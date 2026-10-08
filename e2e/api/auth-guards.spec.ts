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

  // M-10: no more `Access-Control-Allow-Origin: *`
  for (const route of ["/api/extension/status", "/api/extension/submit"]) {
    test(`[M-10] ${route}: arbitrary websites get no CORS grant`, async ({ request }) => {
      const preflight = await request.fetch(route, {
        method: "OPTIONS",
        headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" },
      });
      expect(preflight.headers()["access-control-allow-origin"]).toBeUndefined();

      const res = await request.fetch(route, {
        method: route.endsWith("status") ? "GET" : "POST",
        headers: { Origin: "https://evil.example", Authorization: `Bearer ${forgedFirebaseToken()}` },
      });
      expect(res.headers()["access-control-allow-origin"]).toBeUndefined();
      expect(res.headers()["vary"]).toMatch(/Origin/);
    });
  }

  test("[M-10] extension origins are reflected (dev server allows unpacked extension ids)", async ({ request }) => {
    const origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";
    const res = await request.fetch("/api/extension/status", {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "GET" },
    });
    expect(res.status()).toBe(204);
    expect(res.headers()["access-control-allow-origin"]).toBe(origin);
    expect(res.headers()["access-control-allow-headers"]).toMatch(/Authorization/);
  });

  test("[M-9] error responses do not echo internal exception messages", async ({ request }) => {
    // Unauthenticated / invalid-token paths return fixed messages; nothing from the exception leaks.
    const res = await request.get("/api/extension/status", { headers: { Authorization: "Bearer not-a-jwt" } });
    expect(res.status()).toBe(401);
    const body = JSON.stringify(await res.json());
    expect(body).not.toMatch(/Error:|at \w+ \(|JWT|kid|stack/i);
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
