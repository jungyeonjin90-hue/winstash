import { NextRequest, NextResponse } from "next/server";
import type { JobRole } from "@/types/career";
import { checkServerRateLimit, getClientIp } from "@/lib/serverRateLimit";
import { adminDb } from "@/lib/firebaseAdmin";
import { executeAiTransformation } from "@/lib/transformService";
import { reportException } from "@/lib/monitoring";
import { FREE_TOOL_MAX_CHARS, reserveFreeToolUse } from "@/lib/freeToolQuota";

/**
 * No-login STAR generator behind /tools/star-method-generator.
 * Runs the same English prompt as the app (no invented numbers or specifics), returns only the STAR
 * story and the brag-sheet line, and stores nothing but the daily usage counters (lib/freeToolQuota).
 */
export const maxDuration = 60;

const JOB_ROLES: readonly JobRole[] = ["engineering", "product", "marketing", "operations", "design", "sales"];

// Outside production a missing Admin SDK is let through so local development keeps working.
// In production the tool fails closed: without the daily counters there is no cost cap.
const FAIL_OPEN = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  let refund: (() => Promise<void>) | undefined;
  try {
    // Burst limit per instance (the daily limits below are shared across instances).
    const clientIp = getClientIp(req);
    const burst = checkServerRateLimit(`free-tool:${clientIp}`, 3, 60 * 1000);
    if (!burst.success) {
      return NextResponse.json(
        { error: `Too many tries. Please wait ${burst.resetSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": String(burst.resetSeconds) } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length < 10) {
      return NextResponse.json(
        { error: "Write a sentence or two about something you did at work." },
        { status: 400 }
      );
    }
    if (note.length > FREE_TOOL_MAX_CHARS) {
      return NextResponse.json(
        { error: `Please keep it under ${FREE_TOOL_MAX_CHARS} characters. The full app takes longer notes.` },
        { status: 400 }
      );
    }
    const jobRole = JOB_ROLES.includes(body.job_role as JobRole) ? (body.job_role as JobRole) : "operations";

    if (adminDb) {
      const salt = process.env.FREE_TOOL_IP_SALT || process.env.FIREBASE_CLIENT_EMAIL || "winstash-free-tool";
      const reservation = await reserveFreeToolUse(adminDb, clientIp, salt);
      if (!reservation.ok) {
        return NextResponse.json(
          { error: reservation.error, reason: reservation.reason },
          { status: reservation.status }
        );
      }
      refund = reservation.refund;
    } else if (!FAIL_OPEN) {
      console.error("[FreeTool] Firebase Admin is not configured; cannot enforce the daily cap.");
      return NextResponse.json(
        { error: "The free tool is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    const { output, aiFallback } = await executeAiTransformation(note, jobRole, "impact");
    if (aiFallback) {
      // The heuristic fallback is not worth showing to a first-time visitor: return the try instead.
      await refund?.();
      return NextResponse.json(
        { error: "The AI is busy right now. Please try again in a minute (this try was not counted)." },
        { status: 503 }
      );
    }

    const star = output.star_portfolio;
    return NextResponse.json({
      star: {
        title: star.title,
        situation: star.situation,
        task: star.task,
        action: star.action,
        result: star.result,
      },
      bullet: output.brag_sheet_item.metric_summary,
    });
  } catch (error) {
    await refund?.();
    reportException(error, "[FreeTool] STAR generation failed");
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
