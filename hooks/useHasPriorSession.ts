import { useSyncExternalStore } from "react";
import { SESSION_FLAG_KEY } from "@/context/AuthContext";

function subscribe(onChange: () => void) {
  // Other tabs signing in/out; same-tab changes are picked up on the next render (getSnapshot).
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readFlag(): boolean {
  try {
    return localStorage.getItem(SESSION_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Whether this browser had a signed-in session before (set by AuthContext). Lets the pages show a
 * loading skeleton instead of flashing the landing page while Firebase restores the session.
 * Always false during SSR/hydration, then the stored value on the client.
 */
export function useHasPriorSession(): boolean {
  return useSyncExternalStore(subscribe, readFlag, () => false);
}
