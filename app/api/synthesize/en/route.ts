import { NextRequest, NextResponse } from "next/server";
import { CareerRecord, JobRole, ToneManner, SynthesizedBragItem, SynthesizedStarItem } from "@/types/career";
import { checkServerRateLimit, getClientIp } from "@/lib/serverRateLimit";
import { isGeminiConfigured } from "@/lib/gemini";
import { generateAiSynthesis, type RawSynthesisItem } from "@/lib/synthesisService";
import { reportException, reportMessage } from "@/lib/monitoring";
import { verifyServerAuthAndQuota } from "@/lib/serverAuthQuota";
import { adminDb } from "@/lib/firebaseAdmin";
import { SummaryCacheEntry } from "@/lib/summaryCacheService";

// Allow long-running LLM synthesis (Vercel default of 10s causes empty 500/504 responses).
// Gemini calls are bounded by SYNTHESIS_TIMEOUTS so the handler always finishes within this.
export const maxDuration = 60;

// Payload bounds (audit M-4). 100 logs x a few KB each stays far below MAX_BODY_CHARS.
const MAX_BODY_CHARS = 2_000_000;
const MAX_RECORDS = 100;
const MAX_PERIOD_LABEL_CHARS = 100;

/**
 * Cache keys become Firestore document ids. Client keys (lib/summaryCacheService.ts) look like
 * `brag_2026_ALL_ALL_5_engineering_impact_records:[...]`, so keep them verbatim when valid; reject
 * anything Firestore cannot store as an id or that would hit the server-managed `latest_*` docs.
 */
function sanitizeCacheKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim();
  if (
    !key ||
    key.length > 500 ||
    key.includes("/") ||
    key === "." ||
    key === ".." ||
    /^__.*__$/.test(key) ||
    key.startsWith("latest_")
  ) {
    return null;
  }
  return key;
}

/**
 * Attaches the actual user source records to each synthesized item for 100% transparent auditability
 */
function attachSourceRecordsToItems(
  items: RawSynthesisItem[],
  records: CareerRecord[],
  jobRole: JobRole,
  toneManner: ToneManner,
  periodLabel: string
) {
  return items.map((item, itemIdx) => {
    let sourceIndices: number[] = [];
    if (Array.isArray(item.source_log_indices) && item.source_log_indices.length > 0) {
      sourceIndices = item.source_log_indices.filter(
        (idx: unknown): idx is number => typeof idx === "number" && idx >= 1 && idx <= records.length
      );
    }
    // Fallback: If no valid indices were returned by model, map to matching record index or record 1
    if (sourceIndices.length === 0) {
      if (records[itemIdx]) sourceIndices = [itemIdx + 1];
      else sourceIndices = [1];
    }

    const matchedRecords = sourceIndices
      .map((idx) => records[idx - 1])
      .filter(Boolean);

    const source_records = matchedRecords.map((r) => {
      const dateRange = r.target_week
        ? `${r.target_week.startDate} – ${r.target_week.endDate}`
        : undefined;
      return {
        id: r.id,
        weekLabel: r.target_week?.label || new Date(r.createdAt).toISOString().slice(0, 10),
        dateRange,
        raw_memo: r.raw_memo || "",
        jobRole: r.jobRole || jobRole,
        toneManner: r.toneManner || toneManner,
      };
    });

    return {
      ...item,
      source_records:
        source_records.length > 0
          ? source_records
          : [
              {
                id: records[0]?.id || "rec-default",
                weekLabel: records[0]?.target_week?.label || periodLabel,
                raw_memo: records[0]?.raw_memo || "",
                jobRole,
                toneManner,
              },
            ],
    };
  });
}

