"use client";

import posthog from "posthog-js";
import { logEvent, setUserId } from "firebase/analytics";
import { analytics } from "@/lib/firebase";

/**
 * Custom Event Tracker for WinStash Funnels & User Behaviors
 * Dual-tracks to both PostHog and Google Analytics (Firebase Analytics)
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window !== "undefined") {
    // 1. PostHog Event Tracking
    try {
      posthog.capture(eventName, properties);
    } catch (e) {
      console.warn("PostHog trackEvent error:", e);
    }

    // 2. Google Analytics (Firebase Analytics) Event Tracking
    try {
      if (analytics) {
        logEvent(analytics, eventName, properties);
      }
    } catch (e) {
      console.warn("Firebase Analytics trackEvent error:", e);
    }
  }
}

/**
 * Identify authenticated user and set user traits
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window !== "undefined") {
    // 1. PostHog User Identification
    try {
      posthog.identify(userId, traits);
    } catch (e) {
      console.warn("PostHog identifyUser error:", e);
    }

    // 2. Google Analytics User Identification
    try {
      if (analytics) {
        setUserId(analytics, userId);
      }
    } catch (e) {
      console.warn("Firebase Analytics identifyUser error:", e);
    }
  }
}

/**
 * Reset user identity on sign out
 */
export function resetUser(): void {
  if (typeof window !== "undefined") {
    // 1. PostHog User Reset
    try {
      posthog.reset();
    } catch (e) {
      console.warn("PostHog resetUser error:", e);
    }

    // 2. Google Analytics User Reset
    try {
      if (analytics) {
        setUserId(analytics, "");
      }
    } catch (e) {
      console.warn("Firebase Analytics resetUser error:", e);
    }
  }
}
