"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, Archive } from "lucide-react";
import { CareerRecord } from "@/types/career";

interface TimelineArchiveTabEnProps {
  records: CareerRecord[];
  onDeleteRecord?: (id: string) => void;
}

export function TimelineArchiveTabEn({ records, onDeleteRecord }: TimelineArchiveTabEnProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-zinc-100">
            <Archive className="w-4 h-4 text-indigo-500" />
            <span>Weekly History Archive ({records.length} Logs)</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review your past raw Friday notes and chronological 3-Way outputs.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {records.map((record) => {
          const isExpanded = expandedId === record.id;
          const weekLabel = record.target_week?.label || new Date(record.createdAt).toLocaleDateString("en-US");

          return (
            <div
              key={record.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {weekLabel}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {new Date(record.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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

              {/* Raw Memo Snippet */}
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                {record.raw_memo}
              </p>

              {/* Expanded 3-Way Details */}
              {isExpanded && (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3 text-xs animate-in fade-in">
                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      Weekly Snippets:
                    </span>
                    <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400">
                      {record.weekly_report.done.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Brag Metric:
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-300">
                      {record.brag_sheet_item.metric_summary}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
                    <span className="font-bold text-amber-700 dark:text-amber-300">
                      STAR Case Study:
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-300 font-semibold">
                      {record.star_portfolio.title}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {record.star_portfolio.result}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {records.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            No history logs recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
