"use client";

import { useState, useRef, useEffect } from "react";
import {
  Settings,
  LogOut,
  MessageSquarePlus,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreditStatus } from "@/lib/creditService";
import { isAdminEmail } from "@/lib/adminConfig";
import { WinStashBrandBadge } from "@/components/WinStashLogo";

interface HeaderEnProps {
  onOpenSettings: () => void;
  onOpenFeedback?: () => void;
  onOpenUpgrade?: () => void;
  recordCount?: number;
  creditStatus: CreditStatus | null;
}

export function HeaderEn({
  onOpenSettings,
  onOpenFeedback,
  onOpenUpgrade,
  creditStatus,
}: HeaderEnProps) {
  const { user, signOut, isFirebaseConfigured } = useAuth();
  const isAdmin = isAdminEmail(user?.email);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <WinStashBrandBadge size="md" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                WinStash
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                Career Memory Vault
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              1-Min Friday Notes → Weekly Sync, Promo Review & Portfolio
            </p>
          </div>
        </div>

        {/* Right: Streamlined Action Bar (Plan Badge + Profile Menu) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* 1. Plan / Credit Button */}
          {creditStatus && (
            isAdmin ? (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80 shadow-xs"
                title="Administrator: Unlimited Transformations"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Admin</span>
              </div>
            ) : creditStatus.isPro ? (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs cursor-pointer transition-all hover:border-indigo-400 active:scale-95"
                title="WinStash Pro Active. Click to manage membership."
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 dark:fill-indigo-400" />
                <span>PRO</span>
              </button>
            ) : creditStatus.isUserExhausted ? (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs cursor-pointer transition-all active:scale-95 animate-pulse"
                title="Free Quota Reached. Click to Upgrade to Pro ($5.99/mo)"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Upgrade to Pro</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-xs"
                title={`${creditStatus.remainingCredits} of ${creditStatus.maxUserCredits} free transformations left. Click to upgrade.`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>{creditStatus.remainingCredits} Free Left</span>
              </button>
            )
          )}

          {/* 2. User Profile Dropdown Menu */}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer focus:outline-none"
                aria-label="User profile menu"
                aria-expanded={isMenuOpen}
              >
                <div className="relative">
                  {user.photoURL ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    title={isFirebaseConfigured && !user.isDemo ? "Cloud Synced" : "Local Sandbox"}
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"
                  />
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 hidden sm:block ${
                    isMenuOpen ? "rotate-180 text-zinc-700 dark:text-zinc-200" : ""
                  }`}
                />
              </button>

              {/* Dropdown Popover */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {user.displayName || "WinStash User"}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {user.isDemo ? "Demo Sandbox" : user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                      {creditStatus?.isPro ? (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          Pro Membership Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Free Plan ({creditStatus?.remainingCredits ?? 5} credits left)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="p-1 space-y-0.5 text-xs">
                    {/* Settings Item */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-zinc-500" />
                      <span className="font-medium">Settings & Profile</span>
                    </button>

                    {/* Feedback Item */}
                    {onOpenFeedback && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenFeedback();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer text-left"
                      >
                        <MessageSquarePlus className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">Send Feedback</span>
                      </button>
                    )}
                  </div>

                  {/* Sign Out Item */}
                  <div className="p-1 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left text-xs font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
