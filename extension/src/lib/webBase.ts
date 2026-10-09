/**
 * The WinStash web app the extension talks to (API calls and opened pages).
 *
 * Production builds always use https://winstash.net. A local development build can point elsewhere
 * with VITE_WINSTASH_BASE_URL (e.g. `VITE_WINSTASH_BASE_URL=http://localhost:3000 npm run build`).
 * The extension must never pick a server from whatever tabs happen to be open: that sent the user's
 * Firebase ID token to any app running on localhost:3000.
 */
export const WEB_BASE_URL: string =
  (import.meta.env.VITE_WINSTASH_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "https://winstash.net";
