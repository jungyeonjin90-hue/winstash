"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_xAwUsmoU3ofGhEsvWvijDSBGvy8wf6QgmaaXwfRUiGaw";
      const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only", // Create profiles for identified users
        capture_pageview: true,
        capture_pageleave: true,
        session_recording: {
          maskAllInputs: false,
          maskInputOptions: {
            password: true,
          },
        },
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
