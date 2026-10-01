"use client";

import { useMemo } from "react";
import { Filter, Calendar, CalendarRange } from "lucide-react";
import { CareerRecord } from "@/types/career";
import { getRecordPeriodInfo } from "@/lib/periodUtils";

interface YearRangeFilterEnProps {
  records: CareerRecord[];
  startYear: string;
  endYear: string;
  onStartYearChange: (year: string) => void;
  onEndYearChange: (year: string) => void;
  filteredCount: number;
}

export function YearRangeFilterEn({
  records,
  startYear,
  endYear,
  onStartYearChange,
  onEndYearChange,
  filteredCount,
}: YearRangeFilterEnProps) {
  // Discover all unique years from records + ensure a generous default range (current year - 4 to current year)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearSet = new Set<string>();

    // Baseline years (last 5 years)
    for (let y = currentYear - 4; y <= currentYear; y++) {
      yearSet.add(String(y));
    }

    // Add any years present in actual records
    records.forEach((r) => {
      const info = getRecordPeriodInfo(r);
      if (info.year) {
        yearSet.add(info.year);
      }
    });

    return Array.from(yearSet).sort(); // ascending: ["2022", "2023", "2024", "2025", "2026"]
  }, [records]);

  // Handle start year changes with auto-validation (start <= end)
  const handleStartChange = (newStart: string) => {
    onStartYearChange(newStart);
    const startNum = parseInt(newStart, 10);
    const endNum = parseInt(endYear, 10);
    if (!isNaN(startNum) && !isNaN(endNum) && startNum > endNum) {
      onEndYearChange(newStart);
    }
  };

  // Handle end year changes with auto-validation (end >= start)
  const handleEndChange = (newEnd: string) => {
    onEndYearChange(newEnd);
    const startNum = parseInt(startYear, 10);
    const endNum = parseInt(newEnd, 10);
    if (!isNaN(startNum) && !isNaN(endNum) && endNum < startNum) {
      onStartYearChange(newEnd);
    }
  };

  // Quick preset shortcuts
  const applyPreset = (yearsBack: number | "ALL") => {
    const currentYear = new Date().getFullYear();
    if (yearsBack === "ALL") {
      if (availableYears.length > 0) {
        onStartYearChange(availableYears[0]);
        onEndYearChange(availableYears[availableYears.length - 1]);
      }
    } else {
      const targetStart = Math.max(
        parseInt(availableYears[0] || String(currentYear - 4), 10),
        currentYear - yearsBack + 1
      );
      onStartYearChange(String(targetStart));
      onEndYearChange(String(currentYear));
    }
  };

  const spanYears = useMemo(() => {
    const s = parseInt(startYear, 10);
    const e = parseInt(endYear, 10);
    if (isNaN(s) || isNaN(e) || e < s) return 1;
    return e - s + 1;
  }, [startYear, endYear]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
          <CalendarRange className="w-3.5 h-3.5 text-amber-500" />
          <span>Portfolio Scope:</span>
        </div>

        {/* Start Year Dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium">From:</span>
          <select
            value={startYear}
            onChange={(e) => handleStartChange(e.target.value)}
            className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {y}
              </option>
            ))}
          </select>
        </div>

        <span className="text-zinc-400 font-bold select-none">~</span>

        {/* End Year Dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium">To:</span>
          <select
            value={endYear}
            onChange={(e) => handleEndChange(e.target.value)}
            className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            {availableYears.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Presets */}
        <div className="hidden sm:flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
          <button
            type="button"
            onClick={() => applyPreset(1)}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            1 Year
          </button>
          <button
            type="button"
            onClick={() => applyPreset(2)}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            2 Years
          </button>
          <button
            type="button"
            onClick={() => applyPreset(3)}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            3 Years
          </button>
          <button
            type="button"
            onClick={() => applyPreset("ALL")}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            All
          </button>
        </div>
      </div>

      {/* Summary Badge & Record Counter */}
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-[11px] border border-amber-200/50 dark:border-amber-900/40">
          {spanYears === 1 ? `${startYear} (1 Year)` : `${startYear} ~ ${endYear} (${spanYears} Years)`}
        </span>
        <span className="text-[11px] text-zinc-400 font-medium">
          {filteredCount} weekly {filteredCount === 1 ? "log" : "logs"}
        </span>
      </div>
    </div>
  );
}
