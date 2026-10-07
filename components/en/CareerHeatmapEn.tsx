"use client";

import { useMemo, useState } from "react";
import { CalendarCheck2, ArrowRight, Sparkles, Check, Clock } from "lucide-react";
import { WeekSpan, CareerRecord } from "@/types/career";
import {
  getAllWeeksForYearEn,
  getCurrentWeekSpanEn,
  formatWeekDateRangeEn,
} from "@/lib/weekUtilsEn";

interface CareerHeatmapEnProps {
  records: CareerRecord[];
  onSelectWeek?: (week: WeekSpan) => void;
  selectedWeek?: WeekSpan;
}

export function CareerHeatmapEn({
  records = [],
  onSelectWeek,
  selectedWeek,
}: CareerHeatmapEnProps) {
  const currentWeek = useMemo(() => getCurrentWeekSpanEn(), []);
  const [targetYear, setTargetYear] = useState<number>(currentWeek.year);
  const [hoveredWeek, setHoveredWeek] = useState<{
    week: WeekSpan;
    record?: CareerRecord;
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
  } | null>(null);

  // Available years from records plus current year
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentWeek.year]);
    records.forEach((r) => {
      if (r.target_week?.year) years.add(r.target_week.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [records, currentWeek.year]);

  // Grouped weeks by month for the selected year
  const monthlyWeeks = useMemo(() => {
    return getAllWeeksForYearEn(targetYear);
  }, [targetYear]);

  // Flattened weeks in chronological order
  const allWeeksThisYear = useMemo(() => {
    return monthlyWeeks.flatMap((m) => m.weeks);
  }, [monthlyWeeks]);

  // Record mapping by week key: "year-month-weekOfMonth"
  const recordMap = useMemo(() => {
    const map = new Map<string, CareerRecord>();
    records.forEach((r) => {
      if (r.target_week) {
        const key = `${r.target_week.year}-${r.target_week.month}-${r.target_week.weekOfMonth}`;
        map.set(key, r);
      }
    });
    return map;
  }, [records]);

  // Calculate consistency metrics for target year
  const { totalLoggedThisYear } = useMemo(() => {
    let totalLogged = 0;
    allWeeksThisYear.forEach((w) => {
      const key = `${w.year}-${w.month}-${w.weekOfMonth}`;
      if (recordMap.has(key)) {
        totalLogged++;
      }
    });

    return {
      totalLoggedThisYear: totalLogged,
    };
  }, [allWeeksThisYear, recordMap]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleCellClick = (week: WeekSpan) => {
    if (onSelectWeek) {
      onSelectWeek(week);
      // Smooth scroll up to QuickLogger
      const inputSection = document.getElementById("quick-logger-section");
      if (inputSection) {
        inputSection.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs transition-all hover:shadow-md space-y-4">
      {/* Top Header: Title, Year Picker, Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 shrink-0">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                52-Week Career Heatmap
              </h2>
              {availableYears.length > 1 ? (
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-zinc-700 dark:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {targetYear}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Every Friday counts. Track your weekly brain-dump consistency across all 52 weeks.
            </p>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Total Logged / Completion */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <div className="text-xs font-mono">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalLoggedThisYear}</span>
              <span className="opacity-60">/{allWeeksThisYear.length} Logged</span>
              <span className="ml-1.5 text-[11px] font-sans font-semibold text-indigo-600 dark:text-indigo-400">
                ({Math.round((totalLoggedThisYear / (allWeeksThisYear.length || 52)) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 52-Week Grid (Horizontally Scrollable on Mobile, Responsive Wrap on Desktop) */}
      <div className="relative overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <div className="min-w-[760px] flex items-start justify-between gap-2.5 sm:gap-3">
          {monthlyWeeks.map((monthData) => (
            <div key={monthData.month} className="flex-1 flex flex-col items-center min-w-[54px]">
              {/* Month Label */}
              <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5 tracking-tight uppercase">
                {monthData.monthName}
              </span>

              {/* Weeks in this Month */}
              <div className="flex flex-col gap-1.5 w-full items-center">
                {monthData.weeks.map((week) => {
                  const key = `${week.year}-${week.month}-${week.weekOfMonth}`;
                  const record = recordMap.get(key);
                  const isRecorded = Boolean(record);
                  const isCurrent =
                    currentWeek.year === week.year &&
                    currentWeek.month === week.month &&
                    currentWeek.weekOfMonth === week.weekOfMonth;
                  const isSelected =
                    selectedWeek &&
                    selectedWeek.year === week.year &&
                    selectedWeek.month === week.month &&
                    selectedWeek.weekOfMonth === week.weekOfMonth;
                  const isPast = week.endDate < todayStr;
                  const isFuture = week.startDate > todayStr;

                  let cellClasses =
                    "relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-mono transition-all cursor-pointer group ";

                  if (isRecorded) {
                    cellClasses +=
                      "bg-indigo-600 dark:bg-indigo-500 text-white font-bold shadow-xs hover:bg-indigo-700 dark:hover:bg-indigo-400 hover:scale-105 ";
                  } else if (isCurrent) {
                    cellClasses +=
                      "bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-500 text-amber-900 dark:text-amber-200 animate-pulse ";
                  } else if (isPast) {
                    cellClasses +=
                      "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-indigo-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 ";
                  } else {
                    // Future week
                    cellClasses +=
                      "bg-zinc-50/70 dark:bg-zinc-900/40 border border-dashed border-zinc-200/80 dark:border-zinc-800 text-zinc-300 dark:text-zinc-600 opacity-60 hover:opacity-100 ";
                  }

                  if (isSelected) {
                    cellClasses += "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-900 ";
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCellClick(week)}
                      onMouseEnter={() =>
                        setHoveredWeek({
                          week,
                          record,
                          isPast,
                          isCurrent,
                          isFuture,
                        })
                      }
                      onMouseLeave={() => setHoveredWeek(null)}
                      aria-label={`${week.label}: ${isRecorded ? "Logged" : "Not logged"}`}
                      className={cellClasses}
                    >
                      {isRecorded ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      ) : (
                        <span className="opacity-70 text-[9px]">{week.weekOfMonth}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Hover Detail / Helper Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
        <div className="min-h-[22px] flex items-center gap-2">
          {hoveredWeek ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {hoveredWeek.week.label} ({formatWeekDateRangeEn(hoveredWeek.week.startDate, hoveredWeek.week.endDate)})
              </span>
              <span className="text-zinc-400">·</span>
              {hoveredWeek.record ? (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[320px] sm:max-w-[480px]">
                  ✅ Logged: &ldquo;{hoveredWeek.record.raw_memo.slice(0, 60)}...&rdquo;
                </span>
              ) : hoveredWeek.isCurrent ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  🔥 This week (Current) — Ready to brain-dump!
                </span>
              ) : hoveredWeek.isPast ? (
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  ⚪ Not logged · Click to backfill this week
                </span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Upcoming week
                </span>
              )}
            </div>
          ) : (
            <div className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
              <span>💡 Tip: Click any square to jump directly to that week and edit or backfill notes.</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
            <span>Logged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 dark:bg-amber-950/60 border border-amber-500" />
            <span>Current Week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
            <span>Not Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
