"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { subscribeUserRecords } from "@/lib/firestoreService";
import { auth, googleProvider, getAuthToken } from "@/lib/firebase";
import { getCreditStatus } from "@/lib/creditService";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

export default function ExtensionConnectPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const [status, setStatus] = useState<"connecting" | "success" | "need_login">("connecting");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Catch redirect result if returning from Google OAuth redirect
  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).catch((err) => {
        console.warn("getRedirectResult warning:", err);
      });
    }
  }, []);

  useEffect(() => {
    // Wait until AuthContext finishes checking Firebase session
    if (loading) return;

    if (!user) {
      setStatus("need_login");
      // Auto-trigger Google sign-in immediately without requiring manual click
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("auto") === "true" && !isLoggingIn) {
          setIsLoggingIn(true);
          if (auth) {
            signInWithRedirect(auth, googleProvider).catch((e) => {
              console.error("signInWithRedirect error:", e);
              signInWithGoogle().catch((err2) => {
                console.error("Popup fallback error:", err2);
                setIsLoggingIn(false);
              });
            });
          } else {
            signInWithGoogle().catch(() => setIsLoggingIn(false));
          }
        }
      }
      return;
    }

    let isSubscribed = true;

    // Fetch user's records & credits to send to extension
    const unsubscribeRecords = subscribeUserRecords(
      user.uid,
      Boolean(user.isDemo),
      async (records) => {
        if (!isSubscribed) return;
        try {
          const token = await getAuthToken();
          // Fetch real credit status directly (ensures admins get unlimited Pro)
          const credits = await getCreditStatus(user.uid, Boolean(user.isDemo), user.email);

          const bridgePayload = {
            uid: user.uid,
            email: user.email,
            token,
            records: records || [],
            credits,
            timestamp: Date.now(),
          };

          // 1. LocalStorage for tab polling
          localStorage.setItem("winstash_auth_bridge", JSON.stringify(bridgePayload));

          // 2. DOM Attribute for content script & executeScript direct access
          try {
            document.documentElement.setAttribute("data-winstash-auth", JSON.stringify(bridgePayload));
          } catch {}

          // 3. postMessage for isolated world content script
          try {
            window.postMessage({ type: "WINSTASH_AUTH_BRIDGE_UPDATED", payload: bridgePayload }, "*");
          } catch {}

          // 4. CustomEvent for same-page listeners
          try {
            window.dispatchEvent(new CustomEvent("winstash_auth_ready", { detail: bridgePayload }));
          } catch {}

          setStatus("success");

          // Try closing tab automatically after short delay
          setTimeout(() => {
            try {
              window.close();
            } catch {}
          }, 1500);
        } catch (e) {
          console.error("Failed to build bridge payload:", e);
        }
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribeRecords();
    };
  }, [user]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Login error:", e);
    } finally {
      setIsLoggingIn(false);
    }
  };

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
            <Sparkles className="w-6 h-6 animate-spin text-indigo-400" />
            <span className="text-xs text-zinc-300 font-medium">
              Syncing vault records and session...
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
                Your extension is now authorized. You can close this tab and return to the extension.
              </p>
            </div>
          </div>
        )}

        {status === "need_login" && (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Please sign in with your Google account to authorize the WinStash Chrome Extension.
            </p>
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              {isLoggingIn ? (
                <span>Signing in...</span>
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
