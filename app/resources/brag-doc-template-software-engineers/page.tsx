import type { Metadata } from "next";
import Link from "next/link";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { CopyTemplateButton } from "@/components/resources/CopyTemplateButton";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Software Engineer Brag Doc Template (Free, Copy & Paste)",
  description:
    "A free brag document template for software engineers. Copy the Markdown, see a filled-in example, and track your impact weekly so review season is easy.",
  keywords: [
    "brag document template for software engineers",
    "software engineer brag doc",
    "brag doc example",
    "engineering promotion template",
    "tech brag sheet markdown",
  ],
  alternates: {
    canonical: "https://winstash.net/resources/brag-doc-template-software-engineers",
  },
  openGraph: {
    title: "Software Engineer Brag Doc Template (Free, Copy & Paste)",
    description:
      "A free brag document template for software engineers. Copy the Markdown, see a filled-in example, and track your impact weekly so review season is easy.",
    url: "https://winstash.net/resources/brag-doc-template-software-engineers",
    siteName: "WinStash",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Software Engineer Brag Doc Template - WinStash",
      },
    ],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Software Engineer Brag Doc Template (Free, Copy & Paste)",
    description:
      "A free brag document template for software engineers. Copy the Markdown, see a filled-in example, and track your impact weekly.",
    images: ["/og-image.png"],
  },
};

const TEMPLATE_MARKDOWN = `# [Your Name] — Engineering Brag Doc ([Year] H[1/2])
Role: [Title] · Team: [Team] · Manager: [Name]

## 1. Summary
Two or three themes for this period, one sentence each.
- Theme 1:
- Theme 2:

## 2. Major projects and impact
Use the XYZ formula: Accomplished [X], as measured by [Y], by doing [Z].

### [Project name]
- Problem: What was broken or slowing the team or business down?
- What I did: What did you design, build, or decide?
- Impact (XYZ): Accomplished [X], as measured by [Y], by doing [Z].
- Evidence: Link to the design doc, PR, dashboard, or ticket.

## 3. Reliability and operations
- On-call and incidents:
- Performance or cost improvements (before → after):
- Tech debt paid down:

## 4. Leadership and glue work
- Mentoring:
- Code and design reviews:
- Hiring and interviews:
- Cross-team help:
- Docs, talks, and process improvements:

## 5. Feedback and learning
- Feedback I received (who, when, what):
- What I learned:

## 6. Next period
- Goals I want to be able to point to next time:`;

const FAQ_ITEMS = [
  {
    q: "What is a brag document?",
    a: "A running list of your accomplishments, the impact they had, and the evidence behind them. Julia Evans popularized the idea in her canonical post on writing a brag document (jvns.ca).",
    hasLink: true,
  },
  {
    q: "How often should I update it?",
    a: "Weekly is ideal, and every two weeks works. The shorter the gap between shipping code and logging it, the more specific technical details and metrics you retain.",
    hasLink: false,
  },
  {
    q: "Is a brag doc the same as a self-review?",
    a: "No. The brag doc is the raw, ongoing record of everything you worked on. A self-review is a shorter, curated synthesis you write from it when promotion or review cycles arrive.",
    hasLink: false,
  },
  {
    q: "Can I include internal company details?",
    a: "Keep entries general and always follow your employer's confidentiality policy. When in doubt, describe the architectural problem and the business outcome without naming sensitive customer names, internal servers, or proprietary IP.",
    hasLink: false,
  },
  {
    q: "Can I use it to prepare for job interviews?",
    a: "Yes. Each project entry (Problem, What I did, Impact) maps directly to a Situation, Task, Action, Result (STAR) behavioral interview story.",
    hasLink: false,
  },
];

