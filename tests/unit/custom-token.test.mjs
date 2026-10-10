/**
 * Unit tests for lib/customToken.ts (extension sign-in tokens signed without firebase-admin/auth).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { serviceAccountFromEnv, signCustomToken } from "../../lib/customToken.ts";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const key = { clientEmail: "sa@example.iam.gserviceaccount.com", privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) };
const decode = (part) => JSON.parse(Buffer.from(part, "base64url").toString());

describe("signCustomToken", () => {
  test("produces an RS256 JWT with the Firebase custom token claims", () => {
    const now = Date.parse("2026-10-10T00:00:00Z");
    const [h, p] = signCustomToken("user123", key, now).split(".");
    assert.deepEqual(decode(h), { alg: "RS256", typ: "JWT" });
    const claims = decode(p);
    assert.equal(claims.uid, "user123");
    assert.equal(claims.iss, key.clientEmail);
    assert.equal(claims.sub, key.clientEmail);
    assert.equal(claims.aud, "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit");
    assert.equal(claims.iat, now / 1000);
    assert.equal(claims.exp - claims.iat, 3600);
  });

  test("signature verifies with the service account public key", () => {
    const [h, p, sig] = signCustomToken("user123", key).split(".");
    assert.equal(crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), publicKey, Buffer.from(sig, "base64url")), true);
  });

  test("rejects an empty or over-long uid", () => {
    assert.throws(() => signCustomToken("", key));
    assert.throws(() => signCustomToken("x".repeat(129), key));
  });
});

describe("serviceAccountFromEnv", () => {
  test("reads the key and restores escaped newlines", () => {
    const sa = serviceAccountFromEnv({ FIREBASE_CLIENT_EMAIL: "a@b", FIREBASE_PRIVATE_KEY: "line1\nline2" });
    assert.deepEqual(sa, { clientEmail: "a@b", privateKey: "line1\nline2" });
  });

  test("returns null when either value is missing", () => {
    assert.equal(serviceAccountFromEnv({ FIREBASE_CLIENT_EMAIL: "a@b" }), null);
    assert.equal(serviceAccountFromEnv({}), null);
  });
});
