"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Calendar, Check, MessageSquare, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { CareerRecord } from "@/types/career";

interface WeeklyReportTabProps {
  record: CareerRecord;
}

export function WeeklyReportTab({ record }: WeeklyReportTabProps) {
  const [copiedType, setCopiedType] = useState<"slack" | "email" | null>(null);
  const [showRawMemo, setShowRawMemo] = useState(false);

  const formattedDate = new Date(record.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const KO_WATERMARK = "\n\n---\nFormatted with WinStash (https://winstash.xyz/ko)";

  const generateSlackMarkdown = () => {
    return `📢 *[주간 업무 보고] ${formattedDate}*

✅ *완료된 핵심 업무*
${record.weekly_report.done.map((item) => `• ${item}`).join("\n")}

⏳ *진행 중 이슈 및 모니터링*
${record.weekly_report.in_progress.map((item) => `• ${item}`).join("\n")}

🗓️ *차주 예정 업무*
${record.weekly_report.next_week.map((item) => `• ${item}`).join("\n")}${KO_WATERMARK}`;
  };

  const generateEmailText = () => {
    return `안녕하세요. 이번 주 주간 업무 보고 공유드립니다.

[완료된 핵심 업무]
${record.weekly_report.done.map((item) => `- ${item}`).join("\n")}

[진행 중 이슈 및 모니터링]
${record.weekly_report.in_progress.map((item) => `- ${item}`).join("\n")}

[차주 예정 업무]
${record.weekly_report.next_week.map((item) => `- ${item}`).join("\n")}

감사합니다.${KO_WATERMARK}`;
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
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
              단기 산출물 · 매주 월요일용
            </span>
            <span className="text-xs text-zinc-500 font-mono">{formattedDate}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            팀장/부서장 보고용 개조식 주간업무보고
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            군더더기 없는 비즈니스 문체로 정리되었습니다. 원클릭으로 복사하여 슬랙이나 메일에 바로 전송하세요.
          </p>
        </div>

        {/* Copy Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => copyToClipboard("slack")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all"
          >
            {copiedType === "slack" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">슬랙 복사 완료!</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                <span>슬랙 마크다운 복사</span>
              </>
            )}
          </button>

          <button
            onClick={() => copyToClipboard("email")}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition-all"
          >
            {copiedType === "email" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span className="font-bold">메일 복사 완료!</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>이메일 텍스트 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Done Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>완료된 핵심 업무</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
              {record.weekly_report.done.length}건
            </span>
          </div>
          <ul className="space-y-3">
            {record.weekly_report.done.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* In Progress Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Clock className="w-4 h-4" />
            <span>진행 중 이슈 & 주의사항</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono">
              {record.weekly_report.in_progress.length}건
            </span>
          </div>
          <ul className="space-y-3">
            {record.weekly_report.in_progress.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Week Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Calendar className="w-4 h-4" />
            <span>다음 주 예정 업무</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
              {record.weekly_report.next_week.length}건
            </span>
          </div>
          <ul className="space-y-3">
            {record.weekly_report.next_week.map((item, idx) => (
              <li
                key={idx}
                className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Raw Memo Toggle for verification */}
      <div className="border border-zinc-200/70 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5">
        <button
          onClick={() => setShowRawMemo(!showRawMemo)}
          className="flex items-center justify-between w-full text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          <span className="font-medium">변환 전 사용자가 입력했던 날것의 원문 메모 확인</span>
          {showRawMemo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showRawMemo && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-950/60 p-3 rounded-lg leading-relaxed font-mono">
            {record.raw_memo}
          </div>
        )}
      </div>
    </div>
  );
}
