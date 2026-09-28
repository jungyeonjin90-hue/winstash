import { WeekSpan } from "@/types/career";
import { formatDateLocal } from "./weekUtils";

const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getSundayOfDate(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 (Sun) ~ 6 (Sat)
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * US Standard Week Span Generator (Sunday to Saturday)
 */
export function getWeekSpanFromDateEn(d: Date = new Date()): WeekSpan {
  const sunday = getSundayOfDate(d);
  const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  // US weeks are often assigned to the month that contains the Wednesday
  const wednesday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 3);
  const year = wednesday.getFullYear();
  const month = wednesday.getMonth() + 1; // 1 ~ 12
  
  // Find the first Wednesday of the month
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstSunday = getSundayOfDate(firstOfMonth);
  const firstWednesday = new Date(
    firstSunday.getFullYear(),
    firstSunday.getMonth(),
    firstSunday.getDate() + 3
  );

  let baseWednesday = firstWednesday;
  if (firstWednesday.getMonth() + 1 !== month) {
    baseWednesday = new Date(
      firstWednesday.getFullYear(),
      firstWednesday.getMonth(),
      firstWednesday.getDate() + 7
    );
  }

  const diffTime = wednesday.getTime() - baseWednesday.getTime();
  const weekNumber = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

  const startStr = formatDateLocal(sunday);
  const endStr = formatDateLocal(saturday);

  return {
    year,
    month,
    weekOfMonth: Math.max(1, weekNumber),
    startDate: startStr,
    endDate: endStr,
    label: `Week ${Math.max(1, weekNumber)}`,
  };
}

export function getCurrentWeekSpanEn(): WeekSpan {
  return getWeekSpanFromDateEn(new Date());
}

/**
 * Generate all weeks in a given Year and Month (US Standard)
 */
export function getWeeksForMonthEn(year: number, month: number): WeekSpan[] {
  const weeks: WeekSpan[] = [];
  const seenWeeks = new Set<string>();

  const lastDay = new Date(year, month, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    const span = getWeekSpanFromDateEn(d);
    if (span.year === year && span.month === month) {
      if (!seenWeeks.has(span.startDate)) {
        seenWeeks.add(span.startDate);
        weeks.push(span);
      }
    }
  }

  weeks.sort((a, b) => a.weekOfMonth - b.weekOfMonth);
  return weeks;
}

/**
 * Generate candidate weeks for dropdown selector (fallback/default)
 */
export function getAvailableWeeksEn(referenceDate: Date = new Date()): WeekSpan[] {
  const currentSunday = getSundayOfDate(referenceDate);
  const weeks: WeekSpan[] = [];

  const nextWeekDate = new Date(currentSunday.getTime() + 7 * 24 * 60 * 60 * 1000);
  weeks.push(getWeekSpanFromDateEn(nextWeekDate));
  weeks.push(getWeekSpanFromDateEn(currentSunday));

  for (let i = 1; i <= 8; i++) {
    const pastDate = new Date(currentSunday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    weeks.push(getWeekSpanFromDateEn(pastDate));
  }

  return weeks;
}

/**
 * Format date range for UI (e.g. "Sep 21 - Sep 27")
 */
export function formatWeekDateRangeEn(startDate: string, endDate: string): string {
  try {
    const [, sM, sD] = startDate.split("-").map(Number);
    const [, eM, eD] = endDate.split("-").map(Number);
    const startMonth = MONTH_NAMES_EN[sM - 1];
    const endMonth = MONTH_NAMES_EN[eM - 1];

    if (sM === eM) {
      return `${startMonth} ${sD} - ${eD}`;
    }
    return `${startMonth} ${sD} - ${endMonth} ${eD}`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
}
