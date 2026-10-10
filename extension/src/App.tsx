import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Sparkles, CornerDownLeft, RotateCcw, ExternalLink, Zap, CheckCircle2, Info, LogOut, Loader2, AlertCircle } from "lucide-react";
import { WeekSpan, CareerRecord, CreditStatus } from "./types/career";
import { getCurrentWeekSpanEn } from "./lib/weekUtilsEn";
import { isWeekMatch } from "./lib/weekMatch";
import { isAdminEmail } from "./lib/adminConfig";
import {
  auth,
  onAuthStateChanged,
  logoutUser,
  getAuthToken,
  consumePendingSignIn,
  PENDING_SIGN_IN_KEY,
} from "./lib/firebase";
import { WeekPickerEn } from "./components/WeekPickerEn";
import { CreditConfirmModalEn } from "./components/CreditConfirmModalEn";
import { WinStashBrandBadge } from "./components/WinStashLogo";
import { LoginView, type LoginResult } from "./components/LoginView";
import { WEB_BASE_URL } from "./lib/webBase";

// Values older versions copied from the web app (ID token, user, records); removed on startup.
const LEGACY_BRIDGE_KEYS = [
  "winstash_ext_user",
  "winstash_ext_token",
  "winstash_ext_records",
  "winstash_ext_credits",
  "winstash_ext_logged_out",
];
const STORAGE_KEY_DRAFT = "winstash_draft_memo";
// Generous enough for a cold serverless start + token refresh, short enough to never spin forever.
const STATUS_TIMEOUT_MS = 10_000;

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataFetchError, setDataFetchError] = useState<string | null>(null);

  const [selectedWeek, setSelectedWeek] = useState<WeekSpan>(getCurrentWeekSpanEn());
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [memo, setMemo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: "success" | "info"; message: string } | null>(null);

  // Credit status from backend API (null while loading)
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);

  // Determine whether current user is Pro (Admin is always Pro Unlimited)
  const isUserPro = useMemo(() => {
    if (isAdminEmail(currentUser?.email)) return true;
    return Boolean(creditStatus?.isPro);
  }, [currentUser, creditStatus]);

  // Find existing record for current selected week
  const existingRecord = useMemo(() => {
    return records.find((r) => isWeekMatch(r, selectedWeek));
  }, [records, selectedWeek]);

  // 1. Single Unified Backend API Loader (GET /api/extension/status with a timeout).
  //    It can be triggered twice on open (bridged session + Firebase auth restore); only the latest
  //    request may update the UI, so an older timeout or response cannot overwrite a newer result.
  const latestStatusRequestRef = useRef(0);
  const fetchStatusAndRecords = useCallback(async () => {
    const requestId = ++latestStatusRequestRef.current;
    const isLatest = () => requestId === latestStatusRequestRef.current;
    setIsLoadingData(true);
    setDataFetchError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, STATUS_TIMEOUT_MS);

    try {
      const token = await getAuthToken();
      if (!token) {
        clearTimeout(timeoutId);
        setIsLoadingData(false);
        return;
      }

      const res = await fetch(`${WEB_BASE_URL}/api/extension/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!isLatest()) return;

      if (res.ok) {
        const json = await res.json();
        if (!isLatest()) return;
        if (json.success) {
          // 1. Bind Credits immediately
          if (json.credits) {
            setCreditStatus(json.credits);
          }

          // 2. Bind Records and populate current week rawNote
          if (Array.isArray(json.records)) {
            setRecords(json.records);
            const currentMatch = json.records.find((r: CareerRecord) => isWeekMatch(r, selectedWeek));
            if (currentMatch) {
              const note = currentMatch.rawNote || currentMatch.raw_memo || "";
              setMemo(note);
            } else {
              const draft = localStorage.getItem(STORAGE_KEY_DRAFT);
              if (draft) setMemo(draft);
            }
          }
        } else {
          setDataFetchError(json.error || "Failed to load latest vault data.");
        }
      } else {
        setDataFetchError("Server busy. You can still type notes offline.");
      }
    } catch (err) {
      if (!isLatest()) return;
      if ((err as Error | null)?.name === "AbortError") {
        console.warn(`[WinStash Extension] API timeout after ${STATUS_TIMEOUT_MS}ms. Released loading.`);
        setDataFetchError("Sync is taking longer than usual. You can still write and save notes.");
      } else {
        console.warn("[WinStash Extension] API fetch notice:", err);
        setDataFetchError("Network notice. You can still write and save notes.");
      }
    } finally {
      clearTimeout(timeoutId);
      if (isLatest()) {
        setIsLoadingData(false);
        setIsAuthChecking(false);
      }
    }
  }, [selectedWeek]);

  // 2. Auth: the extension's own Firebase session is the only source of truth (audit H-6).
  //    A sign-in started on winstash.net arrives as a one-time custom token parked by background.js.
  useEffect(() => {
    let isMounted = true;
    let unsubAuth: (() => void) | undefined;
    const hasChromeStorage = typeof chrome !== "undefined" && Boolean(chrome.storage);

    if (hasChromeStorage) chrome.storage.local.remove(LEGACY_BRIDGE_KEYS);

    // A token can also arrive while the popup is open (user finishes the web sign-in)
    const handleSessionChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "session" && changes[PENDING_SIGN_IN_KEY]?.newValue) void consumePendingSignIn();
    };
    if (hasChromeStorage) chrome.storage.onChanged.addListener(handleSessionChange);

    (async () => {
      // Finish a pending web sign-in first so the popup does not flash the login screen
      await consumePendingSignIn();
      if (!isMounted) return;
      unsubAuth = onAuthStateChanged(auth, (fbUser) => {
        if (!isMounted) return;
        setIsAuthChecking(false);
        if (fbUser) {
          setCurrentUser({ uid: fbUser.uid, email: fbUser.email || "" });
          fetchStatusAndRecords();
        } else {
          setCurrentUser(null);
        }
      });
    })();

    // Auto-close leftover extension-connect tabs
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({}, (tabs: chrome.tabs.Tab[]) => {
        tabs?.forEach((t) => {
          if (t.id && t.url && t.url.includes("/auth/extension-connect")) {
            try {
              chrome.tabs.remove(t.id);
            } catch {}
          }
        });
      });
    }

    return () => {
      isMounted = false;
      unsubAuth?.();
      if (hasChromeStorage) chrome.storage.onChanged.removeListener(handleSessionChange);
    };
  }, [fetchStatusAndRecords]);

  // 3. Login callback (the auth listener above loads the data; this only confirms it to the user)
  const handleLoginSuccess = useCallback((authData: LoginResult) => {
    if (authData?.email) {
      setStatusFeedback({
        type: "success",
        message: `Connected as ${authData.email}!`,
      });
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  }, []);

  // 4. Update textarea content when selectedWeek or records change (adjusted during render; the
  //    initial null makes the first render load it, like the former mount effect did)
  const [memoSource, setMemoSource] = useState<{ week: WeekSpan; records: CareerRecord[] } | null>(null);
  if (!memoSource || memoSource.week !== selectedWeek || memoSource.records !== records) {
    setMemoSource({ week: selectedWeek, records });
    const match = records.find((r) => isWeekMatch(r, selectedWeek));
    if (match) {
      setMemo(match.rawNote || match.raw_memo || "");
    } else {
      setMemo(localStorage.getItem(STORAGE_KEY_DRAFT) || "");
    }
  }

  // 5. Draft memo change handler
  const handleMemoChange = (newText: string) => {
    setMemo(newText);
    try {
      if (newText.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY_DRAFT, newText);
      } else {
        localStorage.removeItem(STORAGE_KEY_DRAFT);
      }
    } catch {}
  };

  const handleOpenWebApp = (path: string = "/") => {
    const url = `${WEB_BASE_URL}${path}`;
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}

    setCurrentUser(null);
    setRecords([]);
    setMemo("");
    setCreditStatus(null);
    setStatusFeedback(null);
    setDataFetchError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    } catch {}
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.remove(LEGACY_BRIDGE_KEYS);
      chrome.storage.session.remove(PENDING_SIGN_IN_KEY);
    }
  };

  // Main Submit Trigger
  const handleSubmitClick = () => {
    if (!memo.trim()) return;

    if (creditStatus?.isUserExhausted && !isUserPro) {
      handleOpenWebApp("/pricing");
      return;
    }

    // Updating existing record
    if (existingRecord) {
      if (existingRecord.raw_memo.trim() === memo.trim()) {
        setStatusFeedback({ type: "info", message: "No changes detected in your notes." });
        setTimeout(() => setStatusFeedback(null), 3000);
        return;
      }

      // Free users confirm credit deduction before AI update
      if (!isUserPro) {
        setIsModalOpen(true);
        return;
      }
    }

    executeTransform();
  };

  // Single Backend API Submitter (POST /api/extension/submit)
  const executeTransform = async () => {
    if (!memo.trim() || !currentUser) return;
    setIsSubmitting(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setStatusFeedback({ type: "info", message: "Please sign in again to authorize." });
        setTimeout(() => setStatusFeedback(null), 3500);
        return;
      }

      const res = await fetch(`${WEB_BASE_URL}/api/extension/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_memo: memo.trim(),
          rawNote: memo.trim(),
          target_week: selectedWeek,
          existingRecordId: existingRecord?.id,
          existingCreatedAt: existingRecord?.createdAt,
          job_role: "engineering",
          tone_manner: "impact",
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Failed to save and transform record");
      }

      const json = await res.json();
      if (json.success && json.record) {
        // 1. Update records in state with full AI-synthesized record
        setRecords((prev) => [json.record, ...prev.filter((r) => r.id !== json.record.id)]);

        // 2. Update credits strictly from server canonical response
        if (json.credits) {
          setCreditStatus(json.credits);
        }

        // 3. Clear draft memo
        try {
          localStorage.removeItem(STORAGE_KEY_DRAFT);
        } catch {}

        setIsModalOpen(false);
        const actionVerb = existingRecord ? "updated" : "saved";
        setStatusFeedback({
          type: "success",
          message: `Successfully ${actionVerb} & synced with AI!`,
        });
        setTimeout(() => setStatusFeedback(null), 3000);
      }
    } catch (err) {
      console.error("[WinStash Extension] Transform error:", err);
      setStatusFeedback({
        type: "info",
        message: (err as Error | null)?.message || "Failed to transform memo.",
      });
      setTimeout(() => setStatusFeedback(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initial Auth Loading Screen (under 100ms)
  if (isAuthChecking) {
    return (
      <div className="w-full bg-zinc-900 text-zinc-100 p-8 flex flex-col items-center justify-center space-y-3 min-h-[360px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-xs text-zinc-400 font-medium">Connecting to WinStash Vault...</span>
      </div>
    );
  }

  // Not logged in: Show Google Sign-in screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Main UI
  return (
    <div className="w-full bg-zinc-900 text-zinc-100 p-4 space-y-3 select-none">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <WinStashBrandBadge size="sm" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-extrabold text-white tracking-tight">
              WinStash
            </span>
            <span className="text-xs font-semibold text-zinc-400 truncate max-w-[130px]" title={currentUser.email || ""}>
              {currentUser.email ? currentUser.email.split("@")[0] : "Vault"}
            </span>
          </div>
        </div>

        {/* Controls: Char Counter, Clear, Web Link & Logout */}
        <div className="flex items-center gap-1.5">
          {memo.length > 0 && (
            <button
              type="button"
              onClick={() => handleMemoChange("")}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Clear text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenWebApp("/")}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Open Web Dashboard"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Week Picker Row */}
      <div className="flex items-center justify-between gap-2">
        <WeekPickerEn
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          existingRecords={records}
        />
        {existingRecord && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[11px] font-semibold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Logged</span>
          </span>
        )}
      </div>

      {/* Connection Notice banner (if timeout or network notice) */}
      {dataFetchError && (
        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-950/50 border border-amber-800/50 text-[11px] text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{dataFetchError}</span>
        </div>
      )}

      {/* 3. Textarea Input Card */}
      <div className="relative rounded-2xl bg-zinc-950/90 border border-zinc-800/80 focus-within:border-indigo-500/80 transition-colors shadow-inner">
        <textarea
          value={memo}
          onChange={(e) => handleMemoChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmitClick();
            }
          }}
          placeholder="Brain-dump what you shipped, fixed, or unblocked this week. AI will synthesize it into 3 drawers automatically..."
          rows={7}
          className="w-full p-3.5 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
        />

        {/* Bottom Bar: Character count, Credits info & Action Button */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/60 bg-zinc-900/60 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">
              {memo.length} chars
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isUserPro ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 animate-spin-slow" />
                <span>Pro Unlimited</span>
              </span>
            ) : isLoadingData && !creditStatus ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                <span>Syncing...</span>
              </span>
            ) : creditStatus ? (
              <span className="text-[11px] text-zinc-400 font-medium">
                {creditStatus.isUserExhausted ? (
                  <span className="text-rose-400 font-semibold">0/{creditStatus.maxUserCredits} free left</span>
                ) : (
                  <span>{creditStatus.remainingCredits}/{creditStatus.maxUserCredits} free left</span>
                )}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-medium">10/10 free left</span>
            )}

            {!isUserPro && creditStatus && creditStatus.isUserExhausted ? (
              <button
                type="button"
                onClick={() => handleOpenWebApp("/pricing")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Upgrade to Pro ($5.99)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={!memo.trim() || isSubmitting}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{existingRecord ? `Update ${selectedWeek.label}` : `Save to ${selectedWeek.label}`}</span>
                    <CornerDownLeft className="w-3 h-3 opacity-70" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {statusFeedback && (
        <div
          className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs animate-in fade-in duration-200 ${
            statusFeedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
              : "bg-indigo-950/80 border-indigo-800 text-indigo-300"
          }`}
        >
          {statusFeedback.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Info className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{statusFeedback.message}</span>
        </div>
      )}

      {/* Free Credit Deduct Confirmation Modal */}
      <CreditConfirmModalEn
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={executeTransform}
        remainingCredits={creditStatus?.remainingCredits ?? 0}
        maxCredits={creditStatus?.maxUserCredits ?? 10}
        targetWeekLabel={selectedWeek.label}
        onUpgradeClick={() => {
          setIsModalOpen(false);
          handleOpenWebApp("/pricing");
        }}
        isLoading={isSubmitting}
      />
    </div>
  );
}
