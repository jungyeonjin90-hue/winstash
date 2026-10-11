import { test, expect } from "@playwright/test";
import { E2E_GEMINI_KEY, E2E_PROJECT_ID, E2E_WEBHOOK_SECRET } from "../constants";

/**
 * GET /api/health for uptime monitors: booleans only, never config values.
 * The E2E server has every required setting (emulator Admin SDK, fake Gemini key, test webhook secret).
 */
const ROUTE = "/api/health";

test("reports ok with boolean checks only", async ({ request }) => {
  const res = await request.get(ROUTE);
  const body = await res.json();

  expect(Object.keys(body).sort()).toEqual(["checks", "status", "timestamp"]);
  expect(Object.keys(body.checks).length).toBeGreaterThan(0);
  for (const value of Object.values(body.checks)) expect(typeof value).toBe("boolean");
  expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);

  if (!process.env.E2E_BASE_URL) {
    // The E2E-managed server is fully configured.
    expect(res.status()).toBe(200);
    expect(body.status).toBe("ok");
    expect(Object.values(body.checks).every(Boolean)).toBe(true);
  } else {
    expect(res.status()).toBe(body.status === "ok" ? 200 : 503);
  }
});

test("never leaks secret-looking strings", async ({ request }) => {
  const res = await request.get(ROUTE);
  const text = await res.text();
  for (const secret of [E2E_GEMINI_KEY, E2E_WEBHOOK_SECRET, E2E_PROJECT_ID]) {
    expect(text).not.toContain(secret);
  }
  expect(text).not.toMatch(/PRIVATE KEY|AIza[0-9A-Za-z_-]{10,}|@[a-z0-9.-]+\.iam\.gserviceaccount\.com|https?:\/\//i);
});

test("is never cached", async ({ request }) => {
  const res = await request.get(ROUTE);
  expect(res.headers()["cache-control"]).toContain("no-store");
});
