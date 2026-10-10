/**
 * Runs the evaluation memos (memos.json) through the app's real 3-way transformation
 * (executeAiTransformation in lib/transformService.ts: same prompts, models, validator and fallback
 * as production) and scores each output with score.mjs.
 *
 * Calls Gemini directly. Nothing touches Firestore, credits or users.
 *
 * Usage (from the project root):
 *   node --env-file=.env.eval tests/eval/run-transform-eval.mjs [--runs 1] [--only id1,id2] [--label baseline] [--concurrency 2]
 * See tests/eval/README.md.
 */
import { register } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scoreCase } from "./score.mjs";

register("./ts-hooks.mjs", import.meta.url);

const EVAL_DIR = fileURLToPath(new URL("./", import.meta.url));

function parseArgs(argv) {
  const args = { runs: 1, only: null, label: "run", concurrency: 2 };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1] ?? "";
    if (flag === "--runs") args.runs = Math.max(1, Number(value) || 1);
    else if (flag === "--only") args.only = value.split(",").map((s) => s.trim());
    else if (flag === "--label") args.label = value.replace(/[^A-Za-z0-9_-]/g, "_");
    else if (flag === "--concurrency") args.concurrency = Math.max(1, Number(value) || 1);
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
  const injection = ai.filter((r) => r.canary);

  const lines = [];
  lines.push(`# Transform eval: ${meta.label}`, "");
  lines.push(`- 실행 시각: ${meta.startedAt}`);
  lines.push(`- 케이스 × 반복: ${meta.cases} × ${meta.runs} = ${total}`);
  lines.push(`- 소요 시간: ${Math.round(meta.durationMs / 1000)}초`, "");
  lines.push("## 요약", "");
  lines.push("| 항목 | 결과 |", "|---|---|");
  lines.push(`| AI 응답 (휴리스틱 폴백 아님) | ${ai.length}/${total} (${pct(ai.length, total)}) |`);
  lines.push(`| 오류 | ${rows.filter((r) => r.error).length} |`);
  lines.push(`| 형식 통과 (엄격 검사) | ${count((r) => r.score.schemaOk)}/${ai.length} |`);
  lines.push(`| 요청 언어 일치 | ${count((r) => r.score.languageOk)}/${ai.length} |`);
  lines.push(`| 메모에 없는 숫자 등장 | ${count((r) => r.score.unsupportedNumbers.length > 0)}/${ai.length} |`);
  lines.push(`| 예시 문구 복사 의심 | ${count((r) => r.score.fewShotLeaks.length > 0)}/${ai.length} |`);
  lines.push(`| 인젝션 카나리 노출 | ${injection.filter((r) => r.score.canaryLeaked).length}/${injection.length} |`);
  lines.push(`| 불릿 개수 범위 밖 | ${count((r) => r.score.countWarnings.length > 0)}/${ai.length} |`);
  const latencies = ai.map((r) => r.latencyMs).sort((a, b) => a - b);
  if (latencies.length) {
    lines.push(`| 지연 중앙값 / 최대 | ${latencies[Math.floor(latencies.length / 2)]}ms / ${latencies.at(-1)}ms |`);
  }
  lines.push("");

  lines.push("## 케이스별", "");
  lines.push("| id | run | 출력 | AI | 형식 | 언어(한글비율) | 메모에 없는 숫자 | 한 자리 수 | 예시 복사 | 카나리 | 최장 글자수 |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    if (r.error) {
      lines.push(`| ${r.id} | ${r.run} | ${r.outputLanguage} | 오류 | ${cell(r.error)} | | | | | | |`);
      continue;
    }
    const s = r.score;
    lines.push(
      `| ${r.id} | ${r.run} | ${r.outputLanguage} | ${r.aiFallback ? "폴백" : "AI"} | ${s.schemaOk ? "OK" : "실패"} | ${
        s.languageOk ? "OK" : "실패"
      } (${s.hangulRatio}) | ${s.unsupportedNumbers.join(", ")} | ${s.smallCounts.join(", ")} | ${s.fewShotLeaks.join(", ")} | ${
        r.canary ? (s.canaryLeaked ? "노출" : "OK") : ""
      } | ${s.longestText} |`
    );
  }
  lines.push("");

  const problems = rows.filter((r) => !r.error && (r.score.schemaProblems.length || r.score.countWarnings.length));
  if (problems.length) {
    lines.push("## 형식 문제 상세", "");
    for (const r of problems) {
      lines.push(`- ${r.id} (run ${r.run}): ${[...r.score.schemaProblems, ...r.score.countWarnings].join("; ")}`);
    }
    lines.push("");
  }
  lines.push("판정 기준과 한계는 tests/eval/README.md 참고. 자동 플래그는 사람이 확인할 후보입니다.");
  return lines.join("\n");
}

