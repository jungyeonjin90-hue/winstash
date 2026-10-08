/**
 * Server-Side In-Memory Rate Limiting Guardrail
 * Protects Next.js API routes from bot scraping, DDoS, and runaway LLM costs.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number; // millisecond timestamp
}

// In-memory cache for IP request counts
const ipCache = new Map<string, RateLimitRecord>();

// Clean up expired IP records every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipCache.entries()) {
      if (now > record.resetTime) {
        ipCache.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks if the client IP has exceeded the allowed request limit within the time window.
 * @param ip Client IP address
 * @param limit Maximum requests permitted in the window (default: 10 per minute)
 * @param windowMs Duration of the rate window in milliseconds (default: 60,000ms = 1m)
 */
export function checkServerRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  // `ip` is an opaque bucket key: a client IP, or "uid:<firebase uid>" for per-account limits.
  const effectiveIp = ip && ip.trim().length > 0 ? ip.trim() : "unknown-ip";

  const now = Date.now();
  const record = ipCache.get(effectiveIp);

  if (!record || now > record.resetTime) {
    ipCache.set(effectiveIp, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetSeconds,
    };
  }

  record.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  return {
    success: true,
    remaining: limit - record.count,
    resetSeconds,
  };
}

/**
 * Extracts the client IP from proxy headers.
 *
 * On Vercel, `x-real-ip` / `x-forwarded-for` are set by the platform edge and cannot be forged by the
 * client. `cf-connecting-ip` is only trustworthy when every request really passes through Cloudflare;
 * otherwise any client can send it and get a fresh rate-limit bucket per request (audit H-3).
 * Opt in with TRUST_CF_CONNECTING_IP=true only behind Cloudflare.
 *
 * Note: without a trusted proxy in front (e.g. `next dev`), all of these headers are client-controlled.
 */
export function getClientIp(req: Request): string {
  if (process.env.TRUST_CF_CONNECTING_IP === "true") {
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown-ip";
}

/**
 * Maximum character limit for user raw memo to prevent Gemini API cost abuse.
 * 5,000 characters is approximately 800–1,200 words, more than sufficient for a full weekly work dump.
 */
export const MAX_MEMO_CHAR_LIMIT = 5000;
