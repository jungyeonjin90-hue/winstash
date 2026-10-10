import { NextRequest, NextResponse } from "next/server";
import { TransformationOutput, JobRole, ToneManner, SeniorityLevel, RegionCode, CareerRecord, WeekSpan } from "@/types/career";
import { checkServerRateLimit, getClientIp, MAX_MEMO_CHAR_LIMIT } from "@/lib/serverRateLimit";
import { verifyServerAuthAndQuota } from "@/lib/serverAuthQuota";
import { adminDb } from "@/lib/firebaseAdmin";
import { executeAiTransformation } from "@/lib/transformService";

// Allow the Gemini budget (TRANSFORM_TIMEOUTS) plus Firestore persistence.
export const maxDuration = 60;

// Record ids in use: `rec-<ts>`, `rec-en-<ts>`, sample data. No "/" (path) and no "."-only ids.
function isValidRecordId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,127}$/.test(value);
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function isValidWeekSpan(value: unknown): value is WeekSpan {
  const w = value as Partial<WeekSpan> | null;
  return Boolean(
    w &&
      typeof w === "object" &&
      Number.isInteger(w.year) &&
      Number.isInteger(w.month) &&
      Number.isInteger(w.weekOfMonth) &&
      typeof w.startDate === "string" && YMD.test(w.startDate) &&
      typeof w.endDate === "string" && YMD.test(w.endDate) &&
      typeof w.label === "string" && w.label.length <= 100
  );
}

/** Stores only the known WeekSpan fields (older records may carry extra keys). */
function pickWeekSpan(w: WeekSpan): WeekSpan {
  return {
    year: w.year,
    month: w.month,
    weekOfMonth: w.weekOfMonth,
    startDate: w.startDate,
    endDate: w.endDate,
    label: w.label,
  };
}

export async function POST(req: NextRequest) {
  // Set once a quota unit is reserved; returned if the request fails without delivering a result.
  let refundQuota: (() => Promise<void>) | undefined;
  try {
    // 1. IP Rate Limiting Guardrail (Max 12 requests per minute per IP)
    const clientIp = getClientIp(req);
    const rateLimit = checkServerRateLimit(clientIp, 12, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before submitting again.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // Server-Side Authentication & Quota Enforcement (M-1)
    const quotaCheck = await verifyServerAuthAndQuota(req, "transform");
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.error || "Free transformation credit limit reached" },
        { status: quotaCheck.status || 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }
    const {
      raw_memo,
      job_role = "engineering",
      tone_manner = "impact",
      seniority_level,
      industry,
      region,
      record_id,
      target_week,
      record_date,
    } = body;

    if (!raw_memo || typeof raw_memo !== "string" || raw_memo.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter your weekly raw brain dump notes." },
        { status: 400 }
      );
    }

    // 2. Character Length Guardrail (Cap at 5,000 chars to prevent token abuse)
    if (raw_memo.length > MAX_MEMO_CHAR_LIMIT) {
      return NextResponse.json(
        {
          error: `Your memo is too long (${raw_memo.length.toLocaleString()} characters). Please shorten it under ${MAX_MEMO_CHAR_LIMIT.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    // Client-supplied record metadata becomes a Firestore document id and stored fields (audit L-4)
    if (record_id !== undefined && !isValidRecordId(record_id)) {
      return NextResponse.json({ error: "Invalid record_id." }, { status: 400 });
    }
    if (record_date !== undefined && !isValidIsoDate(record_date)) {
      return NextResponse.json({ error: "Invalid record_date." }, { status: 400 });
    }
    if (target_week !== undefined && target_week !== null && !isValidWeekSpan(target_week)) {
      return NextResponse.json({ error: "Invalid target_week." }, { status: 400 });
    }

    // 3. Atomically reserve one credit (per-user + global kill switch) before the paid AI call
    const reservation = await quotaCheck.reserve!();
    if (!reservation.ok) {
      return NextResponse.json({ error: reservation.error }, { status: reservation.status });
    }
    refundQuota = reservation.refund;

    /**
     * Helper to atomically persist record into Firestore server-side (credit was reserved above).
     * Ensures 100% completion even if the user abruptly closes browser tab!
     */
    const persistAndBuildResponse = async (output: TransformationOutput, aiFallback: boolean) => {
      const finalRecordId = record_id || `rec-en-${Date.now()}`;
      const finalRecordDate = record_date || new Date().toISOString();

      const newRecord: CareerRecord = {
        id: finalRecordId,
        createdAt: finalRecordDate,
        target_week: target_week ? pickWeekSpan(target_week) : undefined,
        raw_memo,
        weekly_report: output.weekly_report,
        brag_sheet_item: output.brag_sheet_item,
        star_portfolio: output.star_portfolio,
        jobRole: job_role as JobRole,
        toneManner: tone_manner as ToneManner,
        source: "web_text",
        savedAt: new Date().toISOString(),
      };

      // Server-side persistence: directly writes to Firestore if user is authenticated
      if (adminDb && quotaCheck.userId && quotaCheck.userId !== "demo-user-1234") {
        try {
          const cleanRecord = JSON.parse(JSON.stringify(newRecord));
          await adminDb
            .collection("users")
            .doc(quotaCheck.userId)
            .collection("records")
            .doc(finalRecordId)
            .set(cleanRecord, { merge: true });

          // Invalidate user summary cache to prevent ghost summaries
          const cacheSnap = await adminDb
            .collection("users")
            .doc(quotaCheck.userId)
            .collection("summary_cache")
            .get();
          if (!cacheSnap.empty) {
            const batch = adminDb.batch();
            cacheSnap.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();
          }
        } catch (dbErr) {
          console.error("[Transform API] Server-side Firestore persistence error:", dbErr);
        }
      }

      // The heuristic fallback is not an AI result: return the reserved credit (audit M-3).
      if (aiFallback) await refundQuota?.();
      return NextResponse.json({ ...output, record: newRecord, aiFallback });
    };

    // Gemini (cheapest models first, bounded by TRANSFORM_TIMEOUTS) with the English prompt;
    // falls back to the English heuristic generator (not charged, see persistAndBuildResponse).
    const { output, aiFallback } = await executeAiTransformation(
      raw_memo,
      job_role as JobRole,
      tone_manner as ToneManner,
      {
        seniorityLevel: seniority_level as SeniorityLevel | undefined,
        // Free-text profile field that lands in the system prompt: keep it a short string.
        industry: typeof industry === "string" ? industry.slice(0, 100) : undefined,
        region: region as RegionCode | undefined,
      }
    );
    return await persistAndBuildResponse(output, aiFallback);
  } catch (error) {
    await refundQuota?.();
    console.error("Transform API Error (Global EN):", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during transformation." },
      { status: 500 }
    );
  }
}
