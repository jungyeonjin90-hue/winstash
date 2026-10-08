/**
 * Unit tests for server auth modules (no network, no emulators).
 *
 *   npm run test:unit
 *
 * Runs the TypeScript sources directly via Node's type stripping. Each scenario that depends on
 * module-level initialisation (lib/firebaseAdmin.ts) runs in a fresh child process with its own env.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const NODE_TS_FLAGS = ["--experimental-strip-types", "--no-warnings"];

/** Runs an ESM snippet in a child Node process with the given env (project env vars stripped). */
function runIsolated(code, env = {}) {
  const baseEnv = { ...process.env };
  for (const k of Object.keys(baseEnv)) {
    if (/^(NEXT_PUBLIC_FIREBASE_|FIREBASE_|FIRESTORE_EMULATOR|GOOGLE_APPLICATION_CREDENTIALS|K_SERVICE)/.test(k)) {
      delete baseEnv[k];
    }
  }
  const res = spawnSync(process.execPath, [...NODE_TS_FLAGS, "--input-type=module", "-e", code], {
    cwd: root,
    env: { ...baseEnv, ...env },
    encoding: "utf8",
  });
  if (res.status !== 0) throw new Error(`child failed (${res.status}):\n${res.stderr}`);
  return JSON.parse(res.stdout.trim().split("\n").pop());
}

function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function token(payloadOverrides = {}, project = "winstash-unit") {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: `https://securetoken.google.com/${project}`,
    aud: project,
    sub: "uid-1",
    iat: now - 10,
    exp: now + 3600,
    ...payloadOverrides,
  };
  const input = `${b64url(JSON.stringify({ alg: "RS256", kid: "k1", typ: "JWT" }))}.${b64url(JSON.stringify(payload))}`;
  return `${input}.${b64url(crypto.createSign("RSA-SHA256").update(input).sign(privateKey))}`;
}

/** Verifies `jwt` in an isolated process and returns the error message (claims are checked before any network). */
function verifyError(jwt, env = {}) {
  return runIsolated(
    `import { verifyFirebaseIdTokenLightweight } from "./lib/lightweightAuth.ts";
     try { await verifyFirebaseIdTokenLightweight(${JSON.stringify(jwt)}); console.log(JSON.stringify("OK")); }
     catch (e) { console.log(JSON.stringify(e.message)); }`,
    env
  );
}

describe("lightweightAuth (H-4)", () => {
  test("refuses to verify when no Firebase project ID is configured", () => {
    assert.match(verifyError(token()), /project ID is not configured/);
  });

  test("rejects a token for another Firebase project", () => {
    assert.match(verifyError(token({}, "someone-elses-project"), { FIREBASE_PROJECT_ID: "winstash-unit" }), /audience mismatch/);
  });

  test("rejects a token that expired 2 minutes ago (old 5-minute grace accepted it)", () => {
    const now = Math.floor(Date.now() / 1000);
    assert.match(
      verifyError(token({ iat: now - 3700, exp: now - 120 }), { FIREBASE_PROJECT_ID: "winstash-unit" }),
      /expired/
    );
  });

  test("rejects a token issued in the future", () => {
    const now = Math.floor(Date.now() / 1000);
    assert.match(verifyError(token({ iat: now + 600 }), { FIREBASE_PROJECT_ID: "winstash-unit" }), /future/);
  });
});

describe("firebaseAdmin initialisation (M-1)", () => {
  const probe = `const m = await import("./lib/firebaseAdmin.ts");
    console.log(JSON.stringify({ hasDb: m.adminDb !== null, configured: m.isFirebaseAdminConfigured() }));`;

  test("project ID only, no credentials, no emulator -> adminDb is null (no fake 'configured' state)", () => {
    assert.deepEqual(runIsolated(probe, { FIREBASE_PROJECT_ID: "winstash-unit" }), { hasDb: false, configured: false });
  });

  test("project ID + Firestore emulator -> adminDb is available", () => {
    assert.deepEqual(
      runIsolated(probe, { FIREBASE_PROJECT_ID: "demo-unit", FIRESTORE_EMULATOR_HOST: "127.0.0.1:1" }),
      { hasDb: true, configured: true }
    );
  });

  test("invalid service-account key -> adminDb is null", () => {
    assert.deepEqual(
      runIsolated(probe, {
        FIREBASE_PROJECT_ID: "winstash-unit",
        FIREBASE_CLIENT_EMAIL: "x@winstash-unit.iam.gserviceaccount.com",
        FIREBASE_PRIVATE_KEY: "not-a-key",
      }),
      { hasDb: false, configured: false }
    );
  });
});
