/**
 * Unit tests for lib/webhookPolicy.ts (Lemon Squeezy test-mode events).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { shouldIgnoreTestModeEvent, unmatchedPaymentContext } from "../../lib/webhookPolicy.ts";

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

describe("unmatchedPaymentContext", () => {
  test("keeps Lemon Squeezy ids for linking the payment by hand", () => {
    assert.deepEqual(
      unmatchedPaymentContext("subscription_created", {
        id: 123,
        type: "subscriptions",
        attributes: { customer_id: 456 },
      }),
      { event: "subscription_created", objectType: "subscriptions", objectId: "123", customerId: "456" }
    );
  });

  test("never includes the customer's email or name", () => {
    const context = unmatchedPaymentContext("order_refunded", {
      id: "9",
      type: "orders",
      attributes: { customer_id: "7", user_email: "buyer@example.com", user_name: "Jane Buyer" },
    });
    const serialized = JSON.stringify(context);
    assert.equal(serialized.includes("buyer@example.com"), false);
    assert.equal(serialized.includes("Jane Buyer"), false);
  });

  test("missing fields become empty strings", () => {
    assert.deepEqual(unmatchedPaymentContext(undefined, undefined), {
      event: "",
      objectType: "",
      objectId: "",
      customerId: "",
    });
  });
});
