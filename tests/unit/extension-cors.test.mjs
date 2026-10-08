/**
 * Unit tests for lib/extensionCors.ts (audit M-10). Covers the production policy, which the
 * E2E suite cannot exercise because it runs against `next dev`.
 *
 *   npm run test:unit
 */
import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { extensionCorsHeaders, isAllowedExtensionOrigin } from "../../lib/extensionCors.ts";

const ORIGINAL_ENV = process.env.NODE_ENV;
const PUBLISHED = "chrome-extension://publishedextensionidxxxxxxxxxxxxx";
const UNPACKED = "chrome-extension://randomunpackeddevidxxxxxxxxxxxxx";

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
  delete process.env.EXTENSION_ALLOWED_ORIGINS;
});

const req = (origin) => new Request("https://winstash.net/api/extension/status", { headers: origin ? { origin } : {} });

describe("extension CORS in production", () => {
  test("only EXTENSION_ALLOWED_ORIGINS are reflected", () => {
    process.env.NODE_ENV = "production";
    process.env.EXTENSION_ALLOWED_ORIGINS = `${PUBLISHED}, https://admin.winstash.net`;
    assert.equal(isAllowedExtensionOrigin(PUBLISHED), true);
    assert.equal(isAllowedExtensionOrigin("https://admin.winstash.net"), true);
    assert.equal(isAllowedExtensionOrigin(UNPACKED), false);
    assert.equal(isAllowedExtensionOrigin("https://evil.example"), false);
    assert.equal(isAllowedExtensionOrigin(null), false);
    assert.equal(extensionCorsHeaders(req(PUBLISHED))["Access-Control-Allow-Origin"], PUBLISHED);
  });

  test("never answers with a wildcard and always varies on Origin", () => {
    process.env.NODE_ENV = "production";
    for (const origin of ["https://evil.example", UNPACKED, null]) {
      const h = extensionCorsHeaders(req(origin));
      assert.equal(h["Access-Control-Allow-Origin"], undefined, String(origin));
      assert.equal(h.Vary, "Origin");
    }
  });

  test("no allow-list configured -> nothing is granted", () => {
    process.env.NODE_ENV = "production";
    assert.equal(isAllowedExtensionOrigin(PUBLISHED), false);
  });
});

describe("extension CORS in development", () => {
  test("unpacked extension ids are allowed, websites are not", () => {
    process.env.NODE_ENV = "development";
    assert.equal(isAllowedExtensionOrigin(UNPACKED), true);
    assert.equal(isAllowedExtensionOrigin("https://evil.example"), false);
    assert.equal(isAllowedExtensionOrigin("http://localhost:3000"), false);
  });
});
