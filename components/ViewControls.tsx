"use client";

import { LayoutGrid, List, Sparkles } from "lucide-react";
import { SynthesisScale } from "@/types/career";

export type ViewDensity = "detailed" | "compact";

interface ViewControlsProps {
  scale: SynthesisScale;
  onScaleChange: (scale: SynthesisScale) => void;
  density: ViewDensity;
  onDensityChange: (density: ViewDensity) => void;
  totalAvailableRecords: number;
  synthesizedCount: number;
  accentColor?: "emerald" | "amber" | "indigo";
}

export function ViewControls({
  scale,
  onScaleChange,
  density,
  onDensityChange,
  totalAvailableRecords,
  synthesizedCount,
  accentColor = "emerald",
}: ViewControlsProps) {
  const scaleOptions: {
    id: SynthesisScale;
    label: string;
    desc: string;
  }[] = [
    { id: 3, label: "3대 핵심", desc: "C-Level 보고용 최고 임팩트 3대 성과로 압축" },
    { id: 5, label: "5대 성과", desc: "연봉협상/Brag Sheet 표준 5대 프로젝트로 정리" },
    { id: 10, label: "10대 마일스톤", desc: "기술 구현 및 세부 마일스톤 10개로 분해 정리" },
    { id: "ALL", label: "전체 원본", desc: "기간 내 모든 개별 주간 기록을 1:1로 나열" },
  ];

  const activeScaleDesc = scaleOptions.find((o) => o.id === scale)?.desc || "";

  const activeBgClass =
    accentColor === "emerald"
      ? "bg-emerald-600 text-white shadow-xs"
      : accentColor === "amber"
      ? "bg-amber-600 text-white shadow-xs"
      : "bg-indigo-600 text-white shadow-xs";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-2.5 text-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Synthesis Scale Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>성과 압축 & 정리 개수:</span>
          </div>

          <div className="flex items-center bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs flex-wrap">
            {scaleOptions.map((opt) => {
              const isSelected = scale === opt.id;
              return (
                <button
                  key={String(opt.id)}
                  onClick={() => onScaleChange(opt.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? activeBgClass
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: View Density Toggle & Count Status */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
            <button
              onClick={() => onDensityChange("detailed")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                density === "detailed"
                  ? activeBgClass
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>상세형</span>
            </button>

            <button
              onClick={() => onDensityChange("compact")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                density === "compact"
                  ? activeBgClass
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>압축형</span>
            </button>
          </div>

          <span className="text-zinc-400 font-mono text-[11px]">
            {synthesizedCount}개 항목 생성됨
          </span>
        </div>
      </div>

      {/* Helper description for active scale */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          💡 {activeScaleDesc}
        </span>
        <span className="text-zinc-400 hidden sm:inline">
          (기간 내 수집된 {totalAvailableRecords}개 주간 기록 기반 맞춤 재구성)
        </span>
      </div>
    </div>
  );
}
