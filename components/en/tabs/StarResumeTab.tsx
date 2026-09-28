"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Briefcase,
  Share2,
  Printer,
  Sparkles,
} from "lucide-react";
import { CareerRecord, JobRole, ToneManner, SynthesizedStarItem } from "@/types/career";
import { maskSynthesizedStarItem } from "@/lib/masking";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { PeriodFilterEn } from "../PeriodFilterEn";
import { ViewControlsEn, ViewDensity } from "../ViewControlsEn";
import { synthesizeStarItems } from "@/lib/synthesizer";
import { formatLinkedInPost, formatAtsResumeMarkdown } from "@/lib/exportFormatters";
import { filterRecordsByPeriod } from "@/lib/periodUtils";
import {
  buildSummaryCacheKey,
  getSummaryCache,
  saveSummaryCache,
  isSummaryStale,
  SummaryCacheEntry,
} from "@/lib/summaryCacheService";
import { useAuth } from "@/context/AuthContext";

interface StarResumeTabProps {
  records: CareerRecord[];
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export function StarResumeTab({
  records,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: StarResumeTabProps) {
  const { user } = useAuth();
  const userId = user?.uid || "guest";
  const isDemo = Boolean(user?.isDemo);

  // Period Filters (Year & Half only; Quarters excluded for Portfolios)
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedHalf, setSelectedHalf] = useState<string>("ALL");

  // Professional Scope (3 | 5 | 10) & View Density ("detailed" | "compact")
  const [scale, setScale] = useState<3 | 5 | 10>(3);
  const [density, setDensity] = useState<ViewDensity>("detailed");

  // Masking & Action states
  const [isNdaMasked, setIsNdaMasked] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [linkedInCopiedId, setLinkedInCopiedId] = useState<string | null>(null);

  // Cached summary state
  const [cachedEntry, setCachedEntry] = useState<SummaryCacheEntry | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // 1. Filter raw records by dropdown periods (Year & Half)
  const filteredRecords = useMemo(() => {
    return filterRecordsByPeriod(records, selectedYear, selectedHalf, "ALL");
  }, [records, selectedYear, selectedHalf]);

  const currentRecordIds = useMemo(() => filteredRecords.map((r) => r.id), [filteredRecords]);

  // 2. Deterministic cache key including Persona & Tone
  const cacheKey = useMemo(() => {
    return buildSummaryCacheKey(
      "star",
      selectedYear,
      selectedHalf,
      "ALL",
      scale,
      jobRole,
      toneManner
    );
  }, [selectedYear, selectedHalf, scale, jobRole, toneManner]);

  // 3. Load from cache whenever key changes
  const loadCache = useCallback(async () => {
    const cached = await getSummaryCache(userId, isDemo, cacheKey);
    setCachedEntry(cached);
  }, [userId, isDemo, cacheKey]);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  // 4. Stale check
  const isStale = useMemo(() => {
    return isSummaryStale(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  // 5. Trigger AI Synthesis on-demand
  const handleSynthesizeWithAi = async () => {
    if (filteredRecords.length === 0) return;
    setIsSynthesizing(true);
    try {
      const periodLabel = `${selectedYear} ${selectedHalf !== "ALL" ? selectedHalf : "Full Year"}`.trim();

      const res = await fetch("/api/synthesize/en", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "star",
          scope: scale,
          jobRole,
          toneManner,
          periodLabel,
          records: filteredRecords,
        }),
      });

      if (!res.ok) throw new Error("AI Synthesis request failed");
      const data = await res.json();
      const items: SynthesizedStarItem[] = data.items || [];

      // Save into cache
      const newEntry: SummaryCacheEntry = {
        cacheKey,
        type: "star",
        year: selectedYear,
        half: selectedHalf,
        quarter: "ALL",
        scope: scale,
        jobRole,
        toneManner,
        items,
        sourceRecordIds: currentRecordIds,
        sourceRecordCount: currentRecordIds.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSummaryCache(userId, isDemo, newEntry);
      setCachedEntry(newEntry);
    } catch (err) {
      console.error("AI STAR Synthesis error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 6. Base Synthesized STAR items
  const baseItems = useMemo<SynthesizedStarItem[]>(() => {
    if (cachedEntry && Array.isArray(cachedEntry.items) && cachedEntry.items.length > 0) {
      return cachedEntry.items as SynthesizedStarItem[];
    }
    // High-performance instantaneous local synthesis while cache is empty (0 API cost)
    return synthesizeStarItems(filteredRecords, scale, jobRole, toneManner);
  }, [cachedEntry, filteredRecords, scale, jobRole, toneManner]);

  // Unique domain tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    baseItems.forEach((item) => {
      item.nda_tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [baseItems]);

  // Tag filter & NDA Masking
  const displayedItems = useMemo(() => {
    const list =
      selectedTag === "ALL"
        ? baseItems
        : baseItems.filter((i) => i.nda_tags.includes(selectedTag));

    if (isNdaMasked) {
      return list.map((item) => maskSynthesizedStarItem(item));
    }
    return list;
  }, [baseItems, selectedTag, isNdaMasked]);

  const copySingleItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyLinkedInPostItem = async (item: SynthesizedStarItem) => {
    const post = formatLinkedInPost(item, jobRole);
    try {
      await navigator.clipboard.writeText(post);
      setLinkedInCopiedId(item.id);
      setTimeout(() => setLinkedInCopiedId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copyAllMarkdown = async () => {
    const text = formatAtsResumeMarkdown(displayedItems, jobRole);
    try {
      await navigator.clipboard.writeText(text);
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-950 dark:text-amber-200">
              Drawer 3: STAR Resume Bullets & Case Studies
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
              Long-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Synthesizes half-year and yearly projects into resume case studies with smart on-demand AI caching.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* NDA Shield Toggle */}
          <button
            onClick={() => setIsNdaMasked(!isNdaMasked)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isNdaMasked
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:text-zinc-800"
            }`}
            title="Toggle confidential client and company masking"
          >
            {isNdaMasked ? <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isNdaMasked ? "NDA Shield: ON" : "NDA Shield: OFF"}</span>
          </button>

          {/* ATS Print / PDF Export */}
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Print or Save as Clean ATS PDF"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Print / PDF</span>
          </button>

          {/* Copy All Resume Markdown */}
          <button
            onClick={copyAllMarkdown}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs transition-all cursor-pointer"
          >
            {isAllCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy for Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Persona & Narrative Tone Selector */}
      <div className="no-print">
        <PersonaSelectorEn
          currentRole={jobRole}
          currentTone={toneManner}
          onRoleChange={(r) => onJobRoleChange?.(r)}
          onToneChange={(t) => onToneMannerChange?.(t)}
        />
      </div>

      {/* 1. Period Dropdown Filters (Year & Half - Quarters Excluded) */}
      <div className="no-print">
        <PeriodFilterEn
          records={records}
          selectedYear={selectedYear}
          selectedHalf={selectedHalf}
          onYearChange={setSelectedYear}
          onHalfChange={setSelectedHalf}
          showQuarter={false}
          filteredCount={filteredRecords.length}
        />
      </div>

      {/* 2. Scope & Density View Controls (Executive 3 / Core 5 / Dossier 10 & Detailed vs Compact) */}
      <div className="no-print">
        <ViewControlsEn
          scale={scale}
          onScaleChange={setScale}
          density={density}
          onDensityChange={setDensity}
          isStale={isStale}
          onRegenerateAi={handleSynthesizeWithAi}
          isSynthesizing={isSynthesizing}
          isCached={Boolean(cachedEntry)}
          accentColor="amber"
        />
      </div>

      {/* STAR Cards List */}
      <div className="space-y-4">
        {displayedItems.map((item, idx) => (
          <div
            key={item.id || idx}
            className={`print-page-break bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs transition-all hover:border-amber-500/40 ${
              density === "compact" ? "p-4 space-y-3" : "p-5 sm:p-6 space-y-4"
            }`}
          >
            {/* Headline Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                    #{idx + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {item.period_span}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                  {item.title}
                </h3>
              </div>

              {/* Action Buttons for Card */}
              <div className="flex items-center gap-1.5 no-print">
                <button
                  onClick={() => copyLinkedInPostItem(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors cursor-pointer"
                  title="Generate viral LinkedIn post from this case study"
                >
                  {linkedInCopiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-600" />
                      <span>Copied Post!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>LinkedIn Post</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    copySingleItem(
                      item.id,
                      `**${item.title}**\n- Situation: ${item.situation}\n- Task: ${item.task}\n- Action: ${item.action}\n- Result: ${item.result}`
                    )
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy STAR bullet text"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Compact Mode: High-density scan view */}
            {density === "compact" ? (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px] uppercase tracking-wider shrink-0">
                    Result:
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-200 font-medium">
                    {item.result}
                  </p>
                </div>
                <div className="flex items-baseline gap-2 text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-400 text-[11px] uppercase tracking-wider shrink-0">
                    Action:
                  </span>
                  <p className="line-clamp-1">{item.action}</p>
                </div>
              </div>
            ) : (
              /* Detailed Mode: Complete 4-Quadrant STAR Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] block">
                    S · Situation
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {item.situation}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px] block">
                    T · Task
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {item.task}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] block">
                    A · Action
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {item.action}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11px] block">
                    R · Result (Google XYZ)
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                    {item.result}
                  </p>
                </div>
              </div>
            )}

            {/* Tags Footer */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              {item.nda_tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {displayedItems.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            No case studies found for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
