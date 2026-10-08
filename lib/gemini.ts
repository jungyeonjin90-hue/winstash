/**
 * Shared Gemini JSON client used by every AI route.
 *
 * - Tries models in order and returns the first response that parses and passes `validate`.
 * - Each attempt has its own timeout and the whole call has a total budget, so a slow or hanging
 *   model can never hold the serverless function until the platform kills it (audit M-7).
 * - The API key travels in the `x-goog-api-key` header, never in the URL, so it cannot leak into
 *   request logs (audit M-7).
 * - Returns null when every attempt fails; callers then use their heuristic fallback and must not
 *   charge the user for it (audit M-3).
 *
 * Keep this module free of `@/` imports: tests load it directly with Node's type stripping.
 */

export interface GeminiJsonRequest<T> {
  models: readonly string[];
  systemInstruction: string;
  userText: string;
  temperature?: number;
  /** Per-model attempt timeout. */
  attemptTimeoutMs: number;
  /** Upper bound for the whole call across all attempts. */
  totalBudgetMs: number;
  /** Shape check for the parsed JSON; attempts whose output fails it are discarded. */
  validate: (value: unknown) => value is T;
  /** Log prefix. */
  label: string;
}

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
// Below this much remaining budget another attempt is not worth starting.
const MIN_ATTEMPT_MS = 1000;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generateGeminiJson<T>(req: GeminiJsonRequest<T>): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Override only for local tests against a mock server (e2e/mock-gemini.mjs).
  const baseUrl = (process.env.GEMINI_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const deadline = Date.now() + req.totalBudgetMs;

  for (const model of req.models) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) {
      console.warn(`[${req.label}] Gemini time budget exhausted before trying ${model}`);
      break;
    }

    try {
      const response = await fetch(`${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: req.userText }] }],
          generationConfig: {
            responseMimeType: "application/json",
            ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
          },
        }),
        signal: AbortSignal.timeout(Math.min(req.attemptTimeoutMs, remaining)),
      });

      if (!response.ok) {
        console.warn(`[${req.label}] Gemini model ${model} returned HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text !== "string") continue;

      const parsed: unknown = JSON.parse(text);
      if (req.validate(parsed)) return parsed;
      console.warn(`[${req.label}] Gemini model ${model} returned an unexpected JSON shape`);
    } catch (err) {
      console.warn(`[${req.label}] Gemini model ${model} failed, trying next:`, err);
    }
  }
  return null;
}

/** Validator for the 3-way transformation output shared by all transform routes. */
export function isTransformationOutput(value: unknown): value is {
  weekly_report: unknown;
  brag_sheet_item: unknown;
  star_portfolio: unknown;
} {
  const v = value as Record<string, unknown> | null;
  return Boolean(v && v.weekly_report && v.brag_sheet_item && v.star_portfolio);
}

/** Time limits for the interactive transform routes (keep total + DB work under maxDuration). */
export const TRANSFORM_TIMEOUTS = { attemptTimeoutMs: 12_000, totalBudgetMs: 25_000 } as const;
/** Synthesis prompts are larger; still bounded well under maxDuration. */
export const SYNTHESIS_TIMEOUTS = { attemptTimeoutMs: 25_000, totalBudgetMs: 45_000 } as const;
