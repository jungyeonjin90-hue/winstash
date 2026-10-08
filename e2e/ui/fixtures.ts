import type { Page } from "@playwright/test";

/** Fixed "now" for UI tests: Friday 2026-10-09 → app week "Week 1" (Oct 4–10, 2026). */
export const FIXED_NOW = new Date(2026, 9, 9, 10, 0, 0);

export const DEMO_UID = "demo-user-1234";

function rec(id: string, createdAt: string, week: [number, number, number, string, string], memo: string) {
  const [year, month, weekOfMonth, startDate, endDate] = week;
  return {
    id,
    createdAt,
    target_week: { year, month, weekOfMonth, startDate, endDate, label: `Week ${weekOfMonth}` },
    raw_memo: memo,
    weekly_report: { done: [`${memo} (done)`], in_progress: [`${memo} (wip)`], next_week: [`${memo} (next)`] },
    brag_sheet_item: { metric_summary: `${memo} metric`, business_impact: `${memo} impact`, quarter: `${year}-Q${Math.ceil(month / 3)}` },
    star_portfolio: {
      title: `${memo} title`, situation: "s", task: "t", action: "a", result: "r",
      nda_tags: ["#Tag"], impactCategory: "efficiency", impactMagnitude: "medium",
    },
    jobRole: "engineering",
    toneManner: "impact",
    source: "web_text",
  };
}

/** Three records, newest first, with week spans computed by lib/weekUtilsEn.ts rules. */
export const SEED_RECORDS = [
  rec("rec-oct-w1", "2026-10-09T09:00:00.000Z", [2026, 10, 1, "2026-10-04", "2026-10-10"], "Memo Oct W1"),
  rec("rec-sep-w3", "2026-09-18T09:00:00.000Z", [2026, 9, 3, "2026-09-13", "2026-09-19"], "Memo Sep W3"),
  rec("rec-aug25-w2", "2025-08-15T09:00:00.000Z", [2025, 8, 2, "2025-08-10", "2025-08-16"], "Memo Aug 2025 W2"),
];

/** Demo session with a saved persona (skips onboarding) and the seed records. */
export async function seedDemo(page: Page, records: unknown[] = SEED_RECORDS) {
  await page.addInitScript(
    ([uid, recs, now]) => {
      if (sessionStorage.getItem("__e2e_seeded")) return;
      localStorage.setItem(
        "career_pulse_demo_user",
        JSON.stringify({ uid, email: "demo.pro@winstash.net", displayName: "Demo User", photoURL: null, isDemo: true })
      );
      localStorage.setItem("winstash_last_activity_timestamp", String(now));
      localStorage.setItem(`career_pulse_persona_${uid}`, JSON.stringify({ jobRole: "engineering", toneManner: "impact" }));
      localStorage.setItem(`career_pulse_records_user_${uid}`, JSON.stringify(recs));
      sessionStorage.setItem("__e2e_seeded", "1");
    },
    [DEMO_UID, records, FIXED_NOW.getTime()] as const
  );
}
