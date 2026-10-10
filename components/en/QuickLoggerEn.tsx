"use client";

import { useState, useEffect } from "react";
import { Sparkles, CornerDownLeft, RotateCcw, Lightbulb, Lock, Zap } from "lucide-react";
import { WeekSpan, CareerRecord, JobRole, ToneManner } from "@/types/career";
import { getCurrentWeekSpanEn } from "@/lib/weekUtilsEn";
import { WeekPickerEn } from "./WeekPickerEn";
import { CreditStatus } from "@/lib/creditService";

interface QuickLoggerEnProps {
  onTransform: (
    rawMemo: string,
    targetWeek?: WeekSpan,
    role?: JobRole,
    tone?: ToneManner,
    existingRecordId?: string
  ) => Promise<void>;
  isLoading: boolean;
  existingRecords?: CareerRecord[];
  creditStatus?: CreditStatus | null;
  onUpgradeClick?: () => void;
  selectedWeek?: WeekSpan;
  onWeekChange?: (week: WeekSpan) => void;
  jobRole?: JobRole;
  /** True once records have loaded and the user has none yet. */
  isFirstNote?: boolean;
  /** Fired once when a user with no records starts typing their first note. */
  onFirstMemoStarted?: () => void;
}

const PLACEHOLDER_BY_ROLE_EN: Record<JobRole, string> = {
  engineering: "Fixed the login timeout bug. Fewer error reports since Wednesday.",
  product: "Shipped the new signup screen to 10% of users. Watching drop-off next week.",
  design: "Finished the checkout redesign review with the team. Two flows still need testing.",
  marketing: "Launched the October newsletter. Open rate looked better than last month.",
  sales: "Closed the renewal with Acme. Next: pricing call with their finance team.",
  operations: "Cleaned up the vendor invoice backlog. Month-end close should be faster.",
};

const LOADING_MESSAGES_EN = [
  "AI is analyzing your raw memo...",
  "Extracting impact & metrics...",
  "Drafting STAR case studies...",
  "Masking sensitive information...",
  "Almost there! Polishing..."
];

function LoadingMessagesEn() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES_EN.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Sparkles className="w-4 h-4 animate-spin text-white/80" />
      <span className="text-white min-w-[160px] text-center">{LOADING_MESSAGES_EN[msgIdx]}</span>
    </div>
  );
}

