import { test, expect, type Page } from "@playwright/test";
import { FIXED_NOW, SEED_RECORDS, seedDemo } from "./fixtures";

/**
 * Characterisation tests for the dashboard's state-synchronisation behaviour (EN app, demo mode).
 * They pin what the UI does today so the React-hooks lint refactor can be verified not to change it.
 *
 * Select order on the page: [0..2] QuickLogger week picker (year, month, week); the active
 * dashboard tab panel is `#dashboard-section div.block`.
 */

test.skip(!!process.env.E2E_BASE_URL, "Demo session restore is disabled in production builds");

const memoBox = (page: Page) => page.getByPlaceholder(/Hotfixed payment gateway timeouts/);
const loggerSelect = (page: Page, i: 0 | 1 | 2) => page.locator("select").nth(i);
const activePanel = (page: Page) => page.locator("#dashboard-section div.block").first();
const tabButton = (page: Page, name: RegExp) =>
  page.locator("#dashboard-section button").filter({ hasText: name }).first();

async function open(page: Page, path = "/", records?: unknown[]) {
  await page.clock.setFixedTime(FIXED_NOW);
  await seedDemo(page, records);
  await page.goto(path);
  await expect(memoBox(page)).toBeVisible();
}

async function pickLoggerWeek(page: Page, year: string, month: string, week: string) {
  await loggerSelect(page, 0).selectOption(year);
  await loggerSelect(page, 1).selectOption(month);
  await loggerSelect(page, 2).selectOption(week);
}

test("initial state: current week selected, its memo loaded, latest record shown", async ({ page }) => {
  await open(page);
  await expect(loggerSelect(page, 0)).toHaveValue("2026");
  await expect(loggerSelect(page, 1)).toHaveValue("10");
  await expect(loggerSelect(page, 2)).toHaveValue("1");
  await expect(memoBox(page)).toHaveValue("Memo Oct W1");

  await expect(tabButton(page, /Weekly Snippets/)).toHaveClass(/bg-white/);
  const weekly = activePanel(page).locator("select");
  await expect(weekly.nth(0)).toHaveValue("2026");
  await expect(weekly.nth(1)).toHaveValue("10");
  await expect(weekly.nth(2)).toHaveValue("rec-oct-w1");
});

test("QuickLogger: switching weeks loads that week's memo or clears it", async ({ page }) => {
  await open(page);
  await pickLoggerWeek(page, "2026", "9", "3");
  await expect(memoBox(page)).toHaveValue("Memo Sep W3");

  await loggerSelect(page, 2).selectOption("1");
  await expect(memoBox(page)).toHaveValue("");
});

test("QuickLogger: an unsaved draft is replaced when switching weeks and back", async ({ page }) => {
  await open(page);
  await memoBox(page).fill("unsaved draft");
  await pickLoggerWeek(page, "2026", "9", "3");
  await expect(memoBox(page)).toHaveValue("Memo Sep W3");
  await pickLoggerWeek(page, "2026", "10", "1");
  await expect(memoBox(page)).toHaveValue("Memo Oct W1");
});

test("?tab=archive restores the History tab; choosing Weekly clears the param", async ({ page }) => {
  await open(page, "/?tab=archive");
  await expect(tabButton(page, /History/)).toHaveClass(/bg-white/);
  await tabButton(page, /Weekly Snippets/).click();
  await expect(page).not.toHaveURL(/tab=/);
});

test("History tab: the latest record is expanded by default", async ({ page }) => {
  await open(page);
  await tabButton(page, /History/).click();
  const panel = activePanel(page);
  await expect(panel.getByText("Memo Oct W1 (done)")).toBeVisible();
  await expect(panel.getByText("Memo Sep W3 (done)")).toHaveCount(0);
});

test("Weekly Snippets: changing the month selects the newest record in it", async ({ page }) => {
  await open(page);
  const weekly = activePanel(page).locator("select");
  await weekly.nth(1).selectOption("09"); // this select uses zero-padded months
  await expect(weekly.nth(2)).toHaveValue("rec-sep-w3");
  await expect(activePanel(page).getByText("Memo Sep W3 (done)")).toBeVisible();
});

test("saving a memo from another tab jumps to Weekly Snippets on the saved record", async ({ page }) => {
  await open(page);
  await tabButton(page, /History/).click();
  await pickLoggerWeek(page, "2026", "9", "1");
  await expect(memoBox(page)).toHaveValue("");
  await memoBox(page).fill("Brand new Sep W1 note");
  await page.getByRole("button", { name: /Save to Week 1/ }).click();
  await expect(page.getByText(/successfully transformed and synced/)).toBeVisible();

  await expect(tabButton(page, /Weekly Snippets/)).toHaveClass(/bg-white/);
  const weekly = activePanel(page).locator("select");
  await expect(weekly.nth(0)).toHaveValue("2026");
  await expect(weekly.nth(1)).toHaveValue("09");
  await expect(weekly.nth(2).locator("option:checked")).toHaveText(/Week 1/);
});

test("Performance Review: year follows the records when they only exist in an older year", async ({ page }) => {
  await open(page, "/", [SEED_RECORDS[2]]); // only Aug 2025
  await tabButton(page, /Performance Review/).click();
  await expect(activePanel(page).locator("select").first()).toHaveValue("2025");
});

test("Feedback modal: fields are reset when it is reopened", async ({ page }) => {
  await open(page);
  const openFeedback = async () => {
    await page.getByRole("button", { name: "User profile menu" }).click();
    await page.getByText("Send Feedback").click();
  };
  await openFeedback();
  const title = page.locator("input[type=text][required]").first();
  await title.fill("half-written title");
  await page.keyboard.press("Escape");
  await expect(title).toHaveCount(0);

  await openFeedback();
  await expect(page.locator("input[type=text][required]").first()).toHaveValue("");
});

test("Career Portfolio: year range defaults to the records' span (up to 3 years)", async ({ page }) => {
  await open(page);
  await tabButton(page, /Career Portfolio/).click();
  const range = activePanel(page).locator("select");
  await expect(range.nth(0)).toHaveValue("2025");
  await expect(range.nth(1)).toHaveValue("2026");
});

test("Career Portfolio: range follows records that load for an older span only", async ({ page }) => {
  await open(page, "/", [SEED_RECORDS[2]]); // only Aug 2025
  await tabButton(page, /Career Portfolio/).click();
  const range = activePanel(page).locator("select");
  await expect(range.nth(0)).toHaveValue("2025");
  await expect(range.nth(1)).toHaveValue("2025");
});
