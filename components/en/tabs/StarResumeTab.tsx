"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Briefcase,
  Sparkles,
  Calendar,
} from "lucide-react";
import { CareerRecord, JobRole, ToneManner, SynthesizedStarItem } from "@/types/career";
import { maskSynthesizedStarItem } from "@/lib/masking";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { PeriodFilterEn } from "../PeriodFilterEn";
import { ViewControlsEn, ViewDensity } from "../ViewControlsEn";
import { formatStarPortfolio, formatSingleStarItem } from "@/lib/exportFormatters";
import { filterRecordsByPeriod, getDetailedRecordDateInfo } from "@/lib/periodUtils";
import {
  buildSummaryCacheKey,
  getSummaryCache,
  saveSummaryCache,
  isSummaryStale,
  isCacheValid,
  deleteSummaryCache,
  SummaryCacheEntry,
} from "@/lib/summaryCacheService";
import {
  checkDailySynthesisLimit,
  recordDailySynthesisUsage,
  checkSynthesisCooldown,
  recordSynthesisCooldown,
} from "@/lib/rateLimitService";
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

  // Derive latest record year or fallback to current calendar year
  const latestRecordYear = useMemo(() => {
    if (records.length > 0) {
      return getDetailedRecordDateInfo(records[0]).year;
    }
    return String(new Date().getFullYear());
  }, [records]);

  // Period Filters (Year & Half only; Quarters excluded for Portfolios)
  const [selectedYear, setSelectedYear] = useState<string>(latestRecordYear);
  const [selectedHalf, setSelectedHalf] = useState<string>("ALL");

  // Keep selectedYear synchronized when records load asynchronously
  useEffect(() => {
    if (records.length > 0) {
      const availableYears = new Set(records.map((r) => getDetailedRecordDateInfo(r).year));
      if (!availableYears.has(selectedYear)) {
        setSelectedYear(latestRecordYear);
      }
    }
  }, [records, latestRecordYear, selectedYear]);

  // Professional Scope (3 | 5 | 10) & View Density ("detailed" | "compact")
  const [scale, setScale] = useState<3 | 5 | 10>(3);
  const [density, setDensity] = useState<ViewDensity>("detailed");

  // Masking & Action states
  const [isNdaMasked, setIsNdaMasked] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);

  // Cached summary state
  const [cachedEntry, setCachedEntry] = useState<SummaryCacheEntry | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // 1. Filter raw records by dropdown periods (Year & Half)
  const filteredRecords = useMemo(() => {
    return filterRecordsByPeriod(records, selectedYear, selectedHalf, "ALL");
  }, [records, selectedYear, selectedHalf]);

  const currentRecordIds = useMemo(() => filteredRecords.map((r) => r.id), [filteredRecords]);

  // 2. Deterministic Content-Addressable cache key strictly bound to current record IDs
  const cacheKey = useMemo(() => {
    return buildSummaryCacheKey(
      "star",
      selectedYear,
      selectedHalf,
      "ALL",
      scale,
      jobRole,
      toneManner,
      currentRecordIds
    );
  }, [selectedYear, selectedHalf, scale, jobRole, toneManner, currentRecordIds]);

  // 3. Load from cache whenever key changes
  const loadCache = useCallback(async () => {
    if (filteredRecords.length === 0) {
      setCachedEntry(null);
      return;
    }
    const cached = await getSummaryCache(userId, isDemo, cacheKey);
    // If cached entry is stale or references deleted records, evict it immediately!
    if (cached && !isCacheValid(cached, currentRecordIds)) {
      setCachedEntry(null);
      deleteSummaryCache(userId, isDemo, cacheKey).catch(() => {});
      return;
    }
    setCachedEntry(cached);
  }, [userId, isDemo, cacheKey, filteredRecords.length, currentRecordIds]);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  // Keep cache strictly in sync if currentRecordIds changes (e.g. user deletes or edits records)
  useEffect(() => {
    if (cachedEntry && !isCacheValid(cachedEntry, currentRecordIds)) {
      setCachedEntry(null);
    }
  }, [cachedEntry, currentRecordIds]);

  // 4. Stale check: has any record been added or deleted since this summary was cached?
  const isStale = useMemo(() => {
    return isSummaryStale(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  const isValid = useMemo(() => {
    return isCacheValid(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  const needsGeneration = !cachedEntry || !isValid || isStale;

  // 5. Trigger AI Synthesis on-demand
  const handleSynthesizeWithAi = async () => {
    if (filteredRecords.length === 0) return;

    // 1. Anti-spam cooldown check (bypassed for admin)
    const cooldown = checkSynthesisCooldown(userId, user?.email);
    if (cooldown.inCooldown) {
      alert(`⏳ Please wait ${cooldown.remainingSeconds}s before requesting AI synthesis again.`);
      return;
    }

    // 2. Daily synthesis quota check (bypassed for admin)
    const dailyLimit = checkDailySynthesisLimit(userId, user?.email);
    if (!dailyLimit.allowed) {
      alert(
        `⚠️ Daily AI synthesis limit reached (${dailyLimit.usedCount}/${dailyLimit.maxLimit}).\n\nPlease try again tomorrow or continue using your cached summaries.`
      );
      return;
    }

    setIsSynthesizing(true);
    recordSynthesisCooldown(userId, user?.email);
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

      // Record daily usage on success
      recordDailySynthesisUsage(userId, user?.email);

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

  // 6. Base Synthesized STAR items: Only show actual cached AI items if strictly valid and filteredRecords not empty
  const baseItems = useMemo<SynthesizedStarItem[]>(() => {
    if (filteredRecords.length === 0) return [];
    if (
      isValid &&
      cachedEntry &&
      Array.isArray(cachedEntry.items) &&
      cachedEntry.items.length > 0
    ) {
      return cachedEntry.items as SynthesizedStarItem[];
    }
    return [];
  }, [filteredRecords.length, isValid, cachedEntry]);

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
      return list.map((item) => maskSynthesizedStarItem(item, "en"));
    }
    return list;
  }, [baseItems, selectedTag, isNdaMasked]);

  const activeJobRole = cachedEntry ? cachedEntry.jobRole : jobRole;

  const copySingleItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyStarPortfolio = async () => {
    let text = "";
    if (displayedItems.length > 0) {
      text = formatStarPortfolio(displayedItems, activeJobRole);
    } else if (filteredRecords.length > 0) {
      const fallbackItems: SynthesizedStarItem[] = filteredRecords.map((r, idx) => ({
        id: r.id,
        rank: idx + 1,
        title: r.star_portfolio?.title || "Career Accomplishment Story",
        period_span: r.target_week?.label || getDetailedRecordDateInfo(r).displayLabel,
        situation: r.star_portfolio?.situation || "",
        task: r.star_portfolio?.task || "",
        action: r.star_portfolio?.action || "",
        result: r.star_portfolio?.result || "",
        nda_tags: r.star_portfolio?.nda_tags || ["Confidential"],
      }));
      const itemsToFormat = isNdaMasked ? fallbackItems.map((i) => maskSynthesizedStarItem(i, "en")) : fallbackItems;
      text = formatStarPortfolio(itemsToFormat, activeJobRole);
    }
    if (!text) return;
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
      {/* 1. Top Banner (Title Only) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-950 dark:text-amber-200">
              Drawer 3: Career Portfolio (STAR Method & Case Studies)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
              Long-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Synthesizes half-year and yearly projects into resume case studies with smart on-demand AI caching.
          </p>
        </div>
      </div>

      {/* 2. Unified Configuration Panel */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 no-print">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Synthesis Configuration
          </span>
        </div>
        
        {/* Period Filter */}
        <PeriodFilterEn
          records={records}
          selectedYear={selectedYear}
          selectedHalf={selectedHalf}
          onYearChange={setSelectedYear}
          onHalfChange={setSelectedHalf}
          showQuarter={false}
          filteredCount={filteredRecords.length}
        />

        {/* Narrative Tone Selector */}
        <PersonaSelectorEn
          currentRole={jobRole}
          currentTone={toneManner}
          onToneChange={(t) => onToneMannerChange?.(t)}
        />

        {/* View Density & Scope Controls */}
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

      {/* 3. Synthesis Action & Export Toolbar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 no-print">
        {/* Synthesize Button with 3-State Logic (Generate / Update / Up to Date) */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {needsGeneration ? (
            <button
              onClick={handleSynthesizeWithAi}
              disabled={isSynthesizing || filteredRecords.length === 0}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
                filteredRecords.length > 0
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 ring-2 ring-amber-500/30 animate-pulse cursor-pointer"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {isSynthesizing ? (
                <Sparkles className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
              <span>
                {isSynthesizing
                  ? "Synthesizing AI Resumes..."
                  : filteredRecords.length === 0
                  ? "No Weekly Logs in this Period"
                  : isStale
                  ? `Update Portfolio (${filteredRecords.length} Logs)`
                  : `Generate Career Portfolio (${filteredRecords.length} Logs)`}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 shadow-xs select-none">
              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Portfolio Up to Date (Saved in DB)</span>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1 hidden sm:inline-block">Options:</span>
          
          {/* NDA Shield Toggle */}
          <button
            onClick={() => setIsNdaMasked(!isNdaMasked)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isNdaMasked
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 ring-1 ring-amber-500/20"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
            title="Toggle confidential client and company masking"
          >
            {isNdaMasked ? <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isNdaMasked ? "NDA Shield: ON" : "NDA Shield: OFF"}</span>
          </button>

          <button
            onClick={copyStarPortfolio}
            disabled={displayedItems.length === 0 && filteredRecords.length === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-xs hover:shadow-amber-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Copy ATS-optimized STAR Career Portfolio case studies"
          >
            {isAllCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied Career Portfolio!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Career Portfolio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stale Notification Banner when new logs are added */}
      {displayedItems.length > 0 && isStale && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              New weekly logs detected ({filteredRecords.length} records total). Click <strong>&quot;Update Resume&quot;</strong> to incorporate new project achievements.
            </span>
          </div>
          <button
            onClick={handleSynthesizeWithAi}
            disabled={isSynthesizing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {isSynthesizing ? "Updating..." : "Update Now"}
          </button>
        </div>
      )}

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
                  onClick={() => copySingleItem(item.id, formatSingleStarItem(item))}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy STAR case study bullet"
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

                <div className="p-3.5 rounded-xl bg-rose-50/30 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 space-y-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11px] block">
                    R · Result (Quantifiable XYZ)
                  </span>
                  <p className="text-zinc-900 dark:text-zinc-50 font-semibold leading-relaxed">
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
          <>
            {filteredRecords.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 space-y-3">
                <Briefcase className="w-9 h-9 mx-auto text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No weekly logs found for the selected period
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Log your weekly accomplishments in the Weekly Snippets drawer first, or adjust your year/half filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Synthesis Prompt Banner */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Showing {filteredRecords.length} Individual Weekly Career Stories (STAR Format)
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Below are your recent accomplishments structured into STAR case studies. You can also aggregate them into a {scale}-story executive portfolio anytime.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSynthesizeWithAi}
                    disabled={isSynthesizing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate {scale}-Story Portfolio</span>
                  </button>
                </div>

                {/* Individual Weekly STAR Cards */}
                <div className="space-y-4">
                  {filteredRecords.map((record, idx) => {
                    const isLatest = idx === 0;
                    const dateInfo = getDetailedRecordDateInfo(record);
                    const rawItem: SynthesizedStarItem = {
                      id: record.id,
                      rank: idx + 1,
                      title: record.star_portfolio?.title || "Career Accomplishment Story",
                      period_span: record.target_week?.label || dateInfo.displayLabel,
                      situation: record.star_portfolio?.situation || "",
                      task: record.star_portfolio?.task || "",
                      action: record.star_portfolio?.action || "",
                      result: record.star_portfolio?.result || "",
                      nda_tags: record.star_portfolio?.nda_tags || ["Confidential"],
                    };
                    const item = isNdaMasked ? maskSynthesizedStarItem(rawItem, "en") : rawItem;

                    return (
                      <div
                        key={record.id}
                        className={`bg-white dark:bg-zinc-900 border rounded-2xl shadow-xs transition-all hover:border-amber-500/40 ${
                          isLatest
                            ? "border-amber-500/50 ring-1 ring-amber-500/20"
                            : "border-zinc-200 dark:border-zinc-800"
                        } ${density === "compact" ? "p-4 space-y-3" : "p-5 sm:p-6 space-y-4"}`}
                      >
                        {/* Headline Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="flex items-center justify-center px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-400" />
                                <span>{item.period_span}</span>
                              </span>
                              {isLatest && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                                  <span>🔥</span>
                                  <span>Latest Entry</span>
                                </span>
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug pt-1">
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 no-print">
                            <button
                              onClick={() =>
                                copySingleItem(
                                  record.id,
                                  formatSingleStarItem(item)
                                )
                              }
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Copy STAR Story"
                            >
                              {copiedId === record.id ? (
                                <Check className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* STAR Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                              Situation
                            </span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                              {item.situation}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                              Task
                            </span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                              {item.task}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                              Action
                            </span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                              {item.action}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                              Result
                            </span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                              {item.result}
                            </p>
                          </div>
                        </div>

                        {/* Tags */}
                        {item.nda_tags && item.nda_tags.length > 0 && (
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
