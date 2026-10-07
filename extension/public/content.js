// WinStash Chrome Extension Content Script
// Automatically syncs auth state, vault records, and credit limits from web tabs to extension storage

(function () {
  function getCachedRecords(userId) {
    try {
      const cache = localStorage.getItem("winstash_latest_records_cache");
      if (cache) {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (userId) {
        const userRecs = localStorage.getItem("career_pulse_records_user_" + userId);
        if (userRecs) {
          const parsed = JSON.parse(userRecs);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {}
    return [];
  }

  function getCachedCredits() {
    try {
      const cache = localStorage.getItem("winstash_latest_credit_cache");
      if (cache) return JSON.parse(cache);
    } catch (e) {}
    return null;
  }

  function notifyAuthWindowComplete() {
    if (typeof window !== "undefined" && window.location.pathname.includes("/auth/extension-connect")) {
      try {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: "CLOSE_EXTENSION_CONNECT_WINDOW" });
        }
      } catch (e) {}
    }
  }

  function syncEverythingToStorage(user, customRecords, customCredits) {
    if (!user || !user.uid) return;

    const records = customRecords && customRecords.length > 0 ? customRecords : getCachedRecords(user.uid);
    const credits = customCredits || getCachedCredits();

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(["winstash_ext_logged_out"], () => {
        const payload = {
          winstash_ext_user: { uid: user.uid, email: user.email || "" },
          winstash_ext_records: records || [],
        };
        if (credits) {
          payload.winstash_ext_credits = credits;
        }
        chrome.storage.local.set(payload, () => {
          console.log(
            "[WinStash Extension Content] Synced to storage:",
            user.email,
            "Records count:",
            records.length
          );
          notifyAuthWindowComplete();
        });
      });
    }
  }

  function clearUserFromStorage() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ winstash_ext_logged_out: true }, () => {
        chrome.storage.local.remove([
          "winstash_ext_user",
          "winstash_ext_records",
          "winstash_ext_credits",
        ]);
      });
    }
  }

  function checkWebSession() {
    try {
      // 1. Check winstash_auth_bridge from extension-connect
      const bridgeStr = localStorage.getItem("winstash_auth_bridge");
      if (bridgeStr) {
        const parsed = JSON.parse(bridgeStr);
        if (parsed?.uid) {
          syncEverythingToStorage(
            { uid: parsed.uid, email: parsed.email },
            parsed.records,
            parsed.credits
          );
          return;
        }
      }

      // 2. Check winstash_auth_user from AuthContext
      const userStr = localStorage.getItem("winstash_auth_user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.uid) {
          syncEverythingToStorage(parsed);
          return;
        }
      }
    } catch (e) {}
  }

  // Initial check on load
  checkWebSession();

  // Listen for custom auth events from web app
  window.addEventListener("winstash_auth_changed", (event) => {
    if (event.detail && event.detail.uid) {
      syncEverythingToStorage(event.detail);
    } else {
      clearUserFromStorage();
    }
  });

  window.addEventListener("winstash_records_updated", (event) => {
    const userStr = localStorage.getItem("winstash_auth_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.uid) {
          syncEverythingToStorage(user, event.detail);
        }
      } catch {}
    }
  });

  window.addEventListener("winstash_credits_updated", (event) => {
    const userStr = localStorage.getItem("winstash_auth_user");
    if (userStr && event.detail) {
      try {
        const user = JSON.parse(userStr);
        if (user?.uid) {
          syncEverythingToStorage(user, null, event.detail);
        }
      } catch {}
    }
  });

  window.addEventListener("winstash_auth_ready", (event) => {
    if (event.detail && event.detail.uid) {
      syncEverythingToStorage(
        event.detail,
        event.detail.records,
        event.detail.credits
      );
      notifyAuthWindowComplete();
    }
  });

  window.addEventListener("message", (event) => {
    if (event.data?.type === "WINSTASH_AUTH_BRIDGE_UPDATED" && event.data.payload) {
      syncEverythingToStorage(
        event.data.payload,
        event.data.payload.records,
        event.data.payload.credits
      );
      notifyAuthWindowComplete();
    }
  });

  // Listen for storage changes across tabs
  window.addEventListener("storage", (event) => {
    if (
      event.key === "winstash_auth_user" ||
      event.key === "winstash_auth_bridge" ||
      event.key === "winstash_latest_records_cache" ||
      event.key === "winstash_latest_credit_cache"
    ) {
      checkWebSession();
    }
  });

  // Listen for direct runtime messages from the extension popup
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === "GET_WEB_DATA") {
        const userStr = localStorage.getItem("winstash_auth_user");
        let user = null;
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch {}
        }
        const records = user ? getCachedRecords(user.uid) : [];
        const credits = getCachedCredits();
        sendResponse({ user, records, credits });
      } else if (msg.type === "SAVE_RECORD_TO_WEB") {
        if (msg.record) {
          window.dispatchEvent(
            new CustomEvent("winstash_save_record_request", {
              detail: { record: msg.record, deductCredit: Boolean(msg.deductCredit) },
            })
          );
          sendResponse({ success: true });
        }
      } else if (msg.type === "LOGOUT_FROM_EXTENSION") {
        try {
          localStorage.removeItem("winstash_auth_user");
          localStorage.removeItem("winstash_auth_bridge");
          localStorage.removeItem("career_pulse_demo_user");
          window.dispatchEvent(new CustomEvent("winstash_auth_changed", { detail: null }));
        } catch {}
        sendResponse({ success: true });
      }
      return true;
    });
  }
})();
