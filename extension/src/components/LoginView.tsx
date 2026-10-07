import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { WinStashBrandBadge } from "./WinStashLogo";
import { loginWithGoogle } from "../lib/firebase";

declare const chrome: any;

interface LoginViewProps {
  onLoginSuccess: (authData: any) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const authWindowIdRef = useRef<number | null>(null);

  // Helper to close authentication window / tabs 100% reliably
  const closeAuthWindow = () => {
    if (authWindowIdRef.current && typeof chrome !== "undefined" && chrome.windows) {
      try {
        chrome.windows.remove(authWindowIdRef.current, () => {});
      } catch {}
      authWindowIdRef.current = null;
    }

    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({}, (tabs: any[]) => {
        tabs?.forEach((t) => {
          if (t.id && t.url && t.url.includes("/auth/extension-connect")) {
            try {
              chrome.tabs.remove(t.id);
            } catch {}
          }
        });
      });
    }
  };

  // Listen for storage changes and poll for auth completion
  useEffect(() => {
    let intervalId: any = null;

    const checkStorage = () => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(
          ["winstash_ext_user", "winstash_ext_records", "winstash_ext_credits"],
          (res: any) => {
            if (res?.winstash_ext_user?.uid) {
              if (intervalId) clearInterval(intervalId);
              setIsLoading(false);
              closeAuthWindow();
              onLoginSuccess({
                uid: res.winstash_ext_user.uid,
                email: res.winstash_ext_user.email,
                records: res.winstash_ext_records || [],
                credits: res.winstash_ext_credits || null,
              });
            }
          }
        );
      }
    };

    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes["winstash_ext_user"]?.newValue?.uid) {
        checkStorage();
      }
    };

    const handleRuntimeMessage = (msg: any) => {
      if (msg?.type === "CLOSE_EXTENSION_CONNECT_WINDOW") {
        closeAuthWindow();
      }
    };

    if (isLoading) {
      intervalId = setInterval(checkStorage, 400);
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        chrome.storage.onChanged.addListener(handleStorageChange);
      }
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(handleRuntimeMessage);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
        try {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        } catch {}
      }
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        try {
          chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
        } catch {}
      }
    };
  }, [isLoading, onLoginSuccess]);

  const openConnectWindow = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({}, (allTabs: any[]) => {
        const isLocalDev = allTabs?.some((t) => t.url && t.url.includes("localhost:3000"));
        const base = isLocalDev ? "http://localhost:3000" : "https://winstash.net";
        const connectUrl = `${base}/auth/extension-connect?auto=true`;

        if (chrome.windows && chrome.windows.create) {
          chrome.windows.create(
            {
              url: connectUrl,
              type: "popup",
              width: 500,
              height: 650,
              focused: true,
            },
            (win: any) => {
              if (win?.id) {
                authWindowIdRef.current = win.id;
              }
              setStatusMsg("Select your Google account...");
            }
          );
        } else {
          chrome.tabs.create({ url: connectUrl }, () => {
            setStatusMsg("Select your Google account...");
          });
        }
      });
    } else {
      window.open("https://winstash.net/auth/extension-connect?auto=true", "_blank");
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMsg("Opening Google account selection...");

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(["winstash_ext_logged_out"]);
    }

    // Method 1: Try direct Firebase signInWithPopup in extension
    try {
      const user = await loginWithGoogle();
      if (user && user.uid) {
        setStatusMsg("Connected successfully!");
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            winstash_ext_user: { uid: user.uid, email: user.email || "" },
          });
        }
        closeAuthWindow();
        onLoginSuccess({
          uid: user.uid,
          email: user.email || "",
          records: [],
          credits: null,
        });
        return;
      }
    } catch (popupErr: any) {
      console.log("[WinStash Extension] Direct popup fallback:", popupErr?.message);
    }

    // Method 2: Open dedicated connect window (which redirects directly to Google OAuth)
    openConnectWindow();
  };

  return (
    <div className="w-full bg-zinc-900 text-zinc-100 p-6 flex flex-col items-center justify-center space-y-5 select-none min-h-[380px]">
      {/* Brand Icon & Name */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <WinStashBrandBadge size="md" />
        <h1 className="text-lg font-black text-white tracking-tight">
          WinStash
        </h1>
        <p className="text-xs text-zinc-400 max-w-[280px] leading-relaxed">
          Log weekly work memos and synthesize career achievements directly from any browser tab.
        </p>
      </div>

      {/* Feature Highlights Card */}
      <div className="w-full max-w-[340px] p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs text-zinc-300">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Direct Cloud Database Sync</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug">
          Connect your WinStash account once to automatically load all your past memos, weekly reports, and STAR portfolio directly from the cloud vault.
        </p>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className="text-[11px] text-indigo-300 text-center px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 max-w-[320px] flex items-center justify-center gap-2">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Sign-in Button */}
      <div className="w-full max-w-[340px] space-y-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-75"
        >
          {isLoading ? (
            <span>Connecting with Google...</span>
          ) : (
            <>
              {/* Google G Logo SVG */}
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
              <span>Continue with Google</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </>
          )}
        </button>

        <p className="text-[10px] text-zinc-500 text-center">
          Secure 1-click cloud sync with WinStash Vault
        </p>
      </div>
    </div>
  );
}
