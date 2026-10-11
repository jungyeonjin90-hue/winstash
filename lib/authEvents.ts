/**
 * Sign-in outcome helpers (kept free of `@/` imports so unit tests can load them directly).
 */

/** Firebase Auth error codes for a sign-in the user abandoned (closed or replaced the popup). */
const CANCEL_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

/** The Firebase Auth error code of an unknown error, or "unknown". */
export function authErrorCode(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "string" && code ? code : "unknown";
}

/** True when the user closed or cancelled the sign-in popup: not an error to show them. */
export function isSignInCancelled(err: unknown): boolean {
  return CANCEL_CODES.has(authErrorCode(err));
}
