"use client";

import { useState, useMemo, useEffect } from "react";
import { Trash2, ChevronDown, ChevronUp, Archive, Calendar, Pencil, Loader2 } from "lucide-react";
import { CareerRecord } from "@/types/career";
import { getDetailedRecordDateInfo } from "@/lib/periodUtils";

interface TimelineArchiveTabEnProps {
  records: CareerRecord[];
  onDeleteRecord?: (id: string) => void;
  onEditRecord?: (rawMemo: string, existingRecordId: string) => Promise<void>;
}

export function TimelineArchiveTabEn({ records, onDeleteRecord, onEditRecord }: TimelineArchiveTabEnProps) {
  const [expandedId, setExpandedId] = useState<string | null>(records[0]?.id || null);

  // Automatically expand the latest record when records arrive or change
  useEffect(() => {
    if (records.length > 0 && !expandedId) {
      setExpandedId(records[0].id);
    }
  }, [records, expandedId]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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

  const recordsWithDateInfo = useMemo(() => {
    return records.map((r) => ({
      record: r,
      dateInfo: getDetailedRecordDateInfo(r),
    }));
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    recordsWithDateInfo.forEach((item) => years.add(item.dateInfo.year));
    return Array.from(years).sort().reverse();
  }, [recordsWithDateInfo]);

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
      .sort((a, b) => Number(b.monthNum) - Number(a.monthNum));
  }, [recordsWithDateInfo, selectedYear]);

  const displayedRecords = useMemo(() => {
    return recordsWithDateInfo.filter((item) => {
      if (selectedYear !== "ALL" && item.dateInfo.year !== selectedYear) return false;
      if (selectedMonth !== "ALL" && item.dateInfo.month !== selectedMonth) return false;
      return true;
    });
  }, [recordsWithDateInfo, selectedYear, selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
            <Archive className="w-4 h-4 text-indigo-500" />
            <span>Weekly History Archive ({displayedRecords.length} Logs)</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review your past raw Friday notes and chronological 3-Way outputs.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedMonth("ALL");
            }}
            className="bg-white dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 cursor-pointer text-zinc-700 dark:text-zinc-300"
          >
            <option value="ALL">All Years</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 cursor-pointer text-zinc-700 dark:text-zinc-300"
          >
            <option value="ALL">All Months</option>
            {availableMonths.map((m) => (
              <option key={m.monthNum} value={m.monthNum}>{m.short}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {displayedRecords.map(({ record, dateInfo }) => {
          const isExpanded = expandedId === record.id;
          const weekLabel = `${dateInfo.year} ${dateInfo.monthLong}, ${dateInfo.displayLabel}`;

          return (
            <div
              key={record.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-5 space-y-2 sm:space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {weekLabel}
                    </span>
                    {record.id === records[0]?.id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white flex items-center gap-1 shadow-xs">
                        <span>🔥</span>
                        <span>Latest Entry</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline-block">
                    (Created: {new Date(record.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {editingId !== record.id && onEditRecord && (
                    <button
                      onClick={() => startEdit(record)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit original note"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteRecord && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this weekly record?")) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Editing State */}
              {editingId === record.id ? (
                <div className="space-y-3 pt-2">
                  <textarea
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    className="w-full h-32 p-3 bg-zinc-50 dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-zinc-800 dark:text-zinc-200"
                    placeholder="Edit your Friday brain dump..."
                    disabled={isSaving}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(record.id)}
                      disabled={isSaving || !editMemo.trim() || editMemo === record.raw_memo}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                    >
                      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isSaving ? "Re-generating..." : "Save & Re-generate"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Raw Memo Snippet */}
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                    {record.raw_memo}
                  </p>

                  {/* Expanded 3-Way Details */}
                  {isExpanded && (
                    <div className="pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5 sm:space-y-3 text-xs sm:text-sm animate-in fade-in">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1 sm:space-y-1.5">
                        <span className="font-bold text-[11px] sm:text-xs text-indigo-700 dark:text-indigo-300">
                          Weekly Snippets:
                        </span>
                        <ul className="list-disc list-inside text-[11px] sm:text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {record.weekly_report?.done && Array.isArray(record.weekly_report.done) && record.weekly_report.done.length > 0 ? (
                            record.weekly_report.done.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))
                          ) : (
                            <li className="italic text-zinc-400">No completed tasks recorded yet</li>
                          )}
                        </ul>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1 sm:space-y-1.5">
                        <span className="font-bold text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300">
                          Brag Metric:
                        </span>
                        <p className="text-[11px] sm:text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                          {record.brag_sheet_item?.metric_summary || "No metric summary available"}
                        </p>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1 sm:space-y-1.5">
                        <span className="font-bold text-[11px] sm:text-xs text-amber-700 dark:text-amber-300">
                          STAR Case Study:
                        </span>
                        <p className="text-[11px] sm:text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 font-semibold">
                          {record.star_portfolio?.title || "Project Record"}
                        </p>
                        {record.star_portfolio?.result && (
                          <p className="text-[10px] sm:text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {record.star_portfolio.result}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {displayedRecords.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            No history logs found for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
