import fs from "node:fs";
import path from "node:path";
import { isPublished, parseArticle, type Article } from "@/lib/resources/articleFormat";

/**
 * Markdown articles: one file in content/resources/ = one page at /resources/{slug}.
 * An article appears (page, /resources hub, sitemap) once its `date` has passed and `draft` is not true;
 * those pages revalidate hourly, so a scheduled article goes live without a new deploy.
 * next.config.ts traces content/resources into the server bundle so revalidation can read the files.
 */
const CONTENT_DIR = path.join(process.cwd(), "content", "resources");

export function getAllArticles(): Article[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const articles = fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
    .map((name) => {
      try {
        return parseArticle(fs.readFileSync(path.join(CONTENT_DIR, name), "utf8"));
      } catch (e) {
        throw new Error(`content/resources/${name}: ${(e as Error).message}`);
      }
    });

  const seen = new Set<string>();
  for (const a of articles) {
    if (seen.has(a.slug)) throw new Error(`Two articles use the slug "${a.slug}"`);
    seen.add(a.slug);
  }
  return articles.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

/** Published articles, newest first. */
export function getPublishedArticles(now: Date = new Date()): Article[] {
  return getAllArticles().filter((a) => isPublished(a, now));
}

export function getPublishedArticle(slug: string, now: Date = new Date()): Article | undefined {
  return getPublishedArticles(now).find((a) => a.slug === slug);
}
