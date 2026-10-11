/**
 * Unit tests for tests/eval/synthesis-score.mjs (Brag / STAR synthesis eval scorer).
 *
 *   npm run test:unit
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  checkCoverage,
  checkItems,
  findInventedEntities,
  findInventedNumbers,
  scoreSynthesis,
  sourceText,
} from "../eval/synthesis-score.mjs";

const records = [
  { id: "w1", raw_memo: "Order list API avg response went from 2.4s to 320ms after adding a composite index." },
  { id: "w2", raw_memo: "Moved CI from Jenkins to GitHub Actions. Pipeline time dropped from 40 min to 12 min." },
  { id: "w3", raw_memo: "Closed Northwind Logistics: $48K ARR, 2-year contract." },
  { id: "w4", raw_memo: "Paired with our intern Dana on her first production PR." },
];
const source = sourceText(records);

function bragItem(overrides = {}) {
  return {
    id: "syn-brag-1",
    metric_summary: "Cut average response time from 2.4s to 320ms",
    business_impact: "Large accounts stopped timing out.",
    key_highlights: ["Added a composite index"],
    source_log_indices: [1],
    ...overrides,
  };
}

function starItem(overrides = {}) {
  return {
    id: "syn-star-1",
    title: "CI Migration",
    situation: "Builds were slow on Jenkins.",
    task: "Speed up the pipeline.",
    action: "Moved CI to GitHub Actions.",
    result: "Pipeline time dropped from 40 min to 12 min.",
    source_log_indices: [2],
    ...overrides,
  };
}

describe("sourceText", () => {
  test("includes raw notes, stored done bullets and metric drafts", () => {
    const text = sourceText([
      { raw_memo: "note", weekly_report: { done: ["done bullet"] }, brag_sheet_item: { metric_summary: "metric draft" } },
    ]);
    assert.match(text, /note/);
    assert.match(text, /done bullet/);
    assert.match(text, /metric draft/);
  });
});

describe("findInventedNumbers", () => {
  test("numbers copied from the records pass", () => {
    assert.deepEqual(findInventedNumbers(records, ["Cut response time from 2.4s to 320ms", "40 min to 12 min"]), []);
  });

  test("simple derivations within one week pass, including after s->ms conversion", () => {
    assert.deepEqual(findInventedNumbers(records, ["87% faster responses", "saved 28 minutes per run", "70% shorter"]), []);
  });

  test("percent change across hours and minutes passes", () => {
    const batch = [{ raw_memo: "Nightly batch took 6 hours; got it down to 50 minutes." }];
    assert.deepEqual(findInventedNumbers(batch, ["~86% runtime reduction"]), []);
  });

  test("K/M scaling of money passes", () => {
    assert.deepEqual(findInventedNumbers(records, ["Closed a $48,000 ARR deal", "$48K ARR"]), []);
  });

  test("invented percentages and currency are flagged as written", () => {
    assert.deepEqual(findInventedNumbers(records, ["Raised revenue 35% and saved $5K"]), ["35%", "$5K"]);
  });

  test("bare single-digit counts are not flagged, but single-digit percentages are", () => {
    assert.deepEqual(findInventedNumbers(records, ["Shipped 3 services"]), []);
    assert.deepEqual(findInventedNumbers(records, ["Cut churn by 7%"]), ["7%"]);
  });

  test("derivations do not mix numbers from different weeks", () => {
    // 48 (week 3) and 12 (week 2) would give 36 or 4x if mixed.
    assert.deepEqual(findInventedNumbers(records, ["36 hours saved"]), ["36"]);
  });
});

describe("findInventedEntities", () => {
  test("tools and names from the records pass", () => {
    const item = bragItem({ metric_summary: "Moved CI to GitHub Actions with Dana and Northwind Logistics." });
    assert.deepEqual(findInventedEntities(source, item, "brag"), []);
  });

  test("product-like tokens and mid-sentence names absent from the records are flagged", () => {
    const item = bragItem({ business_impact: "Migrated to PostgreSQL and partnered with Stripe on billing." });
    assert.deepEqual(findInventedEntities(source, item, "brag").sort(), ["PostgreSQL", "Stripe"]);
  });

  test("Title Case words in STAR titles and generic acronyms are not flagged", () => {
    const item = starItem({ title: "Reliable Platform Delivery", action: "Improved API and CI KPIs." });
    assert.deepEqual(findInventedEntities(source, item, "star"), []);
  });

  test("product-like tokens in STAR titles are still flagged", () => {
    assert.deepEqual(findInventedEntities(source, starItem({ title: "Kafka Rollout With GA4" }), "star"), ["GA4"]);
  });

  test("brag items are checked without a title (the prompt schema has none)", () => {
    assert.equal("title" in bragItem(), false);
    assert.deepEqual(checkItems([bragItem()], "brag", 4, 5), []);
  });
});

describe("checkItems", () => {
  test("complete brag and STAR items pass", () => {
    assert.deepEqual(checkItems([bragItem()], "brag", 4, 5), []);
    assert.deepEqual(checkItems([starItem()], "star", 4, 5), []);
  });

  test("empty STAR fields are reported", () => {
    const problems = checkItems([starItem({ task: "", result: "  " })], "star", 4, 5);
    assert.deepEqual(problems, ["item 1: task is empty or missing", "item 1: result is empty or missing"]);
  });

  test("brag items need a non-empty key_highlights list", () => {
    assert.deepEqual(checkItems([bragItem({ key_highlights: [] })], "brag", 4, 5), [
      "item 1: key_highlights is empty or missing",
    ]);
  });

  test("more items than records or scope, and bad source indices, are reported", () => {
    const items = [bragItem(), bragItem(), bragItem({ source_log_indices: [9] })];
    const problems = checkItems(items, "brag", 2, 2);
    assert.ok(problems.includes("3 items exceed the requested scope 2"));
    assert.ok(problems.includes("3 items from only 2 records (padding?)"));
    assert.ok(problems.includes("item 3: source_log_indices out of range (9)"));
  });

  test("an empty list is a single problem", () => {
    assert.deepEqual(checkItems([], "brag", 4, 5), ["items is empty or not an array"]);
  });
});

describe("checkCoverage", () => {
  const goals = [
    { label: "Latency", match: ["latency|response time", "320"] },
    { label: "CI", match: ["GitHub Actions"] },
  ];

  test("every group must match; alternatives are separated by |", () => {
    assert.deepEqual(checkCoverage(goals, "Response time fell to 320ms. Moved to GitHub Actions."), [
      { label: "Latency", covered: true },
      { label: "CI", covered: true },
    ]);
  });

  test("a partial match is not covered", () => {
    assert.deepEqual(checkCoverage(goals, "Latency improved a lot.")[0], { label: "Latency", covered: false });
  });
});

describe("scoreSynthesis", () => {
  test("combines the checks for a clean output", () => {
    const fixture = { records, mustCover: [{ label: "CI", match: ["GitHub Actions"] }] };
    const score = scoreSynthesis(fixture, "star", 5, [starItem()]);
    assert.equal(score.itemCount, 1);
    assert.deepEqual(score.structureProblems, []);
    assert.deepEqual(score.inventedNumbers, []);
    assert.deepEqual(score.inventedEntities, []);
    assert.equal(score.coverageOk, true);
    assert.equal(score.languageOk, true);
  });

  test("Korean left in the output fails the language check", () => {
    const score = scoreSynthesis({ records, mustCover: [] }, "star", 5, [starItem({ result: "배포 시간 단축" })]);
    assert.equal(score.languageOk, false);
  });
});
