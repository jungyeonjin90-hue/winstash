/**
 * Minimal Gemini `generateContent` mock for E2E tests (started by playwright.config.ts).
 * The E2E Next server points GEMINI_API_BASE_URL here, so tests never call Google.
 *
 * Behaviour is driven by markers in the prompt's user text:
 *   [mock:fail]  -> HTTP 500 for every model (route must fall back to its heuristic)
 *   [mock:slow]  -> never answers (route must time out per attempt and within its total budget)
 * Requests that put the API key in the URL instead of the x-goog-api-key header are rejected.
 */
import http from "node:http";

const PORT = Number(process.env.MOCK_GEMINI_PORT || 3199);
const EXPECTED_KEY = process.env.MOCK_GEMINI_KEY || "e2e-fake-key";

function transformationOutput() {
  return {
    weekly_report: {
      done: ["[mock-ai] Shipped Redis caching for the payment gateway"],
      in_progress: ["[mock-ai] Rolling out Grafana alerts"],
      next_week: ["[mock-ai] Load-test the checkout flow"],
    },
    brag_sheet_item: {
      metric_summary: "[mock-ai] Cut p99 latency 93% (1.2s -> 85ms)",
      business_impact: "[mock-ai] Zero dropped transactions during peak sale",
      quarter: "2026-Q4",
    },
    star_portfolio: {
      title: "[mock-ai] Payment Gateway Latency Overhaul",
      situation: "[mock-ai] Checkout timeouts at peak traffic",
      task: "[mock-ai] Stabilise the payment path",
      action: "[mock-ai] Tuned the pool and added Redis caching",
      result: "[mock-ai] p99 from 1.2s to 85ms",
      nda_tags: ["#Performance", "#Reliability"],
      impactCategory: "efficiency",
      impactMagnitude: "large",
    },
  };
}

function synthesisOutput() {
  return {
    items: [
      {
        id: "mock-1",
        rank: 1,
        title: "[mock-ai] Payment latency overhaul",
        metric_summary: "[mock-ai] p99 -93%",
        business_impact: "[mock-ai] Protected peak revenue",
        quarter_span: "2026-Q4",
        key_highlights: ["[mock-ai] Redis caching"],
        situation: "[mock-ai] Timeouts",
        task: "[mock-ai] Stabilise",
        action: "[mock-ai] Caching",
        result: "[mock-ai] Faster",
        nda_tags: ["#Performance"],
        period_span: "2026",
        impactCategory: "efficiency",
        impactMagnitude: "large",
        source_log_indices: [1],
      },
    ],
  };
}

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, { "content-type": "text/plain" }).end("mock-gemini ok");
    return;
  }

  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    if (req.url.includes("key=")) {
      res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "API key must not be in the URL" }));
      return;
    }
    if (req.headers["x-goog-api-key"] !== EXPECTED_KEY) {
      res.writeHead(401, { "content-type": "application/json" }).end(JSON.stringify({ error: "bad api key" }));
      return;
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const userText = body?.contents?.[0]?.parts?.[0]?.text ?? "";
    const systemText = body?.systemInstruction?.parts?.[0]?.text ?? "";

    if (userText.includes("[mock:slow]")) return; // never respond; the caller's timeout must fire
    if (userText.includes("[mock:fail]")) {
      res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: "mock failure" }));
      return;
    }

    const isSynthesis = systemText.includes('"items"');
    const payload = isSynthesis ? synthesisOutput() : transformationOutput();
    res.writeHead(200, { "content-type": "application/json" }).end(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] })
    );
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-gemini] listening on http://127.0.0.1:${PORT}`);
});
