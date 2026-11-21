/**
 * Pure builder for GET /llms.txt (GEO / AI search crawler index).
 *
 * Follows the llmstxt.org Markdown format so AI assistants (ChatGPT Search, Perplexity, Claude)
 * get an accurate, up-to-date summary of WinStash's positioning, pricing, free tool, and live guides.
 *
 * Keep this module free of `@/` imports so unit tests can load it directly with Node type stripping.
 */

export interface LlmsArticleInput {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft?: boolean;
}

export interface LlmsSelfEvalInput {
  slug: string;
  rolePlural: string;
  description: string;
}

export interface BuildLlmsTxtParams {
  articles: readonly LlmsArticleInput[];
  selfEvalPages: readonly LlmsSelfEvalInput[];
  cantRememberSlug: string;
  proPriceUsd: number;
  now?: Date;
}

const BASE_URL = "https://winstash.net";

export function isRoleResourceSlug(slug: string): boolean {
  return slug.startsWith("self-evaluation-examples-");
}

export function isTemplateResourceSlug(slug: string): boolean {
  return (
    !isRoleResourceSlug(slug) &&
    (slug.includes("template") ||
      slug.includes("brag-sheet") ||
      slug.includes("brag-doc") ||
      slug.includes("work-log"))
  );
}

function isArticleLive(article: Pick<LlmsArticleInput, "date" | "draft">, now: Date): boolean {
  return !article.draft && Date.parse(article.date) <= now.getTime();
}

export function buildLlmsTxt({
  articles,
  selfEvalPages,
  cantRememberSlug,
  proPriceUsd,
  now = new Date(),
}: BuildLlmsTxtParams): string {
  const published = articles
    .filter((a) => isArticleLive(a, now))
    .slice()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const roleArticles = published.filter((a) => isRoleResourceSlug(a.slug));
  const templateArticles = published.filter((a) => isTemplateResourceSlug(a.slug));
  const guideArticles = published.filter(
    (a) => !isRoleResourceSlug(a.slug) && !isTemplateResourceSlug(a.slug)
  );

  const lines: string[] = [
    "# WinStash",
    "",
    "> WinStash turns 1-minute Friday work notes into manager-ready weekly updates, promotion brag sheets, and STAR interview stories — using only what you wrote, with nothing made up.",
    "",
    "WinStash is built for busy professionals preparing for performance reviews, self-evaluations, promotions, and interviews. Instead of scrambling at year-end to remember 12 months of work, users log short notes weekly (or backfill past weeks for an upcoming review) and synthesize them across dates.",
    "",
    "## Product Facts",
    "",
    "- **Core principle**: Strict grounding. WinStash does not invent metrics, percentages, or achievements absent from user notes.",
    "- **Supported personas**: 6 career roles (Software Engineering, Product Management, Product Design, Growth & Marketing, Sales & BD, BizOps & Finance) and 4 narrative tones (Impact, Problem Solving, Stability, Leadership).",
    "- **Outputs from one note**: (1) Weekly Update (Done / In progress / Next week), (2) Outcome-First Brag Sheet item, (3) STAR Story (Situation, Task, Action, Result).",
    `- **Pricing**: Free plan ($0 forever: unlimited manual note logging, 10 Weekly Update drafts, 3 Brag Sheet drafts, 3 STAR Story drafts, 1-click Markdown export, no credit card required). Pro plan ($${proPriceUsd}/month + tax via Lemon Squeezy Merchant of Record: unlimited AI drafts, edits, and syntheses, 1-click cancel anytime, 14-day refund policy).`,
    "- **Privacy**: Notes are private to each signed-in account. Note text and persona settings are processed via Google's Gemini API without sending user name or email; data is not sold.",
    "- **Chrome Extension**: Quick-log weekly work notes from any browser tab via the WinStash Chrome extension, synced with winstash.net.",
    "",
    "## Core Pages",
    "",
    `- [WinStash Home](${BASE_URL}/): Interactive product demo, 3-step self-review catch-up workflow, and Google sign-in.`,
    `- [Free STAR Method Generator](${BASE_URL}/tools/star-method-generator): No-sign-up interactive tool that converts one work note into a grounded STAR story and resume bullet.`,
    `- [Pricing (Free & Pro)](${BASE_URL}/pricing): Full comparison of Free ($0) and Pro ($${proPriceUsd}/mo + tax), Lemon Squeezy billing FAQ, and refund policy.`,
    `- [Career & Performance Review Resources](${BASE_URL}/resources): Hub for role-specific self-evaluation examples, review guides, and brag sheet templates.`,
    `- [Privacy Policy](${BASE_URL}/privacy): Data handling, third-party processors (Firebase, Gemini, Lemon Squeezy, PostHog, Sentry), and deletion rights.`,
    `- [Terms of Service](${BASE_URL}/terms): Acceptable use, account terms, and subscription conditions.`,
    `- [Refund & Cancellation Policy](${BASE_URL}/refund): 14-day refund eligibility and self-serve cancellation details.`,
    "",
    "## Self-Evaluation Examples by Role",
    "",
    ...selfEvalPages.map(
      (p) => `- [${p.rolePlural} Self-Evaluation Examples](${BASE_URL}/resources/${p.slug}): ${p.description}`
    ),
    ...roleArticles.map(
      (a) => `- [${a.title}](${BASE_URL}/resources/${a.slug}): ${a.description}`
    ),
    "",
    "## Self-Review & Promotion Guides",
    "",
    `- [How to Write a Self-Review When You Can't Remember What You Did](${BASE_URL}/resources/${cantRememberSlug}): Rebuild your year in 45 minutes from your calendar, email, and work tools.`,
    ...guideArticles.map(
      (a) => `- [${a.title}](${BASE_URL}/resources/${a.slug}): ${a.description}`
    ),
    "",
    "## Templates & Weekly Tracking",
    "",
    `- [Software Engineer Brag Doc Template (Free Markdown)](${BASE_URL}/resources/brag-doc-template-software-engineers): Copy-and-paste Markdown brag doc template with level-by-level focus areas.`,
    ...templateArticles.map(
      (a) => `- [${a.title}](${BASE_URL}/resources/${a.slug}): ${a.description}`
    ),
    "",
  ];

  return lines.join("\n");
}
