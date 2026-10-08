import { defineConfig, devices } from "@playwright/test";
import { E2E_AUTH_EMULATOR_HOST, E2E_FIRESTORE_EMULATOR_HOST, E2E_PROJECT_ID, E2E_WEBHOOK_SECRET } from "./e2e/constants";

/**
 * WinStash E2E test configuration.
 *
 * - Boots an isolated `next dev` on port 3100 (does not collide with a normal `npm run dev` on 3000).
 * - Overrides cost/analytics-sensitive env vars so tests never call Gemini, never send PostHog events,
 *   and can sign Lemon Squeezy webhooks with a known test secret.
 * - Points the server-side Admin SDK at the local Firestore/Auth emulators (project E2E_PROJECT_ID), so
 *   authenticated quota tests run against throwaway data. Use `npm run test:e2e`, which starts the emulators.
 * - Set E2E_BASE_URL to run against an already running server instead (webServer is then skipped).
 */
const PORT = Number(process.env.E2E_PORT || 3100);
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: externalBaseUrl || `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "api", testMatch: /api\/.*\.spec\.ts/ },
    { name: "ui", testMatch: /ui\/.*\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npx next dev -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        timeout: 180_000,
        // Never reuse: tests rely on this server's env (emulators, blanked API keys). A stale server on the
        // port must fail loudly ("port already in use") instead of silently running tests against prod config.
        reuseExistingServer: false,
        env: {
          // Never hit the paid Gemini API from tests: routes fall back to the heuristic generator.
          GEMINI_API_KEY: "",
          OPENAI_API_KEY: "",
          // Keep test traffic out of product analytics.
          NEXT_PUBLIC_POSTHOG_KEY: "",
          // Deterministic webhook signing secret (see e2e/api/webhook.spec.ts).
          LEMON_SQUEEZY_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
          // Server-side Admin SDK -> local emulators only (never the production project).
          FIREBASE_PROJECT_ID: E2E_PROJECT_ID,
          FIRESTORE_EMULATOR_HOST: E2E_FIRESTORE_EMULATOR_HOST,
          FIREBASE_AUTH_EMULATOR_HOST: E2E_AUTH_EMULATOR_HOST,
        },
      },
});
