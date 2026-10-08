import { test, expect, type APIRequestContext } from "@playwright/test";
import { SAMPLE_MEMO, uniqueIp } from "../helpers";
import { createTestUser, readDoc, readFreeUsedCount, requireEmulators, type TestUser } from "../emulator";

/**
 * M-3: a heuristic fallback (Gemini unavailable) is returned but NOT charged.
 * M-4: /api/synthesize/en validates and bounds its payload.
 * M-7: Gemini calls are time-bounded and send the key in a header (the mock rejects `?key=`).
 *
 * Gemini is the local mock (e2e/mock-gemini.mjs): `[mock:fail]` -> HTTP 500, `[mock:slow]` -> no answer.
 */

requireEmulators();

const auth = (user: TestUser) => ({ Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() });

async function readBragUsed(uid: string): Promise<number> {
  const v = (await readDoc(`users/${uid}/usage/synthesis`))?.bragUsedCount as { integerValue?: string } | undefined;
  return v?.integerValue ? parseInt(v.integerValue, 10) : 0;
}

async function readGlobal(): Promise<number> {
  const v = (await readDoc("system/usage"))?.totalCount as { integerValue?: string } | undefined;
  return v?.integerValue ? parseInt(v.integerValue, 10) : 0;
}

const synth = (request: APIRequestContext, user: TestUser, data: object) =>
  request.post("/api/synthesize/en", { headers: auth(user), data });

const record = (i: number, raw_memo = SAMPLE_MEMO) => ({
  id: `rec-${i}`,
  createdAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
  raw_memo,
});

test.describe("M-3: AI success is charged, heuristic fallback is not", () => {
  test("web transform: AI result consumes a credit (key sent via header)", async ({ request }) => {
    const user = await createTestUser();
    const res = await request.post("/api/transform", { headers: auth(user), data: { raw_memo: SAMPLE_MEMO } });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.aiFallback).toBe(false);
    expect(json.brag_sheet_item.metric_summary).toContain("[mock-ai]");
    expect(await readFreeUsedCount(user.uid)).toBe(1);
  });

  test("web transform: fallback result is returned and saved, but not charged", async ({ request }) => {
    const user = await createTestUser();
    const globalBefore = await readGlobal();
    const res = await request.post("/api/transform", {
      headers: auth(user),
      data: { raw_memo: `${SAMPLE_MEMO} [mock:fail]` },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.aiFallback).toBe(true);
    expect(json.record?.id).toBeTruthy();
    expect(await readFreeUsedCount(user.uid)).toBe(0);
    expect(await readGlobal()).toBe(globalBefore);
  });

  test("KO transform: fallback is not charged", async ({ request }) => {
    const user = await createTestUser();
    const res = await request.post("/api/transform/ko", {
      headers: auth(user),
      data: { raw_memo: "결제 게이트웨이 지연 85ms로 단축 [mock:fail]" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).aiFallback).toBe(true);
    expect(await readFreeUsedCount(user.uid)).toBe(0);
  });

  test("extension submit: fallback record is saved but not charged", async ({ request }) => {
    const user = await createTestUser();
    const res = await request.post("/api/extension/submit", {
      headers: auth(user),
      data: { rawNote: `${SAMPLE_MEMO} [mock:fail]` },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.aiFallback).toBe(true);
    expect(json.credits.totalGeneratedCount).toBe(0);
    expect(await readFreeUsedCount(user.uid)).toBe(0);
  });

  test("brag synthesis: AI result is charged, direct-record fallback is not", async ({ request }) => {
    const user = await createTestUser();

    const ok = await synth(request, user, { type: "brag", scope: 3, records: [record(1)] });
    expect(ok.status()).toBe(200);
    expect((await ok.json()).aiFallback).toBe(false);
    expect(await readBragUsed(user.uid)).toBe(1);

    const fb = await synth(request, user, { type: "brag", scope: 3, records: [record(2, `${SAMPLE_MEMO} [mock:fail]`)] });
    expect(fb.status()).toBe(200);
    const json = await fb.json();
    expect(json.aiFallback).toBe(true);
    expect(json.items.length).toBeGreaterThan(0);
    expect(await readBragUsed(user.uid)).toBe(1);
  });
});

test.describe("M-7: Gemini calls are time-bounded", () => {
  test("a hanging model does not hang the request: fallback within the budget, not charged", async ({ request }) => {
    test.setTimeout(60_000);
    const user = await createTestUser();
    const started = Date.now();
    const res = await request.post("/api/transform", {
      headers: auth(user),
      data: { raw_memo: `${SAMPLE_MEMO} [mock:slow]` },
      timeout: 50_000,
    });
    const elapsed = Date.now() - started;

    expect(res.status()).toBe(200);
    expect((await res.json()).aiFallback).toBe(true);
    expect(elapsed).toBeLessThan(35_000); // TRANSFORM_TIMEOUTS.totalBudgetMs = 25s (+ overhead)
    expect(await readFreeUsedCount(user.uid)).toBe(0);
  });
});

test.describe("M-4: synthesis payload validation", () => {
  test("invalid type or scope -> 400 without charging", async ({ request }) => {
    const user = await createTestUser();
    expect((await synth(request, user, { type: "evil", records: [record(1)] })).status()).toBe(400);
    expect((await synth(request, user, { type: "brag", scope: 1000, records: [record(1)] })).status()).toBe(400);
    expect(await readBragUsed(user.uid)).toBe(0);
  });

  test("more than 100 records are clamped to the 100 most recent", async ({ request }) => {
    const user = await createTestUser();
    const records = Array.from({ length: 140 }, (_, i) => record(i));
    const res = await synth(request, user, { type: "brag", scope: 5, records });
    expect(res.status()).toBe(200);
    expect((await res.json()).entry.sourceRecordCount).toBe(100);
  });

  test("a cache_key that is not a valid document id falls back to a server-built key", async ({ request }) => {
    const user = await createTestUser();
    for (const cache_key of ["../../usage/synthesis", "latest_brag", "__reserved__"]) {
      const res = await synth(request, user, { type: "brag", scope: 3, records: [record(1)], cache_key });
      expect(res.status(), cache_key).toBe(200);
      expect((await res.json()).entry.cacheKey, cache_key).not.toBe(cache_key);
    }
  });

  test("a well-formed client cache key is kept verbatim", async ({ request }) => {
    const user = await createTestUser();
    const cache_key = "brag_2026_ALL_ALL_3_engineering_impact_records:[cnt1_h123_rec-1]";
    const res = await synth(request, user, { type: "brag", scope: 3, records: [record(1)], cache_key });
    expect((await res.json()).entry.cacheKey).toBe(cache_key);
    expect(await readDoc(`users/${user.uid}/summary_cache/${encodeURIComponent(cache_key)}`)).not.toBeNull();
  });
});
