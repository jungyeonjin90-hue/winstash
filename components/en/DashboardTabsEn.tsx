"use client";

import { useState } from "react";
import { MessageSquare, TrendingUp, ShieldCheck, History } from "lucide-react";
import { CareerRecord, JobRole, ToneManner } from "@/types/career";
import { trackEvent } from "@/lib/analytics";
import { WeeklySnippetsTab } from "./tabs/WeeklySnippetsTab";
import { BragDocumentTab } from "./tabs/BragDocumentTab";
import { StarResumeTab } from "./tabs/StarResumeTab";
import { TimelineArchiveTabEn } from "./tabs/TimelineArchiveTabEn";

interface DashboardTabsEnProps {
  records: CareerRecord[];
  onDeleteRecord?: (id: string) => void;
  onEditRecord?: (rawMemo: string, existingRecordId: string) => Promise<void>;
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export type TabType = "weekly" | "brag" | "vault" | "archive";

export function DashboardTabsEn({
  records,
  onDeleteRecord,
  onEditRecord,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: DashboardTabsEnProps) {
  const [activeTab, setActiveTab] = useState<TabType>("weekly");

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    trackEvent("dashboard_tab_switched", { tab });
  };

  // Most recent record
  const latestRecord = records[0];

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto">
        {/* Tab 1: Weekly Snippets */}
        <button
          onClick={() => handleTabChange("weekly")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "weekly"
              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
          <span>Weekly Snippets</span>
          <span className="hidden md:inline-block text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            Slack Sync
          </span>
        </button>

        {/* Tab 2: Brag Document */}
        <button
          onClick={() => handleTabChange("brag")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "brag"
              ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          <span>Brag Document</span>
          <span className="hidden md:inline-block text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            Reviews
          </span>
        </button>

        {/* Tab 3: STAR Resume */}
        <button
          onClick={() => handleTabChange("vault")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === "vault"
              ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          <span>STAR Resume</span>
          <span className="hidden md:inline-block text-[10px] font-normal px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            LinkedIn
          </span>
        </button>

        {/* Tab 4: Archive */}
        <button
          onClick={() => handleTabChange("archive")}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all shrink-0 ml-auto cursor-pointer ${
            activeTab === "archive"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>History ({records.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "weekly" && records.length > 0 && (
          <WeeklySnippetsTab records={records} />
        )}

        {activeTab === "brag" && (
          <BragDocumentTab
            records={records}
            jobRole={jobRole}
            toneManner={toneManner}
            onJobRoleChange={onJobRoleChange}
            onToneMannerChange={onToneMannerChange}
          />
        )}

        {activeTab === "vault" && (
          <StarResumeTab
            records={records}
            jobRole={jobRole}
            toneManner={toneManner}
            onJobRoleChange={onJobRoleChange}
            onToneMannerChange={onToneMannerChange}
          />
        )}

        {activeTab === "archive" && (
          <TimelineArchiveTabEn
            records={records}
            onDeleteRecord={onDeleteRecord}
            onEditRecord={onEditRecord}
          />
        )}

        {records.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm">
            No weekly logs found. Enter your first Friday note above!
          </div>
        )}
      </div>
    </div>
  );
}
