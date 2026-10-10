"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { CareerRecord, JobRole, ToneManner, SynthesizedStarItem } from "@/types/career";
import { maskSynthesizedStarItem } from "@/lib/masking";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { YearRangeFilterEn } from "../YearRangeFilterEn";
import { ViewControlsEn, ViewDensity } from "../ViewControlsEn";
import { SourceNotesAccordionEn } from "../SourceNotesAccordionEn";
import { formatStarPortfolio, formatSingleStarItem } from "@/lib/exportFormatters";
import { filterRecordsByYearRange, getRecordPeriodInfo } from "@/lib/periodUtils";
import {
  buildStarSummaryCacheKey,
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
import { checkSynthesisQuota, CreditStatus } from "@/lib/creditService";
import { getAuthToken } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface StarResumeTabProps {
  records: CareerRecord[];
  creditStatus?: CreditStatus | null;
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
  onUpgradeClick?: () => void;
}

const STAR_LOADING_MESSAGES = [
  "Analyzing multi-week projects...",
  "Framing Situation & Task hurdles...",
  "Distilling Action & Measurable Results...",
  "Finalizing interview-ready case studies...",
];

function StarSynthesizingMessage() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % STAR_LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 animate-in fade-in duration-300">
      <Sparkles className="w-4 h-4 animate-spin text-white shrink-0" />
      <span className="min-w-[250px] text-center">{STAR_LOADING_MESSAGES[msgIdx]}</span>
    </span>
  );
}

