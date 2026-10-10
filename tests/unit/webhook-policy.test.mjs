/**
 * Unit tests for lib/webhookPolicy.ts (Lemon Squeezy test-mode events).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { shouldIgnoreTestModeEvent } from "../../lib/webhookPolicy.ts";

describe("shouldIgnoreTestModeEvent", () => {
  test("test-mode events are ignored by default", () => {
    assert.equal(shouldIgnoreTestModeEvent({ test_mode: true }, {}), true);
  });

  test("LEMON_SQUEEZY_ACCEPT_TEST_EVENTS=true lets them through (for payment testing)", () => {
    assert.equal(shouldIgnoreTestModeEvent({ test_mode: true }, { LEMON_SQUEEZY_ACCEPT_TEST_EVENTS: "true" }), false);
  });

  test("live events are always processed", () => {
    assert.equal(shouldIgnoreTestModeEvent({ test_mode: false }, {}), false);
    assert.equal(shouldIgnoreTestModeEvent({}, {}), false);
    assert.equal(shouldIgnoreTestModeEvent(undefined, {}), false);
  });

  test("only a literal true counts as test mode", () => {
    assert.equal(shouldIgnoreTestModeEvent({ test_mode: "true" }, {}), false);
  });
});
