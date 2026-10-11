/**
 * Runs the synthesis fixtures (synthesis-fixtures.json: sets of weekly records) through the app's real
 * Brag / STAR synthesis (generateAiSynthesis in lib/synthesisService.ts: same prompt, models, validator
 * and timeouts as app/api/synthesize/en) and scores each output with synthesis-score.mjs.
 *
 * Calls Gemini directly. Nothing touches Firestore, credits or users. A null result is what the route
 * would replace with the record-mapping fallback; it is reported as FALLBACK here.
 *
 * Usage (from the project root):
 *   node --env-file=.env.eval tests/eval/run-synthesis-eval.mjs [--types brag,star] [--scope 5] [--runs 1]
 *        [--only id1,id2] [--label baseline] [--concurrency 1]
 *   node tests/eval/run-synthesis-eval.mjs --rescore tests/eval/results/<run folder>
 *     re-scores a saved run (raw.json) with the current scorer, without calling Gemini.
 * See tests/eval/README.md.
 */
import { register } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scoreSynthesis } from "./synthesis-score.mjs";

register("./ts-hooks.mjs", import.meta.url);

const EVAL_DIR = fileURLToPath(new URL("./", import.meta.url));

function parseArgs(argv) {
  const args = { types: ["brag", "star"], scope: 5, runs: 1, only: null, label: "run", concurrency: 1, rescore: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1] ?? "";
    if (flag === "--types") args.types = value.split(",").map((s) => s.trim()).filter((t) => t === "brag" || t === "star");
    else if (flag === "--scope") args.scope = [3, 5, 10].includes(Number(value)) ? Number(value) : 5;
    else if (flag === "--runs") args.runs = Math.max(1, Number(value) || 1);
    else if (flag === "--only") args.only = value.split(",").map((s) => s.trim());
    else if (flag === "--label") args.label = value.replace(/[^A-Za-z0-9_-]/g, "_");
    else if (flag === "--concurrency") args.concurrency = Math.max(1, Number(value) || 1);
    else if (flag === "--rescore") args.rescore = value;
    else continue;
    i++; // skip the flag's value
  }
  return args;
}

/** Runs `worker` over `items` with at most `limit` in flight. */
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(lanes);
  return results;
}

const pct = (n, d) => (d === 0 ? "-" : `${Math.round((n / d) * 100)}%`);
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const csvCell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

function buildSummary(meta, rows) {
  const total = rows.length;
  const ai = rows.filter((r) => !r.aiFallback && !r.error);
  const count = (pred) => ai.filter(pred).length;
  const goals = ai.flatMap((r) => r.score.coverage);

  const lines = [];
  lines.push(`# Synthesis eval: ${meta.label}`, "");
  lines.push(`- 실행 시각: ${meta.startedAt}`);
  lines.push(`- 픽스처 × 유형 × 반복: ${meta.fixtures} × ${meta.types.join("/")} × ${meta.runs} = ${total} (scope ${meta.scope})`);
  lines.push(`- 소요 시간: ${Math.round(meta.durationMs / 1000)}초`, "");
  lines.push("## 요약", "");
  lines.push("| 항목 | 결과 |", "|---|---|");
  lines.push(`| AI 응답 (폴백 아님) | ${ai.length}/${total} (${pct(ai.length, total)}) |`);
  lines.push(`| 오류 | ${rows.filter((r) => r.error).length} |`);
  lines.push(`| 구조 통과 (필수 필드·출처 인덱스·개수) | ${count((r) => r.score.structureProblems.length === 0)}/${ai.length} |`);
  lines.push(`| 기록에 없는 숫자 등장 | ${count((r) => r.score.inventedNumbers.length > 0)}/${ai.length} |`);
  lines.push(`| 기록에 없는 고유명사 후보 | ${count((r) => r.score.inventedEntities.length > 0)}/${ai.length} |`);
  lines.push(
    `| 핵심 성과 모두 포함 | ${count((r) => r.score.coverageOk)}/${ai.length} (성과 단위 ${goals.filter((g) => g.covered).length}/${goals.length}) |`
  );
  lines.push(`| 영어 출력 (한글 0자) | ${count((r) => r.score.languageOk)}/${ai.length} |`);
  const latencies = ai.map((r) => r.latencyMs).sort((a, b) => a - b);
  if (latencies.length) {
    lines.push(`| 지연 중앙값 / 최대 | ${latencies[Math.floor(latencies.length / 2)]}ms / ${latencies.at(-1)}ms |`);
  }
  lines.push("");

  lines.push("## 케이스별", "");
  lines.push("| fixture | type | run | AI | 항목 수/기록 수 | 구조 | 없는 숫자 | 고유명사 후보 | 빠진 성과 | 언어 |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    if (r.error) {
      lines.push(`| ${r.id} | ${r.type} | ${r.run} | 오류 | ${cell(r.error)} | | | | | |`);
      continue;
    }
    if (r.aiFallback) {
      lines.push(`| ${r.id} | ${r.type} | ${r.run} | 폴백 | | | | | | |`);
      continue;
    }
    const s = r.score;
    const missing = s.coverage.filter((c) => !c.covered).map((c) => c.label);
    lines.push(
      `| ${r.id} | ${r.type} | ${r.run} | AI | ${s.itemCount}/${r.recordCount} | ${s.structureProblems.length ? "실패" : "OK"} | ${cell(
        s.inventedNumbers.join(", ")
      )} | ${cell(s.inventedEntities.join(", "))} | ${cell(missing.join(", "))} | ${s.languageOk ? "OK" : `실패 (${s.hangulRatio})`} |`
    );
  }
  lines.push("");

  const problems = rows.filter((r) => r.score?.structureProblems.length);
  if (problems.length) {
    lines.push("## 구조 문제 상세", "");
    for (const r of problems) lines.push(`- ${r.id} ${r.type} (run ${r.run}): ${r.score.structureProblems.join("; ")}`);
    lines.push("");
  }
  lines.push("판정 기준과 한계는 tests/eval/README.md 참고. 자동 플래그는 사람이 확인할 후보입니다.");
  return lines.join("\n");
}

