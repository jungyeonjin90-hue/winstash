"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { StatusPage, primaryButtonClass, secondaryButtonClass } from "@/components/StatusPage";

export default function Error({
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
    <StatusPage
      title="Something went wrong"
      message="We hit an unexpected error and have been notified. Your saved notes are safe. Try again, or head back home."
    >
      <button type="button" onClick={() => retry()} className={primaryButtonClass}>
        Try again
      </button>
      <Link href="/" className={secondaryButtonClass}>
        Go to Home
      </Link>
    </StatusPage>
  );
}
