/**
 * Automatic checks for one Brag / STAR synthesis output (an `items` array) against the weekly records
 * it was built from. Pure functions with no app imports, so tests/unit/eval-synthesis-score.test.mjs
 * can load them directly.
 *
 * Like score.mjs, flags are review candidates: a number derived in a way the detector does not know,
 * or a capitalised common word, still needs a human look.
 */
import { allowedValues, checkLanguage, extractNumbers, isAllowed } from "./score.mjs";

/**
 * Text fields shown to the user, per synthesis type (the fields the prompt's JSON schema asks for).
 * Ids, indices, counts and enums are excluded. Brag items have no title in the schema.
 */
const TEXT_FIELDS = {
  brag: ["metric_summary", "business_impact", "key_highlights"],
  star: ["title", "situation", "task", "action", "result"],
};
const REQUIRED_FIELDS = TEXT_FIELDS;

/**
 * Words that show up capitalised in normal career writing and are not named entities
 * (acronyms, generic roles and functions). Compared case-insensitively.
 */
const GENERIC_TERMS = new Set(
  [
    "I", "AI", "API", "APIs", "UI", "UX", "KPI", "KPIs", "OKR", "OKRs", "ROI", "SLA", "SLAs", "QA", "CS", "PM", "PMs",
    "SQL", "CI", "CD", "CI/CD", "SaaS", "B2B", "B2C", "CRM", "CSAT", "NPS", "ARR", "MRR", "CAC", "LTV", "SEO", "PRD",
    "QBR", "SSO", "ETL", "DAG", "PDF", "CSV", "SDK", "MVP", "GTM", "VP", "CEO", "CTO", "HR", "Q1", "Q2", "Q3", "Q4",
    "STAR", "Brag", "Pro", "US", "USD", "YoY", "QoQ", "MoM", "ms", "N+1",
    // Team and function names the model capitalises ("partnered with Sales", "Enterprise client").
    "Sales", "Marketing", "Product", "Engineering", "Design", "Support", "Finance", "Operations", "Leadership",
    "Customer", "Client", "Enterprise", "Business", "Quarterly", "Review", "Variant", "Control",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November",
    "December", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
  ].map((t) => t.toLowerCase())
);

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

/** Everything the model was given about the user's work: raw notes plus the stored done/metric drafts. */
export function sourceText(records) {
  return records
    .map((r) =>
      [r.raw_memo, ...(Array.isArray(r.weekly_report?.done) ? r.weekly_report.done : []), r.brag_sheet_item?.metric_summary]
        .filter(isNonEmptyString)
        .join("\n")
    )
    .join("\n\n");
}

/** The user-visible strings of one item (arrays flattened). */
export function itemTexts(item, type) {
  const texts = [];
  for (const field of TEXT_FIELDS[type]) {
    const value = item?.[field];
    if (typeof value === "string") texts.push(value);
    else if (Array.isArray(value)) texts.push(...value.filter((v) => typeof v === "string"));
  }
  return texts;
}

/** Shape problems: required text fields, list fields and source indices. */
export function checkItems(items, type, recordCount, scope) {
  const problems = [];
  if (!Array.isArray(items) || items.length === 0) return ["items is empty or not an array"];
  if (items.length > scope) problems.push(`${items.length} items exceed the requested scope ${scope}`);
  if (items.length > recordCount) problems.push(`${items.length} items from only ${recordCount} records (padding?)`);
  items.forEach((item, i) => {
    for (const field of REQUIRED_FIELDS[type]) {
      const value = item?.[field];
      const ok = field === "key_highlights"
        ? Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString)
        : isNonEmptyString(value);
      if (!ok) problems.push(`item ${i + 1}: ${field} is empty or missing`);
    }
    const indices = item?.source_log_indices;
    if (!Array.isArray(indices) || indices.length === 0) {
      problems.push(`item ${i + 1}: no source_log_indices`);
    } else if (!indices.every((n) => Number.isInteger(n) && n >= 1 && n <= recordCount)) {
      problems.push(`item ${i + 1}: source_log_indices out of range (${indices.join(",")})`);
    }
  });
  return problems;
}

