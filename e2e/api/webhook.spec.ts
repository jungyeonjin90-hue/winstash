import { test, expect } from "@playwright/test";
import crypto from "crypto";
import { E2E_WEBHOOK_SECRET } from "../constants";

/**
 * Lemon Squeezy webhook signature verification.
 * The dev server is started with LEMON_SQUEEZY_WEBHOOK_SECRET = E2E_WEBHOOK_SECRET (playwright.config.ts).
 * Only payloads WITHOUT user_id are sent with a valid signature, so no Firestore write is attempted.
 */

const sign = (body: string, secret = E2E_WEBHOOK_SECRET) =>
  crypto.createHmac("sha256", secret).update(body).digest("hex");

const ROUTE = "/api/webhook/lemonsqueezy";

test.skip(!!process.env.E2E_BASE_URL, "Requires the E2E-managed server (known webhook secret).");

test("missing x-signature -> 401", async ({ request }) => {
  const res = await request.post(ROUTE, { data: { meta: { event_name: "subscription_created" } } });
  expect(res.status()).toBe(401);
});

test("signature from wrong secret -> 401", async ({ request }) => {
  const body = JSON.stringify({ meta: { event_name: "subscription_created", custom_data: { user_id: "victim" } } });
  const res = await request.post(ROUTE, {
    headers: { "content-type": "application/json", "x-signature": sign(body, "attacker-secret") },
    data: body,
  });
  expect(res.status()).toBe(401);
});

test("valid signature over a different body (tampered payload) -> 401", async ({ request }) => {
  const original = JSON.stringify({ meta: { event_name: "subscription_created" } });
  const tampered = JSON.stringify({
    meta: { event_name: "subscription_created", custom_data: { user_id: "attacker" } },
    data: { attributes: { status: "active" } },
  });
  const res = await request.post(ROUTE, {
    headers: { "content-type": "application/json", "x-signature": sign(original) },
    data: tampered,
  });
  expect(res.status()).toBe(401);
});

test("valid signature, malformed JSON -> 400", async ({ request }) => {
  const body = "{not-json";
  const res = await request.post(ROUTE, {
    headers: { "content-type": "application/json", "x-signature": sign(body) },
    data: Buffer.from(body), // Buffer: send raw bytes, Playwright would JSON-encode a string
  });
  expect(res.status()).toBe(400);
});

test("valid signature, no custom_data.user_id -> 200 acknowledged without write", async ({ request }) => {
  const body = JSON.stringify({
    meta: { event_name: "subscription_created", custom_data: {} },
    data: { id: "sub_1", attributes: { status: "active", user_email: "buyer@example.com" } },
  });
  const res = await request.post(ROUTE, {
    headers: { "content-type": "application/json", "x-signature": sign(body) },
    data: body,
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.received).toBe(true);
  expect(json.note).toMatch(/No user_id/);
});
