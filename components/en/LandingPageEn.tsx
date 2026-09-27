"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, MessageSquare, TrendingUp, ShieldCheck, Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LandingPageEn() {
  const { signInWithGoogle, signInWithDemo } = useAuth();
  const [loading, setLoading] = useState<"google" | "demo" | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading("google");
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      alert("Google sign-in encountered an error. Please try again or use the demo sandbox.");
    } finally {
      setLoading(null);
    }
  };

  const handleDemoLogin = () => {
    setLoading("demo");
    signInWithDemo();
    setLoading(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">CareerPulse</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  Global Edition
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch back to Korean */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>🇰🇷</span>
              <span>한국어</span>
            </Link>

            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>The 1-Input, 3-Output Career Operating System</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl text-zinc-900 dark:text-zinc-50">
          Stop scrambling at year-end review. <br />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Log 1 min on Friday. AI does the rest.
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Brain-dump what you shipped, broke, or solved this week. CareerPulse automatically categorizes it into <strong>Weekly Snippets</strong> for your manager, a <strong>Brag Document</strong> for compensation reviews, and <strong>STAR Resume bullets</strong> for senior interviews.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full max-w-md">
          <button
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>Get Started with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleDemoLogin}
            disabled={loading !== null}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer text-zinc-700 dark:text-zinc-300"
          >
            Explore Demo Sandbox
          </button>
        </div>

        {/* 3 Core Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left w-full">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              1. Weekly Snippets (PPP)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Progress, Plans, Problems format. 1-click Markdown copy optimized for Slack channels and async manager check-ins.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              2. Brag Document (Google XYZ)
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Synthesizes raw entries into quantifiable metrics. Never forget a shipped feature when performance & salary review arrives.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              3. STAR Resume & NDA Shield
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Situation, Task, Action, Result framework with built-in client confidentiality masking for LinkedIn and resume updates.
            </p>
          </div>
        </div>

        {/* Free Tier Callout */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>First 5 weekly runs are 100% free.</strong> No credit card required. Private & secure.
          </span>
        </div>
      </main>
    </div>
  );
}
