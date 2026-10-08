/** Shared between playwright.config.ts (server env) and webhook tests (signing). */
export const E2E_WEBHOOK_SECRET = "e2e-test-webhook-secret";

/** Firebase emulator project used by the E2E server (must match `--project` in the test:e2e script). */
export const E2E_PROJECT_ID = "demo-winstash-e2e";
export const E2E_FIRESTORE_EMULATOR_HOST = "127.0.0.1:8085";
export const E2E_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
