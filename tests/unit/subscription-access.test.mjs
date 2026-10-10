/**
 * Unit tests for lib/subscriptionAccess.ts (who counts as Pro).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { hasProAccess, PAST_DUE_GRACE_MS } from "../../lib/subscriptionAccess.ts";

const NOW = Date.parse("2026-10-10T00:00:00Z");
const ago = (ms) => new Date(NOW - ms).toISOString();
const DAY = 24 * 60 * 60 * 1000;

describe("hasProAccess", () => {
  test("active / on_trial / paid are Pro", () => {
    for (const planStatus of ["active", "on_trial", "paid"]) {
      assert.equal(hasProAccess({ plan: "pro", planStatus }, NOW), true, planStatus);
    }
  });

  test("plan must be pro", () => {
    assert.equal(hasProAccess({ plan: "free", planStatus: "active" }, NOW), false);
    assert.equal(hasProAccess(undefined, NOW), false);
  });

  test("cancelled stays Pro until endsAt", () => {
    assert.equal(hasProAccess({ plan: "pro", planStatus: "cancelled", endsAt: ago(-DAY) }, NOW), true);
    assert.equal(hasProAccess({ plan: "pro", planStatus: "cancelled", endsAt: ago(DAY) }, NOW), false);
  });

  test("past_due stays Pro during the payment-retry grace", () => {
    assert.equal(hasProAccess({ plan: "pro", planStatus: "past_due", pastDueSince: ago(3 * DAY) }, NOW), true);
  });

  test("past_due grace ends after PAST_DUE_GRACE_MS even without a later webhook", () => {
    assert.equal(hasProAccess({ plan: "pro", planStatus: "past_due", pastDueSince: ago(PAST_DUE_GRACE_MS + 1) }, NOW), false);
  });

  test("past_due without a start time is not Pro", () => {
    assert.equal(hasProAccess({ plan: "pro", planStatus: "past_due" }, NOW), false);
    assert.equal(hasProAccess({ plan: "pro", planStatus: "past_due", pastDueSince: "garbage" }, NOW), false);
  });

  test("unpaid / expired / paused / refunded are not Pro", () => {
    for (const planStatus of ["unpaid", "expired", "paused", "refunded", "inactive"]) {
      assert.equal(hasProAccess({ plan: "pro", planStatus }, NOW), false, planStatus);
    }
  });
});
