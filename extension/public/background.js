// WinStash Chrome Extension Background Service Worker
// Handles background tasks, window lifecycle, and reliable closure of auth connect windows

// 1. Listen for explicit close request from content script or web app
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CLOSE_EXTENSION_CONNECT_WINDOW") {
    console.log("[WinStash Background] Received request to close auth connect window");
    
    // If sent from a tab, close that specific tab immediately
    if (sender && sender.tab && sender.tab.id) {
      chrome.tabs.remove(sender.tab.id, () => {
        if (chrome.runtime.lastError) {
          console.warn("[WinStash Background] Tab close error:", chrome.runtime.lastError);
        }
      });
    }

    // Query and close any remaining extension-connect tabs
    chrome.tabs.query({}, (tabs) => {
      tabs?.forEach((tab) => {
        if (tab.id && tab.url && tab.url.includes("/auth/extension-connect")) {
          chrome.tabs.remove(tab.id, () => {});
        }
      });
    });

    sendResponse({ success: true });
    return true;
  }
});

// 2. Monitor storage changes: when user successfully authenticates, close any open auth-connect tabs and windows
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes["winstash_ext_user"]?.newValue?.uid) {
    console.log("[WinStash Background] User login detected in storage, cleaning up connect tabs and windows");
    setTimeout(() => {
      // Check stored window ID
      chrome.storage.local.get(["winstash_auth_window_id"], (res) => {
        if (res && res.winstash_auth_window_id) {
          try {
            chrome.windows.remove(res.winstash_auth_window_id, () => {
              chrome.storage.local.remove(["winstash_auth_window_id"]);
            });
          } catch {}
        }
      });

      // Also scan all open tabs for extension-connect
      chrome.tabs.query({}, (tabs) => {
        tabs?.forEach((tab) => {
          if (tab.id && tab.url && tab.url.includes("/auth/extension-connect")) {
            chrome.tabs.remove(tab.id, () => {});
          }
        });
      });
    }, 400);
  }
});