export function QuickLoggerEn({
  onTransform,
  isLoading,
  existingRecords = [],
  creditStatus = null,
  onUpgradeClick,
  selectedWeek: controlledWeek,
  onWeekChange,
  jobRole = "engineering",
  isFirstNote = false,
  onFirstMemoStarted,
}: QuickLoggerEnProps) {
  const [memo, setMemo] = useState("");
  const [hasReportedFirstMemo, setHasReportedFirstMemo] = useState(false);

  const handleMemoChange = (value: string) => {
    if (isFirstNote && !hasReportedFirstMemo && memo.length === 0 && value.length > 0) {
      setHasReportedFirstMemo(true);
      onFirstMemoStarted?.();
    }
    setMemo(value);
  };
  const [internalWeek, setInternalWeek] = useState<WeekSpan>(getCurrentWeekSpanEn());
  const selectedWeek = controlledWeek || internalWeek;

  const handleWeekSelect = (w: WeekSpan) => {
    if (onWeekChange) {
      onWeekChange(w);
    } else {
      setInternalWeek(w);
    }
  };

  const existingRecord = existingRecords?.find((record) => {
    if (record.target_week) {
      return (
        record.target_week.year === selectedWeek.year &&
        record.target_week.month === selectedWeek.month &&
        record.target_week.weekOfMonth === selectedWeek.weekOfMonth
      );
    }
    return false;
  });

  // When selectedWeek changes, if there's an existing record, populate the textarea.
  // If there's no existing record, clear the textarea to start fresh.
  // Adjusted during render (React's "reset state when a prop changes" pattern); the initial null
  // makes the first render load the current week's memo, like the former mount effect did.
  const memoSourceKey = `${selectedWeek.year}-${selectedWeek.month}-${selectedWeek.weekOfMonth}|${existingRecord?.id ?? ""}|${existingRecord?.raw_memo ?? ""}`;
  const [loadedMemoKey, setLoadedMemoKey] = useState<string | null>(null);
  if (loadedMemoKey !== memoSourceKey) {
    setLoadedMemoKey(memoSourceKey);
    setMemo(existingRecord ? existingRecord.raw_memo : "");
  }

  // Prevent accidental tab closure or browser back exit when user has typed an unsaved draft
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (memo.trim().length > 10 && !isLoading && memo !== existingRecord?.raw_memo) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [memo, isLoading, existingRecord?.raw_memo]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memo.trim() || isLoading) return;

    if (creditStatus?.isUserExhausted && !creditStatus?.isPro) {
      onUpgradeClick?.();
      return;
    }
    
    // Pass existingRecord.id if we are editing an already logged week.
    await onTransform(memo.trim(), selectedWeek, undefined, undefined, existingRecord?.id);
  };

  return (
    <div id="quick-logger-section" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs transition-all hover:shadow-md space-y-4 scroll-mt-20">
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
          <span className={`text-xs font-mono ${memo.length > 4500 ? "text-amber-500 font-semibold" : "text-zinc-400 dark:text-zinc-500"}`}>
            {memo.length.toLocaleString()} / 5,000 chars
          </span>
        </div>
      </div>

      {/* Week Selector Bar */}
      <WeekPickerEn
        selectedWeek={selectedWeek}
        onWeekChange={handleWeekSelect}
        existingRecords={existingRecords}
      />

      {/* First-note hint */}
      {isFirstNote && (
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
          Write one line about what you did this week. AI turns it into three drafts.
        </p>
      )}

      {/* Textarea Box */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all bg-zinc-50/50 dark:bg-zinc-950/50">
        <textarea
          id="quick-logger-textarea"
          aria-label="Weekly note"
          value={memo}
          onChange={(e) => handleMemoChange(e.target.value)}
          maxLength={5000}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder={PLACEHOLDER_BY_ROLE_EN[jobRole] ?? PLACEHOLDER_BY_ROLE_EN.engineering}
          className="w-full h-32 sm:h-36 p-4 text-base sm:text-sm bg-transparent placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed text-zinc-900 dark:text-zinc-100"
        />

        {/* Bottom Toolbar inside input */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-b-2xl">
          {/* Left info badge / shortcut hint */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline-block">
              Press ⌘/Ctrl+Enter to submit · AI drafts for reference (verify before use)
            </span>
          </div>

          {/* Transform & Submit Button or Out of Credits Warning */}
          <div className="flex items-center gap-2">
            {creditStatus?.isPro ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Pro Unlimited</span>
              </span>
            ) : creditStatus && (
              <span className="hidden md:inline-flex text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                {creditStatus.isUserExhausted ? (
                  <span className="text-rose-500 font-semibold">Free Quota Reached (0/{creditStatus.maxUserCredits})</span>
                ) : (
                  <span>{creditStatus.remainingCredits}/{creditStatus.maxUserCredits} free left</span>
                )}
              </span>
            )}

            {creditStatus && !creditStatus.isPro && creditStatus.isUserExhausted ? (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Upgrade to Pro ($5.99)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!memo.trim() || isLoading}
                className="flex items-center justify-center min-w-[140px] gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <LoadingMessagesEn />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span>{existingRecord ? `Update ${selectedWeek.label}` : `Save to ${selectedWeek.label}`}</span>
                    <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helper Pro-Tip Banner (Nudge for quantifiable results & user feedback); hidden for the first note */}
      {!isFirstNote && (
        <div className="flex items-start sm:items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 text-[11px] sm:text-xs text-amber-800 dark:text-amber-300/90">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-snug">
            <strong className="font-semibold">Pro-tip:</strong> Mention quantifiable results (e.g. <em>+24% CVR, -30% latency, 4h saved</em>) or user feedback if available. It powers significantly stronger STAR bullets! <span className="opacity-75">(Optional: directional impact is fine if metrics aren&apos;t ready)</span>
          </p>
        </div>
      )}

      {/* Sensitive Data Warning Caption */}
      <div className="flex items-center gap-1.5 px-2 text-[11px] text-zinc-400 dark:text-zinc-500">
        <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
        <span>
          Never enter sensitive information: please do not include credit card numbers, social security numbers, passwords, or private API keys.
        </span>
      </div>
    </div>
  );
}
