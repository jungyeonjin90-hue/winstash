"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { QuickLogger } from "@/components/QuickLogger";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { DashboardTabs } from "@/components/DashboardTabs";
import { SettingsModal } from "@/components/SettingsModal";
import { LandingPage } from "@/components/LandingPage";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeUserRecords,
  saveUserRecordToFirestore,
  deleteUserRecordFromFirestore,
  saveUserPersonaToFirestore,
} from "@/lib/firestoreService";
import { getSettings, saveSettings } from "@/lib/storage";
import { CreditStatus, subscribeCreditStatus, consumeFreeCredit } from "@/lib/creditService";
import { CareerRecord, TransformationOutput, JobRole, ToneManner, WeekSpan } from "@/types/career";
import { Sparkles, CheckCircle2, Layers, Loader2, Globe } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { getAuthToken } from "@/lib/firebase";

export default function HomeKo() {
  const { user, loading: authLoading } = useAuth();

  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [jobRole, setJobRole] = useState<JobRole>(() => getSettings().jobRole || "engineering");
  const [toneManner, setToneManner] = useState<ToneManner>(() => getSettings().toneManner || "impact");

  // Firestore 동기화
  useEffect(() => {
    if (!user) return;

    const unsubscribeRecords = subscribeUserRecords(
      user.uid,
      Boolean(user.isDemo),
      (syncedRecords) => {
        setRecords(syncedRecords);
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
      }
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
      alert("로그인이 필요합니다.");
      return;
    }

    const isPro = Boolean(creditStatus?.isPro);

    if (!isPro && creditStatus?.isGlobalExhausted) {
      alert("⚠️ 서비스 전체 프로모션 무료 변환 한도(10,000회)가 소진되었습니다.");
      return;
    }

    if (!isPro && creditStatus?.isUserExhausted) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const settings = getSettings();
      const authToken = await getAuthToken();
      // 한국어 격리 전용 엔드포인트 호출 (서버 사이드 인증 헤더 전송)
      const res = await fetch("/api/transform/ko", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          raw_memo: rawMemo,
          job_role: role,
          tone_manner: tone,
          provider: settings.provider,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "변환 처리에 실패했습니다.");
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
        id: finalExistingRecordId || `rec-${Date.now()}`,
        createdAt: recordDate,
        target_week: finalTargetWeek,
        raw_memo: rawMemo,
        weekly_report: output.weekly_report,
        brag_sheet_item: output.brag_sheet_item,
        star_portfolio: output.star_portfolio,
      };

      await saveUserRecordToFirestore(user.uid, Boolean(user.isDemo), newRecord);

      const updatedCredit = await consumeFreeCredit(user.uid, Boolean(user.isDemo));
      setCreditStatus(updatedCredit);

      showToast(
        finalExistingRecordId
          ? "🎉 주간 기록이 성공적으로 수정 및 업데이트 되었습니다!"
          : `🎉 ${targetWeek ? targetWeek.label : "이번 주"} 3-Way 커리어 OS로 성공적으로 변환 및 동기화 완료!`
      );

      const dashElement = document.getElementById("dashboard-section");
      if (dashElement) {
        dashElement.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "변환 중 오류가 발생했습니다. 다시 시도해 주세요.";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserRecordFromFirestore(user.uid, Boolean(user.isDemo), id);
      showToast("기록이 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("기록 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDataReset = () => {
    showToast("초기 샘플 데이터로 복원되었습니다.");
  };

  const handleDataImported = () => {
    showToast("백업 데이터를 성공적으로 불러왔습니다.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-bounce">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>보안 인증 확인 중...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Banner to English Main */}
      <div className="bg-indigo-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span>WinStash 주력 개발 버전은 <strong>글로벌 영문 버전</strong>입니다.</span>
        <Link href="/" className="underline hover:text-indigo-100 flex items-center gap-1 font-bold">
          <Globe className="w-3 h-3" /> Go to Global (EN)
        </Link>
      </div>

      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        recordCount={records.length}
        creditStatus={creditStatus}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <section className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Input 3-Output 자동 분류 커리어 운영체제 (한국어 버전)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
            금요일 퇴근 전 1분,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              대충 털어놓으세요.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            형식 고민 없이 한 주간 한 일과 이슈를 입력하면, AI가 <strong>주간보고</strong> · <strong>연봉협상 Brag Sheet</strong> · <strong>이직용 STAR 포트폴리오</strong>로 자동 변환하여 누적합니다.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              단기: 주간보고 (개조식)
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              중기: Brag Sheet (수치 임팩트)
            </span>
            <span className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              장기: STAR 포트폴리오 (NDA 마스킹)
            </span>
          </div>
        </section>

        <section className="space-y-4">
          <QuickLogger
            onTransform={handleTransform}
            isLoading={isLoading}
            existingRecords={records}
            creditStatus={creditStatus}
            onUpgradeClick={() => setIsUpgradeModalOpen(true)}
          />
        </section>

        {isLoading && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <LoadingSkeleton />
          </section>
        )}

        <section id="dashboard-section" className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>3-Way 커리어 대시보드</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                상단 탭을 전환하여 목적에 맞는 산출물을 확인하고 바로 복사·내보내기 하세요.
              </p>
            </div>
          </div>

          {isClientLoaded && (
            <DashboardTabs
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

      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 mt-12 text-center text-xs text-zinc-400">
        <p>© 2026 WinStash. 1-Input 3-Output 커리어 운영체제.</p>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDataReset={handleDataReset}
        onDataImported={handleDataImported}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        user={user}
        triggerReason="input"
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
