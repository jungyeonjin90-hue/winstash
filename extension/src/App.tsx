import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Sparkles, CornerDownLeft, RotateCcw, ExternalLink, Zap, CheckCircle2, Info, LogOut, Loader2 } from "lucide-react";
import { WeekSpan, CareerRecord, CreditStatus } from "./types/career";
import { getCurrentWeekSpanEn } from "./lib/weekUtilsEn";
import { isWeekMatch } from "./lib/weekMatch";
import { isAdminEmail } from "./lib/adminConfig";
import {
  auth,
  onAuthStateChanged,
  logoutUser,
  getAuthToken,
  deductFreeCreditInFirestore,
  subscribeToUserRecords,
  fetchUserRecordsFromFirestore,
  saveRecordToFirestore,
  subscribeToUserCredits,
  fetchUserCreditsFromFirestore,
} from "./lib/firebase";
import { WeekPickerEn } from "./components/WeekPickerEn";
import { CreditConfirmModalEn } from "./components/CreditConfirmModalEn";
import { WinStashBrandBadge } from "./components/WinStashLogo";
import { LoginView } from "./components/LoginView";

declare const chrome: any;

const STORAGE_KEY_USER = "winstash_ext_user";
const STORAGE_KEY_LOGGED_OUT = "winstash_ext_logged_out";
const STORAGE_KEY_DRAFT = "winstash_draft_memo";

