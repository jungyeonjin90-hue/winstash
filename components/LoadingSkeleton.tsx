"use client";

import { useEffect, useState } from "react";
import { Sparkles, FileText, TrendingUp, ShieldCheck } from "lucide-react";

export function LoadingSkeleton() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "거친 원자재 메모 자연어 분석 및 핵심 키워드 추출 중...", sub: "업무 수행 내역, 수치, 이슈를 감지합니다." },
    { title: "3-Way 커리어 OS 다목적 산출물 생성 중...", sub: "주간보고 개조식 · Brag Sheet 임팩트 · STAR 구조화 포트폴리오" },
    { title: "민감 정보 비식별화 및 3개 독립 서랍에 저장 중...", sub: "NDA 마스킹 및 영구 저장소 색인 완료" },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1200);
    const timer2 = setTimeout(() => setCurrentStep(2), 2400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-pulse">
      {/* Step Tracker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {steps[currentStep].title}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {steps[currentStep].sub}
            </p>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === currentStep
                  ? "w-8 bg-indigo-600 dark:bg-indigo-400"
                  : idx < currentStep
                  ? "w-2 bg-indigo-300 dark:bg-indigo-700"
                  : "w-2 bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3 Drawers Preview Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Drawer 1 Skeleton */}
        <div className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 bg-zinc-50/60 dark:bg-zinc-800/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-500">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700/80 rounded" />
            <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-700/80 rounded" />
            <div className="h-3 w-4/6 bg-zinc-200 dark:bg-zinc-700/80 rounded" />
          </div>
        </div>

        {/* Drawer 2 Skeleton */}
        <div className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 bg-zinc-50/60 dark:bg-zinc-800/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-5 w-3/4 bg-emerald-100/70 dark:bg-emerald-950/50 rounded" />
            <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-700/80 rounded" />
            <div className="h-3 w-4/5 bg-zinc-200 dark:bg-zinc-700/80 rounded" />
          </div>
        </div>

        {/* Drawer 3 Skeleton */}
        <div className="border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 bg-zinc-50/60 dark:bg-zinc-800/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700/80 rounded" />
            <div className="flex gap-1.5">
              <div className="h-4 w-12 bg-amber-100/60 dark:bg-amber-950/40 rounded" />
              <div className="h-4 w-14 bg-amber-100/60 dark:bg-amber-950/40 rounded" />
            </div>
            <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-700/80 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
