import { test, expect, type Page } from "@playwright/test";

/**
 * Core user journey in demo mode (dev only): onboarding -> brain dump -> AI transform -> dashboard.
 * Demo sessions live in localStorage and Gemini calls go to the local mock (e2e/mock-gemini.mjs),
 * so nothing touches production Firestore or the paid Gemini API.
 */

test.skip(!!process.env.E2E_BASE_URL, "Demo session restore is disabled in production builds");

const DEMO_USER = {
  uid: "demo-user-1234",
  email: "demo.pro@winstash.net",
  displayName: "Demo User",
  photoURL: null,
  isDemo: true,
};

async function seedDemoSession(page: Page, lastActivity = Date.now()) {
  await page.addInitScript(
    ([user, ts]) => {
      if (!sessionStorage.getItem("__e2e_seeded")) {
        localStorage.setItem("career_pulse_demo_user", JSON.stringify(user));
        localStorage.setItem("winstash_last_activity_timestamp", String(ts));
        sessionStorage.setItem("__e2e_seeded", "1");
      }
    },
    [DEMO_USER, lastActivity] as const
  );
}

const memoBox = (page: Page) => page.locator("#quick-logger-textarea");

async function finishOnboarding(page: Page) {
  const start = page.getByRole("button", { name: "Write my first note" });
  await start.click();
  await expect(start).toBeHidden();
  await expect(memoBox(page)).toBeFocused();
}

test("logged-out visitor sees the landing page, not the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(memoBox(page)).toHaveCount(0);
});

test("first-time demo user: onboarding -> save memo -> record appears in dashboard", async ({ page }) => {
  await seedDemoSession(page);
  await page.goto("/");

  await finishOnboarding(page);

  // First-note state: role-based placeholder, one-line hint, no heatmap/dashboard yet
  await expect(memoBox(page)).toHaveAttribute("placeholder", /Fixed the login timeout bug/);
  await expect(page.getByText(/Write one line about what you did this week/)).toBeVisible();
  await expect(page.locator("#dashboard-section")).toHaveCount(0);

  const memo = "Cut p99 latency from 1.2s to 85ms by adding Redis caching. Zero dropped transactions.";
  await memoBox(page).fill(memo);
  await expect(page.getByText(`${memo.length} / 5,000`)).toBeVisible();

  const transform = page.waitForResponse((r) => r.url().endsWith("/api/transform") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Save to Week/ }).click();
  const res = await transform;
  expect(res.status()).toBe(200);
  expect(res.request().headers()["x-demo-user"]).toBe("true");

  await expect(page.getByText(/successfully transformed and synced/)).toBeVisible();
  await expect(page.getByText(/History \(1\)/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Update Week/ })).toBeVisible();

  // First save shows the one-time first-result card with all three drafts.
  const firstResult = page.locator("#first-result-card");
  await expect(firstResult.getByText("Your note became three drafts")).toBeVisible();
  await expect(firstResult.getByText("Weekly Snippet", { exact: true })).toBeVisible();
  await expect(firstResult.getByText("Performance Review", { exact: true })).toBeVisible();
  await expect(firstResult.getByText("Career Portfolio", { exact: true })).toBeVisible();
  await expect(firstResult.getByText(/Tip: add your seniority, industry and region in Settings/)).toBeVisible();
  await firstResult.getByRole("button", { name: "Dismiss" }).click();
  await expect(firstResult).toHaveCount(0);

  // Record survives a reload (demo persistence is localStorage); the card does not come back.
  await page.reload();
  await expect(page.getByText(/History \(1\)/)).toBeVisible();
  await expect(page.locator("#first-result-card")).toHaveCount(0);
});

test("save button is disabled for an empty memo", async ({ page }) => {
  await seedDemoSession(page);
  await page.goto("/");
  await finishOnboarding(page);
  await memoBox(page).fill("   ");
  await expect(page.getByRole("button", { name: /Save to Week/ })).toBeDisabled();
});

test("[L-6] fallback summary must not cut sentences at decimal points", async ({ page }) => {
  await seedDemoSession(page);
  await page.goto("/");
  await finishOnboarding(page);
  // [mock:fail] makes the mock Gemini fail so the heuristic fallback produces the output.
  await memoBox(page).fill("Cut p99 latency from 1.2s to 85ms by adding Redis caching. [mock:fail]");
  await page.getByRole("button", { name: /Save to Week/ }).click();
  await expect(page.getByText(/successfully transformed and synced/)).toBeVisible();
  await expect(page.getByText(/from 1\.$/)).toHaveCount(0);
});

test("30-minute inactivity signs the user out (idle tab regains focus)", async ({ page }) => {
  await seedDemoSession(page);
  await page.goto("/");
  await finishOnboarding(page);

  page.on("dialog", (d) => d.accept());
  const dialog = page.waitForEvent("dialog");
  await page.evaluate(() => {
    localStorage.setItem("winstash_last_activity_timestamp", String(Date.now() - 31 * 60 * 1000));
    window.dispatchEvent(new Event("focus"));
  });
  expect((await dialog).message()).toMatch(/30 minutes of inactivity/);
  await expect(memoBox(page)).toHaveCount(0);
});

test("[L-5] 30-minute inactivity must also apply after a reload / reopened browser", async ({ page }) => {
  test.setTimeout(45_000);
  // Stale timestamp from a previous visit. AuthContext's `if (!user) removeItem(LAST_ACTIVITY_KEY)`
  // branch runs before the session is restored and wipes it, so the user is never signed out.
  await seedDemoSession(page, Date.now() - 31 * 60 * 1000);
  page.on("dialog", (d) => d.accept());
  const dialog = page.waitForEvent("dialog", { timeout: 25_000 });
  await page.goto("/");
  expect((await dialog).message()).toMatch(/30 minutes of inactivity/);
});
