"use client";

import { useState, useEffect } from "react";
import { useHasPriorSession } from "@/hooks/useHasPriorSession";
import Link from "next/link";
import { HeaderEn } from "@/components/en/HeaderEn";
import { QuickLoggerEn } from "@/components/en/QuickLoggerEn";
import { DashboardTabsEn } from "@/components/en/DashboardTabsEn";
import { SettingsModalEn } from "@/components/en/SettingsModalEn";
import { FeedbackModalEn } from "@/components/en/FeedbackModalEn";
import { OnboardingModalEn } from "@/components/en/OnboardingModalEn";
import { LandingPageEn } from "@/components/en/LandingPageEn";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeUserRecords,
  saveUserRecordToFirestore,
  deleteUserRecordFromFirestore,
  saveUserPersonaToFirestore,
  saveLocalUserRecords,
} from "@/lib/firestoreService";
import { clearUserSummaryCache, purgeLegacySummaryCaches } from "@/lib/summaryCacheService";
import { getSettings, saveSettings } from "@/lib/storage";
import { CreditStatus, subscribeCreditStatus, consumeFreeCredit } from "@/lib/creditService";
import { isAdminEmail } from "@/lib/adminConfig";
import { getAuthToken } from "@/lib/firebase";
import { CareerRecord, TransformationOutput, JobRole, ToneManner, WeekSpan, SeniorityLevel, RegionCode } from "@/types/career";
import { trackEvent } from "@/lib/analytics";
import { Sparkles, Layers, Loader2 } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { UpdateConfirmModalEn } from "@/components/en/UpdateConfirmModalEn";
import { CareerHeatmapEn } from "@/components/en/CareerHeatmapEn";

