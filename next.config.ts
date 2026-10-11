import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { cspReportOnlyHeaders } from "./lib/csp";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Report-only for now (lib/csp.ts): violations go to Sentry when NEXT_PUBLIC_SENTRY_DSN is set,
  // nothing is blocked. Do not add an enforcing Content-Security-Policy until the reports are clean.
  ...cspReportOnlyHeaders({ isDev: process.env.NODE_ENV === "development" }),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  // The Korean service (/ko) was removed: send old links to the matching English page, else home.
  async redirects() {
    return [
      { source: "/ko", destination: "/", permanent: true },
      {
        source: "/ko/:page(pricing|privacy|refund|terms|resources)/:rest*",
        destination: "/:page/:rest*",
        permanent: true,
      },
      { source: "/ko/:path*", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Source maps are uploaded only when SENTRY_AUTH_TOKEN is set (e.g. on Vercel); without it, and without
// any Sentry env vars, the build runs exactly as before.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: sentryAuthToken,
  silent: true,
  telemetry: false,
  sourcemaps: { disable: !sentryAuthToken },
  release: { create: Boolean(sentryAuthToken) },
  // Errors only: drop the tracing and replay code from the browser bundle.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },
});
