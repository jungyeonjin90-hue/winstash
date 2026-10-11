"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Last-resort error page for errors in the root layout. It replaces the whole document, so it has its
 * own <html>/<body> and inline styles (global CSS and fonts are not loaded here).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "16px",
        }}
      >
        <title>Something went wrong | WinStash</title>
        <style>{`@media (prefers-color-scheme: dark) { body { background: #09090b; color: #f4f4f5; } }`}</style>
        <main style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#71717a", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
            We hit an unexpected error and have been notified. Your saved notes are safe.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: "#4f46e5",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            Try again
          </button>
          {/* A plain link: the app's router may be what failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#4f46e5", fontWeight: 600, fontSize: 14 }}>
            Go to Home
          </a>
        </main>
      </body>
    </html>
  );
}
