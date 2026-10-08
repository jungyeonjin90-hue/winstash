"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { subscribeUserRecords } from "@/lib/firestoreService";
import { getCreditStatus } from "@/lib/creditService";
import { isAdminEmail } from "@/lib/adminConfig";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

export default function ExtensionConnectPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [status, setStatus] = useState<"connecting" | "success" | "need_login">("connecting");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResolvingRedirect, setIsResolvingRedirect] = useState(true);

  // 1. Process OAuth redirect result if returning from Google
  useEffect(() => {
    if (!auth) {
      setIsResolvingRedirect(false);
      return;
    }

    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          console.log("[ExtensionConnect] Logged in via redirect:", res.user.email);
        }
      })
      .catch((err) => {
        console.warn("[ExtensionConnect] getRedirectResult notice:", err);
      })
      .finally(() => {
        setIsResolvingRedirect(false);
      });
  }, []);

  const dispatchBridgeData = useCallback(
    (
      userData: { uid: string; email: string | null },
      recordsData: any[],
      creditsData: any
    ) => {
      const bridgePayload = {
        uid: userData.uid,
        email: userData.email,
        records: recordsData || [],
        credits: creditsData || null,
        timestamp: Date.now(),
      };

      try {
        if (auth?.currentUser) {
          auth.currentUser.getIdToken().then((t) => {
            try {
              localStorage.setItem("winstash_auth_token", t);
            } catch {}
          }).catch(() => {});
        }
        localStorage.setItem(
          "winstash_auth_user",
          JSON.stringify({ uid: userData.uid, email: userData.email })
        );
        localStorage.setItem("winstash_auth_bridge", JSON.stringify(bridgePayload));
        localStorage.setItem("winstash_latest_records_cache", JSON.stringify(recordsData || []));
        if (creditsData) {
          localStorage.setItem("winstash_latest_credit_cache", JSON.stringify(creditsData));
        }
        document.documentElement.setAttribute(
          "data-winstash-auth",
          JSON.stringify(bridgePayload)
        );
        window.postMessage(
          { type: "WINSTASH_AUTH_BRIDGE_UPDATED", payload: bridgePayload },
          "*"
        );
        window.dispatchEvent(
          new CustomEvent("winstash_auth_ready", { detail: bridgePayload })
        );
        window.dispatchEvent(
          new CustomEvent("winstash_auth_changed", {
            detail: { uid: userData.uid, email: userData.email },
          })
        );
      } catch (e) {
        console.warn("Storage sync error:", e);
      }
    },
    []
  );

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

    // 1. User is authenticated! Read cached records immediately (0ms delay)
    let cachedRecords: any[] = [];
    try {
      const rawCache =
        localStorage.getItem("winstash_latest_records_cache") ||
        localStorage.getItem(`career_pulse_records_user_${user.uid}`);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) cachedRecords = parsed;
      }
    } catch {}

    const isAdmin = isAdminEmail(user.email);
    let initialCredits = isAdmin
      ? {
          plan: "pro",
          isPro: true,
          isAdmin: true,
          userUsedCount: 0,
          remainingCredits: 999999,
          maxUserCredits: 999999,
          isUserExhausted: false,
          totalGeneratedCount: 0,
        }
      : null;

    if (!initialCredits) {
      try {
        const rawCredit = localStorage.getItem("winstash_latest_credit_cache");
        if (rawCredit) initialCredits = JSON.parse(rawCredit);
      } catch {}
    }

    if (!initialCredits) {
      initialCredits = {
        plan: "free",
        isPro: false,
        isAdmin: false,
        userUsedCount: 0,
        remainingCredits: 10,
        maxUserCredits: 10,
        isUserExhausted: false,
        totalGeneratedCount: 0,
      };
    }

    // Broadcast bridge data immediately!
    dispatchBridgeData(user, cachedRecords, initialCredits);
    setStatus("success");

    // Close window / tab after 600ms
    const closeTimer = setTimeout(() => {
      try {
        window.open("", "_self");
        window.close();
      } catch {}
    }, 600);

    // Asynchronously fetch fresh records & credits from Firestore in background
    let isSubscribed = true;
    const unsub = subscribeUserRecords(
      user.uid,
      Boolean(user.isDemo),
      async (freshRecords) => {
        if (!isSubscribed) return;
        try {
          const freshCredits = await getCreditStatus(user.uid, Boolean(user.isDemo), user.email);
          dispatchBridgeData(user, freshRecords || cachedRecords, freshCredits || initialCredits);
        } catch (e) {
          console.warn("Background bridge update error:", e);
        }
      }
    );

    return () => {
      isSubscribed = false;
      clearTimeout(closeTimer);
      unsub();
    };
  }, [user, loading, isResolvingRedirect, isLoggingIn, dispatchBridgeData]);

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