export async function POST(req: NextRequest) {
  // Set once a quota unit is reserved; returned if the request fails without delivering a result.
  let refundQuota: (() => Promise<void>) | undefined;
  try {
    // 1. IP Rate Limiting Guardrail (Max 8 synthesis calls per minute per IP)
    const clientIp = getClientIp(req);
    const rateLimit = checkServerRateLimit(clientIp, 8, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Synthesis rate limit reached. Please wait ${rateLimit.resetSeconds} seconds before requesting a new synthesis.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // 2. Bounded body parsing (audit M-4): reject oversized payloads before parsing them
    const declaredLength = Number(req.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_CHARS) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const type = body.type === undefined ? "brag" : body.type;
    if (type !== "brag" && type !== "star") {
      return NextResponse.json({ error: "Invalid synthesis type." }, { status: 400 });
    }
    const scope = body.scope === undefined ? 5 : body.scope;
    if (scope !== 3 && scope !== 5 && scope !== 10) {
      return NextResponse.json({ error: "Invalid synthesis scope." }, { status: 400 });
    }
    const jobRole = (typeof body.jobRole === "string" ? body.jobRole : "engineering") as JobRole;
    const toneManner = (typeof body.toneManner === "string" ? body.toneManner : "impact") as ToneManner;
    const periodLabel = (typeof body.periodLabel === "string" && body.periodLabel.trim()
      ? body.periodLabel
      : "Current Period"
    ).slice(0, MAX_PERIOD_LABEL_CHARS);
    const { year, half, quarter, start_year, end_year } = body as Record<string, string | undefined>;

    if (!Array.isArray(body.records) || body.records.length === 0) {
      return NextResponse.json({ items: [] });
    }
    // Only the most recent MAX_RECORDS logs are used for the prompt, source mapping and fallback.
    const records = (body.records as CareerRecord[])
      .filter((r) => r && typeof r === "object")
      .slice(0, MAX_RECORDS);
    if (records.length === 0) {
      return NextResponse.json({ items: [] });
    }
    const cacheKey =
      sanitizeCacheKey(body.cache_key) ?? `${type}_${periodLabel.replace(/\//g, "_")}_${scope}`;

    // 2. Server-Side Authentication & Quota Enforcement (M-1)
    const quotaCheck = await verifyServerAuthAndQuota(
      req,
      type === "star" ? "star" : "brag"
    );
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.error || "Synthesis quota limit reached" },
        { status: quotaCheck.status || 403 }
      );
    }

    // 3. Atomically reserve one synthesis credit before the paid AI call
    const reservation = await quotaCheck.reserve!();
    if (!reservation.ok) {
      return NextResponse.json({ error: reservation.error }, { status: reservation.status });
    }
    refundQuota = reservation.refund;

    /**
     * Atomically saves synthesized items into Firestore summary_cache collection server-side.
     * Ensures completion even if user immediately closes browser tab!
     */
    const persistSummaryCacheAndBuildResponse = async (rawItems: RawSynthesisItem[], aiFallback: boolean) => {
      const itemsWithSources = attachSourceRecordsToItems(
        rawItems,
        records,
        jobRole,
        toneManner,
        periodLabel
      );

      const nowStr = new Date().toISOString();
      const sourceRecordIds = (records as CareerRecord[]).map((r) => r.id);

      const newEntry: SummaryCacheEntry = {
        cacheKey,
        type: type as "brag" | "star",
        year: year || end_year || new Date().getFullYear().toString(),
        half: half || "ALL",
        quarter: quarter || "ALL",
        startYear: start_year,
        endYear: end_year,
        scope: scope as 3 | 5 | 10,
        jobRole: jobRole as JobRole,
        toneManner: toneManner as ToneManner,
        items: itemsWithSources,
        sourceRecordIds,
        sourceRecordCount: sourceRecordIds.length,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      // Server-side persistence: writes directly to Firestore summary_cache!
      if (adminDb && quotaCheck.userId && quotaCheck.userId !== "demo-user-1234") {
        try {
          const cleanEntry = JSON.parse(JSON.stringify(newEntry));
          // 1. Save to specific cache key document
          await adminDb
            .collection("users")
            .doc(quotaCheck.userId)
            .collection("summary_cache")
            .doc(newEntry.cacheKey)
            .set(cleanEntry, { merge: true });

          // 2. Save as latest generated summary for this type
          await adminDb
            .collection("users")
            .doc(quotaCheck.userId)
            .collection("summary_cache")
            .doc(`latest_${type}`)
            .set(cleanEntry, { merge: true });
        } catch (dbErr) {
          reportException(dbErr, "[Synthesis API] Server-side Firestore persistence error");
        }
      }

      // Mapping the user's own records is not an AI synthesis: return the reserved credit (audit M-3).
      if (aiFallback) await refundQuota?.();
      return NextResponse.json({ items: itemsWithSources, entry: newEntry, aiFallback });
    };

    // Gemini: gemini-3.8-flash first for executive phrasing, lite models as fallbacks (SYNTHESIS_TIMEOUTS)
    const aiItems = await generateAiSynthesis(type, scope, jobRole, toneManner, periodLabel, records);
    if (aiItems) {
      return await persistSummaryCacheAndBuildResponse(aiItems, false);
    }

    reportMessage("AI fallback: all Gemini models failed for synthesis", "warning", {
      geminiConfigured: isGeminiConfigured(),
      type,
    });

    // Pure 100% User-Record Fallback (Zero hardcoded fake projects)
    // If AI generation is temporarily unavailable, directly map the user's actual weekly records
    if (type === "brag") {
      const directItems: SynthesizedBragItem[] = records.map((r, idx) => ({
        id: `direct-brag-${idx + 1}`,
        rank: idx + 1,
        title: r.brag_sheet_item?.metric_summary || "Weekly Achievement",
        metric_summary: r.brag_sheet_item?.metric_summary || (r.raw_memo ? r.raw_memo.slice(0, 100) : "Accomplishment logged"),
        business_impact: r.brag_sheet_item?.business_impact || "Key business impact delivered.",
        quarter_span: r.brag_sheet_item?.quarter || periodLabel,
        key_highlights: r.weekly_report?.done?.length ? r.weekly_report.done : [r.raw_memo ? r.raw_memo.slice(0, 80) : "Delivered"],
        nda_tags: r.star_portfolio?.nda_tags || ["#Execution", "#Impact"],
        source_log_indices: [idx + 1],
      }));
      return await persistSummaryCacheAndBuildResponse(directItems.slice(0, scope), true);
    } else {
      const directItems: SynthesizedStarItem[] = records.map((r, idx) => ({
        id: `direct-star-${idx + 1}`,
        rank: idx + 1,
        title: r.star_portfolio?.title || "Key Accomplishment",
        situation: r.star_portfolio?.situation || (r.raw_memo ? r.raw_memo.slice(0, 120) : "Context logged"),
        task: r.star_portfolio?.task || "Drive core operational delivery.",
        action: r.star_portfolio?.action || (r.weekly_report?.done?.join("; ") || r.raw_memo || "Executed"),
        result: r.star_portfolio?.result || (r.brag_sheet_item?.metric_summary || "Successful outcome"),
        nda_tags: r.star_portfolio?.nda_tags || ["#Execution", "#Initiative"],
        period_span: periodLabel,
        impactCategory: r.star_portfolio?.impactCategory || "efficiency",
        impactMagnitude: r.star_portfolio?.impactMagnitude || "medium",
        source_log_indices: [idx + 1],
      }));
      return await persistSummaryCacheAndBuildResponse(directItems.slice(0, scope), true);
    }
  } catch (error) {
    await refundQuota?.();
    console.error("Synthesis API error:", error);
    return NextResponse.json(
      { error: "Failed to synthesize accomplishments" },
      { status: 500 }
    );
  }
}
