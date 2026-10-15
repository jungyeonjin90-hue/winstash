import type { Metadata } from "next";
import Link from "next/link";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import {
  FileText,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { SELF_EVALUATION_PAGES, countExamples } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";
import { getPublishedArticles } from "@/lib/resources/articles";

// Markdown articles (content/resources) appear here once their publish date passes; hourly refresh.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Career & Performance Review Resources | WinStash",
  description:
    "Free, copy-pasteable templates and practical guides to write your self-evaluation, track your impact, and prepare for performance reviews in any role.",
  keywords: [
    "self evaluation examples by role",
    "performance review self assessment examples",
    "developer career resources",
    "brag document template",
    "engineering 1:1 meeting agenda",
    "software engineer performance review templates",
    "weekly status update template",
  ],
  alternates: {
    canonical: "https://winstash.net/resources",
  },
  openGraph: {
    title: "Career & Performance Review Resources | WinStash",
    description:
      "Free, copy-pasteable templates and practical guides to write your self-evaluation and prepare for performance reviews in any role.",
    url: "https://winstash.net/resources",
    siteName: "WinStash",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Career & Performance Review Resources - WinStash",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Career & Performance Review Resources | WinStash",
    description:
      "Free, copy-pasteable templates and practical guides to write your self-evaluation and prepare for performance reviews in any role.",
    images: ["/og-image.png"],
  },
};

export default function ResourcesHubPage() {
  const articles = getPublishedArticles();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Career & Performance Review Resources",
    description:
      "Free, copy-pasteable templates and practical guides to write your self-evaluation, track your impact, and prepare for performance reviews in any role.",
    url: "https://winstash.net/resources",
    publisher: {
      "@type": "Organization",
      name: "WinStash",
      logo: {
        "@type": "ImageObject",
        url: "https://winstash.net/icon-192.png",
      },
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Schema.org CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="WinStash Home"
          >
            <WinStashBrandBadge size="sm" />
            <span className="font-extrabold text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              WinStash
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Resources
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="https://winstash.net/?utm_source=resources_hub&utm_medium=seo&utm_campaign=hub_nav"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-xs"
            >
              <span>Try WinStash Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
            <FileText className="w-3.5 h-3.5" />
            <span>Career Toolkit</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Career & Performance Review Resources
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Free, copy-pasteable templates and practical frameworks to document what you shipped,
            track team impact, and breeze through performance reviews without the year-end panic.
          </p>
        </div>

        {/* Latest guides (Markdown articles from content/resources) */}
        {articles.length > 0 && (
          <section className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Latest guides
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Practical how-tos for weekly updates, self-reviews and promotion season.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/resources/${article.slug}`}
                  className="group block p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 transition-all"
                >
                  <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>{article.readingMinutes} min read</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{article.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 3. Self-evaluation examples by role */}
        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Self-evaluation examples by role
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Copy-and-paste examples, a free template, and before/after rewrites for your next review.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SELF_EVALUATION_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/resources/${page.slug}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {page.rolePlural}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    {page.cardSummary}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                  <span>See {countExamples(page)} examples</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free tool: STAR method generator (no sign-up) */}
          <Link
            href="/tools/star-method-generator"
            className="group block p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Free Tool
              </span>
              <span className="flex items-center gap-1">No sign-up</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">
              Free STAR Method Generator
            </h2>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Turn one or two sentences about your work into a STAR story and a resume bullet. It only uses the numbers you wrote.
            </p>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
              <span>Try it now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 0: Can't-remember self-review guide (Active) */}
          <Link
            href={`/resources/${CANT_REMEMBER_GUIDE_SLUG}`}
            className="group block p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Guide
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                8 min read
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">
              How to Write a Self-Review When You Can&apos;t Remember What You Did
            </h2>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Rebuild your year in about 45 minutes from your calendar, email, and work tools, then
              turn what you find into review-ready accomplishments. Includes a free template.
            </p>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
              <span>Read the guide</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 1: Brag Doc Template (Active) */}
          <Link
            href="/resources/brag-doc-template-software-engineers"
            className="group block p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Template Available
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                5 min read
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">
              Software Engineer Brag Doc Template (Free Markdown)
            </h2>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              A factual running record of what you shipped, what it changed, and who you helped.
              Includes copy-pasteable Markdown, a filled-in XYZ formula example, and level-by-level focus areas.
            </p>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
              <span>View template & guide</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* 5. Bottom WinStash Solution Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950 border border-indigo-500/30 p-6 sm:p-10 text-white shadow-2xl">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Automate Your Brag Doc</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Tired of maintaining templates manually?
            </h2>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              WinStash turns rough 60-second Friday notes into manager-ready weekly syncs,
              review-ready brag sheets, and STAR interview stories automatically, using only what you wrote.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="https://winstash.net/?utm_source=resources_hub&utm_medium=seo&utm_campaign=bottom_cta"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-zinc-950 hover:bg-zinc-100 transition-all shadow-lg cursor-pointer"
              >
                <span>Start Free on WinStash</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Free plan • No credit card required</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 mt-16 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WinStashBrandBadge size="sm" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              WinStash — Never Forget What You Shipped
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:underline text-zinc-600 dark:text-zinc-300">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/" className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">
              App Home →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
