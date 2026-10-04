"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  Check,
  ArrowRight,
  Lock,
  ChevronDown,
  Copy,
  Terminal,
  FileSpreadsheet,
  Award,
  Layers,
  Cpu,
  Eye,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { FeedbackModalEn } from "./FeedbackModalEn";
import { WinStashBrandBadge } from "@/components/WinStashLogo";

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// Interactive Demo Showcase Datasets by Persona
interface ShowcaseData {
  role: string;
  roleBadge: string;
  rawMemo: string;
  weeklySnippet: {
    done: string[];
    inProgress: string[];
    nextWeek: string[];
  };
  bragDoc: {
    metricSummary: string;
    businessImpact: string;
    milestones: string[];
    quarter: string;
  };
  starResume: {
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    ndaTags: string[];
  };
}

const SHOWCASE_DATA: Record<string, ShowcaseData> = {
  engineering: {
    role: "Software Engineering",
    roleBadge: "Staff Engineer / Tech Lead",
    rawMemo:
      "Primary payment gateway threw 50+ timeouts/min during flash sale. Did emergency hotfix on Friday. Root cause: connection pool starvation in HikariCP. Tuned maxPoolSize, added Redis L2 cache for hot settlement queries. Latency plummeted from 1,200ms to 85ms (93% drop), error rate hit 0%. Next week: Grafana executive APM dashboard.",
    weeklySnippet: {
      done: [
        "Resolved critical payment gateway timeout crisis under flash-sale concurrency",
        "Tuned HikariCP database pool parameters and deployed Redis distributed L2 caching",
        "Slashed p99 transactional latency by 93% (1,200ms → 85ms) with 0% error rate",
      ],
      inProgress: [
        "Configuring Prometheus alert thresholds for connection pool saturation warnings",
      ],
      nextWeek: [
        "Deploy executive-level real-time Grafana APM dashboard for finance stakeholders",
      ],
    },
    bragDoc: {
      metricSummary: "Slashed P99 Payment Latency by 93% (1.2s → 0.08s) with Zero Transaction Drops",
      businessImpact:
        "Protected an estimated $120,000 in monthly checkout GMV during high-concurrency peak hours and eliminated critical customer churn.",
      milestones: [
        "HikariCP connection leak profiling and pool optimization",
        "Multi-tier Redis cache implementation for repetitive settlement queries",
        "Zero-downtime canary deployment across payment microservices",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "High-Concurrency Payment Gateway Optimization & Latency Reduction",
      situation:
        "During major traffic surges, primary payment gateway timeouts spiked to 50+ errors/minute, threatening immediate revenue loss and customer trust.",
      task:
        "Diagnose backend connection bottlenecks, eliminate connection starvation, and stabilize transaction latency below 100ms with zero downtime.",
      action:
        "Led root-cause profiling using APM thread dumps; reconfigured HikariCP connection lifecycles and architected a Redis-based cache-aside pattern.",
      result:
        "Reduced p99 response time from 1,200ms to 85ms (93% reduction), restored a 99.99% payment success rate, and safeguarded $120K in monthly GMV.",
      ndaTags: ["#LatencyOptimization", "#DistributedSystems", "#Redis", "#SystemResilience"],
    },
  },
  product: {
    role: "Product Management",
    roleBadge: "Lead / Principal PM",
    rawMemo:
      "Shipped 3-step streamlined onboarding experiment to 100% of global mobile traffic with 1-click social auth. Monitored telemetry for 7 days: drop-off plummeted from 38% to 19%, overall signup conversion rate (CVR) surged by +24%. Team celebrated over Friday demo.",
    weeklySnippet: {
      done: [
        "Shipped 3-step progressive onboarding experiment to 100% of global mobile users",
        "Integrated 1-click OAuth friction reduction leading to an immediate +24% CVR lift",
        "Halved new visitor signup abandonment rate from 38% down to 19%",
      ],
      inProgress: [
        "Tracking Day-7 and Day-30 activation retention cohorts across A/B test cohorts",
      ],
      nextWeek: [
        "Roll out personalized welcome coupon triggers based on user role classification",
      ],
    },
    bragDoc: {
      metricSummary: "Boosted User Onboarding CVR by +24% and Slashed Abandonment by Half (38% → 19%)",
      businessImpact:
        "Accelerated customer acquisition velocity with zero incremental marketing spend, yielding an estimated +15,000 newly activated monthly users.",
      milestones: [
        "Cross-functional redesign of legacy 5-step registration funnel into 3 progressive screens",
        "Amplitude funnel telemetry instrumentation for granular drop-off tracking",
        "100% rollout approval after conclusive 7-day A/B statistical significance",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "Frictionless Growth Funnel Redesign & Onboarding Conversion Lift",
      situation:
        "The legacy 5-step mobile signup process created excessive cognitive friction, resulting in a 38% drop-off rate before new visitors experienced core product value.",
      task:
        "Re-architect the user acquisition flow to minimize initial cognitive load, accelerate time-to-first-value, and lift completion rates above 80%.",
      action:
        "Designed and validated an A/B experimentation roadmap; collapsed signup steps, embedded 1-tap social login, and deferred non-essential profiling questions.",
      result:
        "Achieved a 24% uplift in signup conversion, slashed funnel abandonment by 50%, and drove a 12% boost in Day-7 user retention cohorts.",
      ndaTags: ["#GrowthProduct", "#FunnelOptimization", "#ABTesting", "#UserActivation"],
    },
  },
  marketing: {
    role: "Growth & Marketing",
    roleBadge: "Growth Marketing Director",
    rawMemo:
      "Tested high-intent search ad landing pages and instant benefit messaging across US campaigns. In 14 days, signup conversion climbed 32% and CAC fell 18%. Reallocated $40k budget to top-performing keyword cohorts. Next week: automated retargeting sequences.",
    weeklySnippet: {
      done: [
        "Launched optimized high-intent landing page variants across primary US paid channels",
        "Achieved an 18% reduction in Blended CAC while increasing qualified signups by 32%",
        "Reallocated $40,000 monthly ad spend to high-converting keyword cohorts",
      ],
      inProgress: [
        "Refining automated behavioral email onboarding drips for paid traffic cohorts",
      ],
      nextWeek: [
        "Launch dynamic audience retargeting sequence on LinkedIn & Meta Ads",
      ],
    },
    bragDoc: {
      metricSummary: "Slashed Blended CAC by 18% and Lifted Paid Conversion Rate by +32%",
      businessImpact:
        "Generated an estimated $85,000 in annualized marketing efficiency while accelerating qualified enterprise sales pipeline by 22%.",
      milestones: [
        "High-intent landing page messaging overhaul and value proposition reframing",
        "Dynamic budget reallocation engine based on real-time ROAS telemetry",
        "Integration of multi-touch attribution tracking across ad networks",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "Performance Acquisition Engine Optimization & CAC Reduction",
      situation:
        "Rising digital advertising auction costs caused customer acquisition cost (CAC) to climb 25% quarter-over-quarter, compressing paid acquisition unit economics.",
      task:
        "Restructure acquisition funnels, optimize ad creative relevance, and reduce CAC by at least 15% without sacrificing inbound lead quality.",
      action:
        "Conducted comprehensive audit of paid search clusters; deployed high-conversion modular landing pages with instant benefit proof and dynamic copy testing.",
      result:
        "Decreased CAC by 18% within two weeks, expanded conversion rates by 32%, and captured an estimated $85,000 in annualized marketing budget efficiency.",
      ndaTags: ["#GrowthMarketing", "#CACReduction", "#PaidAcquisition", "#ROASOptimization"],
    },
  },
};

export function LandingPageEn() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState<"google" | null>(null);

  // Interactive Showcase States
  const [selectedPersona, setSelectedPersona] = useState<"engineering" | "product" | "marketing">("engineering");
  const [activeOutputTab, setActiveOutputTab] = useState<"weekly" | "brag" | "star">("weekly");
  const [isNdaMasked, setIsNdaMasked] = useState(true);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const activeData = SHOWCASE_DATA[selectedPersona];

  const handleGoogleLogin = async () => {
    try {
      trackEvent("landing_cta_clicked", { location: "hero" });
      setLoading("google");
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      alert("Google sign-in encountered an error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleCopySnippet = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    trackEvent("demo_snippet_copied", { label });
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-500 selection:text-white">
      {/* 1. Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WinStashBrandBadge size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">WinStash</span>
                <span className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/70">
                  Beta
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 hidden sm:inline-block">
                  Career Memory Vault
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                <GoogleIcon className="w-3 h-3" />
              </div>
              <span>Sign In with Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center">
        {/* 2. Hero Header Section */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>100% Free Public Beta · 1-Click Google Setup</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.18] max-w-4xl mx-auto text-zinc-900 dark:text-zinc-50 text-balance">
            <span className="block">
              Stop scrambling before reviews &amp; 1:1s.
            </span>
            <span className="block mt-2 sm:mt-3 text-indigo-600 dark:text-indigo-400">
              Dump 1 min on Friday. AI does the rest.
            </span>
          </h1>

          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal text-pretty max-w-2xl mx-auto">
              Built for engineers, product managers, business planners, and anyone who owes their manager an update. <br className="hidden sm:inline" />
              Write what you shipped, solved, or led—no formatting required. WinStash automatically turns raw Friday notes into 3 ready-to-use career assets:
            </p>

            {/* 3단 가로 나열 태그 형태 (1줄 정렬 유지) */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Manager-ready weekly updates</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Promotion-ready reviews</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Interview-ready career stories</span>
              </span>
            </div>
          </div>

          {/* Large High-Conversion Primary CTA Button */}
          <div className="flex flex-col items-center justify-center pt-3 max-w-md mx-auto space-y-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                <GoogleIcon className="w-3.5 h-3.5" />
              </div>
              <span>Start Stashing in 60s — It&apos;s Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold text-pretty text-center px-4">
              Free to start · Pro ($5.99/mo) adds unlimited AI syntheses after launch
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Free forever to log raw notes</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>1-click Google setup</span>
            </div>
          </div>
        </section>

        {/* 3. Section 2: Live Interactive Transformation Showcase (Direct Match with Real App UI) */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Live Interactive Transformation Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance">
              See How 1 Raw Friday Memo Unlocks 3 Strategic Drawers
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-pretty">
              Select your job persona below to witness the real-time AI synthesis in action.
            </p>

            {/* Persona Switcher Chips */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedPersona("engineering")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPersona === "engineering"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                <span>⚡ Software Engineering</span>
              </button>

              <button
                onClick={() => setSelectedPersona("product")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPersona === "product"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                <span>📈 Product Management</span>
              </button>

              <button
                onClick={() => setSelectedPersona("marketing")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPersona === "marketing"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                <span>🎯 Growth & Marketing</span>
              </button>

              <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700">
                + Design, Sales & BizOps in App
              </span>
            </div>
          </div>

          {/* Interactive Playground Container (Mirrors Actual App UI) */}
          <div className="bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-7 shadow-xl space-y-6">
            {/* Step 1: Input Box (Styled identically to QuickLoggerEn.tsx) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Step 1: Friday 1-Min Raw Brain Dump
                  </span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  {activeData.roleBadge}
                </span>
              </div>

              {/* Simulated Textarea */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[70px]">
                {activeData.rawMemo}
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Auto-detected format: Unstructured raw notes</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" /> Ready for 3-way synthesis
                </span>
              </div>
            </div>

            {/* Transition Divider with Indicator */}
            <div className="relative flex items-center justify-center py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-300/80 dark:border-zinc-700" />
              </div>
              <div className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>AI Automated 1-Input ➡️ 3-Output Separation</span>
              </div>
            </div>

            {/* Step 2: Output Tabs (Mirrors DashboardTabsEn.tsx) */}
            <div className="space-y-4">
              {/* Tab Navigation Pill Bar */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-x-auto shadow-xs">
                <button
                  onClick={() => setActiveOutputTab("weekly")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                    activeOutputTab === "weekly"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Drawer 1: Weekly Snippets</span>
                  <span
                    className={`hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                      activeOutputTab === "weekly"
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    Slack Sync
                  </span>
                </button>

                <button
                  onClick={() => setActiveOutputTab("brag")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                    activeOutputTab === "brag"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Drawer 2: Performance Review</span>
                  <span
                    className={`hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                      activeOutputTab === "brag"
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    Brag Sheet
                  </span>
                </button>

                <button
                  onClick={() => setActiveOutputTab("star")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                    activeOutputTab === "star"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Drawer 3: Career Portfolio</span>
                  <span
                    className={`hidden sm:inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                      activeOutputTab === "star"
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    STAR Format
                  </span>
                </button>
              </div>

              {/* Dynamic Tab Content (Mirrors Actual Tab Cards) */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs min-h-[220px]">
                {/* 1. Weekly Snippet View */}
                {activeOutputTab === "weekly" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Short-Term · Monday Sync
                        </span>
                        <span className="text-xs text-zinc-400">Optimized for Slack & 1-on-1s</span>
                      </div>
                      <button
                        onClick={() =>
                          handleCopySnippet(
                            `📢 [Weekly Snippets] Monday Sync\n\n✅ Progress (Completed)\n${activeData.weeklySnippet.done.map((item) => `• ${item}`).join("\n")}\n\n⏳ In-Flight & Bottlenecks\n• ${activeData.weeklySnippet.inProgress[0]}\n\n---\n⚡ Synthesized with WinStash 3-Way Career OS`,
                            "Weekly Snippet"
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedNotification === "Weekly Snippet" ? "Copied Snippet!" : "Copy Weekly Snippet"}</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm">
                      <div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px] block mb-1">
                          ✅ Done (High Impact Wins)
                        </span>
                        <ul className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                          {activeData.weeklySnippet.done.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider text-[11px] block mb-1">
                          🔄 In Progress
                        </span>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          • {activeData.weeklySnippet.inProgress[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Brag Document View */}
                {activeOutputTab === "brag" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Mid-Term · Promotion & Compensation
                        </span>
                        <span className="text-xs text-zinc-400">{activeData.bragDoc.quarter} Metric Punch</span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        XYZ Impact Formula Verified
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Quantifiable Metric Achievement</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                          {activeData.bragDoc.metricSummary}
                        </h4>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <span className="font-semibold text-emerald-900 dark:text-emerald-300 mr-1.5">
                          Strategic Business Impact:
                        </span>
                        {activeData.bragDoc.businessImpact}
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                          Key Milestones:
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {activeData.bragDoc.milestones.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                              ✓ {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. STAR Resume View */}
                {activeOutputTab === "star" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Long-Term · Career Vault & Stories
                        </span>
                        <span className="text-xs text-zinc-400">STAR Story Method + NDA Shield</span>
                      </div>

                      {/* NDA Toggle Simulation */}
                      <button
                        onClick={() => setIsNdaMasked(!isNdaMasked)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isNdaMasked
                            ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isNdaMasked ? "NDA Shield: ON" : "NDA Shield: OFF"}</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                        {isNdaMasked
                          ? activeData.starResume.title.replace(/Toss/g, "[Fintech Client A]")
                          : activeData.starResume.title}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                          <span className="font-bold text-amber-600 uppercase text-[11px] block">
                            S · Situation
                          </span>
                          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-xs">
                            {activeData.starResume.situation}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                          <span className="font-bold text-indigo-600 uppercase text-[11px] block">
                            T · Task
                          </span>
                          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-xs">
                            {activeData.starResume.task}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                          <span className="font-bold text-emerald-600 uppercase text-[11px] block">
                            A · Action
                          </span>
                          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-xs">
                            {activeData.starResume.action}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 space-y-1">
                          <span className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[11px] block">
                            R · Result (Quantifiable XYZ)
                          </span>
                          <p className="text-zinc-900 dark:text-zinc-50 font-semibold leading-relaxed text-xs">
                            {activeData.starResume.result}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeData.starResume.ndaTags.map((tag, i) => (
                          <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Builder / Creator Note */}
          <div className="pt-4 flex items-center justify-center text-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 shadow-xs">
              <Briefcase className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
              Built by a working professional who writes weekly reports for a living.
            </span>
          </div>
        </section>

        {/* 4. Section 3: The 3 Core Value Drawers */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance">
              One Weekly Action. Three Career-Defining Assets.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-pretty">
              Never start from a blank page again when annual review or unexpected recruiter outreach arrives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Drawer 1 Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-indigo-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  [Short-Term] Every Monday
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Weekly Snippets (PPP)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
                Structured into Progress, Plans, and Problems. Optimized for async Slack check-ins and executive skip-level syncs in 1 click.
              </p>
              <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>1-Click Weekly Snippet Copy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Drawer 2 Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  [Mid-Term] Quarterly / Annual
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  XYZ Performance Review (Brag Sheet)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
                Condenses 12 weeks of micro-tasks into 3, 5, or 10 high-leverage bullet points. Built on the proven XYZ impact formula for promo packets.
              </p>
              <div className="pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>1-Click Performance Review Copy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Drawer 3 Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-amber-500/40 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200/60 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  [Long-Term] Senior Interviews
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  STAR Career Portfolio & NDA Shield
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
                Elevates accomplishments into complete Situation-Task-Action-Result case studies with automatic client anonymity masking.
              </p>
              <div className="pt-2 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>1-Click Career Portfolio Copy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Section 4: Enterprise-Grade Privacy & Security Showcase */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800">
          <div className="bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-indigo-300">
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy & Security Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
                Your career notes stay yours.
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed text-pretty max-w-xl">
                Logging sensitive internal projects shouldn&apos;t keep you up at night. WinStash offers client anonymity masking, strict tenant isolation, and encryption at rest &amp; in transit.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Encrypted at Rest &amp; in Transit</strong>
                    <span className="text-zinc-400 text-pretty block">AES-256 encryption for stored notes and TLS for everything in transit.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">NDA De-Identification Engine</strong>
                    <span className="text-zinc-400 text-pretty block">Helps mask confidential clients, tools, and metrics before export. Always review before sharing.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section 5: Global Tech Frameworks & Standards */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800 text-center space-y-6">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Built on proven frameworks: XYZ, STAR, PPP
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold text-sm sm:text-base">
              <Award className="w-5 h-5 text-indigo-500" />
              <span>XYZ Impact Formula</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold text-sm sm:text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>STAR Story Framework</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold text-sm sm:text-base">
              <Terminal className="w-5 h-5 text-amber-500" />
              <span>PPP Weekly Cadence</span>
            </div>
          </div>
        </section>

        {/* 7. Section 6: Frequently Asked Questions (Accordion) */}
        <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-pretty">
              Everything you need to know about WinStash free plan, privacy, and export formats.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {[
              {
                q: "What is included in the free plan? Do I need a credit card?",
                a: "WinStash is 100% free to start with zero credit card required. Upon signing in, you receive 5 full AI weekly transformations, 3 performance review (Brag Sheet) syntheses, and 3 STAR portfolio case study syntheses. You can continue logging your raw career wins for free forever.",
              },
              {
                q: "What happens after I use my free AI credits?",
                a: "You can continue logging and storing your weekly notes for free forever. During our public beta, active users who share feedback can get credits topped up anytime. When we launch, WinStash Pro ($5.99/mo) will unlock unlimited syntheses.",
              },
              {
                q: "Can I use WinStash if I am not a Software Engineer?",
                a: "Absolutely. WinStash supports 6 dedicated career personas (Engineering, Product Management, Product Design, Growth & Marketing, Sales & BD, BizOps & Finance) and 4 narrative voices (Impact, Problem Solving, Stability, Leadership). AI tunes metrics and domain-specific terminology for your exact discipline.",
              },
              {
                q: "How does the NDA Confidentiality Shield protect my company's secrets?",
                a: "The NDA Shield helps detect internal proprietary code names, client names, and confidential metrics, replacing them with standardized placeholders (e.g. '[Tier-1 Fintech Gateway]') so you can safely prepare external portfolio case studies or resumes. Always review synthesized outputs before external sharing.",
              },
              {
                q: "How do I export my synthesized career achievements?",
                a: "In 1 click, you can copy structured, golden-standard Markdown formatted with callouts and checklists for Notion, Slack, Google Docs, or ATS applications—complete with verified WinStash career attribution.",
              },
              {
                q: "How much time does WinStash take every Friday?",
                a: "Only about 60 seconds. You don't need to format anything—just brain-dump what you worked on, shipped, or fixed. WinStash categorizes it into your 3 career drawers automatically.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform ${
                      openFaq === idx ? "rotate-180 text-indigo-500" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3 text-pretty">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 8. Section 7: Final High-Conversion CTA & Footer */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
          <div className="p-8 sm:p-14 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl space-y-6">
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-balance">
              <span className="block">Start building your career vault this Friday.</span>
              <span className="block mt-1 sm:mt-2 text-zinc-300">Never lose another promotion-worthy win.</span>
            </h3>
            <p className="text-xs sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed text-pretty">
              Built for engineers, product managers, and anyone who reports to someone. Take command of your career story in 1 minute a week.
            </p>
            <div className="pt-2 flex flex-col items-center justify-center gap-2.5">
              <button
                onClick={handleGoogleLogin}
                disabled={loading !== null}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl transition-all cursor-pointer active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                  <GoogleIcon className="w-3.5 h-3.5" />
                </div>
                <span>Start Stashing in 60s — It&apos;s Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-zinc-400 font-medium text-pretty text-center px-4">
                Free to start · Pro ($5.99/mo) adds unlimited AI syntheses after launch
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-10 bg-white/50 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 space-y-3 px-4">
        <p>© 2026 WinStash. AI Career Memory for Everything You Do.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link
            href="/resources"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors underline-offset-4 hover:underline text-zinc-700 dark:text-zinc-300"
          >
            Resources &amp; Templates
          </Link>
          <span>·</span>
          <Link
            href="/terms"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          <span>·</span>
          <Link
            href="/privacy"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <span>·</span>
          <Link
            href="/refund"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
          >
            Refund Policy
          </Link>
          <span>·</span>
          <a
            href="mailto:thestudioplus26@gmail.com"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-4 hover:underline"
          >
            Contact & Support
          </a>
          <span>·</span>
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            Feedback & Issue Report
          </button>
        </div>
        <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
          AES-256 encryption at rest &amp; in transit, and confidential tenant isolation guaranteed.
        </p>
        <p className="text-[10px] text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Disclaimer: WinStash is an independent product and is not affiliated with, endorsed by, or sponsored by Google LLC, Amazon.com, Inc., or any other referenced organizations. All trademarks belong to their respective owners. AI-synthesized outputs should be reviewed and verified by the user before professional use.
        </p>
      </footer>

      {/* Feedback Modal for Visitors */}
      <FeedbackModalEn
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
}
