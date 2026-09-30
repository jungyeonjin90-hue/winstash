"use client";

import posthog from "posthog-js";

/**
 * Custom Event Tracker for WinStash Funnels & User Behaviors
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window !== "undefined") {
    try {
      posthog.capture(eventName, properties);
    } catch (e) {
      console.warn("Analytics trackEvent error:", e);
    }
  }
}

/**
 * Identify authenticated user and set user traits
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window !== "undefined") {
    try {
      posthog.identify(userId, traits);
    } catch (e) {
      console.warn("Analytics identifyUser error:", e);
    }
  }
}

/**
 * Reset user identity on sign out
 */
export function resetUser(): void {
  if (typeof window !== "undefined") {
    try {
      posthog.reset();
    } catch (e) {
      console.warn("Analytics resetUser error:", e);
    }
  }
}
