/**
 * Unit tests for lib/gemini.ts (audit M-7 / M-3). No network: global fetch is stubbed.
 *
 *   npm run test:unit
 */
import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { generateGeminiJson, isTransformationOutput } from "../../lib/gemini.ts";

const realFetch = globalThis.fetch;
let calls;

function ok(payload) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }), {
    status: 200,
  });
}

/** A fetch that never resolves until its AbortSignal fires (like a hanging upstream). */
function hang(_url, init) {
  return new Promise((_, reject) => {
    init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true });
  });
}

const VALID = { weekly_report: {}, brag_sheet_item: {}, star_portfolio: {} };
const base = {
  label: "unit",
  models: ["m1", "m2", "m3"],
  systemInstruction: "sys",
  userText: "user",
  validate: isTransformationOutput,
  attemptTimeoutMs: 200,
  totalBudgetMs: 5_000,
};

beforeEach(() => {
  calls = [];
  process.env.GEMINI_API_KEY = "unit-secret-key";
  delete process.env.GEMINI_API_BASE_URL;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.GEMINI_API_KEY;
});

function stub(handler) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init, at: Date.now() });
    return handler(String(url), init, calls.length);
  };
}

describe("generateGeminiJson", () => {
  test("sends the API key in x-goog-api-key, never in the URL", async () => {
    stub(() => ok(VALID));
    const out = await generateGeminiJson(base);
    assert.deepEqual(out, VALID);
    assert.equal(calls.length, 1);
    assert.ok(!calls[0].url.includes("unit-secret-key"), "key leaked into URL");
    assert.ok(!calls[0].url.includes("key="), "key query parameter present");
    assert.equal(calls[0].init.headers["x-goog-api-key"], "unit-secret-key");
    assert.match(calls[0].url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/m1:generateContent$/);
  });

  test("returns null without calling anything when no API key is configured", async () => {
    delete process.env.GEMINI_API_KEY;
    stub(() => ok(VALID));
    assert.equal(await generateGeminiJson(base), null);
    assert.equal(calls.length, 0);
  });

  test("a hanging model is aborted after attemptTimeoutMs and the next model is tried", async () => {
    stub((_url, init, n) => (n === 1 ? hang(_url, init) : ok(VALID)));
    const started = Date.now();
    const out = await generateGeminiJson(base);
    assert.deepEqual(out, VALID);
    assert.equal(calls.length, 2);
    const elapsed = Date.now() - started;
    assert.ok(elapsed >= 180 && elapsed < 1_500, `elapsed ${elapsed}ms`);
  });

  test("stops trying further models once the total budget is spent", async () => {
    stub(hang);
    const started = Date.now();
    const out = await generateGeminiJson({
      ...base,
      models: ["m1", "m2", "m3", "m4", "m5"],
      attemptTimeoutMs: 1_200,
      totalBudgetMs: 2_500,
    });
    const elapsed = Date.now() - started;
    assert.equal(out, null);
    // 1.2s + 1.2s, then < 1s left -> no third attempt.
    assert.equal(calls.length, 2);
    assert.ok(elapsed < 3_200, `elapsed ${elapsed}ms`);
  });

  test("HTTP errors, non-JSON text and wrong shapes fall through to the next model", async () => {
    stub((_url, _init, n) => {
      if (n === 1) return new Response("{}", { status: 500 });
      if (n === 2) return ok({ unexpected: true });
      return ok(VALID);
    });
    assert.deepEqual(await generateGeminiJson(base), VALID);
    assert.equal(calls.length, 3);
  });

  test("returns null when every model fails", async () => {
    stub(() => new Response("{}", { status: 503 }));
    assert.equal(await generateGeminiJson(base), null);
    assert.equal(calls.length, 3);
  });

  test("GEMINI_API_BASE_URL overrides the endpoint (used only by the E2E mock)", async () => {
    process.env.GEMINI_API_BASE_URL = "http://127.0.0.1:3199/";
    stub(() => ok(VALID));
    await generateGeminiJson(base);
    assert.equal(calls[0].url, "http://127.0.0.1:3199/v1beta/models/m1:generateContent");
  });
});
