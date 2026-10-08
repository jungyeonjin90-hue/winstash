import { test } from "@playwright/test";
import crypto from "crypto";

/**
 * Marks a test that asserts the *secure / correct* behavior but currently fails
 * because of a known defect documented in docs/AUDIT_REPORT.md.
 *
 * - Default run: the test is expected to fail (suite stays green, gap stays visible as "expected fail").
 *   Once the defect is fixed the test starts passing and Playwright reports it as an error,
 *   reminding you to delete the knownGap() call.
 * - STRICT_SECURITY=1: the annotation is ignored so every open gap shows up red.
 */
export function knownGap(auditId: string) {
  test.info().annotations.push({ type: "audit", description: auditId });
  if (!process.env.STRICT_SECURITY) {
    test.fail(true, `Known defect ${auditId} (see docs/AUDIT_REPORT.md)`);
  }
}

/** A random, test-unique client IP so the in-memory rate limiter never leaks state between tests. */
export function uniqueIp(): string {
  const b = crypto.randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Builds a syntactically valid RS256 Firebase-style JWT signed with a throwaway key.
 * Any correct verifier must reject it (unknown kid / bad signature).
 */
export function forgedFirebaseToken(overrides: Record<string, unknown> = {}): string {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "winstash-e2e";
  const header = { alg: "RS256", kid: "forged-kid", typ: "JWT" };
  const payload = {
    iss: `https://securetoken.google.com/${projectId}`,
    aud: projectId,
    sub: "attacker-uid",
    email: "jungyeonjin90@gmail.com",
    iat: now,
    exp: now + 3600,
    ...overrides,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = crypto.createSign("RSA-SHA256").update(signingInput).sign(privateKey);
  return `${signingInput}.${b64url(signature)}`;
}

/** `alg: none` token – the classic JWT bypass attempt. */
export function unsignedToken(): string {
  const now = Math.floor(Date.now() / 1000);
  return `${b64url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${b64url(
    JSON.stringify({ sub: "attacker-uid", iat: now, exp: now + 3600 })
  )}.`;
}

export const SAMPLE_MEMO =
  "Hotfixed payment gateway timeouts by tuning the connection pool and adding Redis caching. " +
  "Cut p99 latency from 1.2s to 85ms. Zero dropped transactions during the peak sale. Next week: Grafana alerts.";
