"use client";

import { useEffect } from "react";
import { X, UserCircle, Briefcase, Award, Building, Globe, LogOut, CheckCircle2, MessageSquarePlus, Sparkles, Zap } from "lucide-react";
import { JobRole, SeniorityLevel, RegionCode } from "@/types/career";
import { useAuth } from "@/context/AuthContext";

interface SettingsModalEnProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
  onOpenUpgrade?: () => void;
  isPro?: boolean;
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
  onOpenFeedback,
  onOpenUpgrade,
  isPro = false,
  jobRole,
  onJobRoleChange,
  seniorityLevel,
  onSeniorityLevelChange,
  industry,
  onIndustryChange,
  region,
  onRegionChange,
}: SettingsModalEnProps) {
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-dialog-title" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                WinStash Settings
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Manage your career profile and account preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Account & Cloud Sync */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Connected Account
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>{user?.email || user?.displayName || "Guest User"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cloud Auto-Sync Active (Encrypted)</span>
              </div>
            </div>

            {user && (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 1.5: Membership & Subscription Management */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Membership & Subscription
            </span>
            {isPro ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                PRO ACTIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                FREE PLAN
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {isPro ? "WinStash Pro Monthly ($5.99 / mo)" : "Free Trial Plan (5 logs, 3 syntheses)"}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {isPro
                  ? "Unlimited weekly logging, past edits, and executive syntheses active."
                  : "Upgrade to unlock unlimited weekly transformations and syntheses."}
              </p>
            </div>

            {isPro ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpgrade?.();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
              >
                <span>Manage / Cancel Subscription</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpgrade?.();
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Upgrade to Pro ($5.99)</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Persona & Career Profile Configuration */}
        <div className="space-y-4 pt-1">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span>Career Profile & Personalization</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Customize your role, seniority, domain, and region to tailor synthesis terminology. All fields except role are completely optional.
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
                <option value="">Not Specified (General Professional)</option>
                <option value="tech_software">IT, Software & Internet</option>
                <option value="finance_banking">Finance, Banking & Insurance</option>
                <option value="retail_consumer">Retail, E-Commerce & Consumer Goods</option>
                <option value="manufacturing_industrial">Manufacturing, Hardware & Automotive</option>
                <option value="healthcare_pharma">Healthcare, Medicine & Biotech</option>
                <option value="professional_services">Consulting, Agency & Professional Services</option>
                <option value="media_entertainment">Media, Entertainment & Content</option>
                <option value="education_public">Education, Research & Public Sector</option>
                <option value="logistics_realestate">Logistics, Real Estate & Hospitality</option>
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
                <option value="US">United States</option>
                <option value="EU">Europe</option>
                <option value="APAC">Asia-Pacific</option>
                <option value="LATAM">Latin America</option>
                <option value="GLOBAL">Global / Worldwide</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          {onOpenFeedback ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFeedback();
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-500" />
              <span>Report Bug / Send Feedback</span>
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