/** Numbers each record supports: its own numbers and their simple derivations, plus unit conversions. */
export function allowedNumbers(records) {
  const allowed = new Set();
  for (const record of records) {
    const numbers = extractNumbers(sourceText([record]));
    // Derivations (differences, % change, ratios) only between numbers of the same week's notes.
    // s<->ms and h<->min versions take part, so "2.4s to 320ms" allows "87% faster" and
    // "6 hours to 50 minutes" allows "86% reduction".
    const converted = numbers.flatMap((n) => [n * 1000, n / 1000, n * 60, n / 60]);
    for (const n of allowedValues([...numbers, ...converted])) allowed.add(n);
    // Plain K/M scaling of money and counts.
    for (const n of numbers) allowed.add(n * 1_000_000).add(n / 1_000_000);
  }
  return allowed;
}

const SUFFIX_SCALE = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };

/**
 * Numbers (as written, with their % / currency / K-M suffix) that are neither in the records nor a
 * simple derivation of one week's numbers. "$48K" is checked as 48000.
 */
export function findInventedNumbers(records, texts) {
  const allowed = allowedNumbers(records);
  const invented = new Set();
  for (const text of texts) {
    const tokens = String(text).match(/[$€£₩]?(?<![A-Za-z_#\d.,])\d+(?:[.,]\d+)*(?:\s?%|[kKmMbB]\b|x\b)?/g) || [];
    for (const token of tokens) {
      const [n] = extractNumbers(token.replace(/^[$€£₩]/, ""));
      if (n === undefined) continue;
      const suffix = token.match(/([kKmMbB])$/)?.[1]?.toLowerCase();
      const candidates = suffix ? [n * SUFFIX_SCALE[suffix]] : [n];
      if (candidates.some((c) => isAllowed(c, allowed))) continue;
      // Bare single-digit counts ("3 services") are often grounded but written as words; skip them.
      if (Number.isInteger(n) && n <= 9 && !/[%$€£₩]/.test(token) && !suffix) continue;
      invented.add(token.trim());
    }
  }
  return [...invented];
}

/**
 * Named-entity candidates in the output that never appear in the records: product/tool-like tokens
 * (internal capitals or digits, e.g. "PostgreSQL", "GA4"), all-caps acronyms, and capitalised words
 * in the middle of a sentence. Titles are Title Case, so only the first two kinds count there.
 */
export function findInventedEntities(source, item, type) {
  const sourceLower = source.toLowerCase();
  const found = new Set();
  for (const field of TEXT_FIELDS[type]) {
    const values = Array.isArray(item?.[field]) ? item[field] : [item?.[field]];
    for (const value of values) {
      if (typeof value !== "string") continue;
      for (const sentence of value.split(/(?<=[.!?;:])\s+|\n+/)) {
        const words = sentence.match(/[A-Za-z][A-Za-z0-9+/&.-]*[A-Za-z0-9+]|[A-Za-z]/g) || [];
        words.forEach((word, idx) => {
          const clean = word.replace(/[.,]+$/, "");
          const productLike = /[a-z][A-Z]|[A-Za-z]\d|^[A-Z]{2,}$/.test(clean);
          const midSentenceCapital = field !== "title" && idx > 0 && /^[A-Z][a-z]/.test(clean);
          if (!productLike && !midSentenceCapital) return;
          if (GENERIC_TERMS.has(clean.toLowerCase())) return;
          if (sourceLower.includes(clean.toLowerCase())) return;
          found.add(clean);
        });
      }
    }
  }
  return [...found];
}

/**
 * Coverage of the fixture's key achievements. Each `match` group must be found in the output text;
 * a group lists alternatives separated by "|" (case-insensitive substring match).
 */
export function checkCoverage(mustCover, allText) {
  const text = allText.toLowerCase();
  return mustCover.map((goal) => ({
    label: goal.label,
    covered: goal.match.every((group) => group.split("|").some((alt) => text.includes(alt.toLowerCase()))),
  }));
}

/** Runs every automatic check for one synthesis output. */
export function scoreSynthesis(fixture, type, scope, items) {
  const source = sourceText(fixture.records);
  const list = Array.isArray(items) ? items : [];
  const texts = list.flatMap((item) => itemTexts(item, type));
  const coverage = checkCoverage(fixture.mustCover || [], texts.join("\n"));
  const language = checkLanguage({ texts }, "en");
  return {
    itemCount: list.length,
    structureProblems: checkItems(items, type, fixture.records.length, scope),
    inventedNumbers: findInventedNumbers(fixture.records, texts),
    inventedEntities: [...new Set(list.flatMap((item) => findInventedEntities(source, item, type)))],
    coverage,
    coverageOk: coverage.every((c) => c.covered),
    languageOk: language.ok,
    hangulRatio: language.hangulRatio,
  };
}
