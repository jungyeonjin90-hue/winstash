import { test, expect } from "@playwright/test";
import { forgedFirebaseToken, SAMPLE_MEMO, uniqueIp, unsignedToken } from "../helpers";

/**
 * Authentication guards on every AI / data API route.
 * These must hold in every environment; they never reach Gemini or Firestore.
 */

const AI_ROUTES = ["/api/transform", "/api/transform/ko"] as const;

test.describe("AI transform routes reject unauthenticated callers", () => {
  for (const route of AI_ROUTES) {
    test(`${route}: no token -> 401`, async ({ request }) => {
      const res = await request.post(route, {
        headers: { "x-forwarded-for": uniqueIp() },
        data: { raw_memo: SAMPLE_MEMO },
      });
      expect(res.status()).toBe(401);
    });

    test(`${route}: forged RS256 token (admin email claim) -> 401`, async ({ request }) => {
      const res = await request.post(route, {
        headers: { "x-forwarded-for": uniqueIp(), Authorization: `Bearer ${forgedFirebaseToken()}` },
        data: { raw_memo: SAMPLE_MEMO },
      });
      expect(res.status()).toBe(401);
    });

    test(`${route}: alg=none token -> 401`, async ({ request }) => {
      const res = await request.post(route, {
        headers: { "x-forwarded-for": uniqueIp(), Authorization: `Bearer ${unsignedToken()}` },
        data: { raw_memo: SAMPLE_MEMO },
      });
      expect(res.status()).toBe(401);
    });

    test(`${route}: expired token -> 401`, async ({ request }) => {
      const past = Math.floor(Date.now() / 1000) - 7200;
      const res = await request.post(route, {
        headers: {
          "x-forwarded-for": uniqueIp(),
          Authorization: `Bearer ${forgedFirebaseToken({ iat: past - 3600, exp: past })}`,
        },
        data: { raw_memo: SAMPLE_MEMO },
      });
      expect(res.status()).toBe(401);
    });
  }

  test("/api/synthesize/en: records present, no token -> 401", async ({ request }) => {
    const res = await request.post("/api/synthesize/en", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { type: "brag", records: [{ id: "r1", raw_memo: SAMPLE_MEMO }] },
    });
    expect(res.status()).toBe(401);
  });

  test("/api/synthesize/en: empty records short-circuits without AI call", async ({ request }) => {
    const res = await request.post("/api/synthesize/en", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { type: "brag", records: [] },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ items: [] });
  });
});

test.describe("Chrome extension API", () => {
  test("GET /api/extension/status: no token -> 401", async ({ request }) => {
    const res = await request.get("/api/extension/status");
    expect(res.status()).toBe(401);
  });

  test("GET /api/extension/status: forged token -> 401", async ({ request }) => {
    const res = await request.get("/api/extension/status", {
      headers: { Authorization: `Bearer ${forgedFirebaseToken()}` },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/extension/submit: no token -> 401", async ({ request }) => {
    const res = await request.post("/api/extension/submit", { data: { rawNote: SAMPLE_MEMO } });
    expect(res.status()).toBe(401);
  });

  test("POST /api/extension/submit: forged token -> 401", async ({ request }) => {
    const res = await request.post("/api/extension/submit", {
      headers: { Authorization: `Bearer ${forgedFirebaseToken()}` },
      data: { rawNote: SAMPLE_MEMO },
    });
    expect(res.status()).toBe(401);
  });

  test("OPTIONS preflight answers 204", async ({ request }) => {
    const res = await request.fetch("/api/extension/status", { method: "OPTIONS" });
    expect(res.status()).toBe(204);
  });

  // C-2 regression: the unauthenticated records route (IDOR) was removed. It must stay gone
  // (or, if ever re-added, must reject callers without a verified token).
  test("[C-2] GET /api/extension/records is not reachable without authentication", async ({ request }) => {
    const res = await request.get("/api/extension/records?userId=victim-uid");
    expect([401, 404]).toContain(res.status());
  });

  test("[C-2] POST /api/extension/records is not reachable without authentication", async ({ request }) => {
    const res = await request.post("/api/extension/records", {
      data: { userId: "victim-uid", record: { id: "injected", raw_memo: "pwned" }, deductCredit: true },
    });
    expect([401, 404, 405]).toContain(res.status());
  });
});
