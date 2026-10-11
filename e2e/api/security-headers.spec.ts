import { test, expect } from "@playwright/test";

/**
 * Security headers on pages. The Content-Security-Policy is report-only for now (lib/csp.ts):
 * an enforcing header must not be sent until the reports are clean.
 */
for (const path of ["/", "/pricing", "/api/health"]) {
  test(`${path} sends the report-only CSP and no enforcing CSP`, async ({ request }) => {
    const res = await request.get(path);
    const headers = res.headers();
    const policy = headers["content-security-policy-report-only"];
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toBeUndefined();
    expect(headers["x-frame-options"]).toBe("DENY");
  });
}
