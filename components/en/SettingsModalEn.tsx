"use client";

import { useState } from "react";
import { X, Database, Download, Upload, RotateCcw, Sparkles, UserCircle, Briefcase, Award, Building, Globe } from "lucide-react";
import { JobRole, SeniorityLevel, RegionCode } from "@/types/career";
import {
  exportRecordsAsJSON,
  importRecordsFromJSON,
  resetToInitialRecords,
} from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

interface SettingsModalEnProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  onDataImported: () => void;
  jobRole?: JobRole;
  onJobRoleChange?: (role: JobRole) => void;
  seniorityLevel?: SeniorityLevel;
  onSeniorityLevelChange?: (level: SeniorityLevel | undefined) => void;
  industry?: string;
  onIndustryChange?: (industry: string | undefined) => void;
  region?: RegionCode;
  onRegionChange?: (region: RegionCode | undefined) => void;
}

export function SettingsModalEn({
  isOpen,
  onClose,
  onDataReset,
  onDataImported,
  jobRole,
  onJobRoleChange,
  seniorityLevel,
  onSeniorityLevelChange,
  industry,
  onIndustryChange,
  region,
  onRegionChange,
}: SettingsModalEnProps) {
  const { user } = useAuth();
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setImportStatus(null);
    }
  }

  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr = exportRecordsAsJSON();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `winstash_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importRecordsFromJSON(content);
      if (success) {
        setImportStatus("Backup successfully restored!");
        onDataImported();
      } else {
        setImportStatus("Invalid JSON backup file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("Reset all logs to initial 3-week sample records?")) {
      resetToInitialRecords();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                WinStash Settings
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AI engine specifications, cloud backup, and data management.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: AI Engine Info Banner */}
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-violet-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>High-Performance AI Engine (Gemini 2.0)</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            WinStash features a native Google Gemini 2.0 transformation pipeline. You don&apos;t need complex API keys—the service automatically structures your entries into polished executive English.
          </p>
        </div>

        {/* Section 1.5: Persona & Career Profile Configuration */}
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <UserCircle className="w-4 h-4 text-indigo-500" />
              <span>Career Profile & Personalization (Optional)</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Optionally specify your seniority, industry domain, and target region. AI tailors metrics, vocabulary, and scope accordingly. You can leave them unspecified anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Job Role */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>Primary Job Role</span>
              </label>
              <select
                value={jobRole || "engineering"}
                onChange={(e) => onJobRoleChange?.(e.target.value as JobRole)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="engineering">Engineering (Software, QA, Data)</option>
                <option value="product">Product Management (PM, PO)</option>
                <option value="design">Product Design (UX/UI, Research)</option>
                <option value="marketing">Growth & Marketing</option>
                <option value="sales">Sales & BD</option>
                <option value="operations">BizOps & Finance</option>
              </select>
            </div>

            {/* 2. Seniority Level */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Seniority Level <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span></span>
              </label>
              <select
                value={seniorityLevel || ""}
                onChange={(e) => onSeniorityLevelChange?.((e.target.value as SeniorityLevel) || undefined)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Not Specified (General Professional)</option>
                <option value="junior">Junior (1–3 years)</option>
                <option value="mid">Mid-Level (4–7 years)</option>
                <option value="senior">Senior (8–11 years)</option>
                <option value="staff_plus">Staff / Principal (12+ years)</option>
                <option value="lead_executive">Lead / Director / Executive</option>
              </select>
            </div>

            {/* 3. Industry Domain */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Building className="w-3.5 h-3.5 text-emerald-500" />
                <span>Industry Domain <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span></span>
              </label>
              <select
                value={industry || ""}
                onChange={(e) => onIndustryChange?.(e.target.value || undefined)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Not Specified (General Tech)</option>
                <option value="fintech">Fintech & Payments</option>
                <option value="saas">Enterprise B2B SaaS</option>
                <option value="ecommerce">E-Commerce & Retail Tech</option>
                <option value="ai_ml">AI, ML & Deep Tech</option>
                <option value="healthcare">Healthcare & BioTech</option>
                <option value="consumer">Consumer Mobile & Social Apps</option>
                <option value="gaming">Gaming & Interactive Media</option>
                <option value="crypto">Web3, Blockchain & Crypto</option>
                <option value="other">Other Industry</option>
              </select>
            </div>

            {/* 4. Target Region */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Target Region <span className="text-[10px] text-zinc-400 font-normal">(Optional)</span></span>
              </label>
              <select
                value={region || ""}
                onChange={(e) => onRegionChange?.((e.target.value as RegionCode) || undefined)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Not Specified (Global Standard)</option>
                <option value="US">United States (Silicon Valley & US Tech)</option>
                <option value="KR">Korea (Pangyo & Korea Tech)</option>
                <option value="EU">Europe (UK, Germany, EU Tech)</option>
                <option value="APAC">Asia-Pacific (Singapore, Tokyo, APAC)</option>
                <option value="GLOBAL">Global Remote / Multi-region</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Storage & Sync */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Storage & Cloud Sync</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-2.5 leading-relaxed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                <span className={`w-2 h-2 rounded-full ${user && !user.isDemo ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{user && !user.isDemo ? "Firestore Cloud Database (Live)" : "Local Storage Sandbox"}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${user && !user.isDemo ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"}`}>
                {user && !user.isDemo ? "Synced" : "Demo Mode"}
              </span>
            </div>

            {user && (
              <div className="pt-1.5 space-y-1">
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Firebase Firestore Database Document Path:
                </div>
                <div className="font-mono text-[11px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-indigo-600 dark:text-indigo-400 select-all break-all">
                  users/{user.uid}/records
                </div>
                <div className="text-[10px] text-zinc-400">
                  User Account: {user.email || user.displayName} (UID: {user.uid})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Backup & Reset */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
            Data Backup & Restore
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>

          {importStatus && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {importStatus}
            </p>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
