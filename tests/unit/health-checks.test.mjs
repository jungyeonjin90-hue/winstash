/**
 * Unit tests for lib/healthChecks.ts (GET /api/health).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildHealthReport } from "../../lib/healthChecks.ts";

const FULL_ENV = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "client-key-value",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project-value",
  GEMINI_API_KEY: "gemini-secret-value",
  LEMON_SQUEEZY_WEBHOOK_SECRET: "webhook-secret-value",
};
const NOW = new Date("2026-10-11T00:00:00.000Z");

describe("buildHealthReport", () => {
  test("ok when every required setting is present and Firebase Admin is ready", () => {
    assert.deepEqual(buildHealthReport(FULL_ENV, true, NOW), {
      status: "ok",
      checks: { firebaseAdmin: true, firebaseClient: true, gemini: true, lemonSqueezyWebhook: true },
      timestamp: "2026-10-11T00:00:00.000Z",
    });
  });

  test("degraded when Firebase Admin did not initialize", () => {
    const report = buildHealthReport(FULL_ENV, false, NOW);
    assert.equal(report.status, "degraded");
    assert.equal(report.checks.firebaseAdmin, false);
  });

  for (const key of Object.keys(FULL_ENV)) {
    test(`degraded when ${key} is missing or empty`, () => {
      assert.equal(buildHealthReport({ ...FULL_ENV, [key]: undefined }, true, NOW).status, "degraded");
      assert.equal(buildHealthReport({ ...FULL_ENV, [key]: "" }, true, NOW).status, "degraded");
    });
  }

  test("returns booleans only, never the configured values", () => {
    const report = buildHealthReport(FULL_ENV, true, NOW);
    for (const value of Object.values(report.checks)) assert.equal(typeof value, "boolean");
    const serialized = JSON.stringify(report);
    for (const secret of Object.values(FULL_ENV)) assert.equal(serialized.includes(secret), false);
  });
});
