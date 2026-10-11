/**
 * Content-Security-Policy for WinStash, sent as `Content-Security-Policy-Report-Only` (step 1: observe
 * violations in Sentry without blocking anything). Kept free of `@/` imports so next.config.ts and the
 * unit tests can load it directly.
 *
 * The allow-list covers what the app loads today:
 * - Firebase Auth (Google sign-in popup on the auth domain, identitytoolkit/securetoken), Firestore and
 *   Firebase Analytics (googleapis.com, Google Tag Manager / Google Analytics)
 * - PostHog (API host plus its assets host for the session-recording script; replay runs in a blob: worker)
 * - Sentry ingest, Google profile photos, and the Vercel preview toolbar
 * Inline scripts and styles are allowed for now (Next.js inlines both); nonces are step 2.
 */

type Env = Record<string, string | undefined>;

/**
 * Sentry's CSP report endpoint for a DSN (`https://<key>@<host>/<projectId>`), or null when the DSN is
 * missing or malformed (reporting is then simply left out of the header).
 */
export function sentryCspReportUri(dsn: string | undefined, environment = "production"): string | null {
  if (!dsn) return null;
  let url: URL;
  try {
    url = new URL(dsn);
  } catch {
    return null;
  }
  const projectId = url.pathname.replace(/^\/+|\/+$/g, "");
  if (url.protocol !== "https:" || !url.username || !/^\d+$/.test(projectId)) return null;
  const params = new URLSearchParams({ sentry_key: url.username, sentry_environment: environment });
  return `https://${url.host}/api/${projectId}/security/?${params.toString()}`;
}

/** The origin of a URL-ish env value ("https://us.i.posthog.com/" -> "https://us.i.posthog.com"), or null. */
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

/** PostHog serves its lazily loaded scripts (session recorder, surveys) from a sibling assets host. */
function posthogAssetsOrigin(apiOrigin: string): string | null {
  const host = new URL(apiOrigin).hostname;
  const match = host.match(/^(us|eu)\.i\.posthog\.com$/);
  return match ? `https://${match[1]}-assets.i.posthog.com` : null;
}

const unique = (values: (string | null | undefined)[]) => [...new Set(values.filter((v): v is string => Boolean(v)))];

export interface CspOptions {
  env?: Env;
  /** Development needs 'unsafe-eval' (React dev tooling). */
  isDev?: boolean;
}

/** The policy directives, in header order. */
export function buildCspDirectives({ env = process.env, isDev = false }: CspOptions = {}): Record<string, string[]> {
  const posthog = originOf(env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://us.i.posthog.com";
  const posthogAssets = posthogAssetsOrigin(posthog);
  const authDomain = originOf(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const firebaseAppOrigin = projectId ? `https://${projectId}.firebaseapp.com` : null;
  const sentryIngest = originOf(env.NEXT_PUBLIC_SENTRY_DSN?.replace(/\/\/[^@/]*@/, "//"));
  const reportUri = sentryCspReportUri(env.NEXT_PUBLIC_SENTRY_DSN, env.NEXT_PUBLIC_VERCEL_ENV || "production");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": unique([
      "'self'",
      "'unsafe-inline'",
      isDev ? "'unsafe-eval'" : null,
      "https://apis.google.com", // Google sign-in (gapi) used by the Firebase Auth popup
      "https://www.googletagmanager.com", // Firebase Analytics (gtag.js)
      posthogAssets,
      "https://vercel.live", // Vercel preview toolbar
    ]),
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": unique([
      "'self'",
      "data:",
      "blob:",
      "https://lh3.googleusercontent.com", // Google profile photos
      "https://www.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://vercel.live",
      "https://vercel.com",
    ]),
    "font-src": ["'self'", "data:"],
    "connect-src": unique([
      "'self'",
      "https://*.googleapis.com", // Firestore, identitytoolkit, securetoken, installations
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://www.googletagmanager.com",
      "https://stats.g.doubleclick.net", // GA4 with Google signals
      posthog,
      posthogAssets,
      sentryIngest,
      "https://vercel.live",
    ]),
    "frame-src": unique([
      authDomain, // Firebase Auth helper iframe and sign-in popup handler
      firebaseAppOrigin,
      "https://accounts.google.com",
      "https://vercel.live",
    ]),
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  if (reportUri) {
    directives["report-uri"] = [reportUri];
    directives["report-to"] = ["csp-endpoint"];
  }
  return directives;
}

/** Serializes directives into a header value. */
export function serializeCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Headers for next.config.ts: the report-only policy, plus the `Reporting-Endpoints` header that the
 * `report-to` directive refers to (only when a Sentry DSN is configured).
 */
export function cspReportOnlyHeaders(options: CspOptions = {}): { key: string; value: string }[] {
  const env = options.env ?? process.env;
  const directives = buildCspDirectives({ ...options, env });
  const headers = [{ key: "Content-Security-Policy-Report-Only", value: serializeCsp(directives) }];
  const reportUri = directives["report-uri"]?.[0];
  if (reportUri) headers.push({ key: "Reporting-Endpoints", value: `csp-endpoint="${reportUri}"` });
  return headers;
}
