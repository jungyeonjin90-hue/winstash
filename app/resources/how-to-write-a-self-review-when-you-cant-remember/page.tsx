import type { Metadata } from "next";
import Link from "next/link";
import { ResourceHeader, ResourceFooter } from "@/components/resources/ResourceChrome";
import { CopyTemplateButton } from "@/components/resources/CopyTemplateButton";
import { SELF_EVALUATION_PAGES } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const PAGE_URL = `https://winstash.net/resources/${CANT_REMEMBER_GUIDE_SLUG}`;
const TITLE = "How to Write a Self-Review When You Can't Remember What You Did";
const DESCRIPTION =
  "Can't remember your year? Rebuild your accomplishments in about 45 minutes from your calendar, email, and work tools, then turn them into a self-review. Free template included.";

const signupUrl = (placement: string) =>
  `https://winstash.net/?utm_source=resources&utm_medium=seo&utm_campaign=${CANT_REMEMBER_GUIDE_SLUG}-${placement}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "how to write a self review",
    "self review can't remember what I did",
    "how to remember accomplishments for performance review",
    "self evaluation tips",
    "performance review self assessment how to write",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "WinStash",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${TITLE} - WinStash` }],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

const STEPS = [
  { title: "Collect the evidence", time: "20 min", body: "Search the tools that already recorded your year." },
  { title: "Walk the year month by month", time: "10 min", body: "Use memory prompts to fill the gaps the tools missed." },
  { title: "Turn fragments into accomplishments", time: "10 min", body: "Rewrite each note as action, result, and why it mattered." },
  { title: "Pick your top 3 to 5", time: "5 min", body: "Lead with the wins your manager cares about most." },
];

const SOURCES = [
  {
    source: "Calendar",
    search: "Scroll back one month at a time. Look for recurring meetings that started or stopped, launch reviews, workshops, and offsites.",
    reveals: "Projects you joined or finished, and when",
  },
  {
    source: "Sent email",
    search: "Search your sent folder for \"launched\", \"shipped\", \"attached\", \"final\", \"approved\", and \"thank you\".",
    reveals: "Deliverables, decisions, and who you helped",
  },
  {
    source: "Slack or Teams",
    search: "Search your own messages plus words like \"thanks\", \"great work\", \"live\", and \"fixed\". Check channels for projects you led.",
    reveals: "Praise, unblocking, and quick wins nobody wrote down",
  },
  {
    source: "Project tool",
    search: "In Jira, Asana, Trello, or Linear, filter by assignee = you, status = done, and this review period.",
    reveals: "Completed work you can count",
  },
  {
    source: "Docs and Drive",
    search: "Sort files you created or edited by date.",
    reveals: "Plans, proposals, reports, and playbooks you wrote",
  },
  {
    source: "Goals and past reviews",
    search: "Open the goals or OKRs you set at the start of the period, your last review, and your 1:1 notes.",
    reveals: "What you're measured on and what you promised",
  },
  {
    source: "Your role's tools",
    search: "CRM, analytics dashboards, support desk, design files, or code history, whichever you use.",
    reveals: "The numbers: revenue, conversion, tickets, users, speed",
  },
];

const PROMPTS = [
  "What did you take over from someone else this year?",
  "What broke, and who did people call to fix it?",
  "What did you start that is now how the team works?",
  "Who did you train, onboard, or mentor?",
  "What did your manager or a customer thank you for?",
  "What would have gone worse without you?",
  "What did you stop doing, automate, or say no to that saved time?",
  "What were you working on during the company's biggest moment this year?",
];

const FRAGMENTS = [
  {
    fragment: "Calendar: \"Vendor review\" every week from March to May",
    accomplishment:
      "Led a three-month vendor evaluation across four options and recommended the one we signed, which cut our annual tooling cost by about 20%.",
  },
  {
    fragment: "Slack: \"thanks for jumping on this!\" from the support lead in August",
    accomplishment:
      "Resolved a billing bug escalation in two days that was generating roughly 30 support tickets a week.",
  },
  {
    fragment: "Drive: \"Onboarding checklist v3\" doc you created",
    accomplishment:
      "Wrote the onboarding checklist the team now uses for every new hire; the three people who joined after it were working independently within their first month.",
  },
];

const TEMPLATE = `# [Your Name] — Self-Review ([Review period])

## Summary
The one or two results I most want my manager to remember:

## Key accomplishments
Formula: what I did + the measurable result + why it mattered.
1.
2.
3.

## How I worked with others
- Helped, mentored, or unblocked:

## Areas for growth
- What didn't go to plan, what I learned, what I'm changing:

## Goals for next period
- `;

const FAQ = [
  {
    q: "How far back should a self-review go?",
    a: "Cover the review period your company sets, usually the last 6 or 12 months. Check your review form or ask your manager before you start digging.",
  },
  {
    q: "Is it okay to estimate numbers?",
    a: "Yes, as long as you say so. Phrases like \"about 20%\" or \"roughly 30 tickets a week\" are fine. Never invent a number you can't stand behind if your manager asks.",
  },
  {
    q: "What if I truly can't find the details?",
    a: "Describe the scope and your role instead: what the project was, who it served, and what you owned. Then ask a teammate or your manager what they remember about the outcome.",
  },
  {
    q: "Should I ask my manager what they remember?",
    a: "Yes. A short message such as \"Before I write my self-review, what work of mine stood out to you this year?\" often surfaces wins you forgot and shows you what they value.",
  },
  {
    q: "How do I avoid this next year?",
    a: "Write a one-minute note every Friday about what you shipped, fixed, or helped with. By review season you have a full record instead of a blank page.",
  },
];

