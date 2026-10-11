import { test, expect } from "@playwright/test";

/**
 * Public page smoke tests: every marketing/legal route renders, has a title,
 * ships the security headers from next.config.ts and throws no uncaught errors.
 */

const PUBLIC_PAGES = [
  "/",
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

test("[L-1] Permissions-Policy keeps camera, microphone and geolocation disabled", async ({ page }) => {
  await page.goto("/");
  const allowed = await page.evaluate(() => {
    const fp = (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy;
    return fp ? ["camera", "microphone", "geolocation"].map((f) => fp.allowsFeature(f)) : null;
  });
  expect(allowed).toEqual([false, false, false]);
});

test("old Korean URLs permanently redirect to the English pages", async ({ request }) => {
  const cases: [string, string][] = [
    ["/ko", "/"],
    ["/ko?utm_source=x", "/?utm_source=x"],
    ["/ko/pricing", "/pricing"],
    ["/ko/resources/brag-doc-template-software-engineers", "/resources/brag-doc-template-software-engineers"],
    ["/ko/unknown/page", "/"],
  ];
  for (const [from, to] of cases) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    const location = new URL(res.headers()["location"], "http://localhost");
    expect(location.pathname + location.search, from).toBe(to);
  }
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

test("pricing shows the Pro price before tax and explains tax in the FAQ", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("/ month + tax")).toBeVisible();
  await expect(page.getByText("Is tax included in the price?")).toBeVisible();
});

test("sitemap lists no Korean (/ko) URLs", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("<urlset");
  expect(xml).not.toMatch(/winstash\.net\/ko(\/|<)/);
  // /en only redirects to / on the client, so it should not be listed either
  expect(xml).not.toContain("winstash.net/en<");
});

test("privacy policy lists every third-party processor the app sends data to", async ({ page }) => {
  await page.goto("/privacy");
  for (const processor of ["PostHog", "Lemon Squeezy", "Sentry"]) {
    await expect(page.getByText(processor).first()).toBeVisible();
  }
});

test("unknown URLs return 404 with the custom not-found page", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist-e2e");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page doesn't exist" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to Home" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Resources" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
});

test("/en permanently redirects to / on the server and keeps the query string", async ({ request }) => {
  for (const [from, to] of [
    ["/en", "/"],
    ["/en?utm_source=newsletter&utm_campaign=q4", "/?utm_source=newsletter&utm_campaign=q4"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    const location = new URL(res.headers()["location"], "http://localhost");
    expect(location.pathname + location.search, from).toBe(to);
  }
});

test("indexed pages declare their own canonical URL", async ({ page }) => {
  for (const [path, canonical] of [
    ["/", "https://winstash.net"],
    ["/?utm_source=x", "https://winstash.net"],
    ["/privacy", "https://winstash.net/privacy"],
    ["/terms", "https://winstash.net/terms"],
    ["/refund", "https://winstash.net/refund"],
    ["/pricing", "https://winstash.net/pricing"],
    ["/resources", "https://winstash.net/resources"],
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute("href", canonical);
  }
});
