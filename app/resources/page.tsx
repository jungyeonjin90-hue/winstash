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
  Wand2,
  Users,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { SELF_EVALUATION_PAGES, countExamples } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";
import { getPublishedArticles } from "@/lib/resources/articles";
import type { Article } from "@/lib/resources/articleFormat";

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

function isRoleArticle(article: Article): boolean {
  return article.slug.startsWith("self-evaluation-examples-");
}

function isTemplateArticle(article: Article): boolean {
  return (
    !isRoleArticle(article) &&
    (article.slug.includes("template") ||
      article.slug.includes("brag-sheet") ||
      article.slug.includes("brag-doc") ||
      article.slug.includes("work-log"))
  );
}

function formatRoleHeading(title: string): string {
  const cleaned = title
    .replace(/\s*Self-Evaluation Examples.*$/i, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .trim();
  if (!cleaned) return title;
  if (cleaned === "Business Analyst & Data Analyst") return "Business & Data Analysts";
  if (cleaned.endsWith("Manager")) return `${cleaned}s`;
  if (cleaned.endsWith("Analyst")) return `${cleaned}s`;
  return cleaned;
}

export default function ResourcesHubPage() {
  const articles = getPublishedArticles();
  const roleArticles = articles.filter(isRoleArticle);
  const templateArticles = articles.filter(isTemplateArticle);
  const guideArticles = articles.filter((a) => !isRoleArticle(a) && !isTemplateArticle(a));

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

      {/* 2. Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-14">
        <div className="space-y-5">
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

          {/* Quick section jump pills */}
          <nav aria-label="Resource categories" className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="#free-tool"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Free STAR Generator</span>
            </a>
            <a
              href="#by-role"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Examples by Role ({SELF_EVALUATION_PAGES.length + roleArticles.length})</span>
            </a>
            <a
              href="#review-guides"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Self-Review &amp; Promotion Guides ({guideArticles.length + 1})</span>
            </a>
            <a
              href="#templates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/70 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Templates &amp; Weekly Tracking ({templateArticles.length + 1})</span>
            </a>
          </nav>
        </div>

        {/* Section 1: Featured Free Tool */}
        <section id="free-tool" className="scroll-mt-24">
          <Link
            href="/tools/star-method-generator"
            className="group block p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/60 dark:from-amber-950/25 dark:via-zinc-900 dark:to-indigo-950/25 border border-amber-200/90 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-700 shadow-xs hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/70 px-2.5 py-1 rounded-full border border-amber-300/70 dark:border-amber-800/70">
                    <Wand2 className="w-3.5 h-3.5" />
                    Interactive Free Tool
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    No sign-up required · Nothing made up
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Free STAR Method Generator
                </h2>

                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Paste one or two rough sentences about something you worked on. Instantly get a structured
                  Situation–Task–Action–Result story and a concise review bullet using only the facts you wrote.
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-zinc-900 group-hover:bg-indigo-600 dark:bg-zinc-100 dark:group-hover:bg-indigo-400 text-white dark:text-zinc-900 transition-colors shadow-sm">
                  <span>Try the generator</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Section 2: Self-evaluation examples by role (Hardcoded role pages + Markdown role pages unified) */}
        <section id="by-role" className="space-y-5 scroll-mt-24">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Self-evaluation examples by role
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Copy-and-paste examples, a fill-in template, and before/after rewrites tailored to your job.
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

            {roleArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/resources/${article.slug}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {formatRoleHeading(article.title)}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    {article.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                  <span>See examples &amp; template</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: Self-Review & Promotion Guides */}
        <section id="review-guides" className="space-y-5 scroll-mt-24">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Self-review &amp; promotion guides
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Step-by-step help for every box on your review form—when you can&apos;t remember what you did, lack metrics, or want to build a promotion case.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Flagship hardcoded guide */}
            <Link
              href={`/resources/${CANT_REMEMBER_GUIDE_SLUG}`}
              className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3 h-3" />
                    Step-by-Step Guide
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />8 min read
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                  How to Write a Self-Review When You Can&apos;t Remember What You Did
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  Rebuild your year in about 45 minutes from your calendar, email, and work tools, then turn what you find into review-ready accomplishments.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                <span>Read the guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {guideArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/resources/${article.slug}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200/70 dark:border-indigo-900/50">
                      Guide &amp; Examples
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readingMinutes} min read
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    {article.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                  <span>Read the guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 4: Templates & Weekly Tracking */}
        <section id="templates" className="space-y-5 scroll-mt-24">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Templates &amp; weekly tracking
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Copy-and-paste templates for logging weekly wins, updating your manager, and keeping a running brag sheet.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/resources/${article.slug}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                      <CheckCircle2 className="w-3 h-3" />
                      Template
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readingMinutes} min read
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                    {article.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                  <span>View template &amp; examples</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}

            {/* Hardcoded Software Engineer Brag Doc Template */}
            <Link
              href="/resources/brag-doc-template-software-engineers"
              className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-indigo-500/80 dark:hover:border-indigo-500/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3 h-3" />
                    Template
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />5 min read
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                  Software Engineer Brag Doc Template (Free Markdown)
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  A factual running record of what you shipped, what it changed, and who you helped, with level-by-level focus areas.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
                <span>View template &amp; guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </section>

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
