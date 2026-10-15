/**
 * Parsing and rendering for Markdown articles in content/resources/*.md (served at /resources/{slug}).
 *
 * Only a small, predictable subset is supported so no Markdown or YAML package is needed:
 * - Frontmatter: `key: value` strings, `key:` followed by `- item` lists, and `faq:` as a list of
 *   `- q: ...` / `  a: ...` pairs. Values may be wrapped in double or single quotes.
 * - Body: ## / ### headings, paragraphs, - and 1. lists, > quotes, ``` code blocks, | tables, ---,
 *   and inline **bold**, *italic*, `code` and [links](url).
 * All text is HTML-escaped; only the tags produced here end up in the page.
 *
 * Keep this module free of `@/` imports: unit tests load it directly with Node's type stripping.
 */

export interface ArticleFaq {
  q: string;
  a: string;
}

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  /** Publish time (ISO 8601). The article stays hidden until then. */
  date: string;
  updated?: string;
  keywords: string[];
  tldr: string[];
  faq: ArticleFaq[];
  /** true keeps the article hidden regardless of date. */
  draft: boolean;
}

export interface Article extends ArticleMeta {
  /** Rendered body HTML. */
  html: string;
  headings: { id: string; text: string }[];
  readingMinutes: number;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    const inner = v.slice(1, -1);
    return v.startsWith('"') ? inner.replace(/\\"/g, '"') : inner.replace(/''/g, "'");
  }
  return v;
}

type FrontmatterValue = string | string[] | Record<string, string>[];

/** Splits `---` frontmatter from the body and parses the supported YAML subset. */
export function parseFrontmatter(source: string): { data: Record<string, FrontmatterValue>; body: string } {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) throw new Error("Article is missing the --- frontmatter block");

  const data: Record<string, FrontmatterValue> = {};
  let listKey: string | null = null;

  for (const raw of match[1].split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;

    const top = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(raw);
    if (top) {
      const [, key, rest] = top;
      if (rest.trim() === "") {
        listKey = key;
        data[key] = [];
      } else {
        listKey = null;
        data[key] = unquote(rest);
      }
      continue;
    }

    if (!listKey) throw new Error(`Unexpected frontmatter line: ${raw}`);
    const list = data[listKey] as (string | Record<string, string>)[];

    const item = /^\s+-\s+(.*)$/.exec(raw);
    if (item) {
      const pair = /^([A-Za-z_][\w-]*):\s+(.*)$/.exec(item[1]);
      list.push(pair ? { [pair[1]]: unquote(pair[2]) } : unquote(item[1]));
      continue;
    }

    const cont = /^\s+([A-Za-z_][\w-]*):\s+(.*)$/.exec(raw);
    const last = list[list.length - 1];
    if (cont && last && typeof last === "object") {
      last[cont[1]] = unquote(cont[2]);
      continue;
    }
    throw new Error(`Unexpected frontmatter line: ${raw}`);
  }

  return { data, body: text.slice(match[0].length) };
}

function requireString(data: Record<string, FrontmatterValue>, key: string): string {
  const v = data[key];
  if (typeof v !== "string" || !v.trim()) throw new Error(`Article frontmatter needs "${key}"`);
  return v.trim();
}

function stringList(data: Record<string, FrontmatterValue>, key: string): string[] {
  const v = data[key];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    throw new Error(`Article frontmatter "${key}" must be a list of text lines`);
  }
  return v as string[];
}

/** Validates frontmatter into ArticleMeta. Throws with a readable message so a bad file fails the build. */
export function toArticleMeta(data: Record<string, FrontmatterValue>): ArticleMeta {
  const slug = requireString(data, "slug");
  if (!SLUG_RE.test(slug)) throw new Error(`Article slug "${slug}" must be lowercase words joined by hyphens`);

  const date = requireString(data, "date");
  if (Number.isNaN(Date.parse(date))) throw new Error(`Article "${slug}" has an invalid date: ${date}`);
  const updated = typeof data.updated === "string" ? data.updated.trim() : undefined;
  if (updated && Number.isNaN(Date.parse(updated))) throw new Error(`Article "${slug}" has an invalid updated date`);

  const rawFaq = data.faq ?? [];
  if (!Array.isArray(rawFaq)) throw new Error(`Article "${slug}" faq must be a list`);
  const faq = rawFaq.map((entry) => {
    if (typeof entry !== "object" || !entry.q || !entry.a) {
      throw new Error(`Article "${slug}" faq entries need both q and a`);
    }
    return { q: entry.q, a: entry.a };
  });

  return {
    slug,
    title: requireString(data, "title"),
    description: requireString(data, "description"),
    date,
    updated,
    keywords: stringList(data, "keywords"),
    tldr: stringList(data, "tldr"),
    faq,
    draft: data.draft === "true",
  };
}

