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
  Award,
  Cpu,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { isSignInCancelled } from "@/lib/authEvents";
import { FeedbackModalEn } from "./FeedbackModalEn";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { IS_PAYMENT_GATEWAY_LIVE } from "@/lib/lemonSqueezyConfig";

const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/winstash-weekly-career-br/lafkjhaebgdafcckekcdffiimacfpajb?utm_source=winstash.net&utm_medium=landing&utm_campaign=catch_up_steps";

const PRICING_NOTE = IS_PAYMENT_GATEWAY_LIVE
  ? "Free to start · Pro ($5.99/mo) for unlimited drafts, edits & redos"
  : "Free to start · Pro ($5.99/mo) adds unlimited drafts, edits & redos after launch";

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

// Every number, tool and name in the drafts below appears in the raw memo above it.
// Keep it that way: the demo has to show the same "nothing made up" rule the product follows.
const SHOWCASE_DATA: Record<string, ShowcaseData> = {
  operations: {
    role: "Operations / BizOps",
    roleBadge: "BizOps Manager",
    rawMemo:
      "Vendor invoice approvals were taking about 6 days because requests sat in three different inboxes. Set up one shared intake form and a weekly 30-min triage with finance and procurement. Approvals now take about 2 days. Wrote the how-to doc and walked 4 team leads through it. Next week: add the two remaining regional teams.",
    weeklySnippet: {
      done: [
        "Set up one shared intake form for vendor invoice approvals, replacing three separate inboxes",
        "Started a weekly 30-minute triage with finance and procurement",
        "Cut typical approval time from about 6 days to about 2; wrote the how-to doc and walked 4 team leads through it",
      ],
      inProgress: [
        "Collecting feedback from the 4 team leads on the new intake process",
      ],
      nextWeek: [
        "Add the two remaining regional teams to the intake form",
      ],
    },
    bragDoc: {
      metricSummary:
        "Cut vendor invoice approval time from about 6 days to about 2 by moving requests from three inboxes into one intake form with a weekly finance and procurement triage.",
      businessImpact:
        "Requests no longer sit unseen in separate inboxes, and 4 team leads now follow the same documented process.",
      milestones: [
        "One shared intake form replacing three inboxes",
        "Weekly 30-minute triage with finance and procurement",
        "How-to doc and walkthrough for 4 team leads",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "Vendor Invoice Approval Process Fix",
      situation:
        "Vendor invoice approvals were taking about 6 days because requests were spread across three different inboxes.",
      task:
        "Shorten approval time and give finance and procurement one place to see every request.",
      action:
        "Set up a shared intake form, started a weekly 30-minute triage with finance and procurement, wrote a how-to doc and walked 4 team leads through it.",
      result:
        "Approvals now take about 2 days instead of about 6. The two remaining regional teams are next.",
      ndaTags: ["#ProcessImprovement", "#CrossFunctional", "#Operations"],
    },
  },
  engineering: {
    role: "Software Engineering",
    roleBadge: "Senior Engineer",
    rawMemo:
      "Payment gateway threw 50+ timeouts/min during the flash sale. Shipped a hotfix Friday. Root cause: connection pool starvation in HikariCP. Tuned maxPoolSize and added a Redis cache for hot settlement queries. Latency went from 1,200ms to 85ms and error rate dropped to 0%. Next week: Grafana dashboard for the gateway.",
    weeklySnippet: {
      done: [
        "Shipped a Friday hotfix for payment gateway timeouts (50+/min) during the flash sale",
        "Traced the cause to HikariCP connection pool starvation; tuned maxPoolSize and added a Redis cache for hot settlement queries",
        "Latency down from 1,200ms to 85ms (93%), error rate down to 0%",
      ],
      inProgress: [
        "Watching gateway latency and errors after the hotfix",
      ],
      nextWeek: [
        "Build a Grafana dashboard for the payment gateway",
      ],
    },
    bragDoc: {
      metricSummary:
        "Cut payment gateway latency from 1,200ms to 85ms (93%) and brought the error rate to 0% by fixing HikariCP pool starvation and caching hot settlement queries in Redis.",
      businessImpact:
        "Stopped 50+ timeouts per minute on the payment gateway during the flash sale.",
      milestones: [
        "Found the root cause: connection pool starvation in HikariCP",
        "Tuned maxPoolSize and added a Redis cache for hot settlement queries",
        "Shipped the hotfix on Friday",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "Payment Gateway Timeout Fix During a Flash Sale",
      situation:
        "During a flash sale, the payment gateway was throwing more than 50 timeouts per minute.",
      task: "Find the root cause and stop the timeouts.",
      action:
        "Traced the problem to connection pool starvation in HikariCP, tuned maxPoolSize, added a Redis cache for hot settlement queries and shipped a hotfix on Friday.",
      result: "Latency dropped from 1,200ms to 85ms (93%) and the error rate fell to 0%.",
      ndaTags: ["#Reliability", "#Performance", "#Backend"],
    },
  },
  product: {
    role: "Product Management",
    roleBadge: "Product Manager",
    rawMemo:
      "Shipped the new 3-step onboarding (was 5 steps) with 1-click Google sign-up to all mobile users. After 7 days, drop-off fell from 38% to 19% and signup conversion rose 24%. Shared results at the Friday demo.",
    weeklySnippet: {
      done: [
        "Shipped the new 3-step onboarding (down from 5) with 1-click Google sign-up to all mobile users",
        "Onboarding drop-off fell from 38% to 19% and signup conversion rose 24% after 7 days",
        "Shared the results at the Friday demo",
      ],
      inProgress: [
        "Keep tracking onboarding drop-off and signup conversion",
      ],
      nextWeek: [
        "Pick the next onboarding improvement based on the 7-day results",
      ],
    },
    bragDoc: {
      metricSummary:
        "Halved mobile onboarding drop-off (38% to 19%) and raised signup conversion 24% by cutting onboarding from 5 steps to 3 and adding 1-click Google sign-up.",
      businessImpact:
        "More new mobile users finish signing up, measured over the first 7 days after full rollout.",
      milestones: [
        "Cut onboarding from 5 steps to 3",
        "Added 1-click Google sign-up",
        "Rolled out to all mobile users and shared 7-day results at the Friday demo",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "Mobile Onboarding Redesign",
      situation: "Mobile onboarding had 5 steps and 38% of new users dropped off.",
      task: "Make mobile sign-up shorter and easier to finish.",
      action:
        "Shipped a 3-step onboarding with 1-click Google sign-up to all mobile users and tracked the results for 7 days.",
      result: "Drop-off fell from 38% to 19% and signup conversion rose 24%.",
      ndaTags: ["#Onboarding", "#Conversion", "#Mobile"],
    },
  },
  marketing: {
    role: "Growth & Marketing",
    roleBadge: "Growth Marketer",
    rawMemo:
      "Tested new landing pages with benefit-first copy for US search ads. In 14 days signup conversion rose 32% and CAC fell 18%. Moved $40k of budget to the best keyword groups. Next week: set up retargeting.",
    weeklySnippet: {
      done: [
        "Launched new benefit-first landing pages for US search ads",
        "Signup conversion up 32% and CAC down 18% over 14 days",
        "Moved $40k of budget to the best-performing keyword groups",
      ],
      inProgress: [
        "Watching conversion and CAC after the budget move",
      ],
      nextWeek: [
        "Set up retargeting",
      ],
    },
    bragDoc: {
      metricSummary:
        "Raised signup conversion 32% and cut CAC 18% in 14 days by testing benefit-first landing pages for US search ads and moving $40k to the best keyword groups.",
      businessImpact: "Search ad budget now goes to the keyword groups that convert best.",
      milestones: [
        "Benefit-first landing page tests for US search ads",
        "$40k of budget moved to the best keyword groups",
        "14-day result: conversion up 32%, CAC down 18%",
      ],
      quarter: "2026-Q3",
    },
    starResume: {
      title: "Search Ad Landing Page Tests",
      situation: "US search ad campaigns needed better signup conversion and a lower CAC.",
      task: "Test new landing pages and put budget behind what worked.",
      action:
        "Ran landing page tests with benefit-first copy for 14 days and moved $40k of budget to the best keyword groups.",
      result: "Signup conversion rose 32% and CAC fell 18%.",
      ndaTags: ["#PaidSearch", "#Conversion", "#Marketing"],
    },
  },
};

export function LandingPageEn() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState<"google" | null>(null);

  // Interactive Showcase States
  const [selectedPersona, setSelectedPersona] = useState<"operations" | "engineering" | "product" | "marketing">("operations");
  const [activeOutputTab, setActiveOutputTab] = useState<"weekly" | "brag" | "star">("weekly");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const activeData = SHOWCASE_DATA[selectedPersona];

  const handleGoogleLogin = async (location: "header" | "hero" | "footer") => {
    try {
      trackEvent("landing_cta_clicked", { location });
      setLoading("google");
      await signInWithGoogle();
    } catch (e) {
      // A closed popup is the user's choice: only real failures get an alert.
      if (!isSignInCancelled(e)) {
        console.error(e);
        alert("Google sign-in encountered an error. Please try again.");
      }
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <WinStashBrandBadge size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">WinStash</span>
                {!IS_PAYMENT_GATEWAY_LIVE && (
                  <span className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/70">
                    Beta
                  </span>
                )}
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 hidden sm:inline-block">
                  Self-Review Prep
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <Link
              href="/pricing"
              className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/tools/star-method-generator"
              onClick={() => trackEvent("free_tool_link_clicked", { location: "landing_nav" })}
              className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
            >
              Try Free
            </Link>
            <Link
              href="/resources"
              className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hidden sm:inline-block"
            >
              Resources
            </Link>
            <button
              onClick={() => handleGoogleLogin("header")}
              disabled={loading !== null}
              className="flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
            >
              <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                <GoogleIcon className="w-3 h-3" />
              </div>
              {/* Short label on phones so the header fits on one line next to the logo, Pricing and Try Free */}
              <span className="sm:hidden">Sign in</span>
              <span className="hidden sm:inline">Sign In with Google</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:block" />
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
            <span>Performance review season · Free to start</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.18] max-w-4xl mx-auto text-zinc-900 dark:text-zinc-50 text-balance">
            <span className="block">
              Can&apos;t remember what you did this year?
            </span>
            <span className="block mt-2 sm:mt-3 text-indigo-600 dark:text-indigo-400">
              Turn rough notes into review-ready proof.
            </span>
          </h1>

          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal text-pretty max-w-2xl mx-auto">
              Jot a few lines about what you did. Get a brag sheet, weekly updates, and STAR stories for your review, using only what you wrote.
            </p>
          </div>

          {/* Large High-Conversion Primary CTA Button */}
          <div className="flex flex-col items-center justify-center pt-3 max-w-md mx-auto space-y-2">
            <button
              onClick={() => handleGoogleLogin("hero")}
              disabled={loading !== null}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm sm:text-base font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 p-0.5 shadow-xs">
                <GoogleIcon className="w-3.5 h-3.5" />
              </div>
              <span>Start My Self-Review — It&apos;s Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/tools/star-method-generator"
              onClick={() => trackEvent("free_tool_link_clicked", { location: "hero" })}
              className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
            >
              Or try it free without signing in →
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>No credit card required</span>
            </div>
          </div>

          {/* Review-season catch-up steps */}
          <div className="max-w-3xl mx-auto pt-6 text-left">
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 text-center">
                Self-review due soon? Catch up in 3 steps.
              </h2>
              <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  ["Pick a past week", "Choose any week or month from the year in the week picker."],
                  ["Write what you remember", "A few rough lines per project is enough. No formatting."],
                  ["Generate your brag sheet", "Synthesize the year, half, or quarter into review-ready bullets."],
                ].map(([title, body], i) => (
                  <li key={title} className="flex gap-3">
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center text-pretty">
                Then keep it going with a 1-minute note every Friday, so next year&apos;s review is already written.{" "}
                Log from any tab with the{" "}
                <a
                  href={CHROME_EXTENSION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Chrome extension
                </a>{" "}
                (Alt+W).{" "}
                <Link href="/resources" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  See self-evaluation examples by role →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* 3. Section 2: Live Interactive Transformation Showcase (Direct Match with Real App UI) */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Example</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance">
              See One Rough Note Become Three Drafts
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-pretty">
              Pick a role. Every number in the drafts comes from the note.
            </p>
            <p className="text-xs sm:text-sm">
              <Link
                href="/tools/star-method-generator"
                onClick={() => trackEvent("free_tool_link_clicked", { location: "landing_showcase" })}
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try it with your own note, no sign-up →
              </Link>
            </p>

            {/* Persona Switcher Chips */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedPersona("operations")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPersona === "operations"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                <span>🧭 Operations / BizOps</span>
              </button>

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
                + Works for any role
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
                    Step 1: 1-Min Rough Note (weekly or catching up)
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
                <span>One note, three drafts</span>
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
                  <span>Draft 1: Weekly Update</span>
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
                  <span>Draft 2: Brag Sheet</span>
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
                  <span>Draft 3: STAR Story</span>
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
                        Only numbers from your note
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>Impact statement</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                          {activeData.bragDoc.metricSummary}
                        </h4>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <span className="font-semibold text-emerald-900 dark:text-emerald-300 mr-1.5">
                          Why it mattered:
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
                          Long-Term · Interviews & Promotion
                        </span>
                        <span className="text-xs text-zinc-400">STAR Story Method</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                        {activeData.starResume.title}
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
                            R · Result
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
              One Note a Week. Three Drafts at Review Time.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-pretty">
              When your review, promotion case, or raise conversation comes up, start from a record instead of from memory.
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
                  Weekly Update (PPP)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
                Done, in progress, and next week, ready to paste into Slack or your 1:1 doc.
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
                  Brag Sheet for Your Review
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
                Condenses weeks of notes into 3, 5, or 10 review-ready bullets: the outcome first, then how you did it. Numbers only if you wrote them.
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
                  STAR Stories
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
                Elevates accomplishments into complete Situation-Task-Action-Result case studies you can reuse in interviews and promotion packets.
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
                Logging sensitive internal projects shouldn&apos;t keep you up at night. WinStash keeps each account isolated and encrypts your notes at rest &amp; in transit.
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
                    <strong className="text-white block font-semibold">Private to Your Account</strong>
                    <span className="text-zinc-400 text-pretty block">Database rules let only your signed-in account read or change your records.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section 5: Global Tech Frameworks & Standards */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200/80 dark:border-zinc-800 text-center space-y-6">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Built on familiar frameworks
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-bold text-sm sm:text-base">
              <Award className="w-5 h-5 text-indigo-500" />
              <span>Outcome-First Bullets (XYZ idea)</span>
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
                a: "WinStash is 100% free to start with zero credit card required. When you sign in, you get 10 Weekly Update drafts, 3 Brag Sheet drafts, and 3 STAR Story drafts for free. Editing a saved week uses one Weekly Update draft. You can keep logging your notes for free forever.",
              },
              {
                q: "My self-review is due soon. Can WinStash still help?",
                a: "Yes. In the week picker, choose any past week, write a few lines about what you worked on, and save. Repeat for the projects you remember, then generate a Brag Sheet for the year, half, or quarter. The free plan's 10 Weekly Update drafts are enough to cover your biggest projects. For wording ideas, see our free self-evaluation examples by role in Resources.",
              },
              {
                q: "Will WinStash make up numbers to make me look better?",
                a: "No. Every number in your drafts comes from your notes, or from simple math on them (for example, about 6 days to about 2 days). If a note has no number, the draft describes the result in words, and you can add the real figure yourself before you use it.",
              },
              {
                q: "How is WinStash different from just using a general AI chatbot?",
                a: "Fair question. WinStash uses AI too, and if you're happy to write a good prompt and paste your notes every week, a general chatbot can do a lot of this. WinStash takes care of everything around the AI: (1) A habit, not a blank prompt—write a rough one-minute note on Friday with zero prompt tweaking. (2) Three outputs from one note—a weekly manager sync, an outcome-first brag sheet, and STAR stories in consistent formats. (3) A record that builds up—your notes stay in one place, so your brag sheet draws on months of entries instead of whatever you remembered to paste in. If you already have a prompt and routine that works for you, keep using it. WinStash is for people who want the habit to be easy enough to actually stick.",
              },
              {
                q: "What happens after I use my free AI credits?",
                a: IS_PAYMENT_GATEWAY_LIVE
                  ? "You can continue logging and storing your weekly notes for free forever. To keep generating weekly updates, Brag Sheets, and STAR stories, upgrade to WinStash Pro ($5.99/mo) for unlimited drafts, edits to past weeks, and redone Brag Sheets and STAR Stories. Cancel anytime."
                  : "You can continue logging and storing your weekly notes for free forever. During our public beta, active users who share feedback can get credits topped up anytime. When we launch, WinStash Pro ($5.99/mo) will unlock unlimited drafts, edits, and redos.",
              },
              {
                q: "Can I use WinStash if I am not a Software Engineer?",
                a: "Absolutely. WinStash supports 6 dedicated career personas (Engineering, Product Management, Product Design, Growth & Marketing, Sales & BD, BizOps & Finance) and 4 narrative voices (Impact, Problem Solving, Stability, Leadership). The wording follows your kind of work, and it still only uses what you wrote.",
              },
              {
                q: "How do I export my synthesized career achievements?",
                a: "Copy any draft as Markdown in one click and paste it into Notion, Slack, Google Docs, or your review form.",
              },
              {
                q: "How much time does WinStash take every Friday?",
                a: "Only about 60 seconds. You don't need to format anything—just brain-dump what you worked on, shipped, or fixed. WinStash turns it into your three drafts automatically.",
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
              <span className="block">Start your record this Friday.</span>
              <span className="block mt-1 sm:mt-2 text-zinc-300">Bring proof to your next review.</span>
            </h3>
            <p className="text-xs sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed text-pretty">
              Catch up on this year&apos;s review today, then keep it going in 1 minute a week.
            </p>
            <div className="pt-2 flex flex-col items-center justify-center gap-2.5">
              <button
                onClick={() => handleGoogleLogin("footer")}
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
                {PRICING_NOTE}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-10 bg-white/50 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 space-y-3 px-4">
        <p>© 2026 WinStash. Rough work notes into review-ready proof.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <Link
            href="/pricing"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors underline-offset-4 hover:underline text-indigo-600 dark:text-indigo-400"
          >
            Pricing
          </Link>
          <span>·</span>
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
          Notes are encrypted at rest &amp; in transit and private to your account.
        </p>
        <p className="text-[10px] text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Disclaimer: WinStash is an independent product and is not affiliated with, endorsed by, or sponsored by any company or trademark holder mentioned on this site. All trademarks belong to their respective owners. AI-synthesized outputs should be reviewed and verified by the user before professional use.
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
