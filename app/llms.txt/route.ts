import { getAllArticles } from "@/lib/resources/articles";
import { SELF_EVALUATION_PAGES } from "@/lib/resources/selfEvaluationPages";
import { CANT_REMEMBER_GUIDE_SLUG } from "@/lib/resources/guides";
import { PRO_PRICE_USD } from "@/lib/lemonSqueezyConfig";
import { buildLlmsTxt } from "@/lib/llmsTxt";

// Scheduled Markdown articles join /llms.txt automatically once their publish date passes.
export const revalidate = 3600;

export async function GET() {
  const body = buildLlmsTxt({
    articles: getAllArticles(),
    selfEvalPages: SELF_EVALUATION_PAGES,
    cantRememberSlug: CANT_REMEMBER_GUIDE_SLUG,
    proPriceUsd: PRO_PRICE_USD,
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
