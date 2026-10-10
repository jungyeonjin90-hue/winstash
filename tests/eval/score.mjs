/**
 * Automatic checks for one 3-way transformation output (weekly_report / brag_sheet_item / star_portfolio).
 * Pure functions with no app imports, so tests/unit/eval-score.test.mjs can load them directly.
 *
 * Flags are review candidates, not verdicts: e.g. a number the model derived in a way the
 * detector does not recognise still needs a human look.
 */

const IMPACT_CATEGORIES = ["efficiency", "revenue", "quality", "leadership", "risk_mitigation", "other"];
const IMPACT_MAGNITUDES = ["small", "medium", "large"];

/** Bullet counts the prompts ask for. Outside these ranges is a warning, not a schema failure. */
const EXPECTED_COUNTS = { done: [2, 3], in_progress: [1, 2], next_week: [1, 2] };

/** Terms from the prompts' few-shot examples and the E2E mock: their appearance hints at copying. */
const FEW_SHOT_TERMS = [
  "Hotjar",
  "45m",
  "12m",
  "73%",
  "8 overseas",
  "8 global",
  "Redis",
  "HikariCP",
  "Payment Gateway",
  "p99",
];

const isString = (v) => typeof v === "string" && v.trim().length > 0;
const isStringArray = (v) => Array.isArray(v) && v.length > 0 && v.every(isString);

/** Strict shape check. Returns a list of problems (empty = valid). */
export function checkSchema(output) {
  const problems = [];
  const w = output?.weekly_report;
  const b = output?.brag_sheet_item;
  const s = output?.star_portfolio;

  if (!w || typeof w !== "object") problems.push("weekly_report missing");
  else for (const key of ["done", "in_progress", "next_week"]) {
    if (!isStringArray(w[key])) problems.push(`weekly_report.${key} is not a non-empty string array`);
  }

  if (!b || typeof b !== "object") problems.push("brag_sheet_item missing");
  else for (const key of ["metric_summary", "business_impact", "quarter"]) {
    if (!isString(b[key])) problems.push(`brag_sheet_item.${key} is not a string`);
  }

  if (!s || typeof s !== "object") problems.push("star_portfolio missing");
  else {
    for (const key of ["title", "situation", "task", "action", "result"]) {
      if (!isString(s[key])) problems.push(`star_portfolio.${key} is not a string`);
    }
    if (!isStringArray(s.nda_tags)) problems.push("star_portfolio.nda_tags is not a non-empty string array");
    if (s.impactCategory !== undefined && !IMPACT_CATEGORIES.includes(s.impactCategory)) {
      problems.push(`star_portfolio.impactCategory "${s.impactCategory}" is not allowed`);
    }
    if (s.impactMagnitude !== undefined && !IMPACT_MAGNITUDES.includes(s.impactMagnitude)) {
      problems.push(`star_portfolio.impactMagnitude "${s.impactMagnitude}" is not allowed`);
    }
  }
  return problems;
}

/** Bullet-count warnings for weekly_report. */
export function checkCounts(output) {
  const warnings = [];
  const w = output?.weekly_report ?? {};
  for (const [key, [min, max]] of Object.entries(EXPECTED_COUNTS)) {
    const n = Array.isArray(w[key]) ? w[key].length : 0;
    if (n < min || n > max) warnings.push(`weekly_report.${key} has ${n} items (expected ${min}-${max})`);
  }
  return warnings;
}

/**
 * The user-visible text of an output: every string value except fixed-format fields
 * (quarter and the enum fields), which would otherwise distort the number and language checks.
 */
