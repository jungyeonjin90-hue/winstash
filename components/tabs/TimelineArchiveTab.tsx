"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  LayoutGrid,
  List,
  Pencil,
  Loader2,
} from "lucide-react";
import { CareerRecord } from "@/types/career";
import { PeriodFilter, PeriodPreset } from "@/components/PeriodFilter";
import { filterRecordsByPeriod } from "@/lib/dateFilter";

interface TimelineArchiveTabProps {
  records: CareerRecord[];
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (rawMemo: string, existingRecordId: string) => Promise<void>;
  onSelectRecordForWeekly: (id: string) => void;
}

export function TimelineArchiveTab({
  records,
  onDeleteRecord,
  onEditRecord,
  onSelectRecordForWeekly,
}: TimelineArchiveTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("ALL");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(records[0]?.id || null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // View count & Density settings
  const [limit, setLimit] = useState<number | "ALL">(5);
  const [density, setDensity] = useState<"detailed" | "compact">("detailed");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const startEdit = (record: CareerRecord) => {
    setEditingId(record.id);
    setEditMemo(record.raw_memo);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMemo("");
  };

  const handleSave = async (id: string) => {
    if (!onEditRecord) return;
    if (!editMemo.trim()) return;
    setIsSaving(true);
    try {
      await onEditRecord(editMemo, id);
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Period filter
  const periodFiltered = useMemo(() => {
    return filterRecordsByPeriod(records, periodPreset, customStart, customEnd);
  }, [records, periodPreset, customStart, customEnd]);

  // 2. Search query filter
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return periodFiltered;
    const q = searchQuery.toLowerCase();
    return periodFiltered.filter(
      (r) =>
        r.raw_memo.toLowerCase().includes(q) ||
        r.star_portfolio.title.toLowerCase().includes(q) ||
        r.brag_sheet_item.metric_summary.toLowerCase().includes(q)
    );
  }, [periodFiltered, searchQuery]);

  // Reset page when filters change
  const filterKey = `${periodPreset}-${customStart}-${customEnd}-${searchQuery}-${limit}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  // Pagination calculation
  const totalItems = filteredRecords.length;
  const totalPages =
    limit === "ALL" ? 1 : Math.max(1, Math.ceil(totalItems / (limit as number)));
  const effectivePage = Math.min(currentPage, totalPages);

  const displayedRecords = useMemo(() => {
    if (limit === "ALL") return filteredRecords;
    const start = (effectivePage - 1) * (limit as number);
    return filteredRecords.slice(start, start + (limit as number));
  }, [filteredRecords, limit, effectivePage]);

  const startIndex =
    totalItems === 0
      ? 0
      : limit === "ALL"
      ? 1
      : (effectivePage - 1) * (limit as number) + 1;
  const endIndex =
    limit === "ALL"
      ? totalItems
      : Math.min(totalItems, effectivePage * (limit as number));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono">
              누적 아카이브
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              총 {records.length}개 주간 기록 보관 중
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            주간 기록 타임라인 & 원자재 보관함
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            매주 금요일에 입력한 날것의 원문 메모와 3-Way 변환 내역이 날짜순으로 영구 보관되는 서랍입니다.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="과거 기록 검색 (키워드, 프로젝트명)..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 pl-9 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Date Period Filter */}
      <PeriodFilter
        startDate={customStart}
        endDate={customEnd}
        preset={periodPreset}
        onPresetChange={setPeriodPreset}
        onDateChange={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
        }}
        matchCount={filteredRecords.length}
      />

      {/* Display Count & Content Density Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
            <span>표시 개수:</span>
            <div className="flex items-center gap-1">
              {[5, 10, "ALL"].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => setLimit(val as number | "ALL")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    limit === val
                      ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700/80"
                  }`}
                >
                  {val === "ALL" ? "전체" : `${val}개`}
                </button>
              ))}
            </div>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>

          {/* Density toggle */}
          <div className="flex items-center bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
            <button
              onClick={() => setDensity("detailed")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                density === "detailed"
                  ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>상세</span>
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                density === "compact"
                  ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>축약</span>
            </button>
          </div>
        </div>

        {/* Count & Pagination */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200/60 dark:border-zinc-800">
          <span className="text-zinc-500 font-mono text-[11px]">
            {totalItems > 0 ? (
              <>
                <strong>{startIndex} - {endIndex}</strong> / 총 {totalItems}개
              </>
            ) : (
              "0개"
            )}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage === 1}
                className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="이전 페이지"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold">
                {effectivePage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="다음 페이지"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {displayedRecords.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center text-zinc-400 text-xs">
            검색 결과 또는 해당 조건의 기록이 없습니다.
          </div>
        ) : (
          displayedRecords.map((rec, idx) => {
            const isExpanded = expandedId === rec.id;
            const dateStr = new Date(rec.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            });

            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      #{totalItems - (startIndex - 1 + idx)}
                    </span>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {dateStr}
                      </span>
                      <span className="ml-2 text-[11px] text-zinc-400 font-mono">
                        [{rec.brag_sheet_item.quarter}]
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onSelectRecordForWeekly(rec.id)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium px-2 py-1 cursor-pointer"
                    >
                      <span>주간보고서 보기</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("이 주간 기록을 삭제하시겠습니까?")) {
                          onDeleteRecord(rec.id);
                        }
                      }}
                      className="text-xs text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Raw Memo Quote Box (Compact vs Detailed) */}
                <div className="bg-zinc-50 dark:bg-zinc-950/70 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      📝 금요일에 작성한 날것의 원문 메모
                    </span>
                    {editingId !== rec.id && (
                      <button
                        onClick={() => startEdit(rec)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] flex items-center gap-1 font-bold text-zinc-500 hover:text-indigo-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md shadow-sm"
                      >
                        <Pencil className="w-3 h-3" />
                        수정
                      </button>
                    )}
                  </div>
                  
                  {editingId === rec.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        className="w-full h-28 bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900 rounded-lg p-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSave(rec.id)}
                          disabled={isSaving || !editMemo.trim() || editMemo === rec.raw_memo}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors disabled:opacity-50"
                        >
                          {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                          수정하여 3 Drawers 다시 생성
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-mono ${
                        density === "compact" && !isExpanded ? "line-clamp-2" : "whitespace-pre-wrap"
                      }`}
                    >
                      {rec.raw_memo}
                    </p>
                  )}
                </div>

                {/* Expanded 3-Way Summary Grid */}
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 animate-in fade-in">
                    {/* 1. Weekly Preview */}
                    <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 p-3.5 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        <FileText className="w-3.5 h-3.5" />
                        <span>주간보고 완료 업무</span>
                      </div>
                      <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                        {rec.weekly_report?.done && rec.weekly_report.done.length > 0 ? (
                          rec.weekly_report.done.slice(0, 2).map((d, i) => (
                            <li key={i} className="truncate">• {d}</li>
                          ))
                        ) : (
                          <li className="text-zinc-400 italic">변환된 주간 업무 없음</li>
                        )}
                      </ul>
                    </div>

                    {/* 2. Brag Preview */}
                    <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3.5 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>성과평가 지표</span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                        {rec.brag_sheet_item?.metric_summary || "성과 지표 없음"}
                      </p>
                    </div>

                    {/* 3. Vault Preview */}
                    <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3.5 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>STAR 프로젝트</span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                        {rec.star_portfolio?.title || "포트폴리오 프로젝트 없음"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
