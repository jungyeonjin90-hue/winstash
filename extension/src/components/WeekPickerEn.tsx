import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { WeekSpan, CareerRecord } from "../types/career";
import { getWeeksForMonthEn, formatWeekDateRangeEn } from "../lib/weekUtilsEn";
import { isWeekMatch } from "../lib/weekMatch";

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
  const availableYears = Array.from(new Set([currentYear, currentYear - 1, Number(selectedWeek.year)])).sort().reverse();

  const MONTH_NAMES_EN = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const availableMonths = MONTH_NAMES_EN.map((name, idx) => ({
    num: idx + 1,
    name
  }));

  const availableWeeks = getWeeksForMonthEn(Number(selectedWeek.year), Number(selectedWeek.month));

  const isWeekLogged = (week: WeekSpan): boolean => {
    return existingRecords.some((record) => isWeekMatch(record, week));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    const newWeeks = getWeeksForMonthEn(newYear, Number(selectedWeek.month));
    const matchingWeek = newWeeks.find(w => Number(w.weekOfMonth) === Number(selectedWeek.weekOfMonth)) || newWeeks[0];
    if (matchingWeek) onWeekChange(matchingWeek);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    const newWeeks = getWeeksForMonthEn(Number(selectedWeek.year), newMonth);
    const matchingWeek = newWeeks.find(w => Number(w.weekOfMonth) === Number(selectedWeek.weekOfMonth)) || newWeeks[0];
    if (matchingWeek) onWeekChange(matchingWeek);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weekNum = parseInt(e.target.value, 10);
    const week = availableWeeks.find(w => Number(w.weekOfMonth) === weekNum);
    if (week) onWeekChange(week);
  };

  const currentIsLogged = isWeekLogged(selectedWeek);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
        <span>Target Week:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Year */}
        <div className="relative">
          <select
            value={Number(selectedWeek.year)}
            onChange={handleYearChange}
            className="appearance-none bg-zinc-50 dark:bg-zinc-950 pl-2.5 pr-6 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 2. Month */}
        <div className="relative">
          <select
            value={Number(selectedWeek.month)}
            onChange={handleMonthChange}
            className="appearance-none bg-zinc-50 dark:bg-zinc-950 pl-2.5 pr-6 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {availableMonths.map(m => (
              <option key={m.num} value={m.num}>{m.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 3. Week */}
        <div className="relative flex items-center group">
          <select
            value={Number(selectedWeek.weekOfMonth)}
            onChange={handleWeekChange}
            className={`bg-zinc-50 dark:bg-zinc-950 pl-2.5 pr-8 py-1.5 rounded-xl border ${
              currentIsLogged ? "border-indigo-500/80 dark:border-indigo-500/80 ring-1 ring-indigo-500/20" : "border-zinc-200 dark:border-zinc-800"
            } text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none`}
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
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
