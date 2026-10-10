// WinStash Chrome Extension Background Service Worker
//
// Receives the one-time Firebase custom token relayed by the content script on the WinStash
// /auth/extension-connect page and parks it in chrome.storage.session (memory only, not readable by
// content scripts). The popup signs in with it (signInWithCustomToken) and deletes it, after which the
// popup keeps its own Firebase session and refreshes ID tokens by itself.

const PENDING_KEY = "winstash_pending_custom_token";

// chrome.storage.session defaults to trusted contexts only; make that explicit.
chrome.storage.session.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" });

function closeConnectTabs() {
  chrome.storage.local.get(["winstash_auth_window_id"], (res) => {
    if (res && res.winstash_auth_window_id) {
      try {
        chrome.windows.remove(res.winstash_auth_window_id, () => {
          chrome.storage.local.remove(["winstash_auth_window_id"]);
        });
      } catch {}
    }
  });
  chrome.tabs.query({}, (tabs) => {
    tabs?.forEach((tab) => {
      if (tab.id && tab.url && tab.url.includes("/auth/extension-connect")) {
        chrome.tabs.remove(tab.id, () => void chrome.runtime.lastError);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "WINSTASH_SIGN_IN_TOKEN") return false;

  // Must come from our own content script running on a page this extension is installed for
  // (content scripts only run on the manifest's matches).
  const fromOwnContentScript = sender.id === chrome.runtime.id && Boolean(sender.tab) && Boolean(sender.url);
  if (!fromOwnContentScript || typeof message.customToken !== "string") {
    sendResponse({ ok: false });
    return false;
  }

  chrome.storage.session.set({ [PENDING_KEY]: { token: message.customToken, at: Date.now() } }, () => {
    sendResponse({ ok: true });
    // Give the page a moment to show "connected" before closing it
    setTimeout(closeConnectTabs, 800);
  });
  return true; // async sendResponse
});
