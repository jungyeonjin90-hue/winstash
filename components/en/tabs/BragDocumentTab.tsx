"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Award,
  Copy,
  Check,
  FileSpreadsheet,
  Sparkles,
  Clock,
  Calendar,
} from "lucide-react";
import { CareerRecord, JobRole, ToneManner, SynthesizedBragItem } from "@/types/career";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { PeriodFilterEn } from "../PeriodFilterEn";
import { ViewControlsEn, ViewDensity } from "../ViewControlsEn";
import { formatBragSheet } from "@/lib/exportFormatters";
import { filterRecordsByPeriod, getDetailedRecordDateInfo, getRecordPeriodInfo } from "@/lib/periodUtils";
import {
  buildSummaryCacheKey,
  getSummaryCache,
  getLatestSummaryCache,
  saveSummaryCache,
  isSummaryStale,
  isCacheValid,
  deleteSummaryCache,
  SummaryCacheEntry,
} from "@/lib/summaryCacheService";
import {
  checkSynthesisCooldown,
  recordSynthesisCooldown,
} from "@/lib/rateLimitService";
import { checkSynthesisQuota, consumeSynthesisQuota, CreditStatus } from "@/lib/creditService";
import { getAuthToken } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface BragDocumentTabProps {
  records: CareerRecord[];
  creditStatus?: CreditStatus | null;
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
  onUpgradeClick?: () => void;
}

const BRAG_LOADING_MESSAGES = [
  "Aggregating weekly logs...",
  "Calculating quantified business impact...",
  "Structuring executive brag bullets...",
  "Almost done! Polishing achievements...",
];

function BragSynthesizingMessage() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % BRAG_LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 animate-in fade-in duration-300">
      <Sparkles className="w-4 h-4 animate-spin text-white shrink-0" />
      <span className="min-w-[240px] text-center">{BRAG_LOADING_MESSAGES[msgIdx]}</span>
    </span>
  );
}

