"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // No key -> analytics stays off (local dev, tests). There is deliberately no built-in fallback key.
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (typeof window !== "undefined" && key) {
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only", // Create profiles for identified users
        capture_pageview: true,
        capture_pageleave: true,
        // Session replay keeps layout and interactions but never what users type or read: weekly notes
        // and AI outputs can contain confidential work information.
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "*",
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
