import { CareerRecord } from "@/types/career";

export interface PeriodInfo {
  year: string; // "2026"
  half: "H1" | "H2";
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  quarterLabel: string; // "2026-Q1"
  halfLabel: string; // "2026-H1"
}

export interface DetailedRecordDateInfo {
  id: string;
  year: string; // "2026"
  month: string; // "03"
  monthShort: string; // "Mar"
  monthLong: string; // "March"
  weekNum: number;
  dateRange: string; // "Mar 16 – Mar 20"
  displayLabel: string; // "W12 (Mar 16 – Mar 20)"
  rawDate: Date;
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
 * Extracts Year, Month, and Week/Date details for weekly history dropdowns
 */
export function getDetailedRecordDateInfo(record: CareerRecord): DetailedRecordDateInfo {
  let date: Date;

  if (record.target_week?.endDate) {
    date = new Date(record.target_week.endDate);
  } else if (record.createdAt) {
    date = new Date(record.createdAt);
  } else {
    date = new Date();
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  let yearStr = "";
  let monthRaw = 1;
  let weekNum = 1;

  const { getWeekSpanFromDateEn, formatWeekDateRangeEn } = require("./weekUtilsEn");

  if (record.target_week) {
    yearStr = String(record.target_week.year);
    monthRaw = record.target_week.month;
    weekNum = record.target_week.weekOfMonth;
  } else {
    const span = getWeekSpanFromDateEn(date);
    yearStr = String(span.year);
    monthRaw = span.month;
    weekNum = span.weekOfMonth;
  }

  const year = yearStr;
  const month = monthRaw < 10 ? `0${monthRaw}` : `${monthRaw}`;
  
  const dummyDate = new Date(Number(yearStr), monthRaw - 1, 15);
  const monthShort = dummyDate.toLocaleDateString("en-US", { month: "short" });
  const monthLong = dummyDate.toLocaleDateString("en-US", { month: "long" });

  let dateRange = "";

  if (record.target_week?.startDate && record.target_week?.endDate) {
    dateRange = formatWeekDateRangeEn(record.target_week.startDate, record.target_week.endDate);
  } else {
    const span = getWeekSpanFromDateEn(date);
    dateRange = formatWeekDateRangeEn(span.startDate, span.endDate);
  }

  const displayLabel = `Week ${weekNum}: ${dateRange}`;

  return {
    id: record.id,
    year,
    month,
    monthShort,
    monthLong,
    weekNum,
    dateRange,
    displayLabel,
    rawDate: date,
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

/**
 * Filters CareerRecords based on a Start Year and End Year range (inclusive)
 * Perfect for multi-year Portfolio and STAR case study synthesis (e.g. 2024 ~ 2026).
 */
export function filterRecordsByYearRange(
  records: CareerRecord[],
  startYear: string,
  endYear: string
): CareerRecord[] {
  const startNum = parseInt(startYear, 10);
  const endNum = parseInt(endYear, 10);

  return records.filter((r) => {
    const info = getRecordPeriodInfo(r);
    const recYear = parseInt(info.year, 10);

    if (!isNaN(startNum) && recYear < startNum) {
      return false;
    }
    if (!isNaN(endNum) && recYear > endNum) {
      return false;
    }

    return true;
  });
}