async function getApiBaseUrl(): Promise<string> {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    try {
      const allTabs: any[] = await new Promise((resolve) => chrome.tabs.query({}, resolve));
      const localTab = allTabs?.find(
        (t) =>
          t.url?.includes("localhost:3000") ||
          t.url?.includes("127.0.0.1:3000") ||
          t.url?.includes("winstash.test")
      );
      if (localTab && localTab.url) {
        const u = new URL(localTab.url);
        return `${u.protocol}//${u.host}`;
      }
    } catch {}
  }
  return "https://winstash.net";
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [selectedWeek, setSelectedWeek] = useState<WeekSpan>(getCurrentWeekSpanEn());
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [memo, setMemo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: "success" | "info"; message: string } | null>(null);

  // Credit status (Admins are always Pro Unlimited; null during initial Firestore load)
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);

  // Determine whether current user is Pro (Admin is always Pro Unlimited)
  const isUserPro = useMemo(() => {
    if (isAdminEmail(currentUser?.email)) return true;
    return Boolean(creditStatus?.isPro);
  }, [currentUser, creditStatus]);

  // Helper: Find existing record for current selected week
  const existingRecord = useMemo(() => {
    return records.find((r) => isWeekMatch(r, selectedWeek));
  }, [records, selectedWeek]);

  // Real Backend Data Loader (GET /api/extension/status) - only for syncing records
  const fetchBackendData = useCallback(async (user?: { uid: string; email: string } | null) => {
    const targetUser = user || currentUser;
    if (!targetUser?.uid) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/extension/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // IMPORTANT: Credits are strictly managed via Firestore onSnapshot (Source of Truth).
          // Do NOT overwrite creditStatus here to eliminate race condition flickering!
          if (Array.isArray(json.records) && json.records.length > 0) {
            setRecords(json.records);
          }
        }
      }
    } catch (e) {
      console.warn("[WinStash Extension] Backend status fetch error:", e);
    }
  }, [currentUser]);

  // 1. Initial Authentication & Firestore Direct Subscription (Source of Truth)
  useEffect(() => {
    let isMounted = true;
    let unsubFirestoreRecords: (() => void) | null = null;
    let unsubFirestoreCredits: (() => void) | null = null;

    // 0. Immediate local storage cache restore (0ms instant UI display for records only)
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [
          STORAGE_KEY_LOGGED_OUT,
          STORAGE_KEY_USER,
          "winstash_ext_records",
        ],
        (res: any) => {
          if (!isMounted) return;
          if (Array.isArray(res?.winstash_ext_records) && res.winstash_ext_records.length > 0) {
            setRecords(res.winstash_ext_records);
          }
          if (!res?.[STORAGE_KEY_LOGGED_OUT] && res?.[STORAGE_KEY_USER]?.uid) {
            const bridgedUser = res[STORAGE_KEY_USER];
            setCurrentUser(bridgedUser);
            setIsAuthChecking(false);
            attachFirestore(bridgedUser.uid, bridgedUser.email);
          }
        }
      );
    }

    const attachFirestore = (userId: string, userEmail?: string | null) => {
      if (unsubFirestoreRecords) {
        unsubFirestoreRecords();
        unsubFirestoreRecords = null;
      }
      if (unsubFirestoreCredits) {
        unsubFirestoreCredits();
        unsubFirestoreCredits = null;
      }

      // 1. Live Firestore Subscription (Direct DB connection to users/{uid}/records)
      unsubFirestoreRecords = subscribeToUserRecords(userId, (freshRecords) => {
        if (!isMounted) return;
        setRecords(freshRecords);
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ winstash_ext_records: freshRecords });
        }
      });

      // 2. Direct Firestore Fetch (Immediate query)
      fetchUserRecordsFromFirestore(userId).then((freshRecords) => {
        if (!isMounted) return;
        if (freshRecords.length > 0) {
          setRecords(freshRecords);
          if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ winstash_ext_records: freshRecords });
          }
        }
      });

      // 3. Live Firestore Credits Subscription - SOLE SOURCE OF TRUTH
      unsubFirestoreCredits = subscribeToUserCredits(userId, userEmail, (freshCredits) => {
        if (!isMounted) return;
        setCreditStatus(freshCredits);
      });

      // 4. Direct Firestore Credit Fetch (Immediate 1-time fetch on mount)
      fetchUserCreditsFromFirestore(userId, userEmail).then((freshCredits) => {
        if (!isMounted) return;
        setCreditStatus(freshCredits);
      });
    };

    // Listen to Firebase Auth state directly
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        const userData = { uid: fbUser.uid, email: fbUser.email || "" };
        setCurrentUser(userData);
        setIsAuthChecking(false);
        attachFirestore(userData.uid, userData.email);
        fetchBackendData(userData);
      } else {
        // Fallback: check chrome.storage.local bridge session
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([STORAGE_KEY_LOGGED_OUT, STORAGE_KEY_USER], (res: any) => {
            if (!isMounted) return;
            if (!res?.[STORAGE_KEY_LOGGED_OUT] && res?.[STORAGE_KEY_USER]?.uid) {
              const bridgedUser = res[STORAGE_KEY_USER];
              setCurrentUser(bridgedUser);
              attachFirestore(bridgedUser.uid, bridgedUser.email);
              fetchBackendData(bridgedUser);
            } else {
              setCurrentUser(null);
            }
            setIsAuthChecking(false);
          });
        } else {
          setIsAuthChecking(false);
        }
      }
    });

    // Auto-close leftover extension-connect tabs
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

    return () => {
      isMounted = false;
      unsubAuth();
      if (unsubFirestoreRecords) unsubFirestoreRecords();
      if (unsubFirestoreCredits) unsubFirestoreCredits();
    };
  }, [fetchBackendData]);

  // 2. Handle successful login callback
  const handleLoginSuccess = useCallback((authData: any) => {
    if (authData?.uid) {
      const user = { uid: authData.uid, email: authData.email || "" };
      setCurrentUser(user);
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove([STORAGE_KEY_LOGGED_OUT]);
        chrome.storage.local.set({ [STORAGE_KEY_USER]: user });
      }
      fetchBackendData(user);
      setStatusFeedback({
        type: "success",
        message: `Connected as ${user.email}!`,
      });
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  }, [fetchBackendData]);

  // 3. Update textarea content when selectedWeek or records from Firestore change
  useEffect(() => {
    const match = records.find((r) => isWeekMatch(r, selectedWeek));
    if (match) {
      const note = match.rawNote || match.raw_memo || "";
      setMemo(note);
    } else {
      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      setMemo(savedDraft || "");
    }
  }, [selectedWeek, records]);
  // 4. Draft memo change handler
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
    const url = `https://winstash.net${path}`;
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
    try {
      localStorage.removeItem(STORAGE_KEY_DRAFT);
    } catch {}

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY_LOGGED_OUT]: true }, () => {
        chrome.storage.local.remove([
          STORAGE_KEY_USER,
          "winstash_ext_token",
          "winstash_ext_records",
          "winstash_ext_credits",
        ]);
      });
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

  // Real Backend API Submitter (POST /api/extension/submit)
  const executeTransform = async () => {
    if (!memo.trim() || !currentUser) return;
    setIsLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        setStatusFeedback({ type: "info", message: "Please sign in again to authorize." });
        setTimeout(() => setStatusFeedback(null), 3500);
        return;
      }

      const recordId = existingRecord ? existingRecord.id : `rec-${Date.now()}`;
      const preliminaryRecord: CareerRecord = {
        id: recordId,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        target_week: selectedWeek,
        raw_memo: memo.trim(),
        rawNote: memo.trim(),
        weekly_report: existingRecord?.weekly_report || {
          done: [memo.trim()],
          in_progress: [],
          next_week: [],
        },
        brag_sheet_item: existingRecord?.brag_sheet_item || {
          metric_summary: memo.trim().slice(0, 80),
          business_impact: "Updated via WinStash Quick Log",
          quarter: `${selectedWeek.year}-Q${Math.ceil(selectedWeek.month / 3)}`,
        },
        star_portfolio: existingRecord?.star_portfolio || {
          title: `${selectedWeek.label} Record`,
          situation: memo.trim(),
          task: "Execution",
          action: memo.trim(),
          result: "Completed",
          nda_tags: ["#CareerRecord"],
        },
        jobRole: "engineering",
        toneManner: "impact",
        source: "chrome_extension",
      };

      // 1. Direct Firestore save (Immediate persistence in cloud DB)
      try {
        await saveRecordToFirestore(currentUser.uid, preliminaryRecord);
      } catch (fsErr) {
        console.warn("[Extension] Direct Firestore save notice:", fsErr);
      }

      // 2. Call backend for server-side AI 3-Way synthesis
      const baseUrl = await getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/extension/submit`, {
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

        // 2. Direct Firestore save of the full AI-synthesized record
        try {
          await saveRecordToFirestore(currentUser.uid, json.record);
        } catch {}

        // 3. Deduct credit in Firestore if updating existing record as free user
        // The live Firestore subscription (subscribeToUserCredits) will automatically update the credit state!
        const shouldDeduct = Boolean(existingRecord && !isUserPro);
        if (shouldDeduct && currentUser?.uid) {
          try {
            await deductFreeCreditInFirestore(currentUser.uid);
          } catch (deductErr) {
            console.warn("[Extension] Credit deduct in Firestore error:", deductErr);
          }
        }

        // 4. Clear draft memo
        try {
          localStorage.removeItem(STORAGE_KEY_DRAFT);
        } catch {}

        setIsModalOpen(false);
        const actionVerb = existingRecord ? "updated" : "saved";
        setStatusFeedback({
          type: "success",
          message: `Successfully ${actionVerb} & synced to Firestore!`,
        });
        setTimeout(() => setStatusFeedback(null), 3000);
      }
    } catch (err: any) {
      console.error("[WinStash Extension] Transform error:", err);
      setStatusFeedback({
        type: "info",
        message: err.message || "Failed to transform memo.",
      });
      setTimeout(() => setStatusFeedback(null), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Initial Storage Check (resolves in ~1ms)
  if (isAuthChecking) {
    return (
      <div className="w-full bg-zinc-900 text-zinc-100 p-8 flex flex-col items-center justify-center space-y-3 min-h-[360px]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-xs text-zinc-400 font-medium">Connecting to WinStash Vault...</span>
      </div>
    );
  }

  // 2. Not logged in: Show clean Google Sign-in screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Logged in: Main Full Vault Logger
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
              onClick={() => setMemo("")}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors px-1 py-0.5 cursor-pointer mr-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
          <span className={`text-xs font-mono mr-1 ${memo.length > 4500 ? "text-amber-400 font-semibold" : "text-zinc-400"}`}>
            {memo.length.toLocaleString()} / 5,000 chars
          </span>

          <button
            type="button"
            onClick={() => handleOpenWebApp("/")}
            title="Open Web Dashboard"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of WinStash"
            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Target Week Selector Bar */}
      <WeekPickerEn
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        existingRecords={records}
      />

      {/* 3. Textarea Container */}
      <div className="relative border border-zinc-700/80 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all bg-zinc-950/70">
        <textarea
          value={memo}
          onChange={(e) => handleMemoChange(e.target.value)}
          maxLength={5000}
          autoFocus
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleSubmitClick();
            }
          }}
          placeholder="e.g. Hotfixed payment gateway timeouts by tuning HikariCP connection pool and deploying Redis caching. Cut p99 latency from 1.2s to 85ms (-93%). Zero dropped transactions during peak sale. Next week: Grafana alerts."
          className="w-full h-32 p-3.5 text-xs bg-transparent placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed text-zinc-100"
        />

        {/* Bottom Toolbar inside input */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-xs rounded-b-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-mono">
              Press ⌘/Ctrl+Enter to submit
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isUserPro ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 animate-spin-slow" />
                <span>Pro Unlimited</span>
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
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
              </span>
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
                disabled={!memo.trim() || isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
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
        isLoading={isLoading}
      />
    </div>
  );
}
