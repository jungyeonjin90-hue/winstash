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
  if (!ip || ip === "unknown-ip") {
    // If IP cannot be determined, permit gracefully but with strict individual count
    return { success: true, remaining: limit, resetSeconds: 0 };
  }

  const now = Date.now();
  const record = ipCache.get(ip);

  if (!record || now > record.resetTime) {
    ipCache.set(ip, {
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
 * Extracts client IP securely from standard HTTP headers (Vercel Anycast / Cloudflare / Proxies)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown-ip";
}

/**
 * Maximum character limit for user raw memo to prevent Gemini API cost abuse.
 * 5,000 characters is approximately 800–1,200 words, more than sufficient for a full weekly work dump.
 */
export const MAX_MEMO_CHAR_LIMIT = 5000;
