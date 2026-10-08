"use client";

import { Calendar, ChevronDown } from "lucide-react";
import { WeekSpan, CareerRecord } from "@/types/career";
import { getWeeksForMonthEn, formatWeekDateRangeEn } from "@/lib/weekUtilsEn";

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
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(new Set([currentYear, currentYear - 1, selectedWeek.year])).sort().reverse();
  
  const MONTH_NAMES_EN = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const availableMonths = MONTH_NAMES_EN.map((name, idx) => ({
    num: idx + 1,
    name
  }));

  const availableWeeks = getWeeksForMonthEn(selectedWeek.year, selectedWeek.month);

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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    const newWeeks = getWeeksForMonthEn(newYear, selectedWeek.month);
    // Find a matching week or fallback to the first week
    const matchingWeek = newWeeks.find(w => w.weekOfMonth === selectedWeek.weekOfMonth) || newWeeks[0];
    if (matchingWeek) onWeekChange(matchingWeek);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    const newWeeks = getWeeksForMonthEn(selectedWeek.year, newMonth);
    // Find a matching week or fallback to the first week
    const matchingWeek = newWeeks.find(w => w.weekOfMonth === selectedWeek.weekOfMonth) || newWeeks[0];
    if (matchingWeek) onWeekChange(matchingWeek);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weekNum = parseInt(e.target.value, 10);
    const week = availableWeeks.find(w => w.weekOfMonth === weekNum);
    if (week) onWeekChange(week);
  };

  const currentIsLogged = isWeekLogged(selectedWeek);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        <span>Target Week:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* 1. Year */}
        <select
          value={selectedWeek.year}
          onChange={handleYearChange}
          className="bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* 2. Month */}
        <select
          value={selectedWeek.month}
          onChange={handleMonthChange}
          className="bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {availableMonths.map(m => (
            <option key={m.num} value={m.num}>{m.name}</option>
          ))}
        </select>

        {/* 3. Week */}
        <div className="relative flex items-center group">
          <select
            value={selectedWeek.weekOfMonth}
            onChange={handleWeekChange}
            className={`bg-zinc-50 dark:bg-zinc-950 pl-2.5 pr-8 py-1.5 rounded-xl border ${currentIsLogged ? 'border-emerald-500/50 dark:border-emerald-500/50' : 'border-zinc-200 dark:border-zinc-800'} text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none flex-1`}
          >
            {availableWeeks.map(w => {
              const logged = isWeekLogged(w);
              const label = `${w.label}: ${formatWeekDateRangeEn(w.startDate, w.endDate)}`;
              return (
                <option key={w.weekOfMonth} value={w.weekOfMonth}>
                  {label} {logged ? "(Logged)" : ""}
                </option>
              );
            })}
          </select>
          <div className="absolute right-2.5 pointer-events-none flex items-center gap-1.5">
            {currentIsLogged && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
