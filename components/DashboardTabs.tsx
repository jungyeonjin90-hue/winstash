"use client";

import { useState, useEffect } from "react";
import { FileText, TrendingUp, ShieldCheck, History, Calendar, ChevronDown, Trash2 } from "lucide-react";
import { CareerRecord, TabType, JobRole, ToneManner } from "@/types/career";
import { WeeklyReportTab } from "./tabs/WeeklyReportTab";
import { BragSheetTab } from "./tabs/BragSheetTab";
import { CareerVaultTab } from "./tabs/CareerVaultTab";
import { TimelineArchiveTab } from "./tabs/TimelineArchiveTab";
import { getMostRecentlySavedId } from "@/lib/recordOrder";

interface DashboardTabsProps {
  records: CareerRecord[];
  activeRecordId?: string;
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (rawMemo: string, existingRecordId: string) => Promise<void>;
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

const VALID_TABS: TabType[] = ["weekly", "brag", "vault", "timeline"];

function readTabFromUrl(): TabType {
  if (typeof window === "undefined") return "weekly";
  const tabParam = new URLSearchParams(window.location.search).get("tab");
  if (tabParam === "archive" || tabParam === "timeline") return "timeline";
  return tabParam && VALID_TABS.includes(tabParam as TabType) ? (tabParam as TabType) : "weekly";
}

export function DashboardTabs({
  records,
  activeRecordId,
  onDeleteRecord,
  onEditRecord,
  jobRole,
  toneManner,
  onJobRoleChange,
  onToneMannerChange,
}: DashboardTabsProps) {
  // 대시보드는 로그인 후 클라이언트에서만 마운트되므로 초기값에서 URL을 읽어도 hydration 불일치가 없음
  const [activeTab, setActiveTab] = useState<TabType>(readTabFromUrl);

  // "최신" = 가장 최근에 저장한 기록 (lib/recordOrder.ts). 목록 자체는 주차 날짜순
  const latestRecordId = getMostRecentlySavedId(records);

  // activeRecordId first: same result as the former mount effect that focused it
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    activeRecordId || latestRecordId || ""
  );

  // Automatically switch tab and focus on newly recorded week (activeRecordId 변경 시 렌더 중 조정)
  const [seenActiveRecordId, setSeenActiveRecordId] = useState(activeRecordId);
  if (seenActiveRecordId !== activeRecordId) {
    setSeenActiveRecordId(activeRecordId);
    if (activeRecordId) {
      setSelectedRecordId(activeRecordId);
      setActiveTab("weekly");
    }
  }

  // Synchronize activeTab with browser history (Back / Forward)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.modal) return;
      const currentTab = readTabFromUrl();
      setActiveTab(currentTab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "weekly") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.pushState({ tab }, "", url.toString());
    }
  };

  // If selectedRecordId not found in records, pick the latest saved one
  const currentRecord =
    records.find((r) => r.id === selectedRecordId) || records.find((r) => r.id === latestRecordId);

  const tabs = [
    {
      id: "weekly" as TabType,
      label: "Tab A. 주간업무보고",
      sub: "매주 월요일 보고용",
      icon: FileText,
      activeBg: "bg-indigo-600 text-white shadow-md shadow-indigo-600/20",
    },
    {
      id: "brag" as TabType,
      label: "Tab B. 성과평가 & Brag",
      sub: "분기/연말 연봉협상용",
      icon: TrendingUp,
      activeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
    },
    {
      id: "vault" as TabType,
      label: "Tab C. 포트폴리오 금고",
      sub: "1~2년 이직 & STAR",
      icon: ShieldCheck,
      activeBg: "bg-amber-600 text-white shadow-md shadow-amber-600/20",
    },
    {
      id: "timeline" as TabType,
      label: "Tab D. 전체 누적 기록",
      sub: "원문 메모 아카이브",
      icon: History,
      activeBg: "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md",
    },
  ];

  if (!records || records.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center">
        <p className="text-zinc-500">아직 등록된 주간 기록이 없습니다. 상단에서 1분 퀵 인풋을 작성해 보세요!</p>
      </div>
    );
  }

  const handleSelectRecordForWeekly = (id: string) => {
    setSelectedRecordId(id);
    setActiveTab("weekly");
  };

  return (
    <div className="space-y-6">
      {/* 4-Way Top Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-zinc-100/80 dark:bg-zinc-900/80 p-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2.5 sm:gap-3 p-3 rounded-xl transition-all text-left cursor-pointer ${
                isActive
                  ? tab.activeBg
                  : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60"
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="font-bold text-xs sm:text-sm tracking-tight truncate">
                  {tab.label}
                </div>
                <div
                  className={`text-[10px] sm:text-[11px] truncate ${
                    isActive ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Week Selector Bar (Particularly relevant when viewing Tab A) */}
      {activeTab === "weekly" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-zinc-500">기록 주차 선택:</span>
            <div className="relative">
              <select
                value={currentRecord?.id || ""}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="appearance-none bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {records.map((rec) => {
                  const dateStr = new Date(rec.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  });
                  const prefix = rec.target_week ? rec.target_week.label : dateStr;
                  return (
                    <option key={rec.id} value={rec.id}>
                      {prefix} — {rec.star_portfolio.title.slice(0, 22)}...
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {currentRecord && (
            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-xs text-zinc-400 font-mono">
                {currentRecord.id === latestRecordId ? "🔥 최신 주간 기록" : `이전 기록`}
              </span>
              <button
                onClick={() => {
                  if (confirm("이 주간 기록을 삭제하시겠습니까?")) {
                    onDeleteRecord(currentRecord.id);
                  }
                }}
                className="text-xs text-zinc-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1"
                title="기록 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content Display */}
      <div>
        <div className={activeTab === "weekly" ? "block" : "hidden"}>
          {currentRecord && <WeeklyReportTab record={currentRecord} />}
        </div>
        <div className={activeTab === "brag" ? "block" : "hidden"}>
          <BragSheetTab
            records={records}
            jobRole={jobRole}
            toneManner={toneManner}
            onJobRoleChange={onJobRoleChange}
            onToneMannerChange={onToneMannerChange}
          />
        </div>
        <div className={activeTab === "vault" ? "block" : "hidden"}>
          <CareerVaultTab
            records={records}
            jobRole={jobRole}
            toneManner={toneManner}
            onJobRoleChange={onJobRoleChange}
            onToneMannerChange={onToneMannerChange}
          />
        </div>
        <div className={activeTab === "timeline" ? "block" : "hidden"}>
          <TimelineArchiveTab
            records={records}
            onDeleteRecord={onDeleteRecord}
            onEditRecord={onEditRecord}
            onSelectRecordForWeekly={handleSelectRecordForWeekly}
          />
        </div>
      </div>
    </div>
  );
}
