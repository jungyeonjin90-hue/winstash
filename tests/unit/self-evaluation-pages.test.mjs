/**
 * Unit tests for lib/resources/selfEvaluationPages.ts (data behind /resources/self-evaluation-examples-*).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  SELF_EVALUATION_PAGES,
  buildTemplate,
  countExamples,
  getSelfEvaluationPage,
} from "../../lib/resources/selfEvaluationPages.ts";
import { CANT_REMEMBER_GUIDE_SLUG } from "../../lib/resources/guides.ts";

const appDir = path.resolve(import.meta.dirname, "../../app/resources");

describe("self-evaluation pages", () => {
  test("slugs are unique and each has a route that loads its own data", () => {
    const slugs = SELF_EVALUATION_PAGES.map((p) => p.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const slug of slugs) {
      const route = fs.readFileSync(path.join(appDir, slug, "page.tsx"), "utf8");
      assert.ok(route.includes(`getSelfEvaluationPage("${slug}")`), `${slug} route loads another page's data`);
    }
  });

  test("every page carries 25 examples, growth examples, rewrites, and FAQs", () => {
    for (const page of SELF_EVALUATION_PAGES) {
      assert.equal(countExamples(page), 25, page.slug);
      assert.equal(page.growthExamples.length, 5, page.slug);
      assert.equal(page.beforeAfter.length, 3, page.slug);
      assert.ok(page.faq.length >= 4, page.slug);
    }
  });

  test("no example sentence is reused across or within pages", () => {
    const seen = new Map();
    for (const page of SELF_EVALUATION_PAGES) {
      const sentences = [
        ...page.competencies.flatMap((c) => c.examples),
        ...page.growthExamples,
      ];
      for (const s of sentences) {
        assert.ok(!seen.has(s), `"${s}" appears on ${seen.get(s)} and ${page.slug}`);
        seen.set(s, page.slug);
      }
    }
  });

  test("search snippets stay within typical display limits", () => {
    for (const page of SELF_EVALUATION_PAGES) {
      assert.ok(page.title.length <= 70, `${page.slug} title is ${page.title.length} chars`);
      assert.ok(page.description.length <= 200, `${page.slug} description is ${page.description.length} chars`);
    }
  });

  test("template lists each competency as a section", () => {
    const page = getSelfEvaluationPage("self-evaluation-examples-sales");
    const template = buildTemplate(page);
    assert.ok(template.includes(`Role: ${page.role}`));
    for (const c of page.competencies) assert.ok(template.includes(`### ${c.name}`));
  });

  test("the can't-remember guide has a route at its slug", () => {
    assert.ok(fs.existsSync(path.join(appDir, CANT_REMEMBER_GUIDE_SLUG, "page.tsx")));
  });

  test("unknown slug throws", () => {
    assert.throws(() => getSelfEvaluationPage("nope"));
  });
});
