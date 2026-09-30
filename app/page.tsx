"use client";

import { useState, useEffect } from "react";
import { HeaderEn } from "@/components/en/HeaderEn";
import { QuickLoggerEn } from "@/components/en/QuickLoggerEn";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { DashboardTabsEn } from "@/components/en/DashboardTabsEn";
import { SettingsModalEn } from "@/components/en/SettingsModalEn";
import { OnboardingModalEn } from "@/components/en/OnboardingModalEn";
import { LandingPageEn } from "@/components/en/LandingPageEn";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeUserRecords,
  saveUserRecordToFirestore,
  deleteUserRecordFromFirestore,
  deleteAllUserRecordsFromFirestore,
  saveUserPersonaToFirestore,
} from "@/lib/firestoreService";
import { clearUserSummaryCache, purgeLegacySummaryCaches } from "@/lib/summaryCacheService";
import { getSettings, saveSettings } from "@/lib/storage";
import { CreditStatus, subscribeCreditStatus, consumeFreeCredit } from "@/lib/creditService";
import { isAdminEmail } from "@/lib/adminConfig";
import { CareerRecord, TransformationOutput, JobRole, ToneManner, WeekSpan } from "@/types/career";
import { INITIAL_CAREER_RECORDS_EN } from "@/lib/initialDataEn";
import { trackEvent } from "@/lib/analytics";
import { Sparkles, Layers, Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();

  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [jobRole, setJobRole] = useState<JobRole>(() => getSettings().jobRole || "engineering");
  const [toneManner, setToneManner] = useState<ToneManner>(() => getSettings().toneManner || "impact");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPersonaLoaded, setIsPersonaLoaded] = useState(false);

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
        const current = getSettings();
        saveSettings({ ...current, jobRole: persona.jobRole, toneManner: persona.toneManner });
      } else {
        setShowOnboarding(true);
      }
      setIsPersonaLoaded(true);
    };

    loadPersona();

    const unsubscribeRecords = subscribeUserRecords(
      user.uid,
      Boolean(user.isDemo),
      (syncedRecords) => {
        setRecords(syncedRecords || []);
        setIsClientLoaded(true);
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
      },
      user.email
    );

    return () => {
      unsubscribeRecords();
      unsubscribeCredit();
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleJobRoleChange = (role: JobRole) => {
    setJobRole(role);
    const current = getSettings();
    saveSettings({ ...current, jobRole: role });
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), role, toneManner);
    }
  };

  const handleToneMannerChange = (tone: ToneManner) => {
    setToneManner(tone);
    const current = getSettings();
    saveSettings({ ...current, toneManner: tone });
    if (user) {
      saveUserPersonaToFirestore(user.uid, Boolean(user.isDemo), jobRole, tone);
    }
  };

  const handleTransform = async (
    rawMemo: string,
    targetWeek?: WeekSpan,
    role: JobRole = jobRole,
    tone: ToneManner = toneManner,
    existingRecordId?: string
  ) => {
    if (!user) {
      alert("Sign-in required to continue.");
      return;
    }

    const isAdmin = isAdminEmail(user.email);

    if (!isAdmin && creditStatus?.isGlobalExhausted) {
      alert("⚠️ The global promotional free quota (10,000 requests) has been reached.");
      return;
    }

    if (!isAdmin && creditStatus?.isUserExhausted) {
      alert("⚠️ You have used all 5 free transformations.\n\nPro subscription plans will open soon!");
      return;
    }

    setIsLoading(true);
    try {
      const settings = getSettings();
      // Pure Global English AI Engine
      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_memo: rawMemo,
          job_role: role,
          tone_manner: tone,
          provider: settings.provider,
          isCreditExhausted: isAdmin ? false : Boolean(creditStatus?.isUserExhausted),
          isGlobalExhausted: isAdmin ? false : Boolean(creditStatus?.isGlobalExhausted),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Transformation request failed.");
      }

      const output: TransformationOutput = await res.json();

      let finalTargetWeek = targetWeek;
      let recordDate = new Date().toISOString();

      let finalExistingRecordId = existingRecordId;

      // Ensure we only have one record per week
      if (!finalExistingRecordId && targetWeek) {
        const duplicate = records.find((r) => 
          r.target_week &&
          r.target_week.year === targetWeek.year &&
          r.target_week.month === targetWeek.month &&
          r.target_week.weekOfMonth === targetWeek.weekOfMonth
        );
        if (duplicate) {
          finalExistingRecordId = duplicate.id;
        }
      }

      if (finalExistingRecordId) {
        const existingRecord = records.find((r) => r.id === finalExistingRecordId);
        if (existingRecord) {
          finalTargetWeek = existingRecord.target_week;
          recordDate = existingRecord.createdAt;
        }
      } else if (targetWeek) {
        recordDate = `${targetWeek.endDate}T09:00:00.000Z`;
      }

      const newRecord: CareerRecord = {
        id: finalExistingRecordId || `rec-en-${Date.now()}`,
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

      // Optimistic local state update for instantaneous reactivity
      setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
      await saveUserRecordToFirestore(user.uid, Boolean(user.isDemo), newRecord);

      trackEvent("memo_transformed", {
        isUpdate: Boolean(finalExistingRecordId),
        memoLength: rawMemo.length,
        jobRole: role,
        toneManner: tone,
        impactCategory: output.star_portfolio?.impactCategory,
        impactMagnitude: output.star_portfolio?.impactMagnitude,
      });

      // Deduct credit for updates as well (bypassed automatically for admins)
      const updatedCredit = await consumeFreeCredit(user.uid, Boolean(user.isDemo), user.email);
      setCreditStatus(updatedCredit);

      if (finalExistingRecordId) {
        await clearUserSummaryCache(user.uid, Boolean(user.isDemo));
      }

      showToast(
        finalExistingRecordId
          ? "🎉 Record successfully updated!"
          : `🎉 ${targetWeek ? targetWeek.label : "Weekly entry"} successfully transformed and synced!`
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

  const handleDataReset = async () => {
    setRecords([]);
    if (user) {
      await deleteAllUserRecordsFromFirestore(user.uid, Boolean(user.isDemo));
      await clearUserSummaryCache(user.uid, Boolean(user.isDemo));
    }
    showToast("All records successfully reset in cloud database.");
  };

  const handleDataImported = async () => {
    if (user) {
      await clearUserSummaryCache(user.uid, Boolean(user.isDemo));
    }
    showToast("Backup data successfully imported.");
  };

  // 1. Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: English landing page
  if (!user) {
    return <LandingPageEn />;
  }

  // 3. Authenticated dashboard
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <HeaderEn
        onOpenSettings={() => setIsSettingsOpen(true)}
        recordCount={records.length}
        creditStatus={creditStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Input, 3-Output Career Operating System</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight text-balance">
            Friday 1-min brain dump.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Never forget your wins.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-balance">
            Write rough notes without worrying about structure. AI synthesizes it into <strong>Weekly Snippets</strong>, an annual <strong>Brag Document</strong>, and <strong>STAR Resume bullets</strong>.
          </p>

          {/* 3 Drawers Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Short-Term: Weekly Snippets (PPP)
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Mid-Term: Brag Doc (XYZ-Format)
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Long-Term: STAR Resume & Case Studies
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
          />
        </section>

        {/* Loading Skeleton */}
        {isLoading && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <LoadingSkeleton />
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
              onDeleteRecord={handleDeleteRecord}
              onEditRecord={async (memo, id) => {
                await handleTransform(memo, undefined, jobRole, toneManner, id);
              }}
              jobRole={jobRole}
              toneManner={toneManner}
              onJobRoleChange={handleJobRoleChange}
              onToneMannerChange={handleToneMannerChange}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 mt-12 text-center text-xs text-zinc-400">
        <p>© 2026 WinStash. 1-Input, 3-Output Career Operating System for Global Builders.</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModalEn
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={handleDataReset}
        onDataImported={handleDataImported}
        jobRole={jobRole}
        onJobRoleChange={handleJobRoleChange}
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
