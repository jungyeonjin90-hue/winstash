import { WeekSpan, CareerRecord } from "../types/career";

/**
 * Robust WeekSpan matching function.
 * Matches by:
 * 1. Exact year, month, weekOfMonth (with Number normalization)
 * 2. Exact startDate & endDate
 * 3. Overlapping date range via record createdAt or startDate
 */
export function isWeekMatch(rec: CareerRecord, week: WeekSpan): boolean {
  if (!rec) return false;

  if (rec.target_week) {
    const rY = Number(rec.target_week.year);
    const rM = Number(rec.target_week.month);
    const rW = Number(rec.target_week.weekOfMonth);

    const wY = Number(week.year);
    const wM = Number(week.month);
    const wW = Number(week.weekOfMonth);

    // 1. Year + Month + WeekOfMonth match
    if (rY === wY && rM === wM && rW === wW) {
      return true;
    }

    // 2. Date range exact match
    if (rec.target_week.startDate && week.startDate) {
      if (rec.target_week.startDate === week.startDate) {
        return true;
      }
    }
  }

  // 3. Fallback to createdAt within target week range
  if (rec.createdAt && week.startDate && week.endDate) {
    const recDate = rec.createdAt.slice(0, 10);
    if (recDate >= week.startDate && recDate <= week.endDate) {
      return true;
    }
  }

  return false;
}