const sectionTitle =
  "text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100";
const card =
  "p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800";

export default function CantRememberSelfReviewGuide() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: TITLE,
        description: DESCRIPTION,
        url: PAGE_URL,
        datePublished: "2026-10-10",
        dateModified: "2026-10-10",
        author: { "@type": "Person", name: "YJ", jobTitle: "Maker of WinStash", url: "https://winstash.net" },
        publisher: {
          "@type": "Organization",
          name: "WinStash",
          logo: { "@type": "ImageObject", url: "https://winstash.net/icon-192.png" },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ResourceHeader signupHref={signupUrl("nav")} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Breadcrumb & title */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <Link href="/resources" className="hover:underline">Resources</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">Can&apos;t Remember Your Year?</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Performance Review Guide</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            {TITLE}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-1">
            <span>
              By <strong className="text-zinc-700 dark:text-zinc-300">YJ</strong>, the maker of WinStash
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>8 min read</span>
            </span>
            <span>•</span>
            <span>Last updated: October 2026</span>
          </div>
        </div>

        {/* Intro */}
        <div className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4 border-l-4 border-indigo-500 pl-4 py-1">
          <p>
            Your self-review is due, you open the form, and your mind goes blank. That&apos;s normal.
            You did far more than you remember. The evidence is just scattered across the tools you
            already use.
          </p>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            This guide walks you through rebuilding your year in about 45 minutes, then turning what
            you find into a self-review your manager can actually use.
          </p>
        </div>

        {/* Steps overview */}
        <section className="space-y-4">
          <h2 className={sectionTitle}>The 45-minute method at a glance</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${card} space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.time}</span>
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{s.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Step 1 */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className={sectionTitle}>Step 1: Collect the evidence your tools already kept</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Open a blank note and spend about 20 minutes on these sources. Write one line per thing
              you find. Don&apos;t polish anything yet.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                <tr>
                  <th className="p-3.5 sm:p-4 w-36">Source</th>
                  <th className="p-3.5 sm:p-4">What to search</th>
                  <th className="p-3.5 sm:p-4 w-56">What it reveals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
                {SOURCES.map((r) => (
                  <tr key={r.source}>
                    <td className="p-3.5 sm:p-4 font-bold text-zinc-900 dark:text-zinc-100">{r.source}</td>
                    <td className="p-3.5 sm:p-4">{r.search}</td>
                    <td className="p-3.5 sm:p-4">{r.reveals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className={sectionTitle}>Step 2: Walk the year with memory prompts</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tools miss the work that happened in conversations. Go month by month and ask yourself:
            </p>
          </div>
          <ul className={`${card} grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5`}>
            {PROMPTS.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className={sectionTitle}>Step 3: Turn fragments into accomplishments</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Rewrite each line as <strong>what you did</strong> + <strong>the measurable result</strong> +{" "}
              <strong>why it mattered</strong>. If you don&apos;t have an exact number, use an honest
              estimate and say so.
            </p>
          </div>
          <div className="space-y-3">
            {FRAGMENTS.map((f) => (
              <div key={f.fragment} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">What you found</div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">{f.fragment}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    What you write
                  </div>
                  <p className="text-sm text-emerald-950 dark:text-emerald-100">{f.accomplishment}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <h2 className={sectionTitle}>Step 4: Pick your top 3 to 5</h2>
          <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
            You&apos;ll likely end up with 15 to 30 lines. Most review forms only have room for a few.
            Put these first:
          </p>
          <ul className="space-y-2 text-sm sm:text-base text-zinc-700 dark:text-zinc-300">
            {[
              "Wins tied to your team's goals or the metrics your manager reports on",
              "Work only you did, or that wouldn't have happened without you",
              "The biggest numbers: revenue, cost, time saved, customers, users",
              "One growth story: something that went wrong and what you changed",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <ArrowRight className="w-4 h-4 mt-1 text-indigo-500 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Need wording ideas? Browse the self-evaluation examples for your role below.
          </p>
        </section>

        {/* Template */}
        <section className="space-y-3">
          <h2 className={sectionTitle}>Free self-review template</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-900 text-zinc-100 p-4 rounded-t-2xl border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-400">self-review-template.md</span>
            </div>
            <CopyTemplateButton textToCopy={TEMPLATE} />
          </div>
          <div className="relative -mt-3 rounded-b-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
            <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed selection:bg-indigo-600">
              <code>{TEMPLATE}</code>
            </pre>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950 border border-indigo-500/30 p-6 sm:p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Skip steps 3 and 4</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Paste your notes. Get a review-ready brag sheet.
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                In WinStash, pick a past week, paste what you found for it, and save. Repeat for each
                project, then generate a brag sheet for the year, half, or quarter. After review season,
                a one-minute note every Friday keeps next year&apos;s review ready.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href={signupUrl("cta")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-zinc-950 hover:bg-zinc-100 transition-all shadow-lg cursor-pointer"
              >
                <span>Try WinStash Free</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Free plan • No credit card required</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className={sectionTitle}>Frequently Asked Questions</h2>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {FAQ.map((item) => (
              <div key={item.q} className="py-5 space-y-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{item.q}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Role examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Self-evaluation examples by role
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SELF_EVALUATION_PAGES.map((p) => (
              <Link
                key={p.slug}
                href={`/resources/${p.slug}`}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/80 transition-colors"
              >
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {p.rolePlural}
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </Link>
            ))}
            <Link
              href="/resources/brag-doc-template-software-engineers"
              className="group flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/80 transition-colors"
            >
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                Software Engineers (brag doc template)
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </Link>
          </div>
        </section>
      </main>

      <ResourceFooter />
    </div>
  );
}
