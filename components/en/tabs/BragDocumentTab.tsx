"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Award,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  Share2,
  Printer,
  Sparkles,
} from "lucide-react";
import { CareerRecord, JobRole, ToneManner, SynthesizedBragItem } from "@/types/career";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { PeriodFilterEn } from "../PeriodFilterEn";
import { ViewControlsEn, ViewDensity } from "../ViewControlsEn";
import { formatNotionMarkdownBrag } from "@/lib/exportFormatters";
import { filterRecordsByPeriod } from "@/lib/periodUtils";
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

interface BragDocumentTabProps {
  records: CareerRecord[];
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export function BragDocumentTab({
  records,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: BragDocumentTabProps) {
  const { user } = useAuth();
  const userId = user?.uid || "guest";
  const isDemo = Boolean(user?.isDemo);

  // Period Filters (Year / Half / Quarter)
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedHalf, setSelectedHalf] = useState<string>("ALL");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("ALL");

  // Professional Scope (3 | 5 | 10) & Density ("detailed" | "compact")
  const [scale, setScale] = useState<3 | 5 | 10>(5);
  const [density, setDensity] = useState<ViewDensity>("detailed");

  // Cached summary state
  const [cachedEntry, setCachedEntry] = useState<SummaryCacheEntry | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Action states
  const [isCopied, setIsCopied] = useState(false);
  const [isNotionCopied, setIsNotionCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkedInCopiedId, setLinkedInCopiedId] = useState<string | null>(null);

  // 1. Filter raw records by dropdown periods
  const filteredRecords = useMemo(() => {
    return filterRecordsByPeriod(records, selectedYear, selectedHalf, selectedQuarter);
  }, [records, selectedYear, selectedHalf, selectedQuarter]);

  const currentRecordIds = useMemo(() => filteredRecords.map((r) => r.id), [filteredRecords]);

  // 2. Deterministic Content-Addressable cache key strictly bound to current record IDs
  const cacheKey = useMemo(() => {
    return buildSummaryCacheKey(
      "brag",
      selectedYear,
      selectedHalf,
      selectedQuarter,
      scale,
      jobRole,
      toneManner,
      currentRecordIds
    );
  }, [selectedYear, selectedHalf, selectedQuarter, scale, jobRole, toneManner, currentRecordIds]);

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

  // 4. Stale check: has any weekly record been added or deleted since this summary was cached?
  const isStale = useMemo(() => {
    return isSummaryStale(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  const isValid = useMemo(() => {
    return isCacheValid(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  const needsGeneration = !cachedEntry || !isValid || isStale;

  // 5. Trigger AI Synthesis on-demand (costs 1 API call, then cached permanently)
  const handleSynthesizeWithAi = async () => {
    if (filteredRecords.length === 0) return;

    // 1. Anti-spam cooldown check (10s)
    const cooldown = checkSynthesisCooldown(userId);
    if (cooldown.inCooldown) {
      alert(`⏳ Please wait ${cooldown.remainingSeconds}s before requesting AI synthesis again.`);
      return;
    }

    // 2. Daily synthesis quota check (max 5 per day)
    const dailyLimit = checkDailySynthesisLimit(userId);
    if (!dailyLimit.allowed) {
      alert(
        `⚠️ Daily AI synthesis limit reached (${dailyLimit.usedCount}/${dailyLimit.maxLimit}).\n\nPlease try again tomorrow or continue using your cached summaries.`
      );
      return;
    }

    setIsSynthesizing(true);
    recordSynthesisCooldown(userId);
    try {
      const periodLabel = `${selectedYear} ${selectedHalf !== "ALL" ? selectedHalf : ""} ${
        selectedQuarter !== "ALL" ? selectedQuarter : ""
      }`.trim();

      const res = await fetch("/api/synthesize/en", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "brag",
          scope: scale,
          jobRole,
          toneManner,
          periodLabel,
          records: filteredRecords,
        }),
      });

      if (!res.ok) throw new Error("AI Synthesis request failed");
      const data = await res.json();
      const items: SynthesizedBragItem[] = data.items || [];

      // Record daily usage on success
      recordDailySynthesisUsage(userId);

      // Save into cache
      const newEntry: SummaryCacheEntry = {
        cacheKey,
        type: "brag",
        year: selectedYear,
        half: selectedHalf,
        quarter: selectedQuarter,
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
      console.error("AI Synthesis error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 6. Active items to display: Only show actual cached AI items if strictly valid and filteredRecords not empty
  const displayedItems = useMemo<SynthesizedBragItem[]>(() => {
    if (filteredRecords.length === 0) return [];
    if (
      isValid &&
      cachedEntry &&
      Array.isArray(cachedEntry.items) &&
      cachedEntry.items.length > 0
    ) {
      return cachedEntry.items as SynthesizedBragItem[];
    }
    return [];
  }, [filteredRecords.length, isValid, cachedEntry]);

  const activeJobRole = cachedEntry ? cachedEntry.jobRole : jobRole;

  const copyAllMarkdown = async () => {
    const text = `# Brag Document · Performance Review Summary
Role Persona: ${activeJobRole.toUpperCase()} | Tone: ${toneManner.toUpperCase()}
Generated on: ${new Date().toLocaleDateString("en-US")}

${displayedItems
  .map(
    (item, idx) => `### ${idx + 1}. ${item.metric_summary}
- **Quarter Span**: ${item.quarter_span}
- **Business Value & Scope**: ${item.business_impact}
- **Key Highlights**: ${item.key_highlights.join("; ")}
`
  )
  .join("\n\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copyNotionMarkdown = async () => {
    const text = formatNotionMarkdownBrag(displayedItems, activeJobRole, `${selectedYear} ${selectedQuarter}`);
    try {
      await navigator.clipboard.writeText(text);
      setIsNotionCopied(true);
      setTimeout(() => setIsNotionCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copySingleItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyLinkedInSnippet = async (item: SynthesizedBragItem) => {
    const text = `🏆 Proud of what our team shipped during ${item.quarter_span}:

"${item.metric_summary}"

📌 Strategic Impact:
${item.business_impact}

Key milestones:
${item.key_highlights.map((h) => `• ${h}`).join("\n")}

#CareerWins #EngineeringLeadership #BuildingInPublic #Impact`;

    try {
      await navigator.clipboard.writeText(text);
      setLinkedInCopiedId(item.id);
      setTimeout(() => setLinkedInCopiedId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCSV = () => {
    const headers = ["Quarter Span", "Metric Summary", "Business Impact", "Key Highlights"];
    const rows = displayedItems.map((item) => [
      `"${item.quarter_span}"`,
      `"${item.metric_summary.replace(/"/g, '""')}"`,
      `"${item.business_impact.replace(/"/g, '""')}"`,
      `"${item.key_highlights.join(" | ").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brag_document_${activeJobRole}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Banner (Title Only) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
              Drawer 2: Brag Document (Performance Reviews & Comp Negotiations)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
              Mid-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Synthesizes your weekly brain dumps into XYZ impact achievements with smart on-demand AI caching.
          </p>
        </div>
      </div>

      {/* 1. Period Dropdown Filters (Data Source Selection) */}
      <div className="no-print">
        <PeriodFilterEn
          records={records}
          selectedYear={selectedYear}
          selectedHalf={selectedHalf}
          selectedQuarter={selectedQuarter}
          onYearChange={setSelectedYear}
          onHalfChange={setSelectedHalf}
          onQuarterChange={setSelectedQuarter}
          showQuarter={true}
          filteredCount={filteredRecords.length}
        />
      </div>

      {/* 2. Persona & Narrative Tone Selector (Synthesis Shaping) */}
      <div className="no-print">
        <PersonaSelectorEn
          currentRole={jobRole}
          currentTone={toneManner}
          onRoleChange={(r) => onJobRoleChange?.(r)}
          onToneChange={(t) => onToneMannerChange?.(t)}
        />
      </div>

      {/* 3. Scope & Density View Controls (Generation & Display) */}
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
          accentColor="emerald"
        />
      </div>

      {/* 4. Synthesis Action & Export Toolbar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 no-print">
        {/* Synthesize Button */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={handleSynthesizeWithAi}
            disabled={isSynthesizing || filteredRecords.length === 0}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
              needsGeneration && filteredRecords.length > 0
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30 animate-pulse"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSynthesizing ? (
              <Sparkles className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className={`w-4 h-4 ${needsGeneration && filteredRecords.length > 0 ? "text-white" : "text-emerald-500"}`} />
            )}
            <span>
              {isSynthesizing
                ? "Synthesizing AI Summary..."
                : filteredRecords.length === 0
                ? "No Weekly Logs in this Period"
                : !cachedEntry
                ? `Generate Brag Summary (${filteredRecords.length} Logs)`
                : isStale
                ? `Update Summary (${filteredRecords.length} Logs)`
                : "Re-Generate Summary"}
            </span>
          </button>
          
          {!needsGeneration && cachedEntry && (
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
              ✓ Up to date (Cached)
            </span>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1 hidden sm:inline-block">Export Options:</span>
          <button
            onClick={copyNotionMarkdown}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Copy optimized Markdown with callouts and checklists for Notion"
          >
            {isNotionCopied ? (
              <><Check className="w-3.5 h-3.5 text-emerald-500" /><span>Copied for Notion!</span></>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /><span>Notion Format</span></>
            )}
          </button>
          <button
            onClick={copyAllMarkdown}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
          >
            {isCopied ? (
              <><Check className="w-3.5 h-3.5 text-white" /><span>Copied All!</span></>
            ) : (
              <><Copy className="w-3.5 h-3.5" /><span>Copy Markdown</span></>
            )}
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /><span>CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" /><span>Print</span>
          </button>
        </div>
      </div>

      {/* Stale Notification Banner when new logs are added */}
      {displayedItems.length > 0 && isStale && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              New weekly logs detected ({filteredRecords.length} records total). Click <strong>&quot;Update Summary&quot;</strong> to refresh with the latest accomplishments.
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

      {/* Synthesized Brag Cards List */}
      <div className="space-y-3.5">
        {displayedItems.map((item, idx) => (
          <div
            key={item.id || idx}
            className={`print-page-break bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs transition-all hover:border-emerald-500/40 ${
              density === "compact" ? "p-4 space-y-2.5" : "p-5 sm:p-6 space-y-3.5"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  #{idx + 1}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {item.quarter_span}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {item.key_highlights.length} Milestones
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 no-print">
                <button
                  onClick={() => copyLinkedInSnippet(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors cursor-pointer"
                  title="Copy achievement for LinkedIn post"
                >
                  {linkedInCopiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>LinkedIn</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    copySingleItem(item.id, `• ${item.metric_summary}\n  - ${item.business_impact}`)
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy achievement bullet"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Metric Summary (XYZ Impact Formula) */}
            <div className="space-y-1">
              {density === "detailed" && (
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>XYZ Metric Punch</span>
                </div>
              )}
              <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                {item.metric_summary}
              </h3>
            </div>

            {/* Strategic Value & Impact (Hidden or concise in compact mode) */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-100 dark:border-zinc-800/80 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1.5">
                Strategic Impact:
              </span>
              {item.business_impact}
            </div>

            {/* Milestones list (Detailed mode only) */}
            {density === "detailed" && item.key_highlights.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Key Milestones:
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {item.key_highlights.map((h, hIdx) => (
                    <li key={hIdx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {displayedItems.length === 0 && (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 space-y-3">
            {filteredRecords.length === 0 ? (
              <>
                <FileSpreadsheet className="w-9 h-9 mx-auto text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No weekly logs found for the selected period
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Log your weekly accomplishments in the Weekly Snippets drawer first, or adjust your year/quarter filters.
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Ready to Synthesize {filteredRecords.length} Weekly Accomplishments
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                    Transform your raw weekly notes into {scale} executive-level XYZ-format metric achievements for your {jobRole} performance review.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSynthesizeWithAi}
                    disabled={isSynthesizing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Brag Summary Now</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
