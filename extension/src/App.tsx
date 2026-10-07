import { useState, useEffect, useMemo, useCallback } from "react";
import { Sparkles, CornerDownLeft, RotateCcw, ExternalLink, Zap, CheckCircle2, Info, LogOut, Loader2 } from "lucide-react";
import { WeekSpan, CareerRecord, CreditStatus } from "./types/career";
import { getCurrentWeekSpanEn } from "./lib/weekUtilsEn";
import { isWeekMatch } from "./lib/weekMatch";
import { isAdminEmail } from "./lib/adminConfig";
import { subscribeToUserRecords, saveRecordToFirestore } from "./lib/firebase";
import { WeekPickerEn } from "./components/WeekPickerEn";
import { CreditConfirmModalEn } from "./components/CreditConfirmModalEn";
import { WinStashBrandBadge } from "./components/WinStashLogo";
import { LoginView } from "./components/LoginView";

declare const chrome: any;

const STORAGE_KEY_USER = "winstash_ext_user";
const STORAGE_KEY_RECORDS = "winstash_ext_records";
const STORAGE_KEY_CREDITS = "winstash_ext_credits";
const STORAGE_KEY_LOGGED_OUT = "winstash_ext_logged_out";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; email: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [selectedWeek, setSelectedWeek] = useState<WeekSpan>(getCurrentWeekSpanEn());
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [memo, setMemo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: "success" | "info"; message: string } | null>(null);

  // Credit status (Admins are always Pro Unlimited)
  const [creditStatus, setCreditStatus] = useState<CreditStatus>({
    isPro: false,
    remainingCredits: 10,
    maxUserCredits: 10,
    isUserExhausted: false,
    totalGeneratedCount: 0,
  });

  // Determine whether current user is Pro (Admin is always Pro Unlimited)
  const isUserPro = useMemo(() => {
    if (isAdminEmail(currentUser?.email)) return true;
    return Boolean(creditStatus?.isPro);
  }, [currentUser, creditStatus]);

  // Helper: Save records to persistent storage
  const saveRecordsToStorage = useCallback((newRecords: CareerRecord[]) => {
    setRecords(newRecords);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: newRecords });
    } else {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
    }
  }, []);

  // Helper: Save credits to persistent storage
  const saveCreditsToStorage = useCallback((newCredits: CreditStatus) => {
    setCreditStatus(newCredits);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY_CREDITS]: newCredits });
    } else {
      localStorage.setItem(STORAGE_KEY_CREDITS, JSON.stringify(newCredits));
    }
  }, []);

  // 1. Initial Load: Read storage immediately without blocking
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [STORAGE_KEY_LOGGED_OUT, STORAGE_KEY_USER, STORAGE_KEY_RECORDS, STORAGE_KEY_CREDITS],
        (result: any) => {
          if (!result?.[STORAGE_KEY_LOGGED_OUT] && result?.[STORAGE_KEY_USER]?.uid) {
            const user = result[STORAGE_KEY_USER];
            setCurrentUser(user);

            if (result[STORAGE_KEY_RECORDS] && Array.isArray(result[STORAGE_KEY_RECORDS])) {
              setRecords(result[STORAGE_KEY_RECORDS]);
            }

            if (isAdminEmail(user?.email)) {
              setCreditStatus({
                isPro: true,
                remainingCredits: 999999,
                maxUserCredits: 999999,
                isUserExhausted: false,
                totalGeneratedCount: 0,
              });
            } else if (result[STORAGE_KEY_CREDITS]) {
              setCreditStatus(result[STORAGE_KEY_CREDITS]);
            }
          }
          setIsAuthChecking(false);
        }
      );
    } else {
      const isLoggedOut = localStorage.getItem(STORAGE_KEY_LOGGED_OUT);
      if (!isLoggedOut) {
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed?.uid) {
              setCurrentUser(parsed);
              if (isAdminEmail(parsed.email)) {
                setCreditStatus({
                  isPro: true,
                  remainingCredits: 999999,
                  maxUserCredits: 999999,
                  isUserExhausted: false,
                  totalGeneratedCount: 0,
                });
              }
            }
          } catch {}
        }
        const savedRecs = localStorage.getItem(STORAGE_KEY_RECORDS);
        if (savedRecs) {
          try {
            setRecords(JSON.parse(savedRecs));
          } catch {}
        }
      }
      setIsAuthChecking(false);
    }
  }, []);

  // 2. Direct DB & Web Sync when logged in
  useEffect(() => {
    if (!currentUser?.uid) return;

    // A. Query open WinStash tab for instant vault records & credits
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({}, (tabs: any[]) => {
        const winstashTab = tabs?.find(
          (t) => t.id && (t.url?.includes("winstash.net") || t.url?.includes("localhost:3000"))
        );
        if (winstashTab && winstashTab.id) {
          chrome.tabs.sendMessage(winstashTab.id, { type: "GET_WEB_DATA" }, (res: any) => {
            if (res && Array.isArray(res.records) && res.records.length > 0) {
              saveRecordsToStorage(res.records);
            }
            if (res && res.credits && !isAdminEmail(currentUser.email)) {
              saveCreditsToStorage(res.credits);
            }
          });
        }
      });
    }

    // B. Fetch records from server API endpoint
    const fetchApiRecords = async () => {
      try {
        const res = await fetch(`https://winstash.net/api/extension/records?userId=${currentUser.uid}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.records) && json.records.length > 0) {
            saveRecordsToStorage(json.records);
          }
        }
      } catch (e) {
        try {
          const localRes = await fetch(`http://localhost:3000/api/extension/records?userId=${currentUser.uid}`);
          if (localRes.ok) {
            const localJson = await localRes.json();
            if (localJson.success && Array.isArray(localJson.records) && localJson.records.length > 0) {
              saveRecordsToStorage(localJson.records);
            }
          }
        } catch {}
      }
    };
    fetchApiRecords();

    // C. Stream user records from Firestore Database
    const unsubscribe = subscribeToUserRecords(currentUser.uid, (syncedRecords) => {
      if (syncedRecords && Array.isArray(syncedRecords) && syncedRecords.length > 0) {
        saveRecordsToStorage(syncedRecords);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, currentUser?.email, saveRecordsToStorage, saveCreditsToStorage]);

  // 3. Real-time storage change listener (for login events from web bridge)
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      const listener = (changes: any, areaName: string) => {
        if (areaName === "local") {
          if (changes[STORAGE_KEY_LOGGED_OUT]?.newValue) {
            setCurrentUser(null);
            setRecords([]);
            return;
          }
          if (changes[STORAGE_KEY_USER]?.newValue) {
            const newUser = changes[STORAGE_KEY_USER].newValue;
            setCurrentUser(newUser);
            if (isAdminEmail(newUser?.email)) {
              setCreditStatus({
                isPro: true,
                remainingCredits: 999999,
                maxUserCredits: 999999,
                isUserExhausted: false,
                totalGeneratedCount: 0,
              });
            }
          }
          if (changes[STORAGE_KEY_RECORDS]?.newValue) {
            setRecords(changes[STORAGE_KEY_RECORDS].newValue);
          }
          if (changes[STORAGE_KEY_CREDITS]?.newValue && !isAdminEmail(currentUser?.email)) {
            setCreditStatus(changes[STORAGE_KEY_CREDITS].newValue);
          }
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => {
        try {
          chrome.storage.onChanged.removeListener(listener);
        } catch {}
      };
    }
  }, [currentUser?.email]);

  // Handle successful login callback
  const handleLoginSuccess = useCallback((authData: any) => {
    const user = { uid: authData.uid, email: authData.email || "" };
    setCurrentUser(user);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove([STORAGE_KEY_LOGGED_OUT]);
      chrome.storage.local.set({ [STORAGE_KEY_USER]: user });
    } else {
      localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    }

    if (authData.records && Array.isArray(authData.records)) {
      saveRecordsToStorage(authData.records);
    }

    if (isAdminEmail(user.email)) {
      const adminCreds: CreditStatus = {
        isPro: true,
        remainingCredits: 999999,
        maxUserCredits: 999999,
        isUserExhausted: false,
        totalGeneratedCount: 0,
      };
      saveCreditsToStorage(adminCreds);
    } else if (authData.credits) {
      saveCreditsToStorage(authData.credits);
    }

    setStatusFeedback({
      type: "success",
      message: `Connected as ${user.email}!`,
    });
    setTimeout(() => setStatusFeedback(null), 3500);
  }, [saveRecordsToStorage, saveCreditsToStorage]);

  // Existing record detection for current week
  const existingRecord = useMemo(() => {
    return records.find((rec) => isWeekMatch(rec, selectedWeek));
  }, [records, selectedWeek]);

  // Auto-populate memo when selectedWeek or existingRecord changes
  useEffect(() => {
    if (existingRecord) {
      setMemo(existingRecord.raw_memo || "");
    } else {
      setMemo("");
    }
  }, [selectedWeek, existingRecord]);

  const handleOpenWebApp = (path: string = "/") => {
    const url = `https://winstash.net${path}`;
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setRecords([]);
    setMemo("");
    setStatusFeedback(null);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [STORAGE_KEY_LOGGED_OUT]: true }, () => {
        chrome.storage.local.remove([STORAGE_KEY_USER, STORAGE_KEY_RECORDS, STORAGE_KEY_CREDITS]);
      });

      // Clear session across all open WinStash tabs
      chrome.tabs.query({}, (tabs: any[]) => {
        tabs?.forEach((tab) => {
          if (tab.id && (tab.url?.includes("winstash.net") || tab.url?.includes("localhost:3000"))) {
            try {
              chrome.tabs.sendMessage(tab.id, { type: "LOGOUT_FROM_EXTENSION" });
            } catch {}
            try {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  try {
                    localStorage.removeItem("winstash_auth_user");
                    localStorage.removeItem("winstash_auth_bridge");
                    localStorage.removeItem("career_pulse_demo_user");
                    window.dispatchEvent(new CustomEvent("winstash_auth_changed", { detail: null }));
                  } catch {}
                },
              });
            } catch {}
          }
        });
      });
    } else {
      localStorage.setItem(STORAGE_KEY_LOGGED_OUT, "true");
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_CREDITS);
    }
  };

  // Main Submit Handler
  const handleSubmitClick = () => {
    if (!memo.trim()) return;

    if (creditStatus.isUserExhausted && !isUserPro) {
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

      // Free users confirm credit deduction (Admins/Pros skip)
      if (!isUserPro) {
        setIsModalOpen(true);
        return;
      }
    }

    executeTransform();
  };

  const executeTransform = async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      const updatedRec: CareerRecord = {
        id: existingRecord ? existingRecord.id : `rec_${Date.now()}`,
        createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString(),
        target_week: selectedWeek,
        raw_memo: memo.trim(),
        source: "chrome_extension",
      };

      const newRecords = existingRecord
        ? records.map((r) => (r.id === existingRecord.id ? updatedRec : r))
        : [updatedRec, ...records];

      // 1. Save locally to extension storage
      saveRecordsToStorage(newRecords);

      // 2. Broadcast to open tabs of winstash.net to save with authenticated client SDK
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({}, (tabs: any[]) => {
          tabs?.forEach((tab) => {
            if (tab.id && (tab.url?.includes("winstash.net") || tab.url?.includes("localhost:3000"))) {
              try {
                chrome.tabs.sendMessage(tab.id, { type: "SAVE_RECORD_TO_WEB", record: updatedRec });
              } catch {}
            }
          });
        });
      }

      // 3. Post to server API endpoint for direct DB persistence
      try {
        const payload = JSON.stringify({ userId: currentUser.uid, record: updatedRec });
        fetch("https://winstash.net/api/extension/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        }).catch(() => {
          fetch("http://localhost:3000/api/extension/records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          }).catch(() => {});
        });
      } catch {}

      // 4. Also try direct Firestore save if SDK happens to be authorized
      try {
        await saveRecordToFirestore(currentUser.uid, updatedRec);
      } catch (err) {
        console.warn("Direct Firestore save fallback:", err);
      }

      // Deduct credit only for free users
      if (!isUserPro) {
        const nextRemaining = Math.max(0, creditStatus.remainingCredits - 1);
        const nextCredits: CreditStatus = {
          ...creditStatus,
          remainingCredits: nextRemaining,
          isUserExhausted: nextRemaining === 0,
          totalGeneratedCount: creditStatus.totalGeneratedCount + 1,
        };
        saveCreditsToStorage(nextCredits);
      }

      setIsModalOpen(false);
      const actionVerb = existingRecord ? "updated" : "saved";
      setStatusFeedback({
        type: "success",
        message: `Successfully ${actionVerb} for ${selectedWeek.label}!`,
      });
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err) {
      console.error("Save error:", err);
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
          onChange={(e) => setMemo(e.target.value)}
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
            ) : creditStatus && (
              <span className="text-[11px] text-zinc-400 font-medium">
                {creditStatus.isUserExhausted ? (
                  <span className="text-rose-400 font-semibold">0/{creditStatus.maxUserCredits} free left</span>
                ) : (
                  <span>{creditStatus.remainingCredits}/{creditStatus.maxUserCredits} free left</span>
                )}
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
        remainingCredits={creditStatus.remainingCredits}
        maxCredits={creditStatus.maxUserCredits}
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