export function BragDocumentTab({
  records,
  creditStatus,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
  onUpgradeClick,
}: BragDocumentTabProps) {
  const { user } = useAuth();
  const userId = user?.uid || "guest";
  const isDemo = Boolean(user?.isDemo);

  // Derive latest record year or fallback to current calendar year
  const latestRecordYear = useMemo(() => {
    if (records.length > 0) {
      const years = records
        .map((r) => parseInt(getDetailedRecordDateInfo(r).year, 10))
        .filter((y) => !isNaN(y));
      if (years.length > 0) {
        return String(Math.max(...years));
      }
      return getDetailedRecordDateInfo(records[0]).year;
    }
    return String(new Date().getFullYear());
  }, [records]);

  // Period Filters (Year / Half / Quarter)
  const [selectedYear, setSelectedYear] = useState<string>(latestRecordYear);
  const [selectedHalf, setSelectedHalf] = useState<string>("ALL");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("ALL");

  // Keep selectedYear synchronized when records load asynchronously
  useEffect(() => {
    if (records.length > 0) {
      const availableYears = new Set(records.map((r) => getDetailedRecordDateInfo(r).year));
      if (!availableYears.has(selectedYear)) {
        setSelectedYear(latestRecordYear);
      }
    }
  }, [records, latestRecordYear, selectedYear]);

  // Automatically restore settings from the most recently generated AI summary
  const hasRestoredRef = useRef(false);

  // Reset cached entry when switching accounts
  useEffect(() => {
    hasRestoredRef.current = false;
    setCachedEntry(null);
  }, [userId]);

  useEffect(() => {
    if (records.length === 0 || !userId || hasRestoredRef.current) return;

    const restoreLatestSummary = async () => {
      try {
        const latest = await getLatestSummaryCache(userId, isDemo, "brag");
        if (latest && Array.isArray(latest.items) && latest.items.length > 0) {
          hasRestoredRef.current = true;
          if (latest.year) setSelectedYear(latest.year);
          if (latest.half) setSelectedHalf(latest.half);
          if (latest.quarter) setSelectedQuarter(latest.quarter);
          if (latest.scope) setScale(latest.scope);
          if (latest.toneManner && onToneMannerChange) {
            onToneMannerChange(latest.toneManner);
          }
          setCachedEntry(latest);
        }
      } catch (err) {
        console.warn("Failed to restore latest brag summary:", err);
      }
    };

    restoreLatestSummary();
  }, [records.length, userId, isDemo, onToneMannerChange]);

  // Professional Scope (3 | 5 | 10) & Density ("detailed" | "compact")
  const [scale, setScale] = useState<3 | 5 | 10>(5);
  const [density, setDensity] = useState<ViewDensity>("detailed");

  // Cached summary state
  const [cachedEntry, setCachedEntry] = useState<SummaryCacheEntry | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Action states
  const [isCopied, setIsCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (filteredRecords.length === 0) {
      alert("No weekly logs found in the selected period. Please choose a period with logs or add a new weekly memo first.");
      return;
    }

    // 1. Anti-spam cooldown check (bypassed for admin)
    const cooldown = checkSynthesisCooldown(userId, user?.email);
    if (cooldown.inCooldown) {
      alert(`⏳ Please wait ${cooldown.remainingSeconds}s before requesting AI synthesis again.`);
      return;
    }

    // 2. Synthesis quota check (3 free for Brag, unlimited for Pro)
    const quota = await checkSynthesisQuota(userId, "brag", isDemo, user?.email);
    if (!quota.allowed) {
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        alert("⚠️ You have used all 3 free Brag Sheet syntheses.\n\nPlease upgrade to Pro ($5.99/mo) for unlimited reviews!");
      }
      return;
    }

    setIsSynthesizing(true);
    recordSynthesisCooldown(userId, user?.email);
    try {
      const periodLabel = `${selectedYear} ${selectedHalf !== "ALL" ? selectedHalf : ""} ${
        selectedQuarter !== "ALL" ? selectedQuarter : ""
      }`.trim();

      const token = await getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (isDemo) headers["x-demo-user"] = "true";

      const res = await fetch("/api/synthesize/en", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "brag",
          scope: scale,
          jobRole,
          toneManner,
          periodLabel,
          records: filteredRecords,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 403) {
          if (onUpgradeClick) onUpgradeClick();
          else alert(errJson.error || "Synthesis quota limit reached.");
          return;
        }
        throw new Error(errJson.error || "AI Synthesis request failed");
      }
      const data = await res.json();
      const items: SynthesizedBragItem[] = data.items || [];

      // Record quota on success
      await consumeSynthesisQuota(userId, "brag", isDemo, user?.email);

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
    } catch (err: unknown) {
      console.error("AI Synthesis error:", err);
      const message = err instanceof Error ? err.message : "Failed to synthesize accomplishments. Please check your network or try again.";
      alert(`⚠️ ${message}`);
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

  const copyBragSheet = async () => {
    const periodSpan = `${selectedYear} ${selectedHalf !== "ALL" ? selectedHalf : ""} ${
      selectedQuarter !== "ALL" ? selectedQuarter : ""
    }`.trim();
    if (displayedItems.length === 0) return;
    const text = formatBragSheet(displayedItems, activeJobRole, periodSpan);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copySingleItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(`${text}\n\n---\n⚡ Synthesized with WinStash 3-Way Career OS`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Banner (Title Only) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
              Drawer 2: Performance Review (Brag Sheet · Comp Negotiations)
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

      {/* 2. Narrative Tone Selector (Synthesis Shaping) */}
      <div className="no-print">
        <PersonaSelectorEn
          currentRole={jobRole}
          currentTone={toneManner}
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
        {/* Synthesize Button with 3-State Logic (Generate / Update / Up to Date) */}
        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {needsGeneration ? (
            <button
              onClick={handleSynthesizeWithAi}
              disabled={isSynthesizing || filteredRecords.length === 0}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
                filteredRecords.length > 0
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30 animate-pulse cursor-pointer"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {isSynthesizing ? (
                <BragSynthesizingMessage />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>
                    {filteredRecords.length === 0
                      ? "No Weekly Logs in this Period"
                      : isStale
                      ? `Update Summary (${filteredRecords.length} Logs)`
                      : `Generate Brag Summary (${filteredRecords.length} Logs)`}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs select-none">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Summary Up to Date (Saved in DB)</span>
            </div>
          )}

          {/* Quota Badge (Pre-flight transparency) */}
          {creditStatus && (
            creditStatus.isPro || creditStatus.isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                <span>Pro Unlimited Reviews</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={creditStatus.remainingBragCredits === 0 ? onUpgradeClick : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all ${
                  creditStatus.remainingBragCredits > 0
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70"
                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70 hover:border-amber-400 cursor-pointer active:scale-95 animate-pulse"
                }`}
                title={
                  creditStatus.remainingBragCredits > 0
                    ? `${creditStatus.remainingBragCredits} of ${creditStatus.maxBragCredits} free reviews remaining.`
                    : "Free reviews exhausted. Click to upgrade to Pro ($5.99/mo)."
                }
              >
                <Sparkles className={`w-3.5 h-3.5 ${creditStatus.remainingBragCredits > 0 ? "text-emerald-500" : "text-amber-500 fill-amber-500"}`} />
                <span>
                  {creditStatus.remainingBragCredits > 0
                    ? `${creditStatus.remainingBragCredits} of ${creditStatus.maxBragCredits} Free Reviews Left`
                    : "0 of 3 Left · Upgrade to Pro"}
                </span>
              </button>
            )
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-zinc-100 dark:border-zinc-800">
          <button
            onClick={copyBragSheet}
            disabled={displayedItems.length === 0}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs hover:shadow-emerald-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Copy Golden Standard Performance Review (Notion / Confluence / Docs compatible)"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied Review!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Performance Review</span>
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
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 space-y-4">
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="flex items-center justify-center flex-wrap gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">{selectedYear}</span>
                    {selectedQuarter !== "ALL" ? (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">{selectedQuarter}</span>
                    ) : selectedHalf !== "ALL" ? (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">{selectedHalf}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">Full Year</span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold">{scale} Items</span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300">{toneManner}</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    No Performance Review Generated Yet for this Selection
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ready to synthesize {filteredRecords.length} weekly check-in logs into executive-level XYZ metric achievements.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSynthesizeWithAi}
                    disabled={isSynthesizing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <BragSynthesizingMessage />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate AI Brag Summary ({filteredRecords.length} Logs)</span>
                      </>
                    )}
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
