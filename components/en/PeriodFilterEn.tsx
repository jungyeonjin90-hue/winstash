"use client";

import { useMemo } from "react";
import { Calendar, Clock, Filter, Layers } from "lucide-react";
import { CareerRecord } from "@/types/career";
import { getAvailablePeriods } from "@/lib/periodUtils";

interface PeriodFilterEnProps {
  records: CareerRecord[];
  selectedYear: string;
  selectedHalf: string;
  selectedQuarter?: string;
  onYearChange: (year: string) => void;
  onHalfChange: (half: string) => void;
  onQuarterChange?: (quarter: string) => void;
  showQuarter?: boolean; // false for STAR Portfolio
  filteredCount: number;
}

export function PeriodFilterEn({
  records,
  selectedYear,
  selectedHalf,
  selectedQuarter = "ALL",
  onYearChange,
  onHalfChange,
  onQuarterChange,
  showQuarter = true,
  filteredCount,
}: PeriodFilterEnProps) {
  const available = useMemo(() => getAvailablePeriods(records), [records]);

  // Restrict quarters based on selected half if applicable
  const availableQuartersForHalf = useMemo(() => {
    if (selectedHalf === "H1") return ["ALL", "Q1", "Q2"];
    if (selectedHalf === "H2") return ["ALL", "Q3", "Q4"];
    return available.quarters;
  }, [selectedHalf, available.quarters]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        {/* Label */}
        <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
          <Filter className="w-3.5 h-3.5 text-indigo-500" />
          <span>Period Scope:</span>
        </div>

        {/* 1. Year Dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Years</option>
            {available.years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Half-Year Dropdown */}
        <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium">Half:</span>
          <select
            value={selectedHalf}
            onChange={(e) => {
              onHalfChange(e.target.value);
              // Auto reset quarter if mismatch
              if (onQuarterChange && e.target.value === "H1" && (selectedQuarter === "Q3" || selectedQuarter === "Q4")) {
                onQuarterChange("ALL");
              } else if (onQuarterChange && e.target.value === "H2" && (selectedQuarter === "Q1" || selectedQuarter === "Q2")) {
                onQuarterChange("ALL");
              }
            }}
            className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-white dark:bg-zinc-900">Full Year (Both Halves)</option>
            <option value="H1" className="bg-white dark:bg-zinc-900">H1 (Jan – Jun)</option>
            <option value="H2" className="bg-white dark:bg-zinc-900">H2 (Jul – Dec)</option>
          </select>
        </div>

        {/* 3. Quarter Dropdown (Brag Sheet only) */}
        {showQuarter && onQuarterChange && (
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 font-medium">Quarter:</span>
            <select
              value={selectedQuarter}
              onChange={(e) => onQuarterChange(e.target.value)}
              className="bg-transparent font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-zinc-900">All Quarters</option>
              {availableQuartersForHalf
                .filter((q) => q !== "ALL")
                .map((q) => (
                  <option key={q} value={q} className="bg-white dark:bg-zinc-900">
                    {q}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Record Counter */}
      <div className="text-[11px] text-zinc-400 font-medium">
        <span>{filteredCount} weekly {filteredCount === 1 ? "log" : "logs"} in range</span>
      </div>
    </div>
  );
}
