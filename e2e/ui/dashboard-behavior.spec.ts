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

const memoBox = (page: Page) => page.locator("#quick-logger-textarea");
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

test("Performance Review / Career Portfolio: with one record, Generate is secondary", async ({ page }) => {
  await open(page, "/", [SEED_RECORDS[0]]);
  await tabButton(page, /Performance Review/).click();
  await expect(activePanel(page).getByText("Memo Oct W1 metric")).toBeVisible();
  await expect(activePanel(page).getByText(/Add a few more weekly notes/)).toBeVisible();
  await expect(activePanel(page).getByRole("button", { name: "Generate from 1 note anyway" })).toBeEnabled();
  await tabButton(page, /Career Portfolio/).click();
  await expect(activePanel(page).getByText("Memo Oct W1 title")).toBeVisible();
  await expect(activePanel(page).getByRole("button", { name: "Generate from 1 note anyway" })).toBeEnabled();
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

test("saving a memo clears only this user's local summary cache (and legacy keys)", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("__e2e_cache_seeded")) return;
    localStorage.setItem("career_pulse_summary_cache_v2_demo-user-1234_brag_x", "{}");
    localStorage.setItem("career_pulse_summary_cache_v2_other-user_brag_x", "{}");
    localStorage.setItem("career_pulse_summary_cache_brag_legacy", "{}");
    sessionStorage.setItem("__e2e_cache_seeded", "1");
  });
  await open(page);
  await pickLoggerWeek(page, "2026", "9", "1");
  await memoBox(page).fill("Cache purge check");
  await page.getByRole("button", { name: /Save to Week 1/ }).click();
  await expect(page.getByText(/successfully transformed and synced/)).toBeVisible();

  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("career_pulse_summary_cache")));
  expect(keys).not.toContain("career_pulse_summary_cache_v2_demo-user-1234_brag_x");
  expect(keys).not.toContain("career_pulse_summary_cache_brag_legacy");
  expect(keys).toContain("career_pulse_summary_cache_v2_other-user_brag_x");
});

test.describe("History order and 'Latest'", () => {
  // Stored out of order on purpose; Sep W3 was saved most recently although Oct W1 is the newest week.
  const withSavedAt = [
    { ...SEED_RECORDS[2], savedAt: "2026-10-01T10:00:00.000Z" }, // Aug 2025 W2
    { ...SEED_RECORDS[0], savedAt: "2026-10-05T10:00:00.000Z" }, // Oct 2026 W1
    { ...SEED_RECORDS[1], savedAt: "2026-10-08T10:00:00.000Z" }, // Sep 2026 W3  <- most recently saved
  ];
  // Labels look like "2026 October, Week 1: Oct 4 - 10"; compare the part before the date range.
  const weekLabels = async (page: Page) =>
    (await activePanel(page).locator("span.font-bold.text-sm.text-indigo-600").allInnerTexts()).map(
      (t) => t.split(":")[0]
    );
  const latestCardLabel = (page: Page) =>
    activePanel(page)
      .locator("div.rounded-2xl", { has: page.getByText("Latest Entry") })
      .last()
      .locator("span.font-bold.text-sm.text-indigo-600")
      .innerText()
      .then((t) => t.split(":")[0]);

  test("History is in week order and 'Latest Entry' marks the most recently saved record", async ({ page }) => {
    await open(page, "/", withSavedAt);
    await tabButton(page, /History/).click();
    expect(await weekLabels(page)).toEqual([
      "2026 October, Week 1",
      "2026 September, Week 3",
      "2025 August, Week 2",
    ]);
    expect(await latestCardLabel(page)).toBe("2026 September, Week 3");
    await expect(activePanel(page).getByText("Memo Sep W3 (done)")).toBeVisible();
  });

  test("a record whose createdAt is its save time (old extension records) is still ordered by its week", async ({ page }) => {
    const extAug = {
      ...SEED_RECORDS[1],
      id: "rec-ext-aug",
      createdAt: "2026-10-09T03:28:23.516Z", // save time, not the week
      target_week: { year: 2026, month: 8, weekOfMonth: 1, startDate: "2026-08-02", endDate: "2026-08-08", label: "Week 1" },
      source: "chrome_extension",
      savedAt: "2026-10-09T03:28:23.591Z",
    };
    await open(page, "/", [...withSavedAt, extAug]);
    await tabButton(page, /History/).click();
    expect(await weekLabels(page)).toEqual([
      "2026 October, Week 1",
      "2026 September, Week 3",
      "2026 August, Week 1",
      "2025 August, Week 2",
    ]);
    expect(await latestCardLabel(page)).toBe("2026 August, Week 1");
  });

  test("an expanded card shows the whole raw note; collapsing it does not open another card", async ({ page }) => {
    const longMemo = Array.from({ length: 6 }, (_, i) => `Line ${i + 1}: shipped item number ${i + 1} with details.`).join("\n");
    const records = [{ ...withSavedAt[2], raw_memo: longMemo }, withSavedAt[1], withSavedAt[0]]; // Sep W3 = latest
    await open(page, "/", records);
    await tabButton(page, /History/).click();

    const panel = activePanel(page);
    const memo = panel.locator("p", { hasText: "Line 1:" });
    // Expanded by default (latest): every line is rendered, not clamped to two lines
    await expect(memo).not.toHaveClass(/line-clamp/);
    await expect(memo).toContainText("Line 6: shipped item number 6");
    const box = await memo.boundingBox();
    expect(box!.height).toBeGreaterThan(80);

    // Collapse it: nothing else opens
    // Only the expanded card shows the "collapse" chevron
    await panel.locator("button:has(svg.lucide-chevron-up)").click();
    await expect(memo).toHaveClass(/line-clamp-2/);
    await expect(panel.getByText("Memo Oct W1 (done)")).toHaveCount(0);
    await expect(panel.getByText("Memo Aug 2025 W2 (done)")).toHaveCount(0);
    await expect(panel.locator("svg.lucide-chevron-up")).toHaveCount(0);
  });

  test("saving a note for an older week puts it in its week's place and makes it 'Latest'", async ({ page }) => {
    await open(page, "/", withSavedAt);
    await tabButton(page, /History/).click();
    await pickLoggerWeek(page, "2026", "9", "1");
    await memoBox(page).fill("Backfilled Sep W1 note");
    await page.getByRole("button", { name: /Save to Week 1/ }).click();
    await expect(page.getByText(/successfully transformed and synced/)).toBeVisible();

    // Weekly Snippets is focused on it and labels it (Latest)
    await expect(activePanel(page).locator("select").nth(2).locator("option:checked")).toHaveText(/Week 1.*\(Latest\)/);

    await tabButton(page, /History/).click();
    expect(await weekLabels(page)).toEqual([
      "2026 October, Week 1",
      "2026 September, Week 3",
      "2026 September, Week 1",
      "2025 August, Week 2",
    ]);
    expect(await latestCardLabel(page)).toBe("2026 September, Week 1");
  });
});
