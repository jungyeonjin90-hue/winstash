import { WeekSpan } from "@/types/career";
import { formatDateLocal, getMondayOfDate } from "./weekUtils";

const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * ISO 8601 Week Span Generator with English Labels
 */
export function getWeekSpanFromDateEn(d: Date = new Date()): WeekSpan {
  const monday = getMondayOfDate(d);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const thursday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const year = thursday.getFullYear();
  const month = thursday.getMonth() + 1; // 1 ~ 12
  const monthName = MONTH_NAMES_EN[month - 1];

  const firstOfMonth = new Date(year, month - 1, 1);
  const firstMonday = getMondayOfDate(firstOfMonth);
  const firstThursday = new Date(
    firstMonday.getFullYear(),
    firstMonday.getMonth(),
    firstMonday.getDate() + 3
  );

  let baseThursday = firstThursday;
  if (firstThursday.getMonth() + 1 !== month) {
    baseThursday = new Date(
      firstThursday.getFullYear(),
      firstThursday.getMonth(),
      firstThursday.getDate() + 7
    );
  }

  const diffTime = thursday.getTime() - baseThursday.getTime();
  const weekNumber = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

  return {
    year,
    month,
    weekOfMonth: Math.max(1, weekNumber),
    startDate: formatDateLocal(monday),
    endDate: formatDateLocal(sunday),
    label: `${monthName} ${year} · Week ${Math.max(1, weekNumber)}`,
  };
}

export function getCurrentWeekSpanEn(): WeekSpan {
  return getWeekSpanFromDateEn(new Date());
}

/**
 * Generate candidate weeks for dropdown selector (past 8 weeks + next week)
 */
export function getAvailableWeeksEn(referenceDate: Date = new Date()): WeekSpan[] {
  const currentMonday = getMondayOfDate(referenceDate);
  const weeks: WeekSpan[] = [];

  // Next week (+1 week)
  const nextWeekDate = new Date(currentMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
  weeks.push(getWeekSpanFromDateEn(nextWeekDate));

  // Current week (0)
  weeks.push(getWeekSpanFromDateEn(currentMonday));

  // Past 8 weeks
  for (let i = 1; i <= 8; i++) {
    const pastDate = new Date(currentMonday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    weeks.push(getWeekSpanFromDateEn(pastDate));
  }

  return weeks;
}

/**
 * Format date range for UI (e.g. "Sep 21 – Sep 27")
 */
export function formatWeekDateRangeEn(startDate: string, endDate: string): string {
  try {
    const [sY, sM, sD] = startDate.split("-").map(Number);
    const [, eM, eD] = endDate.split("-").map(Number);
    const startMonth = MONTH_NAMES_EN[sM - 1];
    const endMonth = MONTH_NAMES_EN[eM - 1];

    if (sM === eM) {
      return `${startMonth} ${sD} – ${eD}, ${sY}`;
    }
    return `${startMonth} ${sD} – ${endMonth} ${eD}, ${sY}`;
  } catch {
    return `${startDate} ~ ${endDate}`;
  }
}