function buildReviewCsv(rows) {
  const header = [
    "id",
    "run",
    "출력언어",
    "메모",
    "weekly_done",
    "brag_metric_summary",
    "star_result",
    "자동플래그",
    "사실충실도(1-5)",
    "실무사용성(1-5)",
    "과장정도(1-5, 낮을수록 담백)",
    "코멘트",
  ];
  const out = [header.map(csvCell).join(",")];
  for (const r of rows) {
    if (r.error) continue;
    const o = r.output;
    const s = r.score;
    const flags = [
      r.aiFallback ? "폴백" : "",
      s.schemaOk ? "" : "형식",
      s.languageOk ? "" : "언어",
      s.unsupportedNumbers.length ? `숫자:${s.unsupportedNumbers.join("/")}` : "",
      s.fewShotLeaks.length ? `예시복사:${s.fewShotLeaks.join("/")}` : "",
      s.canaryLeaked ? "인젝션" : "",
    ]
      .filter(Boolean)
      .join(" ");
    out.push(
      [
        r.id,
        r.run,
        r.outputLanguage,
        r.memo,
        (o?.weekly_report?.done || []).join("\n"),
        o?.brag_sheet_item?.metric_summary,
        o?.star_portfolio?.result,
        flags,
        "",
        "",
        "",
        "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  // BOM so Excel opens the Korean text as UTF-8.
  return "﻿" + out.join("\r\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set. See tests/eval/README.md (use a separate key in .env.eval).");
    process.exit(1);
  }

  const { executeAiTransformation } = await import("../../lib/transformService.ts");

  const allCases = JSON.parse(readFileSync(new URL("./memos.json", import.meta.url), "utf8"));
  const cases = args.only ? allCases.filter((c) => args.only.includes(c.id)) : allCases;
  if (cases.length === 0) {
    console.error("No matching cases.");
    process.exit(1);
  }

  const jobs = [];
  for (const c of cases) for (let run = 1; run <= args.runs; run++) jobs.push({ ...c, run });

  const startedAt = new Date();
  console.log(`Running ${jobs.length} transformations (${cases.length} cases × ${args.runs} runs)...`);

  const rows = await mapLimit(jobs, args.concurrency, async (job) => {
    const t0 = Date.now();
    try {
      const { output, aiFallback } = await executeAiTransformation(job.memo, job.jobRole, job.toneManner, {
        seniorityLevel: job.seniorityLevel,
        industry: job.industry,
        region: job.region,
      });
      const latencyMs = Date.now() - t0;
      const score = scoreCase(job, output);
      console.log(`  ${job.id} #${job.run}: ${aiFallback ? "FALLBACK" : "ai"} ${latencyMs}ms`);
      return { ...job, output, aiFallback, latencyMs, score };
    } catch (err) {
      console.log(`  ${job.id} #${job.run}: ERROR ${err?.message || err}`);
      return { ...job, error: String(err?.message || err), latencyMs: Date.now() - t0 };
    }
  });

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = `${EVAL_DIR}results/${stamp}-${args.label}/`;
  mkdirSync(outDir, { recursive: true });
  const meta = {
    label: args.label,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startedAt.getTime(),
    cases: cases.length,
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
