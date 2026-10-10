import { test, expect } from "@playwright/test";

/**
 * Public page smoke tests: every marketing/legal route renders, has a title,
 * ships the security headers from next.config.ts and throws no uncaught errors.
 */

const PUBLIC_PAGES = [
  "/",
  "/ko",
  "/pricing",
  "/privacy",
  "/terms",
  "/refund",
  "/resources",
  "/resources/brag-doc-template-software-engineers",
  "/auth/extension-connect",
];

for (const path of PUBLIC_PAGES) {
  test(`${path} renders without uncaught errors`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `HTTP status for ${path}`).toBe(200);
    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator("body")).not.toBeEmpty();
    await page.waitForLoadState("load");

    expect(pageErrors, `uncaught errors on ${path}`).toEqual([]);
  });
}

test("security headers are applied", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toBeTruthy();
});

test("[L-1] Permissions-Policy lets our own pages use the microphone (voice input on /ko)", async ({ page }) => {
  await page.goto("/ko");
  const allowed = await page.evaluate(() => {
    const fp = (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy;
    return fp ? fp.allowsFeature("microphone") : null;
  });
  expect(allowed).toBe(true);
  // ...while camera and geolocation stay disabled.
  const others = await page.evaluate(() => {
    const fp = (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy;
    return fp ? [fp.allowsFeature("camera"), fp.allowsFeature("geolocation")] : null;
  });
  expect(others).toEqual([false, false]);
});

test("robots.txt and sitemap.xml are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/User-Agent/i);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("<urlset");
});

test("unknown route returns 404", async ({ request }) => {
  const res = await request.get("/this-page-does-not-exist-e2e");
  expect(res.status()).toBe(404);
});

test("without NEXT_PUBLIC_POSTHOG_KEY no analytics requests are sent (no built-in fallback key)", async ({ page }) => {
  const analytics: string[] = [];
  page.on("request", (req) => {
    if (/posthog\.com|i\.posthog/.test(req.url())) analytics.push(req.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.goto("/pricing");
  await page.waitForLoadState("networkidle");
  expect(analytics).toEqual([]);
});
