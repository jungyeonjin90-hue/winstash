/**
 * Lemon Squeezy webhook policy (kept free of `@/` imports so unit tests can load it directly).
 *
 * Test-mode events (test purchases made while building/QA-ing the store) must not grant real Pro
 * access in production. They are ignored unless LEMON_SQUEEZY_ACCEPT_TEST_EVENTS=true, which is meant
 * to be switched on temporarily while testing payments end to end.
 */
export function shouldIgnoreTestModeEvent(
  meta: { test_mode?: unknown } | undefined,
  env: Record<string, string | undefined> = process.env
): boolean {
  return meta?.test_mode === true && env.LEMON_SQUEEZY_ACCEPT_TEST_EVENTS !== "true";
}

/**
 * Context for the "payment not matched to an account" alert: Lemon Squeezy ids only, so the
 * subscription can be found and linked by hand. Never the customer's email or name (personal data).
 */
export function unmatchedPaymentContext(
  eventName: string | undefined,
  data: { id?: unknown; type?: unknown; attributes?: { customer_id?: unknown } } | undefined
): { event: string; objectType: string; objectId: string; customerId: string } {
  return {
    event: String(eventName || ""),
    objectType: String(data?.type || ""),
    objectId: String(data?.id || ""),
    customerId: String(data?.attributes?.customer_id || ""),
  };
}
