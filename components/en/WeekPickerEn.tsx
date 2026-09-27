"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { WeekSpan, CareerRecord } from "@/types/career";
import { getAvailableWeeksEn, formatWeekDateRangeEn } from "@/lib/weekUtilsEn";

interface WeekPickerEnProps {
  selectedWeek: WeekSpan;
  onWeekChange: (week: WeekSpan) => void;
  existingRecords?: CareerRecord[];
}

export function WeekPickerEn({
  selectedWeek,
  onWeekChange,
  existingRecords = [],
}: WeekPickerEnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableWeeks = getAvailableWeeksEn();

  const isWeekLogged = (week: WeekSpan): boolean => {
    return existingRecords.some((record) => {
      if (record.target_week) {
        return (
          record.target_week.year === week.year &&
          record.target_week.month === week.month &&
          record.target_week.weekOfMonth === week.weekOfMonth
        );
      }
      return false;
    });
  };

  const handleSelect = (week: WeekSpan) => {
    onWeekChange(week);
    setIsOpen(false);
  };

  const currentIsLogged = isWeekLogged(selectedWeek);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          <span>Target Week:</span>
        </label>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-xs transition-colors cursor-pointer"
        >
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {selectedWeek.label}
          </span>
          <span className="text-zinc-400 text-[11px] hidden sm:inline">
            ({formatWeekDateRangeEn(selectedWeek.startDate, selectedWeek.endDate)})
          </span>
          {currentIsLogged && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              Logged
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-40 p-2 space-y-1 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Select Reporting Period
            </div>
            {availableWeeks.map((week, idx) => {
              const isSelected =
                week.year === selectedWeek.year &&
                week.month === selectedWeek.month &&
                week.weekOfMonth === selectedWeek.weekOfMonth;
              const logged = isWeekLogged(week);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(week)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{week.label}</span>
                    <span className="text-[11px] text-zinc-400">
                      {formatWeekDateRangeEn(week.startDate, week.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {logged && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                        Logged
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
