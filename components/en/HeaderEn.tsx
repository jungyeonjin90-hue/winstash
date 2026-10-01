"use client";


import { Sparkles, Settings, Briefcase, LogOut, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreditStatus } from "@/lib/creditService";
import { isAdminEmail } from "@/lib/adminConfig";

interface HeaderEnProps {
  onOpenSettings: () => void;
  onOpenFeedback?: () => void;
  recordCount: number;
  creditStatus: CreditStatus | null;
}

export function HeaderEn({ onOpenSettings, onOpenFeedback, recordCount, creditStatus }: HeaderEnProps) {
  const { user, signOut, isFirebaseConfigured } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                WinStash
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                3-Way Career OS
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              1-Min Friday Log → Weekly Snippets · Performance Review · Career Portfolio
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Credit Status Badge */}
          {creditStatus && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isAdmin
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : creditStatus.remainingCredits > 0
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              }`}
              title={
                isAdmin
                  ? "Administrator Account: Unlimited Transformations & Zero Cooldowns"
                  : `${creditStatus.remainingCredits} of ${creditStatus.maxUserCredits} free transformations remaining`
              }
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAdmin ? "text-amber-500" : "text-indigo-500 dark:text-indigo-400"}`} />
              <span>
                {isAdmin
                  ? "👑 Admin (Unlimited)"
                  : creditStatus.remainingCredits > 0
                  ? `${creditStatus.remainingCredits} Free Left`
                  : "Free Quota Reached"}
              </span>
            </div>
          )}


          {/* Record Count Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-zinc-800">
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Logged</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {recordCount} {recordCount === 1 ? "Week" : "Weeks"}
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
                <span
                  title={isFirebaseConfigured && !user.isDemo ? "Cloud Synced" : "Local Sandbox"}
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"
                />
              </div>

              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                  {user.isDemo ? "Demo Sandbox" : user.email}
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Feedback Trigger */}
          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer"
              title="Report an issue or share feedback"
              aria-label="Feedback"
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Feedback</span>
            </button>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
