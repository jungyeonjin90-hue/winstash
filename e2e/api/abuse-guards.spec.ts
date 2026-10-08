import { test, expect } from "@playwright/test";
import { SAMPLE_MEMO, uniqueIp } from "../helpers";

/**
 * Cost / abuse guardrails: IP rate limit, memo length cap, payload bounds.
 *
 * The "demo" cases rely on the dev-only `x-demo-user: true` bypass in lib/serverAuthQuota.ts,
 * which is disabled when NODE_ENV === "production". Gemini calls go to the local mock
 * (e2e/mock-gemini.mjs), never the paid API.
 */

const isManagedDevServer = !process.env.E2E_BASE_URL;

test.describe("IP rate limiter (/api/transform: 12 req/min)", () => {
  test("13th request from the same IP within a minute -> 429 with Retry-After", async ({ request }) => {
    const ip = uniqueIp();
    const statuses: number[] = [];
    for (let i = 0; i < 13; i++) {
      const res = await request.post("/api/transform", {
        headers: { "x-forwarded-for": ip },
        data: { raw_memo: "x" },
      });
      statuses.push(res.status());
      if (i === 12) expect(res.headers()["retry-after"]).toBeTruthy();
    }
    expect(statuses.slice(0, 12).every((s) => s === 401)).toBe(true);
    expect(statuses[12]).toBe(429);
  });

  test("[H-3] a spoofed cf-connecting-ip header does not reset the limit", async ({ request }) => {
    const realIp = uniqueIp();
    for (let i = 0; i < 12; i++) {
      await request.post("/api/transform", { headers: { "x-forwarded-for": realIp }, data: { raw_memo: "x" } });
    }
    // Same client, but spoofing cf-connecting-ip (honoured first by getClientIp) to get a fresh bucket.
    const res = await request.post("/api/transform", {
      headers: { "x-forwarded-for": realIp, "cf-connecting-ip": uniqueIp() },
      data: { raw_memo: "x" },
    });
    expect(res.status()).toBe(429);
  });
});

test.describe("Demo-mode transform (dev only)", () => {
  test.skip(!isManagedDevServer, "x-demo-user bypass only exists outside production");

  const demoHeaders = () => ({ "x-demo-user": "true", "x-forwarded-for": uniqueIp() });

  test("happy path returns all three artefacts", async ({ request }) => {
    const res = await request.post("/api/transform", {
      headers: demoHeaders(),
      data: { raw_memo: SAMPLE_MEMO, job_role: "engineering", tone_manner: "impact" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.weekly_report?.done)).toBe(true);
    expect(json.brag_sheet_item?.metric_summary).toBeTruthy();
    expect(json.star_portfolio?.title).toBeTruthy();
    expect(json.record?.raw_memo).toBe(SAMPLE_MEMO);
    expect(json.record?.source).toBe("web_text");
  });

  test("Korean route returns all three artefacts", async ({ request }) => {
    const res = await request.post("/api/transform/ko", {
      headers: demoHeaders(),
      data: { raw_memo: "결제 게이트웨이 타임아웃 핫픽스, p99 지연 1.2초에서 85ms로 단축" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.weekly_report && json.brag_sheet_item && json.star_portfolio).toBeTruthy();
  });

  test("empty / whitespace memo -> 400", async ({ request }) => {
    for (const raw_memo of ["", "   \n  "]) {
      const res = await request.post("/api/transform", { headers: demoHeaders(), data: { raw_memo } });
      expect(res.status()).toBe(400);
    }
  });

  test("non-string memo -> 400", async ({ request }) => {
    const res = await request.post("/api/transform", { headers: demoHeaders(), data: { raw_memo: { a: 1 } } });
    expect(res.status()).toBe(400);
  });

  test("memo over 5,000 chars -> 400 (EN and KO)", async ({ request }) => {
    for (const route of ["/api/transform", "/api/transform/ko"]) {
      const res = await request.post(route, { headers: demoHeaders(), data: { raw_memo: "a".repeat(5001) } });
      expect(res.status(), route).toBe(400);
    }
  });

  test("memo of exactly 5,000 chars is accepted", async ({ request }) => {
    const res = await request.post("/api/transform", { headers: demoHeaders(), data: { raw_memo: "a ".repeat(2500) } });
    expect(res.status()).toBe(200);
  });

  test("invalid JSON body -> 400", async ({ request }) => {
    const res = await request.post("/api/transform", {
      headers: { ...demoHeaders(), "content-type": "application/json" },
      data: Buffer.from("{broken"),
    });
    expect(res.status()).toBe(400);
  });

  test("[M-4] /api/synthesize/en rejects oversized payloads with 413", async ({ request }) => {
    // 150 records x 20k chars = ~3 MB of prompt material. Only the record *count* is clamped (100), not size.
    const records = Array.from({ length: 150 }, (_, i) => ({
      id: `r${i}`,
      createdAt: new Date().toISOString(),
      raw_memo: "z".repeat(20_000),
    }));
    const res = await request.post("/api/synthesize/en", {
      headers: demoHeaders(),
      data: { type: "brag", scope: 5, records },
    });
    expect([400, 413]).toContain(res.status());
  });

  test("[M-5] extension submit enforces the 5,000-char memo cap", async ({ request }) => {
    const res = await request.post("/api/extension/submit", {
      headers: { ...demoHeaders(), Authorization: "Bearer not-a-jwt" },
      data: { rawNote: "a".repeat(20_000) },
    });
    expect(res.status()).toBe(400);
  });
});