function buildReviewCsv(rows) {
  const header = ["fixture", "type", "run", "items", "자동플래그", "사실충실도(1-5)", "실무사용성(1-5)", "과장정도(1-5, 낮을수록 담백)", "코멘트"];
  const out = [header.map(csvCell).join(",")];
  for (const r of rows) {
    if (r.error || r.aiFallback) continue;
    const s = r.score;
    const items = (r.items || [])
      .map((item, i) =>
        r.type === "brag"
          ? `${i + 1}. ${item.title} | ${item.metric_summary} | ${item.business_impact}`
          : `${i + 1}. ${item.title} | S: ${item.situation} | T: ${item.task} | A: ${item.action} | R: ${item.result}`
      )
      .join("\n");
    const flags = [
      s.structureProblems.length ? "구조" : "",
      s.inventedNumbers.length ? `숫자:${s.inventedNumbers.join("/")}` : "",
      s.inventedEntities.length ? `고유명사:${s.inventedEntities.join("/")}` : "",
      s.coverageOk ? "" : `누락:${s.coverage.filter((c) => !c.covered).map((c) => c.label).join("/")}`,
      s.languageOk ? "" : "언어",
    ]
      .filter(Boolean)
      .join(" ");
    out.push([r.id, r.type, r.run, items, flags, "", "", "", ""].map(csvCell).join(","));
  }
  // BOM so Excel opens the Korean text as UTF-8.
  return "﻿" + out.join("\r\n");
}

function writeReports(outDir, meta, rows) {
  writeFileSync(`${outDir}raw.json`, JSON.stringify({ meta, rows }, null, 2));
  writeFileSync(`${outDir}summary.md`, buildSummary(meta, rows));
  writeFileSync(`${outDir}review.csv`, buildReviewCsv(rows));
}

/** Re-scores a saved run with the current scorer (after a scorer fix), keeping the model outputs. */
function rescore(dir) {
  const outDir = dir.replace(/[\/]*$/, "/");
  const { meta, rows } = JSON.parse(readFileSync(`${outDir}raw.json`, "utf8"));
  const fixtures = JSON.parse(readFileSync(new URL("./synthesis-fixtures.json", import.meta.url), "utf8"));
  const byId = new Map(fixtures.map((f) => [f.id, f]));
  for (const row of rows) {
    if (row.error || row.aiFallback || !byId.has(row.id)) continue;
    row.score = scoreSynthesis(byId.get(row.id), row.type, meta.scope, row.items);
  }
  writeReports(outDir, meta, rows);
  console.log(`Re-scored ${rows.length} rows in ${outDir}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.rescore) return rescore(args.rescore);
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set. See tests/eval/README.md (use a separate key in .env.eval).");
    process.exit(1);
  }

  const { generateAiSynthesis } = await import("../../lib/synthesisService.ts");

  const allFixtures = JSON.parse(readFileSync(new URL("./synthesis-fixtures.json", import.meta.url), "utf8"));
  const fixtures = args.only ? allFixtures.filter((f) => args.only.includes(f.id)) : allFixtures;
  if (fixtures.length === 0 || args.types.length === 0) {
    console.error("No matching fixtures or types.");
    process.exit(1);
  }

  const jobs = [];
  for (const fixture of fixtures) {
    for (const type of args.types) for (let run = 1; run <= args.runs; run++) jobs.push({ fixture, type, run });
  }

  const startedAt = new Date();
  console.log(`Running ${jobs.length} syntheses (${fixtures.length} fixtures × ${args.types.join("/")} × ${args.runs} runs)...`);

  const rows = await mapLimit(jobs, args.concurrency, async ({ fixture, type, run }) => {
    const base = { id: fixture.id, type, run, recordCount: fixture.records.length };
    const t0 = Date.now();
    try {
      const items = await generateAiSynthesis(
        type,
        args.scope,
        fixture.jobRole,
        fixture.toneManner,
        fixture.periodLabel,
        fixture.records
      );
      const latencyMs = Date.now() - t0;
      const aiFallback = items === null;
      const score = aiFallback ? null : scoreSynthesis(fixture, type, args.scope, items);
      console.log(`  ${fixture.id} ${type} #${run}: ${aiFallback ? "FALLBACK" : `ai (${items.length} items)`} ${latencyMs}ms`);
      return { ...base, items, aiFallback, latencyMs, score };
    } catch (err) {
      console.log(`  ${fixture.id} ${type} #${run}: ERROR ${err?.message || err}`);
      return { ...base, error: String(err?.message || err), latencyMs: Date.now() - t0 };
    }
  });

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = `${EVAL_DIR}results/${stamp}-synthesis-${args.label}/`;
  mkdirSync(outDir, { recursive: true });
  const meta = {
    label: args.label,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    fixtures: fixtures.length,
    types: args.types,
    scope: args.scope,
    runs: args.runs,
  };
  writeFileSync(`${outDir}raw.json`, JSON.stringify({ meta, rows }, null, 2));
  writeFileSync(`${outDir}summary.md`, buildSummary(meta, rows));
  writeFileSync(`${outDir}review.csv`, buildReviewCsv(rows));
  console.log(`\nDone. Results in ${outDir}`);
  console.log("  summary.md  automatic checks\n  review.csv  for human scoring (opens in Excel)\n  raw.json    full outputs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