export function StarResumeTab({
  records,
  creditStatus,
  jobRole = "engineering",
  toneManner = "impact",
  onToneMannerChange,
  onUpgradeClick,
}: StarResumeTabProps) {
  const { user } = useAuth();
  const userId = user?.uid || "guest";
  const isDemo = Boolean(user?.isDemo);

  // Derive default multi-year range from records (default to past 2-3 years up to latest record year)
  const { defaultStartYear, defaultEndYear } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (records.length === 0) {
      return { defaultStartYear: String(currentYear - 2), defaultEndYear: String(currentYear) };
    }
    const years = records
      .map((r) => parseInt(getRecordPeriodInfo(r).year, 10))
      .filter((y) => !isNaN(y));
    if (years.length === 0) {
      return { defaultStartYear: String(currentYear - 2), defaultEndYear: String(currentYear) };
    }
    const min = Math.min(...years);
    const max = Math.max(...years);
    const start = Math.max(min, max - 2); // Default to up to 3 years
    return { defaultStartYear: String(start), defaultEndYear: String(max) };
  }, [records]);

  // Multi-Year Range Filters (e.g. 2024 ~ 2026 for comprehensive portfolio case studies)
  const [startYear, setStartYear] = useState<string>(defaultStartYear);
  const [endYear, setEndYear] = useState<string>(defaultEndYear);

  // Professional Scope (3 | 5 | 10) & View Density ("detailed" | "compact")
  const [scale, setScale] = useState<3 | 5 | 10>(3);
  const [density, setDensity] = useState<ViewDensity>("detailed");

  // Masking & Action states
  const [isNdaMasked, setIsNdaMasked] = useState(false);
  // Tag filter UI is not exposed; every tag is shown.
  const [selectedTag] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);

  // Cached summary state
  const [storedEntry, setCachedEntry] = useState<SummaryCacheEntry | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Automatically restore settings from the most recently generated AI summary (once per account)
  const [restoredForUserId, setRestoredForUserId] = useState<string | null>(null);
  const hasRestored = restoredForUserId === userId;

  // Synchronize when records load asynchronously and no prior cache restored.
  // Adjusted during render whenever the record count or the default range changes.
  const rangeSyncKey = `${records.length}|${defaultStartYear}|${defaultEndYear}`;
  const [prevRangeSyncKey, setPrevRangeSyncKey] = useState(rangeSyncKey);
  if (prevRangeSyncKey !== rangeSyncKey) {
    setPrevRangeSyncKey(rangeSyncKey);
    if (records.length > 0 && !hasRestored) {
      setStartYear(defaultStartYear);
      setEndYear(defaultEndYear);
    }
  }

  // Reset cached entry when switching accounts
  const [cacheOwnerId, setCacheOwnerId] = useState(userId);
  if (cacheOwnerId !== userId) {
    setCacheOwnerId(userId);
    setCachedEntry(null);
  }

  useEffect(() => {
    if (records.length === 0 || !userId || hasRestored) return;

    const restoreLatestSummary = async () => {
      try {
        const latest = await getLatestSummaryCache(userId, isDemo, "star");
        if (latest && Array.isArray(latest.items) && latest.items.length > 0) {
          setRestoredForUserId(userId);
          if (latest.startYear) setStartYear(latest.startYear);
          else if (latest.year) setStartYear(latest.year);

          if (latest.endYear) setEndYear(latest.endYear);
          else if (latest.year) setEndYear(latest.year);

          if (latest.scope) setScale(latest.scope);
          if (latest.toneManner && onToneMannerChange) {
            onToneMannerChange(latest.toneManner);
          }
          setCachedEntry(latest);
        }
      } catch (err) {
        console.warn("Failed to restore latest star portfolio:", err);
      }
    };

    restoreLatestSummary();
  }, [records.length, userId, isDemo, onToneMannerChange, hasRestored]);

  // 1. Filter raw records by multi-year range (startYear ~ endYear)
  const filteredRecords = useMemo(() => {
    return filterRecordsByYearRange(records, startYear, endYear);
  }, [records, startYear, endYear]);

  const currentRecordIds = useMemo(() => filteredRecords.map((r) => r.id), [filteredRecords]);

  // 2. Deterministic Content-Addressable cache key for STAR multi-year portfolios
  const cacheKey = useMemo(() => {
    return buildStarSummaryCacheKey(
      startYear,
      endYear,
      scale,
      jobRole,
      toneManner,
      currentRecordIds
    );
  }, [startYear, endYear, scale, jobRole, toneManner, currentRecordIds]);

  // 3. Load from cache whenever key changes. State is only set after the await, and a newer
  //    key cancels an older in-flight load so it cannot overwrite the newer result.
  const hasFilteredRecords = filteredRecords.length > 0;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await (hasFilteredRecords ? getSummaryCache(userId, isDemo, cacheKey) : Promise.resolve(null));
      if (cancelled) return;
      // If cached entry is stale or references deleted records, evict it immediately!
      if (cached && !isCacheValid(cached, currentRecordIds)) {
        setCachedEntry(null);
        deleteSummaryCache(userId, isDemo, cacheKey).catch(() => {});
        return;
      }
      setCachedEntry(cached);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isDemo, cacheKey, hasFilteredRecords, currentRecordIds]);

  // Keep cache strictly in sync if currentRecordIds changes (e.g. user deletes or edits records):
  // an entry that no longer matches the current records is treated as absent.
  const cachedEntry = storedEntry && isCacheValid(storedEntry, currentRecordIds) ? storedEntry : null;

  // 4. Stale check: has any record been added or deleted since this summary was cached?
  const isStale = useMemo(() => {
    return isSummaryStale(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  const isValid = useMemo(() => {
    return isCacheValid(cachedEntry, currentRecordIds);
  }, [cachedEntry, currentRecordIds]);

  const needsGeneration = !cachedEntry || !isValid || isStale;
  // With a single weekly note, a combined portfolio adds little; keep Generate secondary so new
  // users don't spend a free synthesis on one note.
  const isSingleRecord = records.length === 1 && filteredRecords.length === 1;

  // 5. Trigger AI Synthesis on-demand
  const handleSynthesizeWithAi = async () => {
    if (filteredRecords.length === 0) {
      alert("No weekly logs found in the selected year range. Please choose a range with logs or add a new weekly memo first.");
      return;
    }

    // 1. Anti-spam cooldown check (bypassed for admin)
    const cooldown = checkSynthesisCooldown(userId, user?.email);
    if (cooldown.inCooldown) {
      alert(`⏳ Please wait ${cooldown.remainingSeconds}s before requesting AI synthesis again.`);
      return;
    }

    // 2. Synthesis quota check (3 free for STAR, unlimited for Pro)
    const quota = await checkSynthesisQuota(userId, "star", isDemo, user?.email);
    if (!quota.allowed) {
      if (onUpgradeClick) {
        onUpgradeClick();
      } else {
        alert("⚠️ You have used all 3 free STAR portfolio syntheses.\n\nPlease upgrade to Pro ($5.99/mo) for unlimited case studies!");
      }
      return;
    }

    setIsSynthesizing(true);
    recordSynthesisCooldown(userId, user?.email);
    try {
      const periodLabel = startYear === endYear ? `${startYear}` : `${startYear} – ${endYear}`;

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
          type: "star",
          scope: scale,
          jobRole,
          toneManner,
          periodLabel,
          records: filteredRecords,
          cache_key: cacheKey,
          start_year: startYear,
          end_year: endYear,
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
      const items: SynthesizedStarItem[] = data.items || [];

      // Server already atomically persisted entry into Firestore summary_cache!
      const newEntry: SummaryCacheEntry = data.entry || {
        cacheKey,
        type: "star",
        year: endYear,
        startYear,
        endYear,
        half: "ALL",
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

      // Only demo mode writes to local storage fallback
      if (isDemo) {
        await saveSummaryCache(userId, true, newEntry);
      }

      setCachedEntry(newEntry);
    } catch (err: unknown) {
      console.error("AI STAR Synthesis error:", err);
      const message = err instanceof Error ? err.message : "Failed to synthesize STAR portfolio. Please check your network or try again.";
      alert(`⚠️ ${message}`);
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
    if (displayedItems.length === 0) return;
    const text = formatStarPortfolio(displayedItems, activeJobRole);
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
        
        {/* Multi-Year Portfolio Range Filter */}
        <YearRangeFilterEn
          records={records}
          startYear={startYear}
          endYear={endYear}
          onStartYearChange={setStartYear}
          onEndYearChange={setEndYear}
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
                isSingleRecord
                  ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-none cursor-pointer"
                  : filteredRecords.length > 0
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 ring-2 ring-amber-500/30 animate-pulse cursor-pointer"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {isSynthesizing ? (
                <StarSynthesizingMessage />
              ) : (
                <>
                  <Sparkles className={`w-4 h-4 ${isSingleRecord ? "text-amber-500" : "text-white"}`} />
                  <span>
                    {filteredRecords.length === 0
                      ? "No Weekly Logs in this Period"
                      : isStale
                      ? `Update Portfolio (${filteredRecords.length} Logs)`
                      : `Generate Career Portfolio (${filteredRecords.length} Logs)`}
                  </span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 shadow-xs select-none">
              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Portfolio Up to Date (Saved in DB)</span>
            </div>
          )}

          {/* Quota Badge (Pre-flight transparency) */}
          {creditStatus && (
            creditStatus.isPro || creditStatus.isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                <span>Pro Unlimited Case Studies</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={creditStatus.remainingStarCredits === 0 ? onUpgradeClick : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all ${
                  creditStatus.remainingStarCredits > 0
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70"
                    : "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/70 hover:border-orange-400 cursor-pointer active:scale-95 animate-pulse"
                }`}
                title={
                  creditStatus.remainingStarCredits > 0
                    ? `${creditStatus.remainingStarCredits} of ${creditStatus.maxStarCredits} free case studies remaining.`
                    : "Free case studies exhausted. Click to upgrade to Pro ($5.99/mo)."
                }
              >
                <Sparkles className={`w-3.5 h-3.5 ${creditStatus.remainingStarCredits > 0 ? "text-amber-500" : "text-orange-500 fill-orange-500"}`} />
                <span>
                  {creditStatus.remainingStarCredits > 0
                    ? `${creditStatus.remainingStarCredits} of ${creditStatus.maxStarCredits} Free Case Studies Left`
                    : "0 of 3 Left · Upgrade to Pro"}
                </span>
              </button>
            )
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
            disabled={displayedItems.length === 0}
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
              New weekly logs detected ({filteredRecords.length} records total). Click <strong>&quot;Update Portfolio&quot;</strong> to incorporate new project achievements.
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

            {/* Source Friday Notes & Context Accordion */}
            <SourceNotesAccordionEn
              sourceRecords={item.source_records}
              fallbackRecords={filteredRecords}
              fallbackIndex={idx}
              appliedRole={jobRole}
              appliedTone={toneManner}
              accentColor="amber"
            />
          </div>
        ))}

        {displayedItems.length === 0 && (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 space-y-4">
            {filteredRecords.length === 0 ? (
              <>
                <Briefcase className="w-9 h-9 mx-auto text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No weekly logs found for the selected period
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Log your weekly accomplishments in the Weekly Snippets drawer first, or adjust your year/half filters.
                </p>
              </>
            ) : isSingleRecord ? (
              <div className="space-y-4 text-left max-w-xl mx-auto">
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    From your first note
                  </span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {records[0].star_portfolio?.title}
                  </p>
                  <dl className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {(["situation", "task", "action", "result"] as const).map((key) => (
                      <div key={key} className="flex gap-2">
                        <dt className="font-bold text-amber-700 dark:text-amber-400 w-4 shrink-0">{key[0].toUpperCase()}</dt>
                        <dd>{records[0].star_portfolio?.[key]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                  Add a few more weekly notes, then generate a combined portfolio.
                </p>
                <div className="text-center">
                  <button
                    onClick={handleSynthesizeWithAi}
                    disabled={isSynthesizing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <StarSynthesizingMessage />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate from 1 note anyway</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="flex items-center justify-center flex-wrap gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                      {startYear === endYear ? startYear : `${startYear} ~ ${endYear}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-bold">{scale} Stories</span>
                    <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300">{toneManner}</span>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    No Career Portfolio Generated Yet for this Selection
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ready to aggregate {filteredRecords.length} weekly accomplishment notes into {scale} polished STAR resume case studies.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSynthesizeWithAi}
                    disabled={isSynthesizing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSynthesizing ? (
                      <StarSynthesizingMessage />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate AI STAR Case Studies ({filteredRecords.length} Logs)</span>
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
