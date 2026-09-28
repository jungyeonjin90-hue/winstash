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
import { synthesizeBragItems } from "@/lib/synthesizer";
import { formatNotionMarkdownBrag } from "@/lib/exportFormatters";
import { filterRecordsByPeriod } from "@/lib/periodUtils";
import {
  buildSummaryCacheKey,
  getSummaryCache,
  saveSummaryCache,
  isSummaryStale,
  SummaryCacheEntry,
} from "@/lib/summaryCacheService";
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

  // 2. Deterministic cache key including Persona & Tone
  const cacheKey = useMemo(() => {
    return buildSummaryCacheKey(
      "brag",
      selectedYear,
      selectedHalf,
      selectedQuarter,
      scale,
      jobRole,
      toneManner
    );
  }, [selectedYear, selectedHalf, selectedQuarter, scale, jobRole, toneManner]);

  // 3. Load from cache whenever key changes
  const loadCache = useCallback(async () => {
    const cached = await getSummaryCache(userId, isDemo, cacheKey);
    setCachedEntry(cached);
  }, [userId, isDemo, cacheKey]);

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  // 4. Stale check: has any new weekly record been added since this summary was cached?
  const isStale = useMemo(() => {
    return isSummaryStale(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  // 5. Trigger AI Synthesis on-demand (costs 1 API call, then cached permanently)
  const handleSynthesizeWithAi = async () => {
    if (filteredRecords.length === 0) return;
    setIsSynthesizing(true);
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

  // 6. Active items to display: Cache items if present; otherwise instant local synthesizer items
  const displayedItems = useMemo<SynthesizedBragItem[]>(() => {
    if (cachedEntry && Array.isArray(cachedEntry.items) && cachedEntry.items.length > 0) {
      return cachedEntry.items as SynthesizedBragItem[];
    }
    // High-performance instantaneous local synthesis while cache is empty (0 API cost)
    return synthesizeBragItems(filteredRecords, scale, jobRole, toneManner);
  }, [cachedEntry, filteredRecords, scale, jobRole, toneManner]);

  const copyAllMarkdown = async () => {
    const text = `# Brag Document · Performance Review Summary
Role Persona: ${jobRole.toUpperCase()} | Tone: ${toneManner.toUpperCase()}
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
    const text = formatNotionMarkdownBrag(displayedItems, jobRole, `${selectedYear} ${selectedQuarter}`);
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
    link.download = `brag_document_${jobRole}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Export Actions */}
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
            Synthesizes your weekly brain dumps into Google XYZ achievements with smart on-demand AI caching.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Notion Markdown Copy */}
          <button
            onClick={copyNotionMarkdown}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Copy optimized Markdown with callouts and checklists for Notion"
          >
            {isNotionCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied for Notion!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Notion Format</span>
              </>
            )}
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Print or Save as Clean PDF"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Print</span>
          </button>

          {/* Standard Markdown Copy */}
          <button
            onClick={copyAllMarkdown}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          {/* CSV Export */}
          <button
            onClick={downloadCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
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

      {/* 1. Period Dropdown Filters (Year / Half / Quarter) */}
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
          accentColor="emerald"
        />
      </div>

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

            {/* Metric Summary (Google XYZ Formula) */}
            <div className="space-y-1">
              {density === "detailed" && (
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Google XYZ Metric Punch</span>
                </div>
              )}
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
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
                <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
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
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            No achievements logged for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
