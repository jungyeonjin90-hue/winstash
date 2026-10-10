import type { CareerRecord } from "@/types/career";

/*
 * Ordering rules for weekly records shown in the dashboard.
 *
 * - Lists are ordered by the week the record belongs to (`createdAt` holds the week's date), newest
 *   week first. A record saved for an older week therefore lands in its place, not at the top.
 * - "Latest" means the record the user saved most recently (`savedAt`), whatever week it is for.
 *   Records saved before `savedAt` existed fall back to the newest week, as before.
 */

function time(value: string | undefined): number {
  const t = value ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Newest week first; ties (same week date) by most recently saved. Returns a new array. */
export function sortRecordsByWeek(records: CareerRecord[]): CareerRecord[] {
  return [...records].sort(
    (a, b) => time(b.createdAt) - time(a.createdAt) || time(b.savedAt) - time(a.savedAt)
  );
}

/** Inserts or replaces `record` and keeps the list in week order. */
export function upsertRecordSorted(records: CareerRecord[], record: CareerRecord): CareerRecord[] {
  return sortRecordsByWeek([record, ...records.filter((r) => r.id !== record.id)]);
}

/**
 * Id of the most recently saved record. Falls back to the first record of a week-ordered list when
 * no record carries `savedAt` yet (legacy data).
 */
export function getMostRecentlySavedId(records: CareerRecord[]): string | undefined {
  let best: CareerRecord | undefined;
  for (const r of records) {
    if (r.savedAt && (!best || time(r.savedAt) > time(best.savedAt))) best = r;
  }
  return best?.id ?? records[0]?.id;
}
