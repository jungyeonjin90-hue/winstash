import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

/**
 * Daily limits for the no-login free STAR tool (/tools/star-method-generator).
 *
 * Anyone can call it without an account, so every call is capped twice, per UTC day:
 * - per client IP (stored only as a salted hash, never the raw IP), and
 * - across the whole service, so a bot rotating IPs cannot run up the Gemini bill.
 * Counts live in free_tool_usage/{day} (global) and free_tool_usage/{day}/ips/{ipHash}; no client
 * rule matches that collection, so only the Admin SDK can read or write it.
 *
 * Keep this module free of `@/` imports: unit tests load it directly with Node's type stripping.
 */

export const FREE_TOOL_DAILY_PER_IP = 5;
export const FREE_TOOL_DAILY_GLOBAL = 300;
/** Free-tool notes are one or a few sentences; the full app allows 5,000 characters. */
export const FREE_TOOL_MAX_CHARS = 800;

export type FreeToolDecision =
  | { ok: true }
  | { ok: false; reason: "ip_daily" | "global_daily"; error: string };

export const FREE_TOOL_IP_LIMIT_ERROR = `You've used today's ${FREE_TOOL_DAILY_PER_IP} free tries. Sign in to WinStash to keep going (free plan included), or come back tomorrow.`;
export const FREE_TOOL_GLOBAL_LIMIT_ERROR =
  "The free tool is busy today. Sign in to WinStash to keep going (free plan included), or come back tomorrow.";

/** Pure limit check on the counts read before this request. */
export function decideFreeToolQuota(ipCount: number, globalCount: number): FreeToolDecision {
  if (globalCount >= FREE_TOOL_DAILY_GLOBAL) {
    return { ok: false, reason: "global_daily", error: FREE_TOOL_GLOBAL_LIMIT_ERROR };
  }
  if (ipCount >= FREE_TOOL_DAILY_PER_IP) {
    return { ok: false, reason: "ip_daily", error: FREE_TOOL_IP_LIMIT_ERROR };
  }
  return { ok: true };
}

/** UTC day key, e.g. "2026-10-12". */
export function freeToolDayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Salted hash of the client IP. The day is part of the input so the same IP gets an unrelated key
 * each day. FREE_TOOL_IP_SALT can override the salt; otherwise the Admin client email is used,
 * which is server-only and never shipped to the browser.
 */
export function hashClientIp(ip: string, day: string, salt: string): string {
  return createHash("sha256").update(`${salt}|${day}|${ip}`).digest("hex").slice(0, 32);
}

export type FreeToolReservation =
  | { ok: true; refund: () => Promise<void> }
  | { ok: false; status: number; error: string; reason: string };

/**
 * Atomically checks both daily limits and counts this request (Firestore transaction), before the
 * paid AI call. Call `refund()` when the request then fails or falls back to the heuristic output.
 */
export async function reserveFreeToolUse(
  db: Firestore,
  ip: string,
  salt: string,
  now: Date = new Date()
): Promise<FreeToolReservation> {
  const day = freeToolDayKey(now);
  const globalRef = db.collection("free_tool_usage").doc(day);
  const ipRef = globalRef.collection("ips").doc(hashClientIp(ip, day, salt));

  let decision: FreeToolDecision;
  try {
    decision = await db.runTransaction(async (tx) => {
      const [globalSnap, ipSnap] = await tx.getAll(globalRef, ipRef);
      const result = decideFreeToolQuota(
        (ipSnap.get("count") as number) || 0,
        (globalSnap.get("count") as number) || 0
      );
      if (!result.ok) return result;
      const updatedAt = now.toISOString();
      tx.set(globalRef, { count: FieldValue.increment(1), updatedAt }, { merge: true });
      tx.set(ipRef, { count: FieldValue.increment(1), updatedAt }, { merge: true });
      return result;
    });
  } catch (e) {
    console.error("[FreeTool] Failed to reserve daily quota:", e);
    return {
      ok: false,
      status: 503,
      reason: "quota_unavailable",
      error: "The free tool is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (!decision.ok) return { ok: false, status: 429, reason: decision.reason, error: decision.error };

  let refunded = false;
  return {
    ok: true,
    refund: async () => {
      if (refunded) return;
      refunded = true;
      try {
        const batch = db.batch();
        batch.set(globalRef, { count: FieldValue.increment(-1) }, { merge: true });
        batch.set(ipRef, { count: FieldValue.increment(-1) }, { merge: true });
        await batch.commit();
      } catch (e) {
        console.error("[FreeTool] Failed to refund daily quota:", e);
      }
    },
  };
}
