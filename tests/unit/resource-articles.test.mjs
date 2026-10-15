/**
 * Unit tests for lib/resources/articleFormat.ts and the Markdown articles in content/resources/.
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import {
  isPublished,
  parseArticle,
  parseFrontmatter,
  renderInline,
  renderMarkdown,
} from "../../lib/resources/articleFormat.ts";
import { SELF_EVALUATION_PAGES } from "../../lib/resources/selfEvaluationPages.ts";

const root = path.resolve(import.meta.dirname, "../..");
const contentDir = path.join(root, "content/resources");
const appResourcesDir = path.join(root, "app/resources");

const articleFiles = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
const articles = articleFiles.map((f) => ({ file: f, ...parseArticle(fs.readFileSync(path.join(contentDir, f), "utf8")) }));

describe("frontmatter", () => {
  test("parses strings, lists and faq pairs", () => {
    const { data, body } = parseFrontmatter(
      [
        "---",
        'title: "A \\"quoted\\" title"',
        "slug: my-post",
        "keywords:",
        "  - one",
        '  - "two, three"',
        "faq:",
        '  - q: "Why?"',
        '    a: "Because."',
        "---",
        "Body",
      ].join("\n")
    );
    assert.equal(data.title, 'A "quoted" title');
    assert.equal(data.slug, "my-post");
    assert.deepEqual(data.keywords, ["one", "two, three"]);
    assert.deepEqual(data.faq, [{ q: "Why?", a: "Because." }]);
    assert.equal(body, "Body");
  });

  test("rejects a file without frontmatter", () => {
    assert.throws(() => parseFrontmatter("# Hello"), /frontmatter/);
  });

  test("rejects a bad slug and a bad date", () => {
    const base = (slug, date) => `---\ntitle: T\ndescription: D\nslug: ${slug}\ndate: ${date}\n---\nx`;
    assert.throws(() => parseArticle(base("Bad Slug", "2026-10-15")), /slug/);
    assert.throws(() => parseArticle(base("ok-slug", "not a date")), /date/);
  });
});

describe("markdown rendering", () => {
  test("escapes HTML in text", () => {
    const { html } = renderMarkdown('Hello <script>alert("x")</script>');
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("&lt;script&gt;"));
  });

  test("drops unsafe link targets", () => {
    assert.ok(!renderInline("[x](javascript:alert(1))").includes("href"));
    assert.ok(renderInline("[tool](/tools/star-method-generator)").includes('href="/tools/star-method-generator"'));
    assert.ok(renderInline("[ext](https://example.com)").includes('rel="noopener noreferrer"'));
    assert.ok(!renderInline("[home](https://winstash.net/)").includes("target="));
  });

  test("inline formatting", () => {
    assert.equal(renderInline("**bold** and *it* and `a*b*c`"), "<strong>bold</strong> and <em>it</em> and <code>a*b*c</code>");
  });

  test("blocks: headings, lists, quotes, tables, code", () => {
    const { html, headings } = renderMarkdown(
      [
        "## First part",
        "",
        "Para one",
        "continues.",
        "",
        "- a",
        "- b",
        "",
        "1. one",
        "2. two",
        "",
        "> **S:** line one",
        "> **T:** line two",
        "",
        "| A | B |",
        "| --- | --- |",
        "| 1 | 2 |",
        "",
        "```",
        "<raw> **not bold**",
        "```",
        "",
        "## First part",
      ].join("\n")
    );
    assert.deepEqual(headings, [
      { id: "first-part", text: "First part" },
      { id: "first-part-2", text: "First part" },
    ]);
    assert.ok(html.includes("<p>Para one continues.</p>"));
    assert.ok(html.includes("<ul><li>a</li><li>b</li></ul>"));
    assert.ok(html.includes("<ol><li>one</li><li>two</li></ol>"));
    assert.ok(html.includes("<blockquote><p><strong>S:</strong> line one</p><p><strong>T:</strong> line two</p></blockquote>"));
    assert.ok(html.includes("<thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody>"));
    assert.ok(html.includes("<pre><code>&lt;raw&gt; **not bold**</code></pre>"));
  });
});

describe("publishing", () => {
  test("hidden before its date and while draft", () => {
    const now = new Date("2026-10-15T23:59:00Z");
    assert.equal(isPublished({ date: "2026-10-15T09:00:00+09:00", draft: false }, now), true);
    assert.equal(isPublished({ date: "2026-10-16T09:00:00+09:00", draft: false }, now), false);
    assert.equal(isPublished({ date: "2026-10-15T09:00:00+09:00", draft: true }, now), false);
  });
});

describe("content/resources articles", () => {
  test("there is at least one article and the template parses", () => {
    assert.ok(articles.length > 0);
    assert.doesNotThrow(() => parseArticle(fs.readFileSync(path.join(contentDir, "_template.md"), "utf8")));
  });

  for (const a of articles) {
    describe(a.file, () => {
      test("file name matches slug", () => {
        assert.equal(a.file, `${a.slug}.md`);
      });

      test("slug does not collide with a hand-written page", () => {
        assert.ok(!fs.existsSync(path.join(appResourcesDir, a.slug)), `app/resources/${a.slug} already exists`);
        assert.ok(!SELF_EVALUATION_PAGES.some((p) => p.slug === a.slug));
      });

      test("title and description fit search results", () => {
        assert.ok(a.title.length <= 60, `title is ${a.title.length} chars`);
        assert.ok(a.description.length <= 155, `description is ${a.description.length} chars`);
      });

      test("internal links point to pages that exist when this article is live", () => {
        const links = [...a.html.matchAll(/href="(\/[^"#]*)/g)].map((m) => m[1].replace(/\/$/, "") || "/");
        for (const href of links) {
          if (href === "/" || href === "/resources" || href === "/pricing" || href === "/tools/star-method-generator") continue;
          const slug = href.replace(/^\/resources\//, "");
          assert.ok(href.startsWith("/resources/"), `unexpected internal link ${href}`);
          const handWritten = fs.existsSync(path.join(appResourcesDir, slug));
          const other = articles.find((x) => x.slug === slug);
          assert.ok(handWritten || other, `${href} does not exist`);
          if (other) {
            assert.ok(Date.parse(other.date) <= Date.parse(a.date), `${href} is published after ${a.slug}`);
          }
        }
      });
    });
  }
});
