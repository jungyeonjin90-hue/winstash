/**
 * CORS for the Chrome extension API routes (audit M-10).
 *
 * The extension popup calls these routes from an extension page with `host_permissions` for the API
 * host, and Chrome does not apply CORS to such requests, so the extension itself needs no CORS headers.
 * We therefore stop answering `Access-Control-Allow-Origin: *` (which let any website call the API
 * from a visitor's browser) and only reflect explicitly allowed origins:
 *
 * - EXTENSION_ALLOWED_ORIGINS: comma-separated list, e.g. "chrome-extension://<published-extension-id>"
 * - outside production, any chrome-extension:// origin (unpacked development builds get random ids)
 */

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function allowedOrigins(): string[] {
  return (process.env.EXTENSION_ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isAllowedExtensionOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins().includes(origin)) return true;
  return process.env.NODE_ENV !== "production" && origin.startsWith("chrome-extension://");
}

/** Response headers for a request: reflects the Origin only when it is allowed. */
export function extensionCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!isAllowedExtensionOrigin(origin)) {
    return { Vary: "Origin" };
  }
  return {
    "Access-Control-Allow-Origin": origin as string,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    Vary: "Origin",
  };
}
