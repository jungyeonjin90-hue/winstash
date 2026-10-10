import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { verifyRequestToken } from "@/lib/serverAuthQuota";
import { checkServerRateLimit, getClientIp } from "@/lib/serverRateLimit";

/**
 * Exchanges the web session for a one-time Firebase custom token the Chrome extension can sign in with
 * (audit H-6). Called by /auth/extension-connect on winstash.net (same origin, so no CORS headers).
 *
 * The extension then holds its own Firebase session and refreshes its ID tokens itself, instead of
 * receiving a one-hour ID token through localStorage / the DOM / a content script.
 */
export async function POST(req: NextRequest) {
  const rateLimit = checkServerRateLimit(`ext-session:${getClientIp(req)}`, 10, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetSeconds) } }
    );
  }

  const user = await verifyRequestToken(req);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!adminAuth) {
    console.error("[Extension Session API] Firebase Admin Auth is not configured.");
    return NextResponse.json({ error: "Sign-in service unavailable" }, { status: 503 });
  }

  try {
    const customToken = await adminAuth.createCustomToken(user.uid);
    return NextResponse.json({ customToken }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[Extension Session API] createCustomToken failed:", err);
    return NextResponse.json({ error: "Could not start the extension session" }, { status: 500 });
  }
}
