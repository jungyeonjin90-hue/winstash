import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Clock, ListChecks, ShieldCheck, Wand2 } from "lucide-react";
import { ResourceHeader, ResourceFooter } from "@/components/resources/ResourceChrome";
import { getPublishedArticle, getPublishedArticles } from "@/lib/resources/articles";
import { SELF_EVALUATION_PAGES } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";

/**
 * Markdown articles from content/resources/*.md. Published articles are prerendered at build time;
 * the hourly revalidation lets a scheduled article (future `date`) appear without a new deploy.
 * Folders next to this one (the hand-written pages) take precedence over this dynamic route.
 */
export const revalidate = 3600;

const BASE_URL = "https://winstash.net";

export function generateStaticParams() {
  return getPublishedArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticle(slug);
  if (!article) return {};
  const url = `${BASE_URL}/resources/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      siteName: "WinStash",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${article.title} - WinStash` }],
      locale: "en_US",
      type: "article",
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["/og-image.png"],
    },
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

// Styles for the HTML rendered from Markdown (lib/resources/articleFormat.ts).
const bodyClass = [
  "text-base text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-5",
  "[&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-zinc-900 dark:[&_h2]:text-zinc-50 [&_h2]:pt-6 [&_h2]:scroll-mt-20",
  "[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-zinc-900 dark:[&_h3]:text-zinc-100 [&_h3]:pt-2 [&_h3]:scroll-mt-20",
  "[&_h4]:font-bold [&_h4]:text-zinc-900 dark:[&_h4]:text-zinc-100",
  "[&_a]:font-semibold [&_a]:text-indigo-600 dark:[&_a]:text-indigo-400 [&_a]:underline-offset-2 hover:[&_a]:underline",
  "[&_strong]:font-bold [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 dark:[&_blockquote]:border-indigo-800 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400",
  "[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-zinc-100 dark:[&_code]:bg-zinc-800",
  "[&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:bg-zinc-900 [&_pre]:text-zinc-100 [&_pre]:text-sm [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-100",
  "[&_.table-wrap]:overflow-x-auto [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse",
  "[&_th]:text-left [&_th]:font-bold [&_th]:p-2.5 [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-900 [&_th]:border [&_th]:border-zinc-200 dark:[&_th]:border-zinc-800",
  "[&_td]:p-2.5 [&_td]:align-top [&_td]:border [&_td]:border-zinc-200 dark:[&_td]:border-zinc-800",
  "[&_hr]:border-zinc-200 dark:[&_hr]:border-zinc-800",
].join(" ");

const card = "p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800";

export default async function ResourceArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getPublishedArticle(slug);
  if (!article) notFound();

  const url = `${BASE_URL}/resources/${article.slug}`;
  const signupUrl = (placement: string) =>
    `${BASE_URL}/?utm_source=resources&utm_medium=seo&utm_campaign=${article.slug}-${placement}`;

  // Related reading: the newest other articles, then the existing guides.
  const related = [
    ...getPublishedArticles()
      .filter((a) => a.slug !== article.slug)
      .slice(0, 3)
      .map((a) => ({ href: `/resources/${a.slug}`, title: a.title })),
    { href: `/resources/${CANT_REMEMBER_GUIDE_SLUG}`, title: "How to Write a Self-Review When You Can't Remember What You Did" },
    { href: "/resources/brag-doc-template-software-engineers", title: "Brag Doc Template (Free Markdown)" },
  ].slice(0, 4);

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: article.title,
      description: article.description,
      url,
      mainEntityOfPage: url,
      datePublished: article.date,
      dateModified: article.updated ?? article.date,
      image: `${BASE_URL}/og-image.png`,
      author: { "@type": "Organization", name: "WinStash", url: BASE_URL },
      publisher: {
        "@type": "Organization",
        name: "WinStash",
        logo: { "@type": "ImageObject", url: `${BASE_URL}/icon-192.png` },
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Resources", item: `${BASE_URL}/resources` },
        { "@type": "ListItem", position: 3, name: article.title, item: url },
      ],
    },
  ];

  if (article.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: article.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ResourceHeader signupHref={signupUrl("nav")} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 min-w-0">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <Link href="/resources" className="hover:underline">Resources</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">{article.title}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15] text-balance">
            {article.title}
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
            {article.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            {article.updated && <span>Updated {formatDate(article.updated)}</span>}
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readingMinutes} min read
            </span>
          </div>
        </div>

        {article.tldr.length > 0 && (
          <aside className="p-5 sm:p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/60 space-y-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <ListChecks className="w-4 h-4" />
              TL;DR
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {article.tldr.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </aside>
        )}

        {article.headings.length >= 3 && (
          <nav aria-label="On this page" className={`${card} space-y-2`}>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">On this page</p>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              {article.headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className={bodyClass} dangerouslySetInnerHTML={{ __html: article.html }} />

        <section className="rounded-2xl p-5 sm:p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 space-y-3">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Wand2 className="w-4 h-4" />
            Free tool · No sign-up
          </p>
          <p className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">Turn one work note into a STAR story</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Paste a sentence or two about something you did. You get a STAR story and a resume bullet that only use what
            you wrote.
          </p>
          <Link
            href="/tools/star-method-generator"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900"
          >
            <span>Try the STAR generator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {article.faq.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold tracking-tight">Frequently asked questions</h2>
            <div className="space-y-3">
              {article.faq.map((item) => (
                <div key={item.q} className={`${card} space-y-1`}>
                  <h3 className="text-sm sm:text-base font-bold">{item.q}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950 border border-indigo-500/30 p-6 sm:p-8 text-white space-y-4">
          <h2 className="text-2xl font-black tracking-tight leading-tight">Write it down this week. Use it at review time.</h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            WinStash keeps a short note from each week and turns your notes into a weekly update, a brag sheet and STAR
            stories, using only what you wrote.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              href={signupUrl("bottom_cta")}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-white text-zinc-950 hover:bg-zinc-100"
            >
              <span>Start free on WinStash</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Free plan · No credit card required
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-extrabold tracking-tight">Keep reading</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className={`${card} block h-full text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:border-indigo-500/70 hover:text-indigo-600 dark:hover:text-indigo-400`}
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Self-evaluation examples by role:{" "}
            {SELF_EVALUATION_PAGES.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && " · "}
                <Link href={`/resources/${p.slug}`} className="hover:underline text-zinc-600 dark:text-zinc-300">
                  {p.role}
                </Link>
              </span>
            ))}
          </p>
        </section>
      </main>

      <ResourceFooter />
    </div>
  );
}
