import { test, expect, type APIRequestContext } from "@playwright/test";
import crypto from "crypto";
import { E2E_WEBHOOK_SECRET } from "../constants";
import { readDoc, requireEmulators, seedDoc } from "../emulator";

/**
 * M-6: Lemon Squeezy webhook ordering / idempotency / event filtering, persisted to the Firestore emulator.
 * Payloads are signed with the E2E server's webhook secret.
 */

requireEmulators();

const ROUTE = "/api/webhook/lemonsqueezy";

async function send(request: APIRequestContext, payload: object) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", E2E_WEBHOOK_SECRET).update(body).digest("hex");
  return request.post(ROUTE, {
    headers: { "content-type": "application/json", "x-signature": signature },
    data: Buffer.from(body),
  });
}

function subscriptionEvent(
  userId: string,
  eventName: string,
  attrs: { status: string; updated_at: string; ends_at?: string | null },
  subscriptionId = "sub_123"
) {
  return {
    meta: { event_name: eventName, custom_data: { user_id: userId } },
    data: {
      type: "subscriptions",
      id: subscriptionId,
      attributes: { customer_id: 777, renews_at: "2026-11-08T00:00:00Z", ends_at: null, ...attrs },
    },
  };
}

const newUid = () => `wh${crypto.randomBytes(8).toString("hex")}`;

async function profile(uid: string) {
  const f = (await readDoc(`users/${uid}`)) ?? {};
  const str = (k: string) => (f[k] as { stringValue?: string } | undefined)?.stringValue;
  return {
    plan: str("plan"),
    planStatus: str("planStatus"),
    subscriptionId: str("lemonSqueezySubscriptionId"),
    lastEvent: str("lemonSqueezyLastEvent"),
    pastDueSince: str("pastDueSince") ?? null,
  };
}

test("subscription_created (active) grants Pro and stores subscription ids", async ({ request }) => {
  const uid = newUid();
  const res = await send(request, subscriptionEvent(uid, "subscription_created", { status: "active", updated_at: "2026-10-08T10:00:00Z" }));
  expect(res.status()).toBe(200);
  expect(await profile(uid)).toMatchObject({ plan: "pro", planStatus: "active", subscriptionId: "sub_123" });
});

test("an older event delivered late does NOT overwrite a newer state", async ({ request }) => {
  const uid = newUid();
  await send(request, subscriptionEvent(uid, "subscription_expired", { status: "expired", updated_at: "2026-10-08T12:00:00Z" }));
  expect((await profile(uid)).plan).toBe("free");

  // Retry of an earlier "active" update arrives after the expiry.
  const late = await send(request, subscriptionEvent(uid, "subscription_updated", { status: "active", updated_at: "2026-10-08T09:00:00Z" }));
  expect(late.status()).toBe(200);
  expect((await late.json()).note).toBe("Stale event");
  expect(await profile(uid)).toMatchObject({ plan: "free", planStatus: "expired", lastEvent: "subscription_expired" });
});

test("re-delivering the same event is idempotent", async ({ request }) => {
  const uid = newUid();
  const event = subscriptionEvent(uid, "subscription_updated", { status: "active", updated_at: "2026-10-08T10:00:00Z" });
  expect((await send(request, event)).status()).toBe(200);
  const first = await profile(uid);
  expect((await send(request, event)).status()).toBe(200);
  expect(await profile(uid)).toEqual(first);
});

test("cancelled with time left keeps Pro until ends_at; expiry then revokes it", async ({ request }) => {
  const uid = newUid();
  const future = new Date(Date.now() + 7 * 86400_000).toISOString();
  await send(request, subscriptionEvent(uid, "subscription_cancelled", { status: "cancelled", ends_at: future, updated_at: "2026-10-08T10:00:00Z" }));
  expect(await profile(uid)).toMatchObject({ plan: "pro", planStatus: "cancelled" });

  await send(request, subscriptionEvent(uid, "subscription_expired", { status: "expired", updated_at: "2026-10-15T10:00:00Z" }));
  expect(await profile(uid)).toMatchObject({ plan: "free", planStatus: "expired" });
});

