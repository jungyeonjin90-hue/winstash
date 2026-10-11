import * as Sentry from "@sentry/nextjs";

/**
 * Server-side error reporting: always logs to the console (Vercel logs) and sends to Sentry.
 * Sentry is a no-op when NEXT_PUBLIC_SENTRY_DSN is unset (dev, tests, builds without a DSN).
 *
 * Keep `message` stable (no ids or user data) so events group into one Sentry issue; put the
 * details in `extra`. Never pass emails, names or memo text.
 */
export type MonitoringExtra = Record<string, string | number | boolean | null | undefined>;

export function reportMessage(
  message: string,
  level: "error" | "warning",
  extra: MonitoringExtra = {}
): void {
  const log = level === "error" ? console.error : console.warn;
  log(message, extra);
  try {
    Sentry.captureMessage(message, { level, extra });
  } catch {
    // Monitoring must never break the request.
  }
}

export function reportException(error: unknown, message: string, extra: MonitoringExtra = {}): void {
  console.error(message, error, extra);
  try {
    Sentry.captureException(error, { extra: { ...extra, context: message } });
  } catch {
    // Monitoring must never break the request.
  }
}
