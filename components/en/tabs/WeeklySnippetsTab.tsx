"use client";

import { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { CareerRecord } from "@/types/career";
import { getDetailedRecordDateInfo, DetailedRecordDateInfo } from "@/lib/periodUtils";
import { formatWeeklySnippet } from "@/lib/exportFormatters";

interface WeeklySnippetsTabProps {
  records: CareerRecord[];
  initialRecordId?: string;
  activeRecordId?: string;
}

export function WeeklySnippetsTab({
  records,
  initialRecordId,
  activeRecordId,
}: WeeklySnippetsTabProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [showRawMemo, setShowRawMemo] = useState(false);

  // Parse all records with detailed Year, Month, Week info
  const recordsWithDateInfo = useMemo(() => {
    return records.map((r) => ({
      record: r,
      dateInfo: getDetailedRecordDateInfo(r),
    }));
  }, [records]);

  // Initial Year, Month, and RecordId
  const latestDateInfo = recordsWithDateInfo[0]?.dateInfo;
  const [selectedYear, setSelectedYear] = useState<string>(
    latestDateInfo?.year || String(new Date().getFullYear())
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    latestDateInfo?.month || "ALL"
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecordId || records[0]?.id || ""
  );

  // 1. Available Years from records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    recordsWithDateInfo.forEach((item) => years.add(item.dateInfo.year));
    return Array.from(years).sort().reverse();
  }, [recordsWithDateInfo]);

  // 2. Available Months for the selected Year
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { short: string; long: string }>();
    recordsWithDateInfo
      .filter((item) => selectedYear === "ALL" || item.dateInfo.year === selectedYear)
      .forEach((item) => {
        monthMap.set(item.dateInfo.month, {
          short: item.dateInfo.monthShort,
          long: item.dateInfo.monthLong,
        });
      });

    return Array.from(monthMap.entries())
      .map(([mNum, names]) => ({
        monthNum: mNum,
        short: names.short,
        long: names.long,
      }))
      .sort((a, b) => Number(b.monthNum) - Number(a.monthNum)); // reverse chronological
  }, [recordsWithDateInfo, selectedYear]);

  // Whenever activeRecordId changes (user just logged or updated a raw note),
  // immediately snap year, month, and selectedRecordId to that exact period!
  useEffect(() => {
    if (activeRecordId && records.length > 0) {
      const target = records.find((r) => r.id === activeRecordId);
      if (target) {
        setSelectedRecordId(target.id);
        const targetInfo = getDetailedRecordDateInfo(target);
        setSelectedYear(targetInfo.year);
        setSelectedMonth(targetInfo.month);
      }
    }
  }, [activeRecordId, records]);

  // Automatically select the most recent record when records load asynchronously or change
  useEffect(() => {
    if (records.length > 0) {
      const latest = records[0];
      const isCurrentValid = records.some((r) => r.id === selectedRecordId);
      // If no valid selection or uninitialized, snap to the latest created record
      if (!selectedRecordId || !isCurrentValid) {
        setSelectedRecordId(latest.id);
        const latestInfo = getDetailedRecordDateInfo(latest);
        setSelectedYear(latestInfo.year);
        setSelectedMonth(latestInfo.month);
      }
    }
  }, [records, selectedRecordId]);

  // 3. Weeks available matching selected Year and Month
  // Sorted reverse-chronologically (latest week first: Week 4, Week 3, ...)
  const matchingRecords = useMemo(() => {
    const filtered = recordsWithDateInfo.filter((item) => {
      if (selectedYear !== "ALL" && item.dateInfo.year !== selectedYear) return false;
      if (selectedMonth !== "ALL" && item.dateInfo.month !== selectedMonth) return false;
      return true;
    });
    
    // Sort descending by week number so newest week appears first
    return filtered.sort((a, b) => b.dateInfo.weekNum - a.dateInfo.weekNum);
  }, [recordsWithDateInfo, selectedYear, selectedMonth]);

  // If currently selected record is not in matching weeks, select the newest matching one
  useEffect(() => {
    if (matchingRecords.length > 0) {
      const isCurrentInMatching = matchingRecords.some(
        (m) => m.record.id === selectedRecordId
      );
      if (!isCurrentInMatching) {
        setSelectedRecordId(matchingRecords[0].record.id);
      }
    }
  }, [matchingRecords, selectedRecordId]);

  // Active selected record
  const activeRecord = useMemo(() => {
    const found = recordsWithDateInfo.find((item) => item.record.id === selectedRecordId);
    return found ? found.record : records[0] || null;
  }, [recordsWithDateInfo, selectedRecordId, records]);

  // Current global index for Older / Newer buttons
  const currentIndex = records.findIndex((r) => r.id === selectedRecordId);
  const hasOlder = currentIndex < records.length - 1;
  const hasNewer = currentIndex > 0;

  const handleOlder = () => {
    if (hasOlder) {
      const nextRecord = records[currentIndex + 1];
      setSelectedRecordId(nextRecord.id);
      const nextInfo = getDetailedRecordDateInfo(nextRecord);
      setSelectedYear(nextInfo.year);
      setSelectedMonth(nextInfo.month);
    }
  };

  const handleNewer = () => {
    if (hasNewer) {
      const prevRecord = records[currentIndex - 1];
      setSelectedRecordId(prevRecord.id);
      const prevInfo = getDetailedRecordDateInfo(prevRecord);
      setSelectedYear(prevInfo.year);
      setSelectedMonth(prevInfo.month);
    }
  };

  if (!activeRecord) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm">
        No weekly logs found. Enter your first Friday note above!
      </div>
    );
  }

  const activeDateInfo = getDetailedRecordDateInfo(activeRecord);
  const historyTitle = `${activeDateInfo.year} ${activeDateInfo.monthLong}, ${activeDateInfo.displayLabel}`;

  const handleCopySnippet = async () => {
    const text = formatWeeklySnippet(activeRecord, historyTitle);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Copy Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
              {historyTitle}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
              Short-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Engineered for skip-level status syncs, 1-on-1s, Slack, and Email team updates.
          </p>
        </div>

        {/* Unified 1-Click Copy Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopySnippet}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/20 transition-all cursor-pointer"
            title="Copy formatted Weekly Snippet (Slack / Email / Docs compatible)"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied Weekly Snippet!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Weekly Snippet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-Tier Hierarchical Dropdown Toolbar: Year ✕ Month ✕ Week */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 no-print text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Select Log:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* 1. Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedMonth("ALL"); // Reset month
              }}
              className="bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Years</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* 2. Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m.monthNum} value={m.monthNum}>
                  {m.short}
                </option>
              ))}
            </select>

            {/* 3. Week / Date Dropdown */}
            <div className="relative flex items-center group">
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-950 pl-2.5 pr-8 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none flex-1"
              >
                {matchingRecords.map((item) => {
                  const isLatestOverall = item.record.id === records[0]?.id;
                  return (
                    <option key={item.record.id} value={item.record.id}>
                      {item.dateInfo.displayLabel} {isLatestOverall ? "(Latest)" : ""}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 pointer-events-none flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Older / Newer Quick Navigation */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-zinc-200/60 dark:border-zinc-800">
          <button
            onClick={handleOlder}
            disabled={!hasOlder}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              hasOlder
                ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                : "opacity-40 cursor-not-allowed text-zinc-400"
            }`}
            title="Jump to previous week"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Older</span>
          </button>

          <span className="text-zinc-400 font-mono text-[11px]">
            {currentIndex + 1} of {records.length}
          </span>

          <button
            onClick={handleNewer}
            disabled={!hasNewer}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              hasNewer
                ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                : "opacity-40 cursor-not-allowed text-zinc-400"
            }`}
            title="Jump to newer week"
          >
            <span>Newer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Structured 3 Sections Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Done */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Progress (Completed)</span>
          </div>
          <ul className="space-y-2.5">
            {activeRecord.weekly_report.done.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. In Progress */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>In-Flight & Bottlenecks</span>
          </div>
          <ul className="space-y-2.5">
            {activeRecord.weekly_report.in_progress.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Next Week */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Plans & Next Priorities</span>
          </div>
          <ul className="space-y-2.5">
            {activeRecord.weekly_report.next_week.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Raw Memo Toggle */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => setShowRawMemo(!showRawMemo)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {showRawMemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showRawMemo ? "Hide Original Brain Dump" : "View Original Friday Brain Dump"}</span>
        </button>

        {showRawMemo && (
          <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap animate-in fade-in">
            {activeRecord.raw_memo}
          </div>
        )}
      </div>
    </div>
  );
}
