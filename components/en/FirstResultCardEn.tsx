"use client";

import { useEffect } from "react";
import { Sparkles, X, CalendarCheck, Award, Briefcase } from "lucide-react";
import { CareerRecord } from "@/types/career";
import { trackEvent } from "@/lib/analytics";

interface FirstResultCardEnProps {
  record: CareerRecord;
  onDismiss: () => void;
}

function DraftList({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
      <ul className="space-y-1 list-disc pl-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** Shown once, right after a user's first note is transformed, using the saved record as-is. */
export function FirstResultCardEn({ record, onDismiss }: FirstResultCardEnProps) {
  useEffect(() => {
    trackEvent("first_result_viewed");
  }, []);

  const { weekly_report, brag_sheet_item, star_portfolio } = record;

  return (
    <div
      id="first-result-card"
      className="relative w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-5 sm:p-7 shadow-md space-y-5 scroll-mt-20 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 pr-8">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Your note became three drafts
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly Snippet */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-200">
            <CalendarCheck className="w-4 h-4 text-indigo-500" />
            <span>Weekly Snippet</span>
          </div>
          <DraftList label="Done" items={weekly_report?.done} />
          <DraftList label="In progress" items={weekly_report?.in_progress} />
          <DraftList label="Next week" items={weekly_report?.next_week} />
        </div>

        {/* Performance Review bullet */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Performance Review</span>
          </div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {brag_sheet_item?.metric_summary}
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {brag_sheet_item?.business_impact}
          </p>
        </div>

        {/* Career Portfolio STAR story */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
            <Briefcase className="w-4 h-4 text-amber-500" />
            <span>Career Portfolio</span>
          </div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {star_portfolio?.title}
          </p>
          <dl className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {(["situation", "task", "action", "result"] as const).map((key) => (
              <div key={key} className="flex gap-2">
                <dt className="font-bold text-amber-700 dark:text-amber-400 w-4 shrink-0">{key[0].toUpperCase()}</dt>
                <dd>{star_portfolio?.[key]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Log every Friday and turn them into a quarterly Performance Review or Career Portfolio.
      </p>

      <div className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>
          AI-generated drafts are designed for reference. Please review and verify factual numbers before official submission or export.
        </span>
      </div>
    </div>
  );
}