export default function BragDocTemplatePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: "Software Engineer Brag Doc Template (Free, Copy & Paste)",
        description:
          "A free brag document template for software engineers. Copy the Markdown, see a filled-in example, and track your impact weekly so review season is easy.",
        url: "https://winstash.net/resources/brag-doc-template-software-engineers",
        datePublished: "2026-10-01",
        dateModified: "2026-10-05",
        author: {
          "@type": "Person",
          name: "Yeonjin Jung",
          jobTitle: "Maker of WinStash",
          url: "https://winstash.net",
        },
        publisher: {
          "@type": "Organization",
          name: "WinStash",
          logo: {
            "@type": "ImageObject",
            url: "https://winstash.net/icon-192.png",
          },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Schema.org Structured Data for Search Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/en"
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
              href="https://winstash.net/en?utm_source=resources&utm_medium=seo&utm_campaign=brag-doc-swe-nav"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-xs"
            >
              <span>Try WinStash Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Article Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Breadcrumb & Title */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/en" className="hover:underline">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <Link href="/resources" className="hover:underline">
              Developer Resources
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">
              Brag Doc Template
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
            <FileText className="w-3.5 h-3.5" />
            <span>Free Engineering Template</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Software Engineer Brag Doc Template (Free Markdown)
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-1">
            <span>
              By <strong className="text-zinc-700 dark:text-zinc-300">Yeonjin Jung</strong>, the maker of WinStash and a working professional who writes weekly reports for a living
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>5 min read</span>
            </span>
            <span>•</span>
            <span>Last updated: October 2026</span>
          </div>
        </div>

        {/* Intro Lead */}
        <div className="prose prose-zinc dark:prose-invert max-w-none text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4 border-l-4 border-indigo-500 pl-4 py-1">
          <p>
            When review season arrives, most of us stare at a blank document trying to remember
            what we did in March. A <strong>brag document</strong> fixes that. It is a running,
            factual record of what you shipped, what it changed, and who you helped.
          </p>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Below is a Markdown template you can copy in one click, a filled-in
            example using the XYZ formula, and the four habits that make the document worth keeping up.
          </p>
        </div>

        {/* 3. The One-Click Copy Template Box */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-900 text-zinc-100 p-4 rounded-t-2xl border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-400">
                engineering-brag-doc-template.md
              </span>
            </div>
            <CopyTemplateButton textToCopy={TEMPLATE_MARKDOWN} />
          </div>

          <div className="relative rounded-b-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
            <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed selection:bg-indigo-600">
              <code>{TEMPLATE_MARKDOWN}</code>
            </pre>
          </div>
        </section>

        {/* 4. How to Use It (5 minutes a week) */}
        <section className="space-y-4 pt-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            How to use it (5 minutes a week)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Put it where you already work
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Copy the template into the tool you already open daily: a Markdown file in your repo,
                Notion, Obsidian, or your notes app.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Log on Friday afternoon
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every Friday, add one or two bullet points under the right section while the week’s
                PRs and incidents are still fresh in memory.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Attach proof as you ship
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When a major project concludes, write the XYZ impact line and attach one piece of
                evidence (PR link, Datadog dashboard, or RFC).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Curate for promo cycles
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Before your self-review, promotion packet, or manager 1:1, scan from top to bottom and
                cherry-pick the 5 strongest technical narratives.
              </p>
            </div>
          </div>
        </section>

        {/* 5. A Filled-in Example (Weak vs Strong) */}
        <section className="space-y-4 pt-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              A filled-in example
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Illustrative case showing the difference between a vague note and a clear, review-ready brag item.
            </p>
          </div>

          <div className="space-y-4">
            {/* Weak */}
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Weak Entry (What engineers usually write)</span>
              </div>
              <p className="text-sm font-mono text-rose-900 dark:text-rose-200 pl-6 italic">
                &quot;Improved the CI pipeline.&quot;
              </p>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 pl-6">
                Why it fails: A reviewer has no context on what was broken, what you personally built, or why it mattered to business velocity.
              </p>
            </div>

            {/* Strong */}
            <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strong Entry (XYZ Formula)</span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-mono bg-white dark:bg-zinc-900 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 text-zinc-800 dark:text-zinc-200">
                <p>
                  <strong>Project:</strong> CI pipeline speed-up
                </p>
                <p>
                  <strong>Problem:</strong> Builds took about 25 minutes, so engineers waited or
                  context-switched on every pull request.
                </p>
                <p>
                  <strong>What I did:</strong> Split the test suite into parallel jobs and added
                  dependency caching.
                </p>
                <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  <strong>Impact (XYZ):</strong> Cut median build time from 25 to 9 minutes, as
                  measured over four weeks across a team of 12, by parallelizing tests and caching
                  dependencies.
                </p>
                <p>
                  <strong>Evidence:</strong> Link to the pipeline Grafana dashboard and GitHub PR #412.
                </p>
              </div>

              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
                The strong version tells a promotion reviewer exactly <strong>why the work mattered</strong>,
                <strong>how you know</strong>, and <strong>where to verify it</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* 6. What to Emphasize at Each Level Table */}
        <section className="space-y-4 pt-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              What to emphasize at each level
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              These are general industry patterns. Your company’s internal engineering career ladder is
              the ultimate reference.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                <tr>
                  <th className="p-3.5 sm:p-4 w-32">Level</th>
                  <th className="p-3.5 sm:p-4">What reviewers look for</th>
                  <th className="p-3.5 sm:p-4">What you should log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 sm:p-4 font-bold text-zinc-900 dark:text-zinc-100">Junior</td>
                  <td className="p-3.5 sm:p-4">Reliable delivery and steep learning curve</td>
                  <td className="p-3.5 sm:p-4">Tasks completed independently, concepts learned, feedback acted upon</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 sm:p-4 font-bold text-zinc-900 dark:text-zinc-100">Mid-level</td>
                  <td className="p-3.5 sm:p-4">End-to-end feature ownership and code quality</td>
                  <td className="p-3.5 sm:p-4">Features owned from spec to prod, regressions prevented, testing standards raised</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 sm:p-4 font-bold text-zinc-900 dark:text-zinc-100">Senior</td>
                  <td className="p-3.5 sm:p-4">Architectural scope, multiplier effect & mentoring</td>
                  <td className="p-3.5 sm:p-4">Key system design decisions, junior pairing, cross-team unblocking, tech debt slashed</td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="p-3.5 sm:p-4 font-bold text-zinc-900 dark:text-zinc-100">Staff+</td>
                  <td className="p-3.5 sm:p-4">Organizational impact and technical strategy</td>
                  <td className="p-3.5 sm:p-4">Company-wide standards set, multi-quarter initiatives delivered, culture elevated</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. 4 Habits of a Brag Doc That Gets Used */}
        <section className="space-y-4 pt-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            4 habits of a brag doc that gets used
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">1.</span> Log weekly, not quarterly
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Five focused minutes on Friday afternoon beats spending an entire painful weekend
                digging through closed Jira tickets and git commits six months later.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">2.</span> Write outcomes, not just output
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Merging a pull request is output. Dropping p95 latency, cutting AWS spend, or eliminating
                manual CS tickets is an outcome. Always emphasize what changed.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">3.</span> Track glue work on purpose
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Code reviews, mentoring, incident triaging, and documentation rarely show up on sprint
                velocity charts, but they are critical for senior promotion packets.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">4.</span> Keep confidential details general
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Write &quot;Tier-1 enterprise customer&quot; instead of exact names. Describe the architectural
                challenge and percentage metrics safely without exposing proprietary secrets.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Conversion CTA Box (The Solution to Manual Maintenance) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950 border border-indigo-500/30 p-6 sm:p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>The 60-Second Alternative</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Templates are easy to copy and hard to keep up.
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Opening a blank file on Friday afternoon feels like homework, so the habit tends to fade.
                That is the exact problem <strong>WinStash</strong> was built to solve.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm font-mono text-zinc-300 space-y-2">
              <span className="text-zinc-500 text-[11px] block uppercase font-sans font-bold">
                Write a 1-minute rough Friday note:
              </span>
              <p className="text-indigo-300">
                &quot;fixed login timeout, paired with Alex on the db migration, on-call was quiet&quot;
              </p>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300">
              WinStash auto-transforms messy notes like this into:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-medium">
              <li className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Weekly Sync for Slack</span>
              </li>
              <li className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>XYZ Impact Brag Sheet</span>
              </li>
              <li className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>STAR Stories for Resumes</span>
              </li>
            </ul>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="https://winstash.net/en?utm_source=resources&utm_medium=seo&utm_campaign=brag-doc-swe"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-zinc-950 hover:bg-zinc-100 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-98 cursor-pointer"
              >
                <span>Try WinStash Free</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Free during public beta • Zero card required</span>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FAQ Section */}
        <section className="space-y-4 pt-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="py-5 space-y-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {item.q}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.hasLink ? (
                    <>
                      A running list of your accomplishments, the impact they had, and the evidence
                      behind them. Julia Evans popularized the idea in her post on writing a brag
                      document (
                      <a
                        href="https://jvns.ca/blog/brag-documents/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500 inline-flex items-center gap-0.5"
                      >
                        jvns.ca
                        <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                      </a>
                      ).
                    </>
                  ) : (
                    item.a
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 mt-16 text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WinStashBrandBadge size="sm" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              WinStash — Never Forget What You Shipped
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/en" className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">
              App Home →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
