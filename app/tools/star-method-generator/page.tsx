import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Wand2 } from "lucide-react";
import { ResourceHeader, ResourceFooter } from "@/components/resources/ResourceChrome";
import { StarGeneratorTool } from "@/components/tools/StarGeneratorTool";

const SLUG = "star-method-generator";
const PAGE_URL = `https://winstash.net/tools/${SLUG}`;
const TITLE = "Free STAR Method Generator: Turn a Work Note into a STAR Story";
const DESCRIPTION =
  "Paste one or two sentences about something you did at work and get a STAR story (Situation, Task, Action, Result) plus a resume bullet. Free, no sign-up, and it never makes up numbers.";

const signupUrl = (placement: string) =>
  `https://winstash.net/?utm_source=free_tool&utm_medium=tool&utm_campaign=${SLUG}-${placement}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "STAR method generator",
    "STAR method examples",
    "STAR interview answer generator",
    "resume bullet generator",
    "performance review accomplishments",
    "brag sheet",
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "WinStash",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${TITLE} - WinStash` }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

const FAQ = [
  {
    q: "What is the STAR method?",
    a: "STAR stands for Situation, Task, Action, Result. It is a simple structure for describing one piece of work: the context, what you needed to do, what you did, and what changed. Interviewers, managers and promotion committees use it because it keeps a story short and concrete.",
  },
  {
    q: "Does the generator make up numbers?",
    a: "No. It only uses numbers that are in your note. If your note has no numbers, the result describes the outcome in words, and you can add the real figure yourself before you use it.",
  },
  {
    q: "Is my note saved?",
    a: "No. The free tool sends your note to the AI to write the STAR story and does not store it. Each visitor gets a few free tries per day.",
  },
  {
    q: "How is this different from WinStash?",
    a: "This page turns one note into one STAR story. WinStash keeps a short note from every week and turns all of them into your weekly update, brag sheet and STAR stories, so review season starts from a record instead of from memory.",
  },
];

const STEPS = [
  { title: "Write what you did", body: "One or two plain sentences, the way you would tell a coworker." },
  { title: "Pick your role", body: "So the wording fits your kind of work." },
  { title: "Copy the result", body: "A STAR story for interviews and reviews, plus a one-line resume bullet." },
];

export default function StarMethodGeneratorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Free STAR Method Generator",
        url: PAGE_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: DESCRIPTION,
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

      <ResourceHeader signupHref={signupUrl("nav")} showFreeToolLink={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <Link href="/resources" className="hover:underline">Resources</Link>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">STAR Method Generator</span>
          </div>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Free tool · No sign-up</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15] text-balance">
            Free STAR Method Generator
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
            Turn a rough work note into a STAR story and a resume bullet for your self-review, promotion packet or
            next interview. It only uses what you wrote, so there are no made-up numbers to defend later.
          </p>
        </div>

        <StarGeneratorTool signupHref={signupUrl("result")} />

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight">How it works</h2>
          <ol className="grid sm:grid-cols-3 gap-3">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
              >
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Step {i + 1}</span>
                <p className="text-sm font-bold">{s.title}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight">Tips for a stronger STAR story</h2>
          <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed list-disc pl-5">
            <li>Say what you did yourself, not what the team did. &quot;I set up&quot; beats &quot;we worked on&quot;.</li>
            <li>Include the before and after if you know it: days to hours, errors per week, people trained.</li>
            <li>No number? Describe what got easier or who stopped being blocked. That still counts.</li>
            <li>
              Write the note the week it happens. Months later the details are gone.{" "}
              <Link
                href="/resources/how-to-write-a-self-review-when-you-cant-remember"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Already forgot? Here is how to rebuild your year.
              </Link>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight">FAQ</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
              >
                <h3 className="text-sm font-bold">{item.q}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <ResourceFooter />
    </div>
  );
}
