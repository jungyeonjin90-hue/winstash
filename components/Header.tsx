"use client";

import Link from "next/link";
import { Sparkles, Settings, Briefcase, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { WinStashBrandBadge } from "@/components/WinStashLogo";

import { CreditStatus } from "@/lib/creditService";

interface HeaderProps {
  onOpenSettings: () => void;
  recordCount: number;
  creditStatus: CreditStatus | null;
}

export function Header({ onOpenSettings, recordCount, creditStatus }: HeaderProps) {
  const { user, signOut, isFirebaseConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <WinStashBrandBadge size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                WinStash
              </span>
              <span className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/70">
                Beta
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 hidden sm:inline-block">
                3-Way 커리어 OS
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              1분 주간 기록 → 주간보고 · 연봉협상 · 이직 포트폴리오 자동화
            </p>
          </div>
        </div>

        {/* Right Action Bar - Stats & User Profile & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Credit Status Badge */}
          {creditStatus && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                creditStatus.remainingCredits > 0
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              }`}
              title={`무료 변환 ${creditStatus.remainingCredits}/${creditStatus.maxUserCredits}회 남음`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>
                {creditStatus.remainingCredits > 0
                  ? `무료 ${creditStatus.remainingCredits}회 남음`
                  : "무료 한도 모두 소진"}
              </span>
            </div>
          )}

          {/* Language Switcher */}
          <Link
            href="/en"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            title="Switch to English Version"
          >
            <span>🇺🇸</span>
            <span className="hidden sm:inline">English</span>
            <span className="sm:hidden">EN</span>
          </Link>

          {/* Record Count Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-zinc-800">
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">누적</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {recordCount}주차
            </span>
          </div>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                {user.photoURL ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Minimal Cloud Sync Dot Indicator */}
                <span
                  title={isFirebaseConfigured && !user.isDemo ? "클라우드 동기화됨" : "로컬 모드"}
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"
                />
              </div>

              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                  {user.isDemo ? "체험 계정" : user.email}
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 cursor-pointer"
            title="환경 설정 (API 키 & 백업)"
            aria-label="설정"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
