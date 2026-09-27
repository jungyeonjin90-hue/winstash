"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Calendar, Check, MessageSquare, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { CareerRecord } from "@/types/career";

interface WeeklySnippetsTabProps {
  record: CareerRecord;
}

export function WeeklySnippetsTab({ record }: WeeklySnippetsTabProps) {
  const [copiedType, setCopiedType] = useState<"slack" | "email" | null>(null);
  const [showRawMemo, setShowRawMemo] = useState(false);

  const formattedDate = new Date(record.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  const weekLabel = record.target_week?.label || formattedDate;

  const generateSlackMarkdown = () => {
    return `📢 *[Weekly Snippets] ${weekLabel} (${formattedDate})*

✅ *Progress (Completed)*
${record.weekly_report.done.map((item) => `• ${item}`).join("\n")}

⏳ *In-Flight & Bottlenecks*
${record.weekly_report.in_progress.map((item) => `• ${item}`).join("\n")}

🗓️ *Plans & Next Priorities*
${record.weekly_report.next_week.map((item) => `• ${item}`).join("\n")}`;
  };

  const generateEmailText = () => {
    return `Hi Team,

Here is my weekly status update for ${weekLabel} (${formattedDate}):

[Progress / Key Accomplishments]
${record.weekly_report.done.map((item) => `- ${item}`).join("\n")}

[In-Flight & Active Tracking]
${record.weekly_report.in_progress.map((item) => `- ${item}`).join("\n")}

[Next Week Priorities]
${record.weekly_report.next_week.map((item) => `- ${item}`).join("\n")}

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
    <div className="space-y-6">
      {/* Top Banner & Quick Copy Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
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

      {/* Structured 3 Sections Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Done */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Progress (Completed)</span>
          </div>
          <ul className="space-y-2.5">
            {record.weekly_report.done.map((item, idx) => (
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
            {record.weekly_report.in_progress.map((item, idx) => (
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
            {record.weekly_report.next_week.map((item, idx) => (
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
            {record.raw_memo}
          </div>
        )}
      </div>
    </div>
  );
}
