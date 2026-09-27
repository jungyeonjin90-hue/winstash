"use client";

import { Calendar } from "lucide-react";

export type PeriodPreset = "ALL" | "LAST_3_MONTHS" | "LAST_6_MONTHS" | "THIS_YEAR" | "CUSTOM";

interface PeriodFilterProps {
  startDate: string;
  endDate: string;
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  onDateChange: (start: string, end: string) => void;
  matchCount: number;
}

export function PeriodFilter({
  startDate,
  endDate,
  preset,
  onPresetChange,
  onDateChange,
  matchCount,
}: PeriodFilterProps) {

  const presets: { id: PeriodPreset; label: string }[] = [
    { id: "ALL", label: "전체 기간" },
    { id: "LAST_3_MONTHS", label: "최근 3개월 (분기)" },
    { id: "LAST_6_MONTHS", label: "최근 6개월 (반기)" },
    { id: "THIS_YEAR", label: "올해 전체" },
    { id: "CUSTOM", label: "직접 지정" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            조회 기간 설정:
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-medium">
            {matchCount}건의 기록 일치
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {presets.map((p) => {
            const isSelected = preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPresetChange(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Range Selector (Shown when CUSTOM is selected) */}
      {preset === "CUSTOM" && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>시작일:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <span className="text-zinc-400">~</span>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>종료일:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
