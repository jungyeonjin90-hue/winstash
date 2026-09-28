"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Check,
  MessageSquare,
  Mail,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { CareerRecord } from "@/types/career";

interface WeeklySnippetsTabProps {
  records: CareerRecord[];
  initialRecordId?: string;
}

export function WeeklySnippetsTab({ records, initialRecordId }: WeeklySnippetsTabProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecordId || records[0]?.id || ""
  );
  const [copiedType, setCopiedType] = useState<"slack" | "email" | null>(null);
  const [showRawMemo, setShowRawMemo] = useState(false);

  // Active selected record or fallback to first record
  const currentIndex = records.findIndex((r) => r.id === selectedRecordId);
  const activeRecord = (currentIndex >= 0 ? records[currentIndex] : records[0]) || null;

  if (!activeRecord) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm">
        No weekly logs found. Enter your first Friday note above!
      </div>
    );
  }

  const formattedDate = new Date(activeRecord.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  const weekLabel = activeRecord.target_week?.label || formattedDate;

  // Navigation handlers
  const hasOlder = currentIndex < records.length - 1;
  const hasNewer = currentIndex > 0;

  const handleOlder = () => {
    if (hasOlder) {
      setSelectedRecordId(records[currentIndex + 1].id);
    }
  };

  const handleNewer = () => {
    if (hasNewer) {
      setSelectedRecordId(records[currentIndex - 1].id);
    }
  };

  const generateSlackMarkdown = () => {
    return `📢 *[Weekly Snippets] ${weekLabel} (${formattedDate})*

✅ *Progress (Completed)*
${activeRecord.weekly_report.done.map((item) => `• ${item}`).join("\n")}

⏳ *In-Flight & Bottlenecks*
${activeRecord.weekly_report.in_progress.map((item) => `• ${item}`).join("\n")}

🗓️ *Plans & Next Priorities*
${activeRecord.weekly_report.next_week.map((item) => `• ${item}`).join("\n")}`;
  };

  const generateEmailText = () => {
    return `Hi Team,

Here is my weekly status update for ${weekLabel} (${formattedDate}):

[Progress / Key Accomplishments]
${activeRecord.weekly_report.done.map((item) => `- ${item}`).join("\n")}

[In-Flight & Active Tracking]
${activeRecord.weekly_report.in_progress.map((item) => `- ${item}`).join("\n")}

[Next Week Priorities]
${activeRecord.weekly_report.next_week.map((item) => `- ${item}`).join("\n")}

Best regards`;
  };

  const copyToClipboard = async (type: "slack" | "email") => {
    const text = type === "slack" ? generateSlackMarkdown() : generateEmailText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
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
              Drawer 1: Weekly Snippets (PPP Framework)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
              Short-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Engineered for skip-level status syncs, 1-on-1s, and Slack channel updates.
          </p>
        </div>

        {/* Copy Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => copyToClipboard("slack")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#4A154B] hover:bg-[#611f69] text-white shadow-xs transition-all cursor-pointer"
            title="Copy Slack Markdown"
          >
            {copiedType === "slack" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Slack!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Copy for Slack</span>
              </>
            )}
          </button>

          <button
            onClick={() => copyToClipboard("email")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs transition-all cursor-pointer"
            title="Copy Email Text"
          >
            {copiedType === "email" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied to Email!</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>Copy for Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Week Selection Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 no-print text-xs">
        {/* Dropdown Week Picker */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shrink-0">
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Week Log:</span>
          </span>

          <select
            value={activeRecord.id}
            onChange={(e) => setSelectedRecordId(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
          >
            {records.map((r, idx) => {
              const label = r.target_week?.label || new Date(r.createdAt).toLocaleDateString("en-US");
              const isLatest = idx === 0;
              return (
                <option key={r.id} value={r.id} className="bg-white dark:bg-zinc-900">
                  {label} {isLatest ? "(Latest)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Older / Newer Quick Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleOlder}
            disabled={!hasOlder}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
              hasOlder
                ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                : "opacity-40 cursor-not-allowed text-zinc-400"
            }`}
            title="View previous week"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Older Week</span>
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
            title="View newer week"
          >
            <span>Newer Week</span>
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
