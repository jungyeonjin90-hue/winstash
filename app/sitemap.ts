import type { MetadataRoute } from "next";
import { SELF_EVALUATION_PAGES } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";
import { getPublishedArticles } from "@/lib/resources/articles";

// Scheduled Markdown articles join the sitemap dynamically the moment their publish date passes.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOME_LAST_MODIFIED = new Date("2026-11-21T00:00:00Z");
const PRIVACY_LAST_MODIFIED = new Date("2026-10-11T00:00:00Z");
const LEGAL_LAST_MODIFIED = new Date("2026-10-04T00:00:00Z");
const STATIC_FEATURE_LAST_MODIFIED = new Date("2026-10-31T00:00:00Z");
const DEFAULT_HUB_LAST_MODIFIED = "2026-11-13T09:00:00+09:00";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://winstash.net";
  const publishedArticles = getPublishedArticles();

  const latestArticleMs = publishedArticles.reduce((max, article) => {
    const ms = Date.parse(article.updated ?? article.date);
    return Number.isFinite(ms) && ms > max ? ms : max;
  }, 0);
  const latestArticleDate =
    latestArticleMs > 0 ? new Date(latestArticleMs) : new Date(DEFAULT_HUB_LAST_MODIFIED);

  return [
    {
      url: baseUrl,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: PRIVACY_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: STATIC_FEATURE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: latestArticleDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/star-method-generator`,
      lastModified: STATIC_FEATURE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources/brag-doc-template-software-engineers`,
      lastModified: STATIC_FEATURE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/${CANT_REMEMBER_GUIDE_SLUG}`,
      lastModified: STATIC_FEATURE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...SELF_EVALUATION_PAGES.map((page) => ({
      url: `${baseUrl}/resources/${page.slug}`,
      lastModified: STATIC_FEATURE_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...publishedArticles.map((article) => ({
      url: `${baseUrl}/resources/${article.slug}`,
      lastModified: new Date(article.updated ?? article.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
