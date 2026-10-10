import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { extensionCorsHeaders } from "@/lib/extensionCors";
import { getServerCreditStatus, toExtensionCredits, verifyServerAuthAndQuota } from "@/lib/serverAuthQuota";
import { checkServerRateLimit, getClientIp, MAX_MEMO_CHAR_LIMIT } from "@/lib/serverRateLimit";
import { CareerRecord, JobRole, ToneManner } from "@/types/career";
import { detectMemoLanguage, executeAiTransformation, type TransformLanguage } from "@/lib/transformService";


const DEMO_USER_ID = "demo-user-1234";

// Allow the Gemini budget (TRANSFORM_TIMEOUTS) plus Firestore persistence.
export const maxDuration = 60;

function errorResponse(
  cors: Record<string, string>,
  error: string,
  status: number,
  extraHeaders: Record<string, string> = {}
) {
  return NextResponse.json({ success: false, error }, { status, headers: { ...cors, ...extraHeaders } });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: extensionCorsHeaders(req) });
}

/**
 * Chrome extension memo submit.
 * Same guardrails as /api/transform: IP rate limit, verified Firebase token, server-side free quota
 * (new entries and edits share the 10 free credits, see lib/creditConfig.ts), and the memo length cap.
 * The credit is reserved atomically before the AI call and refunded if the record cannot be saved.
 */
export async function POST(req: NextRequest) {
  const cors = extensionCorsHeaders(req);
  // Set once a quota unit is reserved; returned if the request fails without delivering a result.
  let refundQuota: (() => Promise<void>) | undefined;
  try {
    // 1. IP rate limit (same budget as the web transform route)
    const rateLimit = checkServerRateLimit(getClientIp(req), 12, 60 * 1000);
    if (!rateLimit.success) {
      return errorResponse(
        cors,
        `Rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before submitting again.`,
        429,
        { "Retry-After": String(rateLimit.resetSeconds) }
      );
    }

    // 2. Token verification + server-side quota (usage/summary)
    const quotaCheck = await verifyServerAuthAndQuota(req, "transform");
    if (!quotaCheck.allowed || !quotaCheck.userId) {
      return errorResponse(cors, quotaCheck.error || "Free transformation credit limit reached", quotaCheck.status || 403);
    }
    const userId = quotaCheck.userId;
    const isDemo = userId === DEMO_USER_ID;

    // 3. Parse and validate body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse(cors, "Invalid JSON request body.", 400);
    }

    const rawMemo =
      typeof body.rawNote === "string" && body.rawNote.trim() ? body.rawNote : body.raw_memo;
    if (typeof rawMemo !== "string" || rawMemo.trim().length === 0) {
      return errorResponse(cors, "Memo content is required", 400);
    }
    const memoText = rawMemo.trim();
    if (memoText.length > MAX_MEMO_CHAR_LIMIT) {
      return errorResponse(
        cors,
        `Your memo is too long (${memoText.length.toLocaleString()} characters). Please shorten it under ${MAX_MEMO_CHAR_LIMIT.toLocaleString()} characters.`,
        400
      );
    }

    const existingRecordId = typeof body.existingRecordId === "string" ? body.existingRecordId : undefined;
    const existingCreatedAt = typeof body.existingCreatedAt === "string" ? body.existingCreatedAt : undefined;
    const jobRole = (typeof body.job_role === "string" ? body.job_role : "engineering") as JobRole;
    const toneManner = (typeof body.tone_manner === "string" ? body.tone_manner : "impact") as ToneManner;

    // 4. Atomically reserve one credit (per-user + global kill switch) before the paid AI call
    const reservation = await quotaCheck.reserve!();
    if (!reservation.ok) {
      return errorResponse(cors, reservation.error, reservation.status);
    }
    refundQuota = reservation.refund;

    // 5. AI 3-way transformation (weekly report, brag sheet, STAR portfolio)
    // Output language: explicit request from the client, otherwise the memo's own language, so an
    // English note is never turned into Korean results (and vice versa).
    const language: TransformLanguage =
      body.language === "en" || body.language === "ko" ? body.language : detectMemoLanguage(memoText);
    const { output: transformation, aiFallback } = await executeAiTransformation(memoText, jobRole, toneManner, {
      language,
    });

    const recordId = existingRecordId || `rec-${Date.now()}`;
    const cleanRecord = {
      id: recordId,
      createdAt: existingCreatedAt || new Date().toISOString(),
      target_week: body.target_week || undefined,
      raw_memo: memoText,
      rawNote: memoText,
      weekly_report: transformation.weekly_report,
      brag_sheet_item: transformation.brag_sheet_item,
      star_portfolio: transformation.star_portfolio,
      jobRole,
      toneManner,
      source: "chrome_extension",
      savedAt: new Date().toISOString(),
    } as unknown as CareerRecord;

    // 6. Persist (Admin SDK). Demo users are never written to Firestore.
    if (!isDemo) {
      if (!adminDb) {
        await refundQuota();
        return errorResponse(cors, "Server database is unavailable. Please try again later.", 503);
      }
      try {
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("records")
          .doc(recordId)
          .set(JSON.parse(JSON.stringify(cleanRecord)), { merge: true });
      } catch (saveErr) {
        console.error("[Extension Submit API] Failed to save record:", saveErr);
        await refundQuota();
        return errorResponse(cors, "Failed to save your record. No credit was used.", 503);
      }
    }

    // The heuristic fallback is not an AI result: return the reserved credit (audit M-3).
    if (aiFallback) await refundQuota();

    // Omitted when unknown so the extension keeps its last known balance instead of a wrong one.
    const credits = isDemo ? null : await getServerCreditStatus(userId, Boolean(quotaCheck.isAdmin));

    return NextResponse.json(
      { success: true, record: cleanRecord, aiFallback, credits: credits ? toExtensionCredits(credits) : undefined },
      { headers: cors }
    );
  } catch (err) {
    await refundQuota?.();
    console.error("[Extension Submit API] Fatal error:", err);
    return errorResponse(cors, "Failed to process record", 500);
  }
}