/** Published = not a draft and the publish time has passed. */
export function isPublished(meta: Pick<ArticleMeta, "date" | "draft">, now: Date = new Date()): boolean {
  return !meta.draft && Date.parse(meta.date) <= now.getTime();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_[\]()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeHref(url: string): string | null {
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || u.startsWith("/") || u.startsWith("#") || /^mailto:/i.test(u)) return u;
  return null;
}

/** Inline Markdown on one line of text: code, links, bold, italic. */
export function renderInline(text: string): string {
  // Code spans are cut out first so their content is not formatted.
  const codes: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  const links: string[] = [];
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, url: string) => {
    const href = safeHref(url);
    if (!href) return whole;
    const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?winstash\.net/i.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    links.push(`<a href="${escapeHtml(href)}"${attrs}>${formatEmphasis(escapeHtml(label))}</a>`);
    return `\u0001${links.length - 1}\u0001`;
  });

  out = formatEmphasis(escapeHtml(out));
  out = out.replace(/\u0001(\d+)\u0001/g, (_, i: string) => links[Number(i)]);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)]);
}

function formatEmphasis(html: string): string {
  return html
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, "$1<em>$2</em>");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Renders the article body. Returns HTML plus the ## headings (for the table of contents). */
export function renderMarkdown(body: string): { html: string; headings: { id: string; text: string }[] } {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  const headings: { id: string; text: string }[] = [];
  const usedIds = new Set<string>();
  let i = 0;

  const uniqueId = (text: string) => {
    const base = slugifyHeading(text) || "section";
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  };

  const isBlockStart = (line: string) =>
    /^#{2,4}\s/.test(line) ||
    /^```/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^\|/.test(line) ||
    /^-{3,}\s*$/.test(line);

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const heading = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = uniqueId(text);
      if (level === 2) headings.push({ id, text: text.replace(/[`*]/g, "") });
      out.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++; // closing fence
      out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
      // Each quoted line is its own paragraph (e.g. Situation / Task / Action / Result).
      const paras = quote.filter((q) => q.trim()).map((q) => `<p>${renderInline(q.trim())}</p>`);
      out.push(`<blockquote>${paras.join("")}</blockquote>`);
      continue;
    }

    const bullet = /^\s*[-*]\s+/;
    const numbered = /^\s*\d+\.\s+/;
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const marker = ordered ? numbered : bullet;
      const items: string[] = [];
      while (i < lines.length && marker.test(lines[i])) {
        let item = lines[i++].replace(marker, "");
        // Indented continuation lines belong to the same item.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !marker.test(lines[i])) item += " " + lines[i++].trim();
        items.push(`<li>${renderInline(item)}</li>`);
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    if (/^\|/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const hasHeader = rows.length > 1 && /^\|?\s*:?-{3,}/.test(rows[1]);
      const head = hasHeader ? splitRow(rows[0]) : null;
      const bodyRows = (hasHeader ? rows.slice(2) : rows).map(splitRow);
      const thead = head ? `<thead><tr>${head.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr></thead>` : "";
      const tbody = `<tbody>${bodyRows
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) para.push(lines[i++].trim());
    out.push(`<p>${renderInline(para.join(" "))}</p>`);
  }

  return { html: out.join("\n"), headings };
}

/** Parses one article file into metadata plus rendered HTML. */
export function parseArticle(source: string): Article {
  const { data, body } = parseFrontmatter(source);
  const meta = toArticleMeta(data);
  const { html, headings } = renderMarkdown(body);
  const words = body.split(/\s+/).filter(Boolean).length;
  return { ...meta, html, headings, readingMinutes: Math.max(1, Math.round(words / 230)) };
}