export function outputTexts(output) {
  const texts = [];
  const visit = (value, path) => {
    if (typeof value === "string") {
      if (!/(^|\.)(quarter|impactCategory|impactMagnitude)$/.test(path)) texts.push(value);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, `${path}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) visit(v, path ? `${path}.${k}` : k);
    }
  };
  visit(output, "");
  return texts;
}

/**
 * Numbers as written in prose. Skips digits glued to a preceding letter (L2, S3, OAuth2, p99),
 * quarter labels (2026-Q4, Q3) and "1:1", which are names rather than quantities.
 */
export function extractNumbers(text) {
  const cleaned = String(text)
    .replace(/\b(?:19|20)\d{2}\s*-?\s*Q[1-4]\b/gi, " ")
    .replace(/\bQ[1-4]\b/gi, " ")
    .replace(/\b1\s*:\s*1\b/g, " ");
  const matches = cleaned.match(/(?<![A-Za-z_#\d.,])\d+(?:[.,]\d+)*/g) || [];
  return matches
    // Commas are thousands separators ("1,200").
    .map((m) => Number(m.replace(/,/g, "")))
    .filter((n) => Number.isFinite(n));
}

/** Values that may legitimately appear given the memo's numbers: the numbers and simple derivations. */
function allowedValues(memoNumbers) {
  const allowed = new Set(memoNumbers);
  for (const a of memoNumbers) {
    for (const b of memoNumbers) {
      if (a === b || a === 0) continue;
      allowed.add(Math.abs(a - b)); // difference
      allowed.add(Math.round((Math.abs(a - b) / a) * 100)); // percent change
      allowed.add(Math.round((b / a) * 100)); // percent of
      allowed.add(Math.round((b / a) * 10) / 10); // ratio, 1 decimal ("3.5x")
      allowed.add(Math.round(b / a)); // ratio, whole ("4x")
    }
  }
  return allowed;
}

function isAllowed(value, allowed) {
  for (const a of allowed) {
    // Rounding slack: half a unit for percent-sized values, 2% otherwise ("1.2s" must not match "2.4s").
    const tolerance = Math.max(Math.abs(a) * 0.02, Math.abs(a) >= 10 ? 0.5 : 0.01);
    if (Math.abs(a - value) <= tolerance) return true;
  }
  return false;
}

/**
 * Numbers in the output that are neither in the memo nor a simple derivation of memo numbers.
 * Single-digit counts (e.g. "3 vendors" for three named vendors) are reported separately as
 * `smallCounts`, since they are often grounded but written as words in the memo.
 */
export function findUnsupportedNumbers(memo, output) {
  const allowed = allowedValues(extractNumbers(memo));
  const unsupported = new Set();
  const smallCounts = new Set();
  for (const text of outputTexts(output)) {
    for (const n of extractNumbers(text)) {
      if (isAllowed(n, allowed)) continue;
      if (Number.isInteger(n) && n >= 0 && n <= 9) smallCounts.add(n);
      else unsupported.add(n);
    }
  }
  return { unsupported: [...unsupported], smallCounts: [...smallCounts] };
}

/** Share of Hangul among letters (Hangul + Latin) in the output's text. */
export function hangulRatio(output) {
  const text = outputTexts(output).join(" ");
  const hangul = (text.match(/[가-힣ㄱ-ㆎ]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return hangul + latin === 0 ? 0 : hangul / (hangul + latin);
}

/**
 * Korean output may keep English tech terms, so it passes at >= 50% Hangul.
 * English output must contain no Hangul at all.
 */
export function checkLanguage(output, targetLanguage) {
  const ratio = hangulRatio(output);
  const ok = targetLanguage === "ko" ? ratio >= 0.5 : ratio === 0;
  return { ok, hangulRatio: Math.round(ratio * 100) / 100 };
}

/** Few-shot or mock terms present in the output but absent from the memo. */
export function findFewShotLeaks(memo, output) {
  const text = outputTexts(output).join(" ").toLowerCase();
  const memoLower = memo.toLowerCase();
  return FEW_SHOT_TERMS.filter((t) => text.includes(t.toLowerCase()) && !memoLower.includes(t.toLowerCase()));
}

/** Longest bullet/field in characters, for spotting bloated sentences. */
export function longestText(output) {
  return outputTexts(output).reduce((max, t) => Math.max(max, t.length), 0);
}

/** Runs every automatic check for one case. */
export function scoreCase(testCase, output) {
  const schemaProblems = checkSchema(output);
  const numbers = findUnsupportedNumbers(testCase.memo, output);
  const language = checkLanguage(output, testCase.outputLanguage);
  const leaks = findFewShotLeaks(testCase.memo, output);
  const canaryLeaked = Boolean(
    testCase.canary && outputTexts(output).join(" ").toLowerCase().includes(testCase.canary.toLowerCase())
  );
  return {
    schemaOk: schemaProblems.length === 0,
    schemaProblems,
    countWarnings: checkCounts(output),
    unsupportedNumbers: numbers.unsupported,
    smallCounts: numbers.smallCounts,
    languageOk: language.ok,
    hangulRatio: language.hangulRatio,
    fewShotLeaks: leaks,
    canaryLeaked,
    longestText: longestText(output),
  };
}
