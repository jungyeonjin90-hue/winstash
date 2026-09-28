import { CareerRecord } from "@/types/career";

export interface PeriodInfo {
  year: string; // "2026"
  half: "H1" | "H2";
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  quarterLabel: string; // "2026-Q1"
  halfLabel: string; // "2026-H1"
}

/**
 * Extracts Year, Half (H1/H2), and Quarter (Q1-Q4) from a CareerRecord
 */
export function getRecordPeriodInfo(record: CareerRecord): PeriodInfo {
  let date: Date;

  if (record.target_week?.endDate) {
    date = new Date(record.target_week.endDate);
  } else if (record.createdAt) {
    date = new Date(record.createdAt);
  } else {
    date = new Date();
  }

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const year = String(date.getFullYear());
  const month = date.getMonth() + 1; // 1-12

  const half: "H1" | "H2" = month <= 6 ? "H1" : "H2";
  const quarterNum = Math.ceil(month / 3); // 1, 2, 3, 4
  const quarter: "Q1" | "Q2" | "Q3" | "Q4" = `Q${quarterNum}` as "Q1" | "Q2" | "Q3" | "Q4";

  return {
    year,
    half,
    quarter,
    quarterLabel: `${year}-${quarter}`,
    halfLabel: `${year}-${half}`,
  };
}

/**
 * Discovers all unique available Years, Halves, and Quarters from records
 */
export function getAvailablePeriods(records: CareerRecord[]) {
  const years = new Set<string>();
  const halves = new Set<string>(); // "H1", "H2"
  const quarters = new Set<string>(); // "Q1", "Q2", "Q3", "Q4"

  records.forEach((r) => {
    const info = getRecordPeriodInfo(r);
    years.add(info.year);
    halves.add(info.half);
    quarters.add(info.quarter);
  });

  const currentYear = String(new Date().getFullYear());
  if (years.size === 0) {
    years.add(currentYear);
  }

  return {
    years: Array.from(years).sort().reverse(),
    halves: ["ALL", "H1", "H2"] as const,
    quarters: ["ALL", "Q1", "Q2", "Q3", "Q4"] as const,
  };
}

/**
 * Filters CareerRecords based on Year, Half, and Quarter
 */
export function filterRecordsByPeriod(
  records: CareerRecord[],
  selectedYear: string,
  selectedHalf: string = "ALL",
  selectedQuarter: string = "ALL"
): CareerRecord[] {
  return records.filter((r) => {
    const info = getRecordPeriodInfo(r);

    if (selectedYear !== "ALL" && info.year !== selectedYear) {
      return false;
    }

    if (selectedHalf !== "ALL" && info.half !== selectedHalf) {
      return false;
    }

    if (selectedQuarter !== "ALL" && info.quarter !== selectedQuarter) {
      return false;
    }

    return true;
  });
}
