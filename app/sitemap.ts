import type { MetadataRoute } from "next";
import { SELF_EVALUATION_PAGES } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";
import { getPublishedArticles } from "@/lib/resources/articles";

// Scheduled Markdown articles join the sitemap once their publish date passes.
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://winstash.net";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/star-method-generator`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources/brag-doc-template-software-engineers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/${CANT_REMEMBER_GUIDE_SLUG}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...SELF_EVALUATION_PAGES.map((page) => ({
      url: `${baseUrl}/resources/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...getPublishedArticles().map((article) => ({
      url: `${baseUrl}/resources/${article.slug}`,
      lastModified: new Date(article.updated ?? article.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
