"use client";

import { LayoutGrid, List, Sparkles } from "lucide-react";

export type ViewDensity = "detailed" | "compact";

interface ViewControlsEnProps {
  scale: 3 | 5 | 10;
  onScaleChange: (scale: 3 | 5 | 10) => void;
  density: ViewDensity;
  onDensityChange: (density: ViewDensity) => void;
  isStale?: boolean;
  onRegenerateAi?: () => void;
  isSynthesizing?: boolean;
  isCached?: boolean;
  accentColor?: "emerald" | "amber" | "indigo";
}

export function ViewControlsEn({
  scale,
  onScaleChange,
  density,
  onDensityChange,
  accentColor = "emerald",
}: ViewControlsEnProps) {
  const scaleOptions: {
    id: 3 | 5 | 10;
    label: string;
    badge: string;
    desc: string;
  }[] = [
    {
      id: 3,
      label: "Executive Brief",
      badge: "3 Points",
      desc: "Top 3 highest-leverage wins tailored for C-Level & VP syncs",
    },
    {
      id: 5,
      label: "Core Highlights",
      badge: "5 Points",
      desc: "Standard 5-project brag sheet for direct manager review",
    },
    {
      id: 10,
      label: "Comprehensive Dossier",
      badge: "10 Points",
      desc: "Full 10-milestone audit for annual reviews & career vault",
    },
  ];

  const activeScaleDesc = scaleOptions.find((o) => o.id === scale)?.desc || "";

  const activeBgClass =
    accentColor === "emerald"
      ? "bg-emerald-600 text-white shadow-xs"
      : accentColor === "amber"
      ? "bg-amber-600 text-white shadow-xs"
      : "bg-indigo-600 text-white shadow-xs";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3 text-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Professional Scope Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Synthesis Scope:</span>
          </div>

          <div className="flex items-center bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs flex-wrap gap-1">
            {scaleOptions.map((opt) => {
              const isSelected = scale === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onScaleChange(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? activeBgClass
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
                  }`}
                  title={opt.desc}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300"
                    }`}
                  >
                    {opt.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: View Density Toggle & AI Status */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-zinc-200/60 dark:border-zinc-800">
          {/* Detailed vs Compact Density Toggle */}
          <div className="flex items-center bg-white dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs">
            <button
              onClick={() => onDensityChange("detailed")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                density === "detailed"
                  ? activeBgClass
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
              title="Detailed view: complete STAR and business context"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Detailed</span>
            </button>

            <button
              onClick={() => onDensityChange("compact")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                density === "compact"
                  ? activeBgClass
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
              title="Compact view: high-density scan with metrics and tags"
            >
              <List className="w-3.5 h-3.5" />
              <span>Compact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Helper description for active scale */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/60 gap-1.5">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          🎯 {activeScaleDesc}
        </span>
      </div>
    </div>
  );
}