interface PendingUpdateParams {
  rawMemo: string;
  targetWeek?: WeekSpan;
  role: JobRole;
  tone: ToneManner;
  existingRecordId: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [activeRecordId, setActiveRecordId] = useState<string | undefined>(undefined);
  const [selectedWeek, setSelectedWeek] = useState<WeekSpan | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTriggerReason, setUpgradeTriggerReason] = useState<"input" | "edit" | "brag" | "star" | "header">("header");
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdateParams | null>(null);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [jobRole, setJobRole] = useState<JobRole>("engineering");
  const [toneManner, setToneManner] = useState<ToneManner>("impact");
  const [seniorityLevel, setSeniorityLevel] = useState<SeniorityLevel | undefined>(undefined);
  const [industry, setIndustry] = useState<string | undefined>(undefined);
  const [region, setRegion] = useState<RegionCode | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasPriorSession = useHasPriorSession();

  // Modal handlers with browser history support (Back button closes modal instead of leaving site)
  const openSettingsModal = () => {
    setIsSettingsOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "settings" }, "");
    }
  };

  const closeSettingsModal = () => {
    setIsSettingsOpen(false);
    if (typeof window !== "undefined" && window.history.state?.modal === "settings") {
      window.history.back();
    }
  };

  const openFeedbackModal = () => {
    setIsFeedbackOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "feedback" }, "");
    }
  };

  const closeFeedbackModal = () => {
    setIsFeedbackOpen(false);
    if (typeof window !== "undefined" && window.history.state?.modal === "feedback") {
      window.history.back();
    }
  };

  const openUpgradeModal = (reason: "input" | "edit" | "brag" | "star" | "header" = "header") => {
    setUpgradeTriggerReason(reason);
    setIsUpgradeModalOpen(true);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "upgrade" }, "");
    }
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    if (typeof window !== "undefined" && window.history.state?.modal === "upgrade") {
      window.history.back();
    }
  };

  const openConfirmUpdateModal = (params: PendingUpdateParams) => {
    setPendingUpdate(params);
    if (typeof window !== "undefined") {
      window.history.pushState({ modal: "updateConfirm" }, "");
    }
  };

  const closeConfirmUpdateModal = () => {
    setPendingUpdate(null);
    if (typeof window !== "undefined" && window.history.state?.modal === "updateConfirm") {
      window.history.back();
    }
  };

  // Close open modals when browser Back button is pressed
  useEffect(() => {
    const handlePopState = () => {
      setIsSettingsOpen(false);
      setIsFeedbackOpen(false);
      setIsUpgradeModalOpen(false);
      setPendingUpdate(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Reset per-user state whenever the signed-in user changes. Done during render (keyed on the same
  // `user` object the subscription effect below depends on) so no frame shows the previous user's data.
  const [stateOwner, setStateOwner] = useState<typeof user | undefined>(undefined);
  if (stateOwner !== user) {
    setStateOwner(user);
    if (!user) {
      // User is logged out: Immediately wipe all state to ensure zero cross-account data retention
      setRecords([]);
      setActiveRecordId(undefined);
      setPendingUpdate(null);
      setIsClientLoaded(false);
      setShowOnboarding(false);
      setCreditStatus(null);
      setJobRole("engineering");
      setToneManner("impact");
      setSeniorityLevel(undefined);
      setIndustry(undefined);
      setRegion(undefined);
    } else {
      // User is logged in: First reset state to prevent brief flash of prior user's state
      setRecords([]);
      setIsClientLoaded(false);
      setShowOnboarding(false);

      // Read user-scoped settings if available, else clean defaults
      const userSettings = getSettings(user.uid);
      setJobRole(userSettings.jobRole || "engineering");
      setToneManner(userSettings.toneManner || "impact");
      setSeniorityLevel(userSettings.seniorityLevel);
      setIndustry(userSettings.industry);
      setRegion(userSettings.region);
    }
  }

  // Subscribe to user records & credit status, load persona
  useEffect(() => {
    if (!user) return;

    // Purge legacy unkeyed caches immediately to prevent ghost summaries
    purgeLegacySummaryCaches();

    const loadPersona = async () => {
      const { getUserPersonaFromFirestore } = await import("@/lib/firestoreService");
      const persona = await getUserPersonaFromFirestore(user.uid, Boolean(user.isDemo));
      if (persona) {
        setJobRole(persona.jobRole);
        setToneManner(persona.toneManner);
        if (persona.seniorityLevel) setSeniorityLevel(persona.seniorityLevel);
        if (persona.industry) setIndustry(persona.industry);
        if (persona.region) setRegion(persona.region);
        const current = getSettings(user.uid);
        saveSettings({
          ...current,
          jobRole: persona.jobRole,
          toneManner: persona.toneManner,
          seniorityLevel: persona.seniorityLevel,
          industry: persona.industry,
          region: persona.region,
        }, user.uid);
      } else {
        setShowOnboarding(true);
      }
    };

    loadPersona();

    const unsubscribeRecords = subscribeUserRecords(
      user.uid,
      Boolean(user.isDemo),
      (syncedRecords) => {
        const cleanRecords = syncedRecords || [];
        setRecords(cleanRecords);
        setIsClientLoaded(true);
        saveLocalUserRecords(user.uid, cleanRecords);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("winstash_latest_records_cache", JSON.stringify(cleanRecords));
            window.dispatchEvent(new CustomEvent("winstash_records_updated", { detail: cleanRecords }));
          } catch {}
        }
      },
      (error) => {
        console.error("Firestore sync error:", error);
      }
    );

    const unsubscribeCredit = subscribeCreditStatus(
      user.uid,
      Boolean(user.isDemo),
      (status) => {
        setCreditStatus(status);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("winstash_latest_credit_cache", JSON.stringify(status));
            window.dispatchEvent(new CustomEvent("winstash_credits_updated", { detail: status }));
          } catch {}
        }
      },
      user.email
    );

    const handleExtSave = async (e: Event) => {
      const detail = (e as CustomEvent<{ record?: CareerRecord; deductCredit?: boolean }>).detail;
      if (detail?.record && user) {
        try {
          await saveUserRecordToFirestore(user.uid, Boolean(user.isDemo), detail.record);
          if (detail.deductCredit) {
            const updatedCredit = await consumeFreeCredit(user.uid, Boolean(user.isDemo), user.email);
            setCreditStatus(updatedCredit);
          }
        } catch (err) {
          console.error("Failed to save record from extension:", err);
        }
      }
    };
    window.addEventListener("winstash_save_record_request", handleExtSave);

    return () => {
      unsubscribeRecords();
      unsubscribeCredit();
      window.removeEventListener("winstash_save_record_request", handleExtSave);
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleJobRoleChange = (role: JobRole) => {
    setJobRole(role);
    const current = getSettings(user?.uid);
    saveSettings({ ...current, jobRole: role }, user?.uid);
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), role, toneManner, {
        seniorityLevel,
        industry,
        region,
      });
    }
  };

  const handleToneMannerChange = (tone: ToneManner) => {
    setToneManner(tone);
    const current = getSettings(user?.uid);
    saveSettings({ ...current, toneManner: tone }, user?.uid);
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), jobRole, tone, {
        seniorityLevel,
        industry,
        region,
      });
    }
  };

  const handleSeniorityChange = (level: SeniorityLevel | undefined) => {
    setSeniorityLevel(level);
    const current = getSettings(user?.uid);
    saveSettings({ ...current, seniorityLevel: level }, user?.uid);
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), jobRole, toneManner, {
        seniorityLevel: level,
        industry,
        region,
      });
    }
  };

  const handleIndustryChange = (ind: string | undefined) => {
    setIndustry(ind);
    const current = getSettings(user?.uid);
    saveSettings({ ...current, industry: ind }, user?.uid);
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), jobRole, toneManner, {
        seniorityLevel,
        industry: ind,
        region,
      });
    }
  };

  const handleRegionChange = (reg: RegionCode | undefined) => {
    setRegion(reg);
    const current = getSettings(user?.uid);
    saveSettings({ ...current, region: reg }, user?.uid);
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), jobRole, toneManner, {
        seniorityLevel,
        industry,
        region: reg,
      });
    }
  };

  const handleTransform = async (
    rawMemo: string,
    targetWeek?: WeekSpan,
    role: JobRole = jobRole,
    tone: ToneManner = toneManner,
    existingRecordId?: string,
    isConfirmedUpdate: boolean = false
  ) => {
    if (!user) {
      alert("Sign-in required to continue.");
      return;
    }

    const isAdmin = isAdminEmail(user.email);
    const isPro = isAdmin || Boolean(creditStatus?.isPro);

    // Identify if this operation is an update to an existing record
    let finalExistingRecordId = existingRecordId;
    if (!finalExistingRecordId && targetWeek) {
      const duplicate = records.find(
        (r) =>
          r.target_week &&
          r.target_week.year === targetWeek.year &&
          r.target_week.month === targetWeek.month &&
          r.target_week.weekOfMonth === targetWeek.weekOfMonth
      );
      if (duplicate) {
        finalExistingRecordId = duplicate.id;
      }
    }

    // Safety & Confirmation checks when updating an existing entry
    if (finalExistingRecordId) {
      const existingRecord = records.find((r) => r.id === finalExistingRecordId);
      // 1. Prevent wasting credit if user didn't make any changes
      if (existingRecord && existingRecord.raw_memo.trim() === rawMemo.trim()) {
        showToast("ℹ️ No changes detected in your notes.");
        return;
      }

      // 2. For free tier users, ask for confirmation before deducting 1 credit
      if (!isPro && !isConfirmedUpdate) {
        if (creditStatus?.isUserExhausted) {
          openUpgradeModal("edit");
          return;
        }
        openConfirmUpdateModal({
          rawMemo,
          targetWeek,
          role,
          tone,
          existingRecordId: finalExistingRecordId,
        });
        return;
      }
    }

    if (!isPro && creditStatus?.isGlobalExhausted) {
      alert("⚠️ The global promotional free quota (10,000 requests) has been reached.");
      return;
    }

    if (!isPro && creditStatus?.isUserExhausted) {
      openUpgradeModal(finalExistingRecordId ? "edit" : "input");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (user?.isDemo) {
        headers["x-demo-user"] = "true";
      }

      let finalTargetWeek = targetWeek;
      let recordDate = new Date().toISOString();

      if (finalExistingRecordId) {
        const existingRecord = records.find((r) => r.id === finalExistingRecordId);
        if (existingRecord) {
          finalTargetWeek = existingRecord.target_week;
          recordDate = existingRecord.createdAt;
        }
      } else if (targetWeek) {
        recordDate = `${targetWeek.endDate}T09:00:00.000Z`;
      }

      const proposedRecordId = finalExistingRecordId || `rec-en-${Date.now()}`;

      // Pure Global English AI Engine with Atomic Server-Side Persistence
      const res = await fetch("/api/transform", {
        method: "POST",
        headers,
        body: JSON.stringify({
          raw_memo: rawMemo,
          job_role: role,
          tone_manner: tone,
          seniority_level: seniorityLevel,
          industry,
          region,
          record_id: proposedRecordId,
          target_week: finalTargetWeek,
          record_date: recordDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          openUpgradeModal(finalExistingRecordId ? "edit" : "input");
          return;
        }
        throw new Error(errorData.error || "Transformation request failed.");
      }

      const output: TransformationOutput & { record?: CareerRecord } = await res.json();

      const newRecord: CareerRecord = output.record || {
        id: proposedRecordId,
        createdAt: recordDate,
        target_week: finalTargetWeek,
        raw_memo: rawMemo,
        weekly_report: output.weekly_report,
        brag_sheet_item: output.brag_sheet_item,
        star_portfolio: output.star_portfolio,
        jobRole: role,
        toneManner: tone,
        source: "web_text",
      };

      // Instant optimistic local state update
      setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
      setActiveRecordId(newRecord.id);

      // Demo users persist to local storage fallback only
      if (user?.isDemo) {
        await saveUserRecordToFirestore(user.uid, true, newRecord);
      }

      trackEvent("memo_transformed", {
        isUpdate: Boolean(finalExistingRecordId),
        memoLength: rawMemo.length,
        jobRole: role,
        toneManner: tone,
        impactCategory: output.star_portfolio?.impactCategory,
        impactMagnitude: output.star_portfolio?.impactMagnitude,
      });

      // Clear local summary cache to ensure next view reflects latest notes
      await clearUserSummaryCache(user.uid, Boolean(user.isDemo));

      showToast(
        finalExistingRecordId
          ? "🎉 Record successfully updated!"
          : `🎉 ${finalTargetWeek ? finalTargetWeek.label : "Weekly entry"} successfully transformed and synced!`
      );

      const dashElement = document.getElementById("dashboard-section");
      if (dashElement) {
        dashElement.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "An error occurred during transformation.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;
    const { rawMemo, targetWeek, role, tone, existingRecordId } = pendingUpdate;
    closeConfirmUpdateModal();
    await handleTransform(rawMemo, targetWeek, role, tone, existingRecordId, true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!user) return;
    try {
      // 1. Immediately remove from local React state for instantaneous UI sync
      setRecords((prev) => prev.filter((r) => r.id !== id));

      await deleteUserRecordFromFirestore(user.uid, Boolean(user.isDemo), id);
      // 2. Immediately clear summary cache so deleted record never lingers in Brag or Vault
      await clearUserSummaryCache(user.uid, Boolean(user.isDemo));
      showToast("Record successfully deleted from database.");
    } catch (err) {
      console.error("Delete record failed:", err);
      alert("Failed to delete record from database.");
    }
  };


  // 1. New visitors or unauthenticated users: Immediately render landing page (Zero loading delay!)
  if (!user && (!hasPriorSession || !authLoading)) {
    return <LandingPageEn />;
  }

  // 2. Existing logged-in user returning: Smooth vault loading state while restoring session (~0.2s)
  if (authLoading && hasPriorSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Loading your vault...</span>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated fallback
  if (!user) {
    return <LandingPageEn />;
  }

  // 3. Authenticated dashboard
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <HeaderEn
        onOpenSettings={openSettingsModal}
        onOpenFeedback={openFeedbackModal}
        onOpenUpgrade={() => openUpgradeModal("header")}
        recordCount={records.length}
        creditStatus={creditStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Never Forget Your Wins · Career Memory Vault</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight text-balance">
            Friday 1-min brain dump.{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              Never forget your wins.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-balance">
            Write rough notes without worrying about structure. AI synthesizes it into <strong>Weekly Snippets</strong>, an executive <strong>Performance Review</strong>, and a polished <strong>Career Portfolio</strong>.
          </p>

          {/* 3 Drawers Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Short-Term: Weekly Snippets (PPP)
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Mid-Term: Performance Review (Brag Sheet)
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Long-Term: Career Portfolio (STAR Format)
            </span>
          </div>
        </section>

        {/* Screen 1: Quick Logger */}
        <section className="space-y-4">
          <QuickLoggerEn
            onTransform={handleTransform}
            isLoading={isLoading}
            existingRecords={records}
            creditStatus={creditStatus}
            onUpgradeClick={() => openUpgradeModal("input")}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </section>

        {/* Screen 1.5: 52-Week Career Heatmap */}
        {isClientLoaded && (
          <section className="space-y-4">
            <CareerHeatmapEn
              records={records}
              selectedWeek={selectedWeek}
              onSelectWeek={(w) => setSelectedWeek(w)}
            />
          </section>
        )}

        {/* Screen 2: 3-Way Dashboard */}
        <section id="dashboard-section" className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>3-Way Career Dashboard</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Switch tabs to view your short-term syncs, mid-term achievements, or interview case studies.
              </p>
            </div>
          </div>

          {isClientLoaded && (
            <DashboardTabsEn
              records={records}
              activeRecordId={activeRecordId}
              onDeleteRecord={handleDeleteRecord}
              onEditRecord={async (memo, id) => {
                await handleTransform(memo, undefined, jobRole, toneManner, id);
              }}
              onUpgradeClick={() => openUpgradeModal("brag")}
              creditStatus={creditStatus}
              jobRole={jobRole}
              toneManner={toneManner}
              onJobRoleChange={handleJobRoleChange}
              onToneMannerChange={handleToneMannerChange}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 mt-12 text-center text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3 px-6 max-w-7xl mx-auto">
        <p>© 2026 WinStash. 1-Min Friday notes into career assets.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 font-medium">
          <Link
            href="/terms"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4"
          >
            Terms of Service
          </Link>
          <span>·</span>
          <Link
            href="/privacy"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          <span>·</span>
          <Link
            href="/refund"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4"
          >
            Refund Policy
          </Link>
          <span>·</span>
          <a
            href="mailto:thestudioplus26@gmail.com"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4"
          >
            Support
          </a>
          <span>·</span>
          <button
            onClick={openFeedbackModal}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4 cursor-pointer"
          >
            Feedback
          </button>
        </div>
      </footer>

      {/* Feedback & Bug Report Modal */}
      <FeedbackModalEn
        isOpen={isFeedbackOpen}
        onClose={closeFeedbackModal}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Upgrade / Subscription Management Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        user={user}
        triggerReason={upgradeTriggerReason}
        isPro={Boolean(creditStatus?.isPro)}
      />

      {/* Settings Modal */}
      <SettingsModalEn
        isOpen={isSettingsOpen}
        onClose={closeSettingsModal}
        onOpenFeedback={openFeedbackModal}
        onOpenUpgrade={() => {
          setIsSettingsOpen(false);
          openUpgradeModal("header");
        }}
        isPro={Boolean(creditStatus?.isPro)}
        jobRole={jobRole}
        onJobRoleChange={handleJobRoleChange}
        seniorityLevel={seniorityLevel}
        onSeniorityLevelChange={handleSeniorityChange}
        industry={industry}
        onIndustryChange={handleIndustryChange}
        region={region}
        onRegionChange={handleRegionChange}
      />

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModalEn
          isOpen={showOnboarding}
          onSave={(role) => {
            handleJobRoleChange(role);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Update Confirmation Modal (Credit deduction notice for free tier) */}
      <UpdateConfirmModalEn
        isOpen={Boolean(pendingUpdate)}
        onClose={closeConfirmUpdateModal}
        onConfirm={handleConfirmUpdate}
        remainingCredits={creditStatus?.remainingCredits ?? 0}
        maxCredits={creditStatus?.maxUserCredits ?? 10}
        targetWeekLabel={
          pendingUpdate?.targetWeek?.label ||
          records.find((r) => r.id === pendingUpdate?.existingRecordId)?.target_week?.label
        }
        onUpgradeClick={() => {
          closeConfirmUpdateModal();
          openUpgradeModal("edit");
        }}
        isLoading={isLoading}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
