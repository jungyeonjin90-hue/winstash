import React, { useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { WeekSpan } from "../types/career";
import { getCurrentWeekSpan, getWeeksForMonth } from "../lib/weekUtils";

interface WeekSelectorProps {
  selectedWeek: WeekSpan;
  onWeekChange: (week: WeekSpan) => void;
  hasRecord?: boolean;
}

export function WeekSelector({
  selectedWeek,
  onWeekChange,
  hasRecord = false,
}: WeekSelectorProps) {
  const currentWeek = useMemo(() => getCurrentWeekSpan(), []);

  const isCurrentWeek =
    selectedWeek.startDate === currentWeek.startDate &&
    selectedWeek.endDate === currentWeek.endDate;

  // 연도 옵션 (작년, 올해, 내년)
  const yearOptions = useMemo(() => {
    const curYear = currentWeek.year;
    return [curYear - 1, curYear, curYear + 1];
  }, [currentWeek.year]);

  // 월 옵션 (1~12월)
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  // 선택된 연/월에 해당하는 주차 목록
  const availableWeeks = useMemo(() => {
    return getWeeksForMonth(selectedWeek.year, selectedWeek.month);
  }, [selectedWeek.year, selectedWeek.month]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    const weeks = getWeeksForMonth(year, selectedWeek.month);
    if (weeks.length > 0) {
      const match = weeks.find((w) => w.weekOfMonth === selectedWeek.weekOfMonth) || weeks[0];
      onWeekChange(match);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = Number(e.target.value);
    const weeks = getWeeksForMonth(selectedWeek.year, month);
    if (weeks.length > 0) {
      const match = weeks.find((w) => w.weekOfMonth === selectedWeek.weekOfMonth) || weeks[0];
      onWeekChange(match);
    }
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weekOfMonth = Number(e.target.value);
    const target = availableWeeks.find((w) => w.weekOfMonth === weekOfMonth);
    if (target) {
      onWeekChange(target);
    }
  };

  return (
    <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-2xl p-3 shadow-xs space-y-2.5">
      {/* 라벨 & 뱃지 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>기록 대상 주차 (기간 선택)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isCurrentWeek && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              이번 주
            </span>
          )}
          {hasRecord && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              기록 있음
            </span>
          )}
        </div>
      </div>

      {/* 3단 드롭다운 (연도, 월, 주차) */}
      <div className="grid grid-cols-3 gap-2">
        {/* 연도 */}
        <div className="relative">
          <select
            value={selectedWeek.year}
            onChange={handleYearChange}
            className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-xl px-2.5 py-1.5 pr-6 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 월 */}
        <div className="relative">
          <select
            value={selectedWeek.month}
            onChange={handleMonthChange}
            className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-xl px-2.5 py-1.5 pr-6 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 주차 */}
        <div className="relative">
          <select
            value={selectedWeek.weekOfMonth}
            onChange={handleWeekChange}
            className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-xl px-2.5 py-1.5 pr-6 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {availableWeeks.map((w) => (
              <option key={w.weekOfMonth} value={w.weekOfMonth}>
                {w.weekOfMonth}주차
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 날짜 범위 표시 */}
      <div className="text-[11px] text-zinc-400 font-mono text-center bg-zinc-900/60 py-1 rounded-lg border border-zinc-800">
        {selectedWeek.startDate.slice(5).replace("-", ".")} (월) ~ {selectedWeek.endDate.slice(5).replace("-", ".")} (일)
      </div>
    </div>
  );
}
