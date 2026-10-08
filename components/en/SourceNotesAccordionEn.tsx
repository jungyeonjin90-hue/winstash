"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Calendar, ArrowDown } from "lucide-react";
import { SourceRecordContext, CareerRecord, JobRole, ToneManner } from "@/types/career";

const ROLE_LABELS: Record<string, { label: string; icon: string }> = {
  engineering: { label: "Software Engineering", icon: "💻" },
  product: { label: "Product Management", icon: "🚀" },
  design: { label: "Product Design", icon: "🎨" },
  marketing: { label: "Growth & Marketing", icon: "📈" },
  sales: { label: "Sales & BD", icon: "💼" },
  operations: { label: "BizOps & Finance", icon: "⚙️" },
};

const TONE_LABELS: Record<string, { label: string; icon: string }> = {
  impact: { label: "Impact & Metrics", icon: "🚀" },
  problem_solving: { label: "Problem Solving", icon: "🛠️" },
  stability: { label: "Stability & Standards", icon: "🛡️" },
  leadership: { label: "Leadership & Collaboration", icon: "🤝" },
};

interface SourceNotesAccordionEnProps {
  sourceRecords?: SourceRecordContext[];
  fallbackRecords?: CareerRecord[];
  fallbackIndex?: number;
  appliedRole?: JobRole;
  appliedTone?: ToneManner;
  accentColor?: "emerald" | "amber";
}

export function SourceNotesAccordionEn({
  sourceRecords,
  fallbackRecords,
  fallbackIndex = 0,
  appliedRole = "engineering",
  appliedTone = "impact",
  accentColor = "emerald",
}: SourceNotesAccordionEnProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Resolve source records with fallback to actual logs for backward-compatible cached items
  let records: SourceRecordContext[] = [];
  if (sourceRecords && sourceRecords.length > 0) {
    records = sourceRecords;
  } else if (fallbackRecords && fallbackRecords.length > 0) {
    const matchedRecord = fallbackRecords[fallbackIndex] || fallbackRecords[0];
    if (matchedRecord) {
      records = [
        {
          id: matchedRecord.id,
          weekLabel: matchedRecord.target_week?.label || new Date(matchedRecord.createdAt).toISOString().slice(0, 10),
          dateRange: matchedRecord.target_week
            ? `${matchedRecord.target_week.startDate} – ${matchedRecord.target_week.endDate}`
            : undefined,
          raw_memo: matchedRecord.raw_memo || "",
          jobRole: matchedRecord.jobRole || appliedRole,
          toneManner: matchedRecord.toneManner || appliedTone,
        },
      ];
    }
  }

  if (records.length === 0) return null;

  const isMultiWeek = records.length > 1;
  const roleMeta = ROLE_LABELS[appliedRole] || { label: appliedRole, icon: "💻" };
  const toneMeta = TONE_LABELS[appliedTone] || { label: appliedTone, icon: "🚀" };

  const buttonHoverColor =
    accentColor === "emerald"
      ? "hover:text-emerald-600 dark:hover:text-emerald-400"
      : "hover:text-amber-600 dark:hover:text-amber-400";

  const badgeBg =
    accentColor === "emerald"
      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60"
      : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60";

  return (
    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 no-print">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs font-semibold text-zinc-400 ${buttonHoverColor} transition-colors cursor-pointer select-none`}
      >
        {isOpen ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Hide Original Friday {isMultiWeek ? "Notes" : "Note"}</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>
              {isMultiWeek
                ? `View ${records.length} Contributing Friday Notes & Context`
                : "View Original Friday Note & Context"}
            </span>
          </>
        )}
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200/90 dark:border-zinc-800 text-xs space-y-3.5 animate-in fade-in duration-150">
          {/* Header Context Meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/70 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono uppercase tracking-wider ${badgeBg}`}>
                {isMultiWeek ? `${records.length} Weeks Contributing` : "1 Week Source"}
              </span>
              <span className="text-zinc-500 font-medium">Source Evidence Log</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-400">Applied Persona:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                <span>{roleMeta.icon}</span>
                <span>{roleMeta.label}</span>
              </span>
              <span>·</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                <span>{toneMeta.icon}</span>
                <span>{toneMeta.label}</span>
              </span>
            </div>
          </div>

          {/* Records List (Timeline thread if multi-week) */}
          <div className="space-y-3">
            {records.map((rec, rIdx) => {
              const weekDisplay = rec.dateRange
                ? `${rec.weekLabel} (${rec.dateRange})`
                : rec.weekLabel;

              return (
                <React.Fragment key={rec.id || rIdx}>
                  <div className="space-y-1.5 rounded-lg bg-white dark:bg-zinc-900 p-3.5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>
                          {isMultiWeek ? `Week ${rIdx + 1} · ` : ""}
                          {weekDisplay}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400">
                        Friday Brain Dump
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap pt-0.5 select-text">
                      {rec.raw_memo || "(No raw text recorded)"}
                    </p>
                  </div>

                  {/* Connecting Timeline Arrow for multi-week progressions */}
                  {isMultiWeek && rIdx < records.length - 1 && (
                    <div className="flex items-center justify-center py-0.5">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                        <ArrowDown className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
