/**
 * Unit tests for lib/llmsTxt.ts and lib/landingFaq.ts.
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseArticle } from "../../lib/resources/articleFormat.ts";
import { SELF_EVALUATION_PAGES } from "../../lib/resources/selfEvaluationPages.ts";
import { CANT_REMEMBER_GUIDE_SLUG } from "../../lib/resources/guides.ts";
import { PRO_PRICE_USD } from "../../lib/lemonSqueezyConfig.ts";
import { buildLlmsTxt } from "../../lib/llmsTxt.ts";
import { getLandingFaqs } from "../../lib/landingFaq.ts";

const root = path.resolve(import.meta.dirname, "../..");
const contentDir = path.join(root, "content/resources");

const allArticles = fs
  .readdirSync(contentDir)
  .filter((name) => name.endsWith(".md") && !name.startsWith("_"))
  .map((name) => parseArticle(fs.readFileSync(path.join(contentDir, name), "utf8")));

const SCHEDULED_NOV_DEC_SLUGS = [
  "year-end-performance-review-examples",
  "self-evaluation-examples-data-engineers",
  "how-to-ask-for-a-raise-in-a-performance-review",
  "performance-review-phrases-for-leadership",
  "self-evaluation-examples-managers",
  "performance-review-response-examples",
  "year-end-performance-review-preparation-checklist",
  "self-evaluation-examples-devops-engineers",
  "how-to-write-a-self-evaluation-after-a-tough-year",
  "performance-review-meeting-questions-for-manager",
  "self-evaluation-examples-account-managers",
  "how-performance-review-calibration-works",
];

describe("buildLlmsTxt", () => {
  test("includes core product info and live pages, while hiding future scheduled articles on 2026-11-21", () => {
    const out = buildLlmsTxt({
      articles: allArticles,
      selfEvalPages: SELF_EVALUATION_PAGES,
      cantRememberSlug: CANT_REMEMBER_GUIDE_SLUG,
      proPriceUsd: PRO_PRICE_USD,
      now: new Date("2026-11-21T00:00:00Z"),
    });

    assert.ok(out.startsWith("# WinStash\n"));
    assert.ok(out.includes("https://winstash.net/pricing"));
    assert.ok(out.includes("https://winstash.net/tools/star-method-generator"));
    assert.ok(out.includes("https://winstash.net/resources/peer-review-examples-for-coworkers"));
    assert.ok(out.includes("https://winstash.net/resources/end-of-year-wrap-up-email-to-manager-template"));
    assert.ok(out.includes(`https://winstash.net/resources/${CANT_REMEMBER_GUIDE_SLUG}`));
    assert.ok(out.includes("$5.99"));

    for (const slug of SCHEDULED_NOV_DEC_SLUGS) {
      assert.ok(!out.includes(slug), `${slug} must remain hidden on 2026-11-21`);
    }
  });

  test("includes all 12 Nov/Dec scheduled articles once their publish dates have passed", () => {
    const out = buildLlmsTxt({
      articles: allArticles,
      selfEvalPages: SELF_EVALUATION_PAGES,
      cantRememberSlug: CANT_REMEMBER_GUIDE_SLUG,
      proPriceUsd: PRO_PRICE_USD,
      now: new Date("2026-12-20T00:00:00Z"),
    });

    for (const slug of SCHEDULED_NOV_DEC_SLUGS) {
      assert.ok(out.includes(`https://winstash.net/resources/${slug}`), `${slug} should appear after publish date`);
    }
  });
});

describe("getLandingFaqs", () => {
  test("returns 8 non-empty Q&A items", () => {
    const liveFaqs = getLandingFaqs(true);
    assert.equal(liveFaqs.length, 8);
    for (const faq of liveFaqs) {
      assert.ok(faq.q.trim().length > 0);
      assert.ok(faq.a.trim().length > 0);
    }

    const betaFaqs = getLandingFaqs(false);
    assert.equal(betaFaqs.length, 8);
    assert.notEqual(liveFaqs[4].a, betaFaqs[4].a);
  });
});
