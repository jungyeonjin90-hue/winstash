import type { Metadata } from "next";
import Link from "next/link";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { CopyTemplateButton } from "@/components/resources/CopyTemplateButton";
import {
  SELF_EVALUATION_PAGES,
  buildTemplate,
  countExamples,
  type SelfEvaluationPage,
} from "@/lib/resources/selfEvaluationPages";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const BASE_URL = "https://winstash.net";
const DATE_PUBLISHED = "2026-10-10";
const DATE_MODIFIED = "2026-10-10";

function pageUrl(page: SelfEvaluationPage) {
  return `${BASE_URL}/resources/${page.slug}`;
}

function signupUrl(page: SelfEvaluationPage, placement: string) {
  return `${BASE_URL}/en?utm_source=resources&utm_medium=seo&utm_campaign=${page.slug}-${placement}`;
}

export function buildSelfEvaluationMetadata(page: SelfEvaluationPage): Metadata {
  const url = pageUrl(page);
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: "WinStash",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${page.title} - WinStash` }],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/og-image.png"],
    },
  };
}

const sectionTitle =
  "text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100";
const card =
  "p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800";

export function SelfEvaluationExamplesPage({ page }: { page: SelfEvaluationPage }) {
  const url = pageUrl(page);
  const exampleCount = countExamples(page);
  const template = buildTemplate(page);
  const related = SELF_EVALUATION_PAGES.filter((p) => p.slug !== page.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.title,
        description: page.description,
        url,
        datePublished: DATE_PUBLISHED,
        dateModified: DATE_MODIFIED,
        author: {
          "@type": "Person",
          name: "YJ",
          jobTitle: "Maker of WinStash",
          url: BASE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "WinStash",
          logo: { "@type": "ImageObject", url: `${BASE_URL}/icon-192.png` },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/en" className="flex items-center gap-2.5 group cursor-pointer" aria-label="WinStash Home">
            <WinStashBrandBadge size="sm" />
            <span className="font-extrabold text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              WinStash
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Resources
            </span>
          </Link>
          <Link
            href={signupUrl(page, "nav")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-xs"
          >
            <span>Try WinStash Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        {/* Breadcrumb & title */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/en" className="hover:underline">Home</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <Link href="/resources" className="hover:underline">Resources</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">{page.breadcrumb}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
            <FileText className="w-3.5 h-3.5" />
            <span>Free Self-Evaluation Examples</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            {page.h1}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-1">
            <span>
              By <strong className="text-zinc-700 dark:text-zinc-300">YJ</strong>, the maker of WinStash
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>7 min read</span>
            </span>
            <span>•</span>
            <span>Last updated: October 2026</span>
          </div>
        </div>

        {/* Intro */}
        <div className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-4 border-l-4 border-indigo-500 pl-4 py-1">
          <p>{page.intro}</p>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Below are {exampleCount} examples you can copy, grouped by what reviewers look for. Replace
            every <strong>[bracketed]</strong> value with your own numbers.
          </p>
        </div>

        {/* Formula */}
        <section className="space-y-4">
          <h2 className={sectionTitle}>The formula behind every strong example</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["1", "What you did", "The action you personally took, not what the team did around you."],
              ["2", "The measurable result", "A number, a before-and-after, or a date. An honest estimate is fine."],
              ["3", "Why it mattered", "The effect on customers, revenue, the team, or a company goal."],
            ].map(([n, title, body]) => (
              <div key={n} className={`${card} space-y-2`}>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                  {n}
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-zinc-800 dark:text-zinc-200">Example:</strong> {page.formulaExample}
          </p>
        </section>

        {/* What reviewers look for */}
        <section className="space-y-4">
          <h2 className={sectionTitle}>What reviewers look for in a {page.role.toLowerCase()} self-evaluation</h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                <tr>
                  <th className="p-3.5 sm:p-4 w-48">Area</th>
                  <th className="p-3.5 sm:p-4">The question behind it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">
                {page.competencies.map((c) => (
                  <tr key={c.name}>
                    <td className="p-3.5 sm:p-4 font-bold text-zinc-900 dark:text-zinc-100">{c.name}</td>
                    <td className="p-3.5 sm:p-4">{c.lookFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Examples */}
        <section className="space-y-6">
          <h2 className={sectionTitle}>
            {exampleCount} self-evaluation examples for {page.rolePlural.toLowerCase()}
          </h2>
          {page.competencies.map((c) => (
            <div key={c.name} className={`${card} space-y-3`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{c.name}</h3>
                <CopyTemplateButton
                  textToCopy={c.examples.map((e) => `- ${e}`).join("\n")}
                  buttonLabel="Copy these 5"
                  copiedLabel="Copied!"
                />
              </div>
              <ul className="space-y-2.5">
                {c.examples.map((e) => (
                  <li key={e} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Growth */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className={sectionTitle}>Examples for a year that didn&apos;t go to plan</h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Most review forms ask about areas for growth. Name what happened, what you learned, and what you are changing.
            </p>
          </div>
          <ul className={`${card} space-y-2.5`}>
            {page.growthExamples.map((e) => (
              <li key={e} className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                <ArrowRight className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Before / after */}
        <section className="space-y-4">
          <h2 className={sectionTitle}>Before and after: vague vs. specific</h2>
          <div className="space-y-4">
            {page.beforeAfter.map((ba) => (
              <div key={ba.weak} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    <span>Vague</span>
                  </div>
                  <p className="text-sm text-rose-900 dark:text-rose-200 italic">&quot;{ba.weak}&quot;</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Specific</span>
                  </div>
                  <p className="text-sm text-emerald-950 dark:text-emerald-100">&quot;{ba.strong}&quot;</p>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">Why it works: {ba.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Template */}
        <section className="space-y-3">
          <h2 className={sectionTitle}>Free {page.role.toLowerCase()} self-evaluation template</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-900 text-zinc-100 p-4 rounded-t-2xl border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-400">self-evaluation-template.md</span>
            </div>
            <CopyTemplateButton textToCopy={template} />
          </div>
          <div className="relative -mt-3 rounded-b-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-xl">
            <pre className="p-4 sm:p-6 text-xs sm:text-sm font-mono text-zinc-200 overflow-x-auto leading-relaxed selection:bg-indigo-600">
              <code>{template}</code>
            </pre>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950 border border-indigo-500/30 p-6 sm:p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Can&apos;t remember what you did this year?</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Write down what you remember. WinStash does the rest.
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Paste rough notes about your year, even half-remembered ones. WinStash turns them into
                review-ready accomplishments in the same format as the examples above. Then log a
                one-minute note each Friday, and next year&apos;s review writes itself.
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-medium">
              <li className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Weekly updates for your manager</span>
              </li>
              <li className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Brag sheet for your review</span>
              </li>
              <li className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>STAR stories for interviews</span>
              </li>
            </ul>
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href={signupUrl(page, "cta")}
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
            {page.faq.map((item) => (
              <div key={item.q} className="py-5 space-y-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{item.q}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Self-evaluation examples for other roles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map((p) => (
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

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 mt-16 text-xs text-zinc-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WinStashBrandBadge size="sm" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">WinStash — Never Forget Your Wins</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:underline text-zinc-600 dark:text-zinc-300">Pricing</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/en" className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">App Home →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
