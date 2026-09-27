"use client";

import { useState } from "react";
import { Mic, MicOff, Sparkles, CornerDownLeft, RotateCcw, Lightbulb } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { WeekSpan, CareerRecord } from "@/types/career";
import { getCurrentWeekSpanEn } from "@/lib/weekUtilsEn";
import { WeekPickerEn } from "./WeekPickerEn";
import { CreditStatus } from "@/lib/creditService";

interface QuickLoggerEnProps {
  onTransform: (rawMemo: string, targetWeek: WeekSpan) => Promise<void>;
  isLoading: boolean;
  existingRecords?: CareerRecord[];
  creditStatus?: CreditStatus | null;
}

const PRESET_MEMOS_EN = [
  {
    label: "⚡ Payment P99 Latency -93% (Engineering)",
    text: "Resolved critical payment gateway timeout spikes (50+ errors/min) by tuning HikariCP connection pool parameters and adding Redis multi-tier caching. Slashed p99 latency from 1,200ms to 85ms (93% reduction) and eliminated transaction failures to 0%. Next week: Grafana executive dashboard.",
  },
  {
    label: "📈 3-Step Funnel & +24% CVR (Product)",
    text: "Shipped 3-step streamlined onboarding experiment to 100% of global mobile traffic with 1-click social auth. Monitored telemetry for 7 days: drop-off dropped from 38% to 19%, overall signup conversion rate (CVR) surged by +24%.",
  },
  {
    label: "🎯 Search Ads CAC -18% (Growth)",
    text: "A/B tested search & paid social landing pages with high-intent benefit messaging and instant coupon issuance. Drove a 32% increase in signup conversion and reduced customer acquisition cost (CAC) by 18% over 2 weeks.",
  },
  {
    label: "🛠️ 4-Hour Reconciliation Automation (Ops)",
    text: "Automated manual weekly financial reconciliation using a Python pipeline and corporate Slack Bot. Codified 8 edge cases with finance. Slashed Friday manual review time from 4 hours to 3 minutes with 0% error discrepancy.",
  },
];

export function QuickLoggerEn({
  onTransform,
  isLoading,
  existingRecords = [],
  creditStatus = null,
}: QuickLoggerEnProps) {
  const [memo, setMemo] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<WeekSpan>(getCurrentWeekSpanEn());

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (transcribed) => {
      setMemo((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
    },
  });

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memo.trim() || isLoading) return;
    if (isListening) stopListening();
    await onTransform(memo.trim(), selectedWeek);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs transition-all hover:shadow-md space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Weekly Brain Dump (Raw Notes)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Don&apos;t worry about format. Brain-dump what you shipped, broke, or solved this week. AI will synthesize it into 3 drawers automatically.
          </p>
        </div>

        {/* Word/Char Counter & Clear */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {memo.length > 0 && (
            <button
              onClick={() => setMemo("")}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
            {memo.length} chars
          </span>
        </div>
      </div>

      {/* Week Selector Bar */}
      <WeekPickerEn
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        existingRecords={existingRecords}
      />

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          Quick Examples:
        </span>
        {PRESET_MEMOS_EN.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setMemo(preset.text)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors font-medium cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Textarea Box */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all bg-zinc-50/50 dark:bg-zinc-950/50">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder="e.g. Hotfixed payment gateway timeouts by tuning HikariCP connection pool and deploying Redis caching. Cut p99 latency from 1.2s to 85ms (-93%). Zero dropped transactions during peak sale. Next week: Grafana alerts."
          className="w-full h-32 sm:h-36 p-4 text-xs sm:text-sm bg-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed text-zinc-900 dark:text-zinc-100"
        />

        {/* Bottom Toolbar inside input */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-b-2xl">
          {/* Voice Input Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMic}
              title={
                !isSupported
                  ? "Browser speech recognition is not supported."
                  : isListening
                  ? "Stop Dictation"
                  : "Voice Dictation"
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening... (Click to stop)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Voice Dictation (STT)</span>
                </>
              )}
            </button>

            {speechError && (
              <span className="text-[11px] text-rose-500 font-medium">
                {speechError}
              </span>
            )}
          </div>

          {/* Transform & Submit Button or Out of Credits Warning */}
          <div className="flex items-center gap-2">
            {creditStatus && (
              <span className="hidden md:inline-flex text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                {creditStatus.isUserExhausted ? (
                  <span className="text-rose-500 font-semibold">Free Quota Reached</span>
                ) : (
                  <span>{creditStatus.remainingCredits}/{creditStatus.maxUserCredits} free left</span>
                )}
              </span>
            )}

            {creditStatus && creditStatus.isUserExhausted ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                title="You have used all 5 free transformations."
              >
                <span>Free Quota Exhausted</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!memo.trim() || isLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>{isLoading ? "Synthesizing 3 Drawers..." : `Save to ${selectedWeek.label}`}</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
