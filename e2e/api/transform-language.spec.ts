import { test, expect, type APIRequestContext } from "@playwright/test";
import { SAMPLE_MEMO, uniqueIp } from "../helpers";
import { createTestUser, requireEmulators, type TestUser } from "../emulator";

/**
 * Output language of the 3-way transformation per entry point.
 * The mock Gemini tags its output `[mock-ai][en]` / `[mock-ai][ko]` after the language of the system
 * prompt it received, so these tests see which prompt each route used.
 *
 * - Chrome extension (/api/extension/submit): follows the memo's language (or an explicit `language`).
 * - English web (/api/transform): always English.  Korean web (/api/transform/ko): always Korean.
 */

requireEmulators();

const KOREAN_MEMO = "결제 게이트웨이 타임아웃을 핫픽스하고 Redis 캐시를 도입해 p99 지연을 1.2초에서 85ms로 줄임";
const HANGUL = /[가-힣]/;

const auth = (user: TestUser) => ({ Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() });

async function submitFromExtension(request: APIRequestContext, data: Record<string, unknown>) {
  const user = await createTestUser();
  const res = await request.post("/api/extension/submit", { headers: auth(user), data });
  expect(res.status()).toBe(200);
  return (await res.json()).record;
}

/** Every generated string in a record's three outputs. */
function outputStrings(record: Record<string, unknown>): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk([record.weekly_report, record.brag_sheet_item, record.star_portfolio]);
  return out;
}

test.describe("Chrome extension follows the memo's language", () => {
  test("English note -> English prompt, English results", async ({ request }) => {
    const record = await submitFromExtension(request, { rawNote: SAMPLE_MEMO });
    expect(record.raw_memo).toBe(SAMPLE_MEMO);
    expect(record.brag_sheet_item.metric_summary).toContain("[mock-ai][en]");
  });

  test("Korean note -> Korean prompt", async ({ request }) => {
    const record = await submitFromExtension(request, { rawNote: KOREAN_MEMO });
    expect(record.brag_sheet_item.metric_summary).toContain("[mock-ai][ko]");
  });

  test("English note with AI unavailable -> English fallback text (no Hangul)", async ({ request }) => {
    const record = await submitFromExtension(request, { rawNote: `${SAMPLE_MEMO} [mock:fail]` });
    const strings = outputStrings(record);
    expect(strings.length).toBeGreaterThan(3);
    expect(strings.filter((s) => HANGUL.test(s))).toEqual([]);
  });

  test("Korean note with AI unavailable -> Korean fallback text", async ({ request }) => {
    const record = await submitFromExtension(request, { rawNote: `${KOREAN_MEMO} [mock:fail]` });
    expect(outputStrings(record).some((s) => HANGUL.test(s))).toBe(true);
  });

  test("an explicit language from the client wins over detection", async ({ request }) => {
    const record = await submitFromExtension(request, { rawNote: SAMPLE_MEMO, language: "ko" });
    expect(record.brag_sheet_item.metric_summary).toContain("[mock-ai][ko]");
  });

  test("a mostly-English note with a few Korean words stays English", async ({ request }) => {
    const record = await submitFromExtension(request, { rawNote: `${SAMPLE_MEMO} (결제팀 협업)` });
    expect(record.brag_sheet_item.metric_summary).toContain("[mock-ai][en]");
  });
});

test.describe("Web routes keep their UI language", () => {
  test("English web: English even for a Korean note", async ({ request }) => {
    const user = await createTestUser();
    const res = await request.post("/api/transform", { headers: auth(user), data: { raw_memo: KOREAN_MEMO } });
    expect(res.status()).toBe(200);
    expect((await res.json()).brag_sheet_item.metric_summary).toContain("[mock-ai][en]");
  });

  test("Korean web: Korean even for an English note", async ({ request }) => {
    const user = await createTestUser();
    const res = await request.post("/api/transform/ko", { headers: auth(user), data: { raw_memo: SAMPLE_MEMO } });
    expect(res.status()).toBe(200);
    expect((await res.json()).brag_sheet_item.metric_summary).toContain("[mock-ai][ko]");
  });
});
