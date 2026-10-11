import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage, primaryButtonClass, secondaryButtonClass } from "@/components/StatusPage";

export const metadata: Metadata = {
  title: "Page not found | WinStash",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="This page doesn't exist"
      message="The link may be old or mistyped. Your notes are safe. Head back and keep logging your wins."
    >
      <Link href="/" className={primaryButtonClass}>
        Go to Home
      </Link>
      <Link href="/pricing" className={secondaryButtonClass}>
        Pricing
      </Link>
      <Link href="/resources" className={secondaryButtonClass}>
        Resources
      </Link>
    </StatusPage>
  );
}
