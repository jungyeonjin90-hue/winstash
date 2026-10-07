import React, { useEffect } from "react";
import { Sparkles, AlertCircle, X, ArrowRight, Zap } from "lucide-react";

interface CreditConfirmModalEnProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  remainingCredits: number;
  maxCredits: number;
  targetWeekLabel?: string;
  onUpgradeClick?: () => void;
  isLoading?: boolean;
}

export function CreditConfirmModalEn({
  isOpen,
  onClose,
  onConfirm,
  remainingCredits,
  maxCredits,
  targetWeekLabel,
  onUpgradeClick,
  isLoading = false,
}: CreditConfirmModalEnProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const afterCredits = Math.max(0, remainingCredits - 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[380px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-5 space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3 pr-6">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
              Update & Re-synthesize Entry?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Updating {targetWeekLabel ? <span className="font-semibold text-zinc-700 dark:text-zinc-300">{targetWeekLabel}</span> : "this entry"} will re-run AI synthesis across your Weekly Report, Brag Sheet, and STAR portfolio.
            </p>
          </div>
        </div>

        {/* Credit Deduction Notice Card */}
        <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Credit Deduction Notice</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-[10px] font-bold">
              -1 Credit
            </span>
          </div>

          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            Free tier includes <strong>{maxCredits} AI syntheses</strong>. Modifying an existing record counts as 1 credit deduction.
          </p>

          <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-600 dark:text-zinc-400">Current balance:</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
              <span className="text-indigo-600 dark:text-indigo-400">{remainingCredits}</span> / {maxCredits} left
              <ArrowRight className="inline-block w-3 h-3 mx-1 text-zinc-400" />
              <span className="text-amber-600 dark:text-amber-400 font-bold">{afterCredits} left</span>
            </span>
          </div>
        </div>

        {/* Pro Teaser */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 p-2.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-300 text-[11px]">
              Want unlimited edits? Pro has zero credit deductions.
            </span>
          </div>
          {onUpgradeClick && (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
            >
              Upgrade
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Updating...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Update & Deduct 1 Credit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
