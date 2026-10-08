import { WeekSpan, CareerRecord } from "../types/career";

/**
 * Robust WeekSpan matching function.
 * Matches by:
 * 1. Exact year, month, weekOfMonth (with Number normalization)
 * 2. Exact startDate & endDate
 * 3. Overlapping date range via record createdAt or startDate
 */
/** A CareerRecord (with target_week / createdAt) or a bare WeekSpan. */
type WeekMatchInput = Partial<CareerRecord> & Partial<WeekSpan>;

export function isWeekMatch(recOrWeek: WeekMatchInput | null | undefined, week: WeekSpan): boolean {
  if (!recOrWeek || !week) return false;

  // Normalize: if passed CareerRecord with target_week, or a WeekSpan directly
  const target: Partial<WeekSpan> | null = recOrWeek.target_week || (recOrWeek.year && recOrWeek.weekOfMonth ? recOrWeek : null);

  if (target) {
    const rY = Number(target.year);
    const rM = Number(target.month);
    const rW = Number(target.weekOfMonth);

    const wY = Number(week.year);
    const wM = Number(week.month);
    const wW = Number(week.weekOfMonth);

    // 1. Year + Month + WeekOfMonth match
    if (rY === wY && rM === wM && rW === wW) {
      return true;
    }

    // 2. Date range exact match
    if (target.startDate && week.startDate) {
      if (target.startDate === week.startDate) {
        return true;
      }
    }
  }

  // 3. Fallback to createdAt within target week range
  const createdAt = recOrWeek.createdAt;
  if (createdAt && week.startDate && week.endDate) {
    const recDate = String(createdAt).slice(0, 10);
    if (recDate >= week.startDate && recDate <= week.endDate) {
      return true;
    }
  }

  return false;
}
