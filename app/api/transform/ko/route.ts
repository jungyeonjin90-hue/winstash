import { NextRequest, NextResponse } from "next/server";
import { JobRole, ToneManner } from "@/types/career";
import { executeAiTransformation } from "@/lib/transformService";
import { checkServerRateLimit, getClientIp, MAX_MEMO_CHAR_LIMIT } from "@/lib/serverRateLimit";
import { verifyServerAuthAndQuota } from "@/lib/serverAuthQuota";

// Allow the Gemini budget (TRANSFORM_TIMEOUTS) plus response handling.
export const maxDuration = 60;

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
          error: `요청 횟수 제한을 초과했습니다. ${rateLimit.resetSeconds}초 후에 다시 시도해주세요.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
          },
        }
      );
    }

    // Server-Side Authentication & Quota Enforcement (Critical Security Fix)
    const quotaCheck = await verifyServerAuthAndQuota(req, "transform");
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.error || "무료 변환 크레딧이 소진되었습니다." },
        { status: quotaCheck.status || 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "올바른 JSON 요청 본문이 아닙니다." },
        { status: 400 }
      );
    }
    const {
      raw_memo,
      job_role = "engineering",
      tone_manner = "impact",
    } = body;

    if (!raw_memo || typeof raw_memo !== "string" || raw_memo.trim().length === 0) {
      return NextResponse.json(
        { error: "주간 메모 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 2. Character Length Guardrail (Cap at 5,000 chars)
    if (raw_memo.length > MAX_MEMO_CHAR_LIMIT) {
      return NextResponse.json(
        {
          error: `입력 메모가 너무 깁니다 (${raw_memo.length.toLocaleString()}자). ${MAX_MEMO_CHAR_LIMIT.toLocaleString()}자 이내로 줄여주세요.`,
        },
        { status: 400 }
      );
    }

    // 3. AI 호출 전에 크레딧 1회를 원자적으로 예약 (개인 한도 + 전체 킬스위치)
    const reservation = await quotaCheck.reserve!();
    if (!reservation.ok) {
      return NextResponse.json({ error: reservation.error }, { status: reservation.status });
    }
    refundQuota = reservation.refund;

    // Gemini 변환 (프롬프트·모델·폴백은 lib/transformService.ts 와 확장 프로그램 경로가 공유)
    const { output, aiFallback } = await executeAiTransformation(
      raw_memo,
      job_role as JobRole,
      tone_manner as ToneManner
    );
    // 휴리스틱 폴백은 AI 결과가 아니므로 크레딧 환불 (감사 M-3)
    if (aiFallback) await refundQuota?.();
    return NextResponse.json({ ...output, aiFallback });
  } catch (error) {
    await refundQuota?.();
    console.error("Transform API Error (KO):", error);
    return NextResponse.json(
      { error: "변환 처리 중 예기치 못한 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
