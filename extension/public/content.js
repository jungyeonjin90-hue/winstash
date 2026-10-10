// WinStash Chrome Extension Content Script
//
// Runs only on the WinStash web app (see manifest "content_scripts"; production builds match
// https://winstash.net only). Its single job: relay the one-time Firebase custom token that
// /auth/extension-connect posts to its own window to the extension background, then acknowledge.
// It never reads localStorage, cookies or page data, and never copies anything else into the extension.

(function () {
  const SIGN_IN_MESSAGE = "WINSTASH_EXTENSION_SIGN_IN";
  const SIGN_IN_ACK = "WINSTASH_EXTENSION_SIGN_IN_ACK";

  window.addEventListener("message", (event) => {
    // Only messages the page posted to itself (not from iframes or other windows/origins)
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || data.type !== SIGN_IN_MESSAGE || typeof data.customToken !== "string") return;
    if (!window.location.pathname.startsWith("/auth/extension-connect")) return;

    try {
      chrome.runtime.sendMessage({ type: "WINSTASH_SIGN_IN_TOKEN", customToken: data.customToken }, (res) => {
        if (chrome.runtime.lastError || !res?.ok) return;
        window.postMessage({ type: SIGN_IN_ACK }, window.location.origin);
      });
    } catch {}
  });
})();
