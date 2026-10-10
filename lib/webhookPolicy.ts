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
