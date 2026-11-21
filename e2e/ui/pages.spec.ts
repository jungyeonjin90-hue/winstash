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

test("no Beta badge next to the logo while payments are live", async ({ page }) => {
  // The E2E server runs with payments live (NEXT_PUBLIC_LEMON_SQUEEZY_IS_LIVE unset).
  for (const path of ["/", "/pricing", "/privacy", "/terms", "/refund"]) {
    await page.goto(path);
    await expect(page.locator("header").first()).toBeVisible();
    await expect(page.locator("header").getByText("Beta", { exact: true }), path).toHaveCount(0);
  }
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

test("llms.txt serves text/plain Markdown summary for AI crawlers", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const body = await res.text();
  expect(body).toContain("# WinStash");
  expect(body).toContain("https://winstash.net/tools/star-method-generator");
  expect(body).toContain("https://winstash.net/pricing");
});

test("home page renders Schema.org JSON-LD graph and exposes FAQ answers in initial SSR HTML", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  expect(html).toContain("WinStash is 100% free to start with zero credit card required.");

  await page.goto("/");
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(scripts.length).toBeGreaterThanOrEqual(1);

  const parsed = JSON.parse(scripts[0]) as { "@graph": Array<{ "@type": string; mainEntity?: unknown[] }> };
  const types = parsed["@graph"].map((node) => node["@type"]);
  expect(types).toContain("Organization");
  expect(types).toContain("WebSite");
  expect(types).toContain("SoftwareApplication");
  expect(types).toContain("FAQPage");

  const faqNode = parsed["@graph"].find((node) => node["@type"] === "FAQPage");
  expect(faqNode?.mainEntity).toHaveLength(8);
});

test("sitemap uses stable lastmod for static pages and respects scheduled article dates", async ({ request }) => {
  const xml1 = await (await request.get("/sitemap.xml")).text();
  await new Promise((r) => setTimeout(r, 1100));
  const xml2 = await (await request.get("/sitemap.xml")).text();

  const extractLastmod = (xml: string, url: string) => {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`<loc>${escaped}</loc>\\s*<lastmod>([^<]+)</lastmod>`).exec(xml);
    return match?.[1];
  };

  expect(extractLastmod(xml1, "https://winstash.net/privacy")).toBeTruthy();
  expect(extractLastmod(xml1, "https://winstash.net/privacy")).toBe(
    extractLastmod(xml2, "https://winstash.net/privacy")
  );
  expect(extractLastmod(xml1, "https://winstash.net/pricing")).toBe(
    extractLastmod(xml2, "https://winstash.net/pricing")
  );

  if (Date.now() < Date.parse("2026-11-23T09:00:00+09:00")) {
    expect(xml1).not.toContain("year-end-performance-review-examples");
  }
});

test("robots.txt blocks /api/ and /auth/", async ({ request }) => {
  const text = await (await request.get("/robots.txt")).text();
  expect(text).toContain("Disallow: /api/");
  expect(text).toContain("Disallow: /auth/");
});
