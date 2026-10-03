import { NextResponse } from "next/server";

// TEMPORARY diagnostic route (to be removed): reports why server modules fail on Vercel.
export async function GET() {
  const out: Record<string, unknown> = {
    hasProject: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    privateKeyLen: (process.env.FIREBASE_PRIVATE_KEY || "").length,
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
  };
  for (const m of ["@/lib/firebaseAdmin", "@/lib/serverRateLimit", "@/lib/serverAuthQuota", "@/lib/adminConfig", "@/lib/creditConfig"]) {
    try {
      if (m === "@/lib/firebaseAdmin") await import("@/lib/firebaseAdmin");
      else if (m === "@/lib/serverRateLimit") await import("@/lib/serverRateLimit");
      else if (m === "@/lib/serverAuthQuota") await import("@/lib/serverAuthQuota");
      else if (m === "@/lib/adminConfig") await import("@/lib/adminConfig");
      else await import("@/lib/creditConfig");
      out[m] = "ok";
    } catch (e) {
      out[m] = String((e as Error)?.stack || e).slice(0, 600);
    }
  }
  return NextResponse.json(out);
}
