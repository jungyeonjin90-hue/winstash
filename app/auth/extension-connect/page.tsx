"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { auth, googleProvider, getAuthToken } from "@/lib/firebase";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

// Message protocol with the extension's content script (extension/public/content.js).
// Messages are posted to this page's own origin only; the content script relays the one-time custom
// token to the extension background and acknowledges receipt.
const SIGN_IN_MESSAGE = "WINSTASH_EXTENSION_SIGN_IN";
const SIGN_IN_ACK = "WINSTASH_EXTENSION_SIGN_IN_ACK";
const ACK_TIMEOUT_MS = 4000;

type ConnectStatus = "connecting" | "success" | "need_login" | "no_extension" | "error";

/** Gets a one-time custom token for the signed-in user and hands it to the extension. */
async function handOffToExtension(): Promise<"success" | "no_extension" | "error"> {
  const idToken = await getAuthToken();
  if (!idToken) return "error";
  const res = await fetch("/api/extension/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return "error";
  const { customToken } = (await res.json()) as { customToken?: string };
  if (!customToken) return "error";

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", onAck);
      resolve("no_extension");
    }, ACK_TIMEOUT_MS);
    function onAck(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      if (event.data?.type !== SIGN_IN_ACK) return;
      clearTimeout(timer);
      window.removeEventListener("message", onAck);
      resolve("success");
    }
    window.addEventListener("message", onAck);
    window.postMessage({ type: SIGN_IN_MESSAGE, customToken }, window.location.origin);
  });
}

export default function ExtensionConnectPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [status, setStatus] = useState<ConnectStatus>("connecting");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResolvingRedirect, setIsResolvingRedirect] = useState(true);

  // 1. Process OAuth redirect result if returning from Google
  useEffect(() => {
    const pending = auth
      ? getRedirectResult(auth)
          .then((res) => {
            if (res?.user) {
              console.log("[ExtensionConnect] Logged in via redirect:", res.user.email);
            }
          })
          .catch((err) => {
            console.warn("[ExtensionConnect] getRedirectResult notice:", err);
          })
      : Promise.resolve(); // Firebase not configured: nothing to resolve

    pending.finally(() => {
      setIsResolvingRedirect(false);
    });
  }, []);

  const handleManualLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Login error:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (loading || isResolvingRedirect) return;

    if (!user) {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const isAuto = urlParams.get("auto") === "true";
        const hasRedirected = sessionStorage.getItem("winstash_ext_redirected");

        // If auto-connect requested and not yet redirected in this window session
        // Redirect directly to Google Account Chooser without popup blocking!
        if (isAuto && !hasRedirected && !isLoggingIn && auth) {
          sessionStorage.setItem("winstash_ext_redirected", "true");
          // This effect drives an external flow (OAuth redirect, sessionStorage, extension bridge);
          // the state updates mirror that flow for the UI, which is what effects are for.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsLoggingIn(true);
          signInWithRedirect(auth, googleProvider).catch((e) => {
            console.error("signInWithRedirect error:", e);
            sessionStorage.removeItem("winstash_ext_redirected");
            setIsLoggingIn(false);
            setStatus("need_login");
          });
          return;
        }
      }

      setStatus("need_login");
      return;
    }

    // User is authenticated! Clear redirect tracking flag
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("winstash_ext_redirected");
    }

    // Hand a one-time sign-in token to the extension (no tokens or records are stored in the page)
    let cancelled = false;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    handOffToExtension()
      .catch((e) => {
        console.warn("[ExtensionConnect] hand-off failed:", e);
        return "error" as const;
      })
      .then((result) => {
        if (cancelled) return;
        setStatus(result);
        if (result === "success") {
          // Close window / tab shortly after the extension has the token
          closeTimer = setTimeout(() => {
            try {
              window.open("", "_self");
              window.close();
            } catch {}
          }, 600);
        }
      });

    return () => {
      cancelled = true;
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [user, loading, isResolvingRedirect, isLoggingIn]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="flex justify-center">
          <WinStashBrandBadge size="lg" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <span>WinStash Extension Connect</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Connecting your Chrome extension to your cloud vault
          </p>
        </div>

        {status === "connecting" && (
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs text-zinc-300 font-medium">
              {isLoggingIn ? "Redirecting to Google Account Selection..." : "Authorizing session..."}
            </span>
          </div>
        )}

        {status === "success" && (
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex flex-col items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-300">
                Connected Successfully!
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Your extension is now authorized. Closing window...
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  window.open("", "_self");
                  window.close();
                } catch {}
              }}
              className="mt-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}

        {(status === "no_extension" || status === "error") && (
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex flex-col items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            <p className="text-xs text-zinc-300 leading-relaxed">
              {status === "no_extension"
                ? "The WinStash extension did not respond. Make sure it is installed and enabled, then open it and click Connect again."
                : "We couldn't connect the extension right now. Please try again in a moment."}
            </p>
          </div>
        )}

        {status === "need_login" && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Please sign in with your Google account to authorize the WinStash Chrome Extension.
            </p>
            <button
              type="button"
              onClick={handleManualLogin}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
