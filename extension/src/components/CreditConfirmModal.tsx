import React, { useEffect } from "react";
import { Sparkles, AlertCircle, X, ArrowRight } from "lucide-react";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[340px] bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl p-5 space-y-4">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-200 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              AI 성과 분석 & 서랍 저장
            </h3>
            {targetWeekLabel && (
              <p className="text-[11px] text-zinc-400">{targetWeekLabel}</p>
            )}
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-zinc-300 leading-relaxed">
          해당 주차의 업무 메모를 AI로 분석하여 주간보고, Brag Sheet, STAR 포트폴리오를 생성합니다.
        </p>

        {/* 크레딧 차감 시각화 카드 */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">현재 보유 크레딧</span>
            <span className="font-bold text-zinc-200">{remainingCredits} / {maxCredits}회</span>
          </div>

          <div className="flex items-center justify-center gap-3 py-1">
            <div className="text-center px-3 py-1 rounded-xl bg-zinc-800/80 border border-zinc-700">
              <span className="text-[10px] text-zinc-400 block">이전</span>
              <span className="text-xs font-bold text-zinc-200">{remainingCredits}회</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            <div className="text-center px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800/60">
              <span className="text-[10px] text-indigo-300 block">차감 후</span>
              <span className="text-xs font-bold text-indigo-300">{afterCredits}회</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pt-1 border-t border-zinc-800/80">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>생성 완료 시 무료 크레딧 1회가 차감됩니다.</span>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>생성 요청 중...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>1 크레딧 사용</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
