/**
 * Sentry options shared by the browser, Node.js and Edge configs. Errors only (no tracing).
 * Without NEXT_PUBLIC_SENTRY_DSN (dev, tests, builds without a DSN) Sentry is disabled entirely.
 *
 * SDK v11 collects request data by default; turn all of it off (the old `sendDefaultPii: false`):
 * request bodies and local variables could contain memo text, headers and cookies carry auth tokens.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const sentryOptions = {
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
  },
};