test("order_created is acknowledged but does not overwrite the subscription id", async ({ request }) => {
  const uid = newUid();
  await send(request, subscriptionEvent(uid, "subscription_created", { status: "active", updated_at: "2026-10-08T10:00:00Z" }));

  const res = await send(request, {
    meta: { event_name: "order_created", custom_data: { user_id: uid } },
    data: { type: "orders", id: "order_999", attributes: { status: "paid", customer_id: 777, updated_at: "2026-10-08T10:00:01Z" } },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).ignored).toBe(true);
  expect(await profile(uid)).toMatchObject({ plan: "pro", subscriptionId: "sub_123" });
});

test("a refund revokes Pro and keeps the subscription id", async ({ request }) => {
  const uid = newUid();
  await send(request, subscriptionEvent(uid, "subscription_created", { status: "active", updated_at: "2026-10-08T10:00:00Z" }));

  const res = await send(request, {
    meta: { event_name: "subscription_payment_refunded", custom_data: { user_id: uid } },
    data: { type: "subscription-invoices", id: "inv_1", attributes: { status: "refunded", updated_at: "2026-10-09T10:00:00Z" } },
  });
  expect(res.status()).toBe(200);
  expect(await profile(uid)).toMatchObject({ plan: "free", planStatus: "refunded", subscriptionId: "sub_123" });
});

test("a malformed user_id cannot target another document path", async ({ request }) => {
  const res = await send(request, subscriptionEvent("victim/usage/summary", "subscription_created", { status: "active", updated_at: "2026-10-08T10:00:00Z" }));
  expect(res.status()).toBe(200);
  expect((await res.json()).ignored).toBe(true);
  expect(await readDoc("users/victim/usage/summary")).toBeNull();
});

test("the stored lemonSqueezyEventAt gates updates (why firestore.rules makes it server-only)", async ({ request }) => {
  // Seeded with rules bypassed: proves the server honours the stored marker; the rules test proves clients can't write it.
  const uid = newUid();
  await seedDoc(`users/${uid}`, { plan: "pro", planStatus: "active", lemonSqueezyEventAt: "2026-10-10T00:00:00Z" });
  await send(request, subscriptionEvent(uid, "subscription_expired", { status: "expired", updated_at: "2026-10-09T00:00:00Z" }));
  expect((await profile(uid)).plan).toBe("pro");
});

test("a test-mode purchase does not grant Pro (LEMON_SQUEEZY_ACCEPT_TEST_EVENTS is off)", async ({ request }) => {
  const uid = newUid();
  const event = subscriptionEvent(uid, "subscription_created", { status: "active", updated_at: "2026-10-08T10:00:00Z" });
  const res = await send(request, { ...event, meta: { ...event.meta, test_mode: true } });
  expect(res.status()).toBe(200);
  expect((await res.json()).note).toBe("Test-mode event ignored");
  expect((await profile(uid)).plan).toBeUndefined();
});

test("past_due keeps Pro while payment is retried; the grace start is kept and cleared on recovery", async ({ request }) => {
  const uid = newUid();
  await send(request, subscriptionEvent(uid, "subscription_created", { status: "active", updated_at: "2026-10-01T00:00:00Z" }));

  await send(request, subscriptionEvent(uid, "subscription_updated", { status: "past_due", updated_at: "2026-10-02T00:00:00Z" }));
  expect(await profile(uid)).toMatchObject({ plan: "pro", planStatus: "past_due" });
  const since = (await profile(uid)).pastDueSince;
  expect(since && Date.parse(since)).toBe(Date.parse("2026-10-02T00:00:00Z"));

  // Another retry failure: grace still counts from the first failure
  await send(request, subscriptionEvent(uid, "subscription_updated", { status: "past_due", updated_at: "2026-10-05T00:00:00Z" }));
  expect((await profile(uid)).pastDueSince).toBe(since);

  // Payment recovered
  await send(request, subscriptionEvent(uid, "subscription_updated", { status: "active", updated_at: "2026-10-06T00:00:00Z" }));
  expect(await profile(uid)).toMatchObject({ plan: "pro", planStatus: "active", pastDueSince: null });
});

test("retries exhausted (unpaid) revokes Pro", async ({ request }) => {
  const uid = newUid();
  await send(request, subscriptionEvent(uid, "subscription_updated", { status: "past_due", updated_at: "2026-10-02T00:00:00Z" }));
  await send(request, subscriptionEvent(uid, "subscription_updated", { status: "unpaid", updated_at: "2026-10-16T00:00:00Z" }));
  expect(await profile(uid)).toMatchObject({ plan: "free", planStatus: "unpaid", pastDueSince: null });
});
