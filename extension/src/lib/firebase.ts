import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvyjCpGsZ_b1Ovcrj-TWlAlAMxmN2sU_0",
  authDomain: "auth.winstash.net",
  projectId: "careerpulse-c2213",
  storageBucket: "careerpulse-c2213.firebasestorage.app",
  messagingSenderId: "486318705408",
  appId: "1:486318705408:web:1d1d953477e284b4dd01e5",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * ID token of the extension's own Firebase session (refreshed automatically by the SDK).
 * There is no fallback to tokens copied from the web app any more (audit H-6).
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    await auth.authStateReady();
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch (err) {
    console.warn("[Auth] Failed to get current user token:", err);
    return null;
  }
}

/** Where background.js parks the one-time custom token from /auth/extension-connect. */
export const PENDING_SIGN_IN_KEY = "winstash_pending_custom_token";
// Firebase custom tokens are valid for one hour; a stale hand-off is ignored well before that.
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Completes a web-initiated sign-in: if the background holds a pending custom token, sign in with it
 * (the extension then has its own refreshable session) and delete it. Returns true if it signed in.
 */
export async function consumePendingSignIn(): Promise<boolean> {
  if (typeof chrome === "undefined" || !chrome.storage?.session) return false;
  const stored = await chrome.storage.session.get(PENDING_SIGN_IN_KEY);
  const pending = stored[PENDING_SIGN_IN_KEY] as { token?: string; at?: number } | undefined;
  if (!pending?.token) return false;
  await chrome.storage.session.remove(PENDING_SIGN_IN_KEY);
  if (!pending.at || Date.now() - pending.at > PENDING_MAX_AGE_MS) return false;
  try {
    await signInWithCustomToken(auth, pending.token);
    return true;
  } catch (err) {
    console.warn("[Auth] Custom token sign-in failed:", err);
    return false;
  }
}

export { onAuthStateChanged };
export type { User };
