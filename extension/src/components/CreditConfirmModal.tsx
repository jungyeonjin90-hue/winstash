import React, { useEffect } from "react";
import { Sparkles, X, ArrowRight } from "lucide-react";

interface CreditConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  remainingCredits: number;
  maxCredits: number;
  targetWeekLabel?: string;
  isLoading?: boolean;
}

export function CreditConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  remainingCredits,
  maxCredits,
  targetWeekLabel,
  isLoading = false,
}: CreditConfirmModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[320px] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-4 space-y-3 text-zinc-100">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          disabled={isLoading}
          aria-label="모달 닫기"
          className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-2 pr-6">
          <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">
              기록 수정 (-1 크레딧)?
            </h3>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {targetWeekLabel ? targetWeekLabel : "선택한 주차"}
            </p>
          </div>
        </div>

        {/* 잔여 크레딧 행 */}
        <div className="rounded-xl bg-zinc-950/70 border border-zinc-800 px-3 py-2 flex items-center justify-between text-[11px]">
          <span className="text-zinc-400">잔여 크레딧</span>
          <span className="font-mono font-semibold flex items-center gap-1.5">
            <span className="text-zinc-300">{remainingCredits}</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
            <span className="text-amber-400 font-bold">{afterCredits}회 남음</span>
            <span className="text-zinc-500 text-[10px]">/ {maxCredits}</span>
          </span>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>저장 중...</span>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>수정 확인</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
