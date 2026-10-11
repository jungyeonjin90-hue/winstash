import { test, expect } from "@playwright/test";
import { seedDemo } from "./fixtures";

/**
 * Report-only CSP: our own pages should not trigger violations (they would become breakage once the
 * policy is enforced). The browser fires `securitypolicyviolation` for report-only violations too.
 */
async function collectViolations(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
}

const readViolations = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

for (const path of ["/", "/pricing", "/privacy", "/resources", "/this-page-does-not-exist-e2e"]) {
  test(`no CSP violations on ${path}`, async ({ page }) => {
    await collectViolations(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await readViolations(page)).toEqual([]);
  });
}

test("no CSP violations in the signed-in (demo) dashboard", async ({ page }) => {
  await collectViolations(page);
  await seedDemo(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "User profile menu" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(await readViolations(page)).toEqual([]);
});
