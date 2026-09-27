"use client";

import { useState, useMemo } from "react";
import { Calendar, ChevronDown, RotateCcw, Clock, AlertCircle } from "lucide-react";
import { WeekSpan, CareerRecord } from "@/types/career";
import {
  getCurrentWeekSpan,
  getRecentWeekOptions,
  getWeeksForMonth,
} from "@/lib/weekUtils";

interface WeekPickerProps {
  selectedWeek: WeekSpan;
  onWeekChange: (week: WeekSpan) => void;
  existingRecords?: CareerRecord[];
}

export function WeekPicker({
  selectedWeek,
  onWeekChange,
  existingRecords = [],
}: WeekPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentWeek = useMemo(() => getCurrentWeekSpan(), []);
  const recentWeeks = useMemo(() => getRecentWeekOptions(6), []);

  const isCurrentWeek =
    selectedWeek.startDate === currentWeek.startDate &&
    selectedWeek.endDate === currentWeek.endDate;

  // 선택된 연/월에 실제로 존재하는 주차 목록 계산
  const availableWeeksInMonth = useMemo(() => {
    return getWeeksForMonth(selectedWeek.year, selectedWeek.month);
  }, [selectedWeek.year, selectedWeek.month]);

  // 선택된 주차에 이미 작성된 기록이 있는지 확인
  const existingRecord = useMemo(() => {
    return existingRecords.find((rec) => {
      if (rec.target_week) {
        return (
          rec.target_week.startDate === selectedWeek.startDate &&
          rec.target_week.endDate === selectedWeek.endDate
        );
      }
      const recDate = rec.createdAt.slice(0, 10);
      return recDate >= selectedWeek.startDate && recDate <= selectedWeek.endDate;
    });
  }, [existingRecords, selectedWeek]);

  const handleResetToCurrent = () => {
    onWeekChange(currentWeek);
    setIsOpen(false);
  };

  const handleYearChange = (year: number) => {
    const weeks = getWeeksForMonth(year, selectedWeek.month);
    if (weeks.length > 0) {
      // 동일한 주차가 있으면 유지, 없으면 첫째 주 선택
      const target = weeks.find((w) => w.weekOfMonth === selectedWeek.weekOfMonth) || weeks[0];
      onWeekChange(target);
    }
  };

  const handleMonthChange = (month: number) => {
    const weeks = getWeeksForMonth(selectedWeek.year, month);
    if (weeks.length > 0) {
      const target = weeks.find((w) => w.weekOfMonth === selectedWeek.weekOfMonth) || weeks[0];
      onWeekChange(target);
    }
  };

  const handleWeekSelect = (startDate: string) => {
    const target = availableWeeksInMonth.find((w) => w.startDate === startDate);
    if (target) {
      onWeekChange(target);
    }
  };

  return (
    <div className="w-full bg-zinc-50/90 dark:bg-zinc-950/70 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 transition-all">
      {/* Top Display Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-4 h-4" />
          </div>

          <span className="text-xs text-zinc-500 font-medium">기록 대상 주차:</span>

          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span>{selectedWeek.label}</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
              {selectedWeek.startDate.slice(5).replace("-", ".")} (월) ~ {selectedWeek.endDate.slice(5).replace("-", ".")} (일)
            </span>
          </span>

          {isCurrentWeek ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              이번 주
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              과거 주차 (소급 입력)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleResetToCurrent}
              className="text-xs text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-zinc-800 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>이번 주로 리셋</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
          >
            <span>주차 변경</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Existing Record Indicator */}
      {existingRecord && (
        <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            이 주차에 이미 등록된 기록(<strong>{existingRecord.star_portfolio.title.slice(0, 20)}...</strong>)이 있습니다. 새 메모 작성 시 이어서 축적됩니다.
          </span>
        </div>
      )}

      {/* Expandable Selector Drawer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              최근 주차 빠른 선택:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {recentWeeks.map((week, idx) => {
                const isSelected =
                  week.startDate === selectedWeek.startDate &&
                  week.endDate === selectedWeek.endDate;
                const isCurrent = idx === 0;

                return (
                  <button
                    key={week.startDate}
                    type="button"
                    onClick={() => {
                      onWeekChange(week);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800"
                    }`}
                  >
                    <span>{isCurrent ? "🔥 이번 주" : week.label}</span>
                    <span className={`text-[10px] font-mono ${isSelected ? "text-indigo-200" : "text-zinc-400"}`}>
                      ({week.startDate.slice(5).replace("-", ".")}~{week.endDate.slice(5).replace("-", ".")})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Year / Month / Week Selectors */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
              직접 연도 / 월 / 주차 지정:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Year Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">연도</label>
                <select
                  value={selectedWeek.year}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">월</label>
                <select
                  value={selectedWeek.month}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Number Select (해당 월의 실제 주차와 날짜 범위를 명확히 표시) */}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">주차 및 날짜 범위 (월~일)</label>
                <select
                  value={selectedWeek.startDate}
                  onChange={(e) => handleWeekSelect(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableWeeksInMonth.map((w) => (
                    <option key={w.startDate} value={w.startDate}>
                      {w.weekOfMonth}주차 ({w.startDate.slice(5).replace("-", ".")} ~ {w.endDate.slice(5).replace("-", ".")})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
