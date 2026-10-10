"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { LEMON_SQUEEZY_BILLING_PORTAL_URL } from "@/lib/lemonSqueezyConfig";
import type { PaymentIssue } from "@/lib/subscriptionAccess";

const COPY = {
  past_due:
    "Your last Pro payment didn't go through. We'll retry your card over the next few days and you keep Pro meanwhile. Update your card to avoid losing access.",
  unpaid:
    "We couldn't collect your Pro payment, so your account is on the Free plan for now. Update your card to restore Pro. Your notes are safe.",
  action: "Update card",
} as const;

/** Tells a subscriber whose renewal failed to update their card in the Lemon Squeezy portal. */
export function PaymentIssueBanner({ issue }: { issue: PaymentIssue | null | undefined }) {
  if (!issue) return null;

  return (
    <div
      role="alert"
      className="w-full border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/60"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-start gap-2 flex-1 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{COPY[issue]}</span>
        </div>
        <a
          href={LEMON_SQUEEZY_BILLING_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          <span>{COPY.action}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
