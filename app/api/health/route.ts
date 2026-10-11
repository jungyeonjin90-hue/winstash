import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildHealthReport } from "@/lib/healthChecks";

// Uptime monitors poll this: always evaluate at request time, never from a cache.
export const dynamic = "force-dynamic";

/**
 * Health check: whether the required configuration is present and Firebase Admin initialized.
 * Booleans only (no env values) and no external calls. 200 when every check passes, 503 otherwise.
 */
export async function GET() {
  const report = buildHealthReport(process.env, adminDb !== null);
  return NextResponse.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
