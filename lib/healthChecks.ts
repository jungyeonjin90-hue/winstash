/**
 * Configuration checks behind GET /api/health (kept free of `@/` imports so unit tests can load it).
 * Every check is a boolean "is the required config present"; values are never returned.
 */
export interface HealthReport {
  status: "ok" | "degraded";
  checks: {
    firebaseAdmin: boolean;
    firebaseClient: boolean;
    gemini: boolean;
    lemonSqueezyWebhook: boolean;
  };
  timestamp: string;
}

export function buildHealthReport(
  env: Record<string, string | undefined>,
  firebaseAdminReady: boolean,
  now: Date = new Date()
): HealthReport {
  const checks: HealthReport["checks"] = {
    // Server quota, persistence and webhooks need the Admin SDK (see lib/firebaseAdmin.ts).
    firebaseAdmin: firebaseAdminReady,
    // Sign-in in the browser needs the client config.
    firebaseClient: Boolean(env.NEXT_PUBLIC_FIREBASE_API_KEY && env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    // Without a key every transform silently falls back to the heuristic generator.
    gemini: Boolean(env.GEMINI_API_KEY),
    // Without the signing secret every payment webhook is rejected and nobody gets Pro.
    lemonSqueezyWebhook: Boolean(env.LEMON_SQUEEZY_WEBHOOK_SECRET),
  };
  const healthy = Object.values(checks).every(Boolean);
  return { status: healthy ? "ok" : "degraded", checks, timestamp: now.toISOString() };
}
