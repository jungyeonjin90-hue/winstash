import { test, expect } from "@playwright/test";

/** Landing header on a phone: logo, Pricing and the sign-in button stay on one line without touching. */
test.use({ viewport: { width: 375, height: 812 } });

test("landing header fits on one line at 375px with space between the logo and Pricing", async ({ page }) => {
  await page.goto("/");
  const header = page.locator("header").first();
  const brand = header.getByText("WinStash", { exact: true });
  const pricing = header.getByRole("link", { name: "Pricing" });
  const signIn = header.getByRole("button", { name: /sign in/i });
  await expect(signIn).toBeVisible();

  const [brandBox, pricingBox, signInBox, headerBox] = await Promise.all([
    brand.boundingBox(),
    pricing.boundingBox(),
    signIn.boundingBox(),
    header.boundingBox(),
  ]);
  // A visible gap between the brand name and Pricing (they used to render as "WinStashPricing").
  expect(pricingBox!.x - (brandBox!.x + brandBox!.width)).toBeGreaterThanOrEqual(8);
  // The sign-in label stays on one line and inside the viewport.
  expect(signInBox!.height).toBeLessThanOrEqual(40);
  expect(signInBox!.x + signInBox!.width).toBeLessThanOrEqual(375);
  expect(headerBox!.height).toBeLessThanOrEqual(65);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
