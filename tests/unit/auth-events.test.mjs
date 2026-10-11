/**
 * Unit tests for lib/authEvents.ts (sign-in cancel vs failure).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { authErrorCode, isSignInCancelled } from "../../lib/authEvents.ts";

describe("isSignInCancelled", () => {
  test("closing or replacing the popup counts as a cancel", () => {
    for (const code of ["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]) {
      assert.equal(isSignInCancelled({ code }), true, code);
    }
  });

  test("real failures are not cancels", () => {
    for (const err of [{ code: "auth/popup-blocked" }, { code: "auth/network-request-failed" }, new Error("x"), null, undefined]) {
      assert.equal(isSignInCancelled(err), false);
    }
  });
});

describe("authErrorCode", () => {
  test("returns the Firebase code, or unknown", () => {
    assert.equal(authErrorCode({ code: "auth/popup-blocked" }), "auth/popup-blocked");
    assert.equal(authErrorCode(new Error("boom")), "unknown");
    assert.equal(authErrorCode(null), "unknown");
    assert.equal(authErrorCode({ code: 42 }), "unknown");
  });
});
