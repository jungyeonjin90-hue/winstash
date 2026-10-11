/**
 * Unit tests for lib/csp.ts (Content-Security-Policy-Report-Only).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildCspDirectives, cspReportOnlyHeaders, sentryCspReportUri, serializeCsp } from "../../lib/csp.ts";

const DSN = "https://abc123publickey@o4512237083820032.ingest.us.sentry.io/4512237105643520";

describe("sentryCspReportUri", () => {
  test("derives Sentry's security endpoint from the DSN", () => {
    assert.equal(
      sentryCspReportUri(DSN),
      "https://o4512237083820032.ingest.us.sentry.io/api/4512237105643520/security/?sentry_key=abc123publickey&sentry_environment=production"
    );
  });

  test("passes the environment through", () => {
    assert.match(sentryCspReportUri(DSN, "preview"), /sentry_environment=preview$/);
  });

  test("missing or malformed DSNs give null", () => {
    assert.equal(sentryCspReportUri(undefined), null);
    assert.equal(sentryCspReportUri(""), null);
    assert.equal(sentryCspReportUri("not a url"), null);
    assert.equal(sentryCspReportUri("https://o1.ingest.sentry.io/123"), null); // no public key
    assert.equal(sentryCspReportUri("https://key@o1.ingest.sentry.io/abc"), null); // non-numeric project
    assert.equal(sentryCspReportUri("http://key@o1.ingest.sentry.io/123"), null); // not https
  });
});

describe("buildCspDirectives", () => {
  const env = {
    NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "auth.winstash.net",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "careerpulse-c2213",
    NEXT_PUBLIC_SENTRY_DSN: DSN,
  };

  test("allows the origins the app loads", () => {
    const d = buildCspDirectives({ env });
    assert.ok(d["connect-src"].includes("https://us.i.posthog.com"));
    assert.ok(d["connect-src"].includes("https://us-assets.i.posthog.com"));
    assert.ok(d["script-src"].includes("https://us-assets.i.posthog.com"));
    assert.ok(d["connect-src"].includes("https://o4512237083820032.ingest.us.sentry.io"));
    assert.ok(d["connect-src"].includes("https://*.googleapis.com"));
    assert.ok(d["frame-src"].includes("https://auth.winstash.net"));
    assert.ok(d["frame-src"].includes("https://careerpulse-c2213.firebaseapp.com"));
    assert.deepEqual(d["worker-src"], ["'self'", "blob:"]);
    assert.deepEqual(d["object-src"], ["'none'"]);
    assert.deepEqual(d["frame-ancestors"], ["'none'"]);
  });

  test("never puts the DSN's public key in connect-src", () => {
    assert.ok(!buildCspDirectives({ env })["connect-src"].some((v) => v.includes("abc123publickey")));
  });

  test("'unsafe-eval' only in development", () => {
    assert.ok(!buildCspDirectives({ env })["script-src"].includes("'unsafe-eval'"));
    assert.ok(buildCspDirectives({ env, isDev: true })["script-src"].includes("'unsafe-eval'"));
  });

  test("reporting directives only when a DSN is set", () => {
    assert.ok(buildCspDirectives({ env })["report-uri"]);
    const noDsn = buildCspDirectives({ env: { ...env, NEXT_PUBLIC_SENTRY_DSN: "" } });
    assert.equal(noDsn["report-uri"], undefined);
    assert.equal(noDsn["report-to"], undefined);
  });

  test("defaults to PostHog US when no host is configured", () => {
    assert.ok(buildCspDirectives({ env: {} })["connect-src"].includes("https://us.i.posthog.com"));
  });
});

describe("cspReportOnlyHeaders", () => {
  test("report-only header plus Reporting-Endpoints when a DSN is set, never an enforcing header", () => {
    const headers = cspReportOnlyHeaders({ env: { NEXT_PUBLIC_SENTRY_DSN: DSN } });
    assert.deepEqual(
      headers.map((h) => h.key),
      ["Content-Security-Policy-Report-Only", "Reporting-Endpoints"]
    );
    assert.match(headers[1].value, /^csp-endpoint="https:\/\/o4512237083820032\.ingest\.us\.sentry\.io\/api\//);
  });

  test("only the report-only header without a DSN", () => {
    assert.deepEqual(
      cspReportOnlyHeaders({ env: {} }).map((h) => h.key),
      ["Content-Security-Policy-Report-Only"]
    );
  });

  test("serializes as `name values; name values`", () => {
    assert.equal(serializeCsp({ "default-src": ["'self'"], "object-src": ["'none'"] }), "default-src 'self'; object-src 'none'");
  });
});
