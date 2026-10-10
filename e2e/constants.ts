/** Shared between playwright.config.ts (server env) and webhook tests (signing). */
export const E2E_WEBHOOK_SECRET = "e2e-test-webhook-secret";

/** Firebase emulator project used by the E2E server (must match `--project` in the test:e2e script). */
export const E2E_PROJECT_ID = "demo-winstash-e2e";
// Overridable so a second checkout (git worktree) can run the suite next to another run.
export const E2E_FIRESTORE_EMULATOR_HOST = process.env.E2E_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
export const E2E_AUTH_EMULATOR_HOST = process.env.E2E_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

/** Admin allow-list used by the E2E server (overrides the production admin emails). */
export const E2E_ADMIN_EMAIL = "e2e-admin@example.com";

/** Local Gemini mock (e2e/mock-gemini.mjs) and the fake key the E2E server sends to it. */
export const E2E_MOCK_GEMINI_PORT = Number(process.env.E2E_MOCK_GEMINI_PORT || 3199);
export const E2E_GEMINI_KEY = "e2e-fake-key";
