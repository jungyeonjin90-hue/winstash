import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

export async function getAuthToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch (err) {
    console.warn("[Auth] Failed to get current user token:", err);
  }

  // Fallback: check chrome.storage.local bridge token
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const res = await new Promise<{ winstash_ext_token?: string }>((resolve) =>
        chrome.storage.local.get<{ winstash_ext_token?: string }>(["winstash_ext_token"], resolve)
      );
      if (res && res.winstash_ext_token) {
        return res.winstash_ext_token;
      }
    } catch {}
  }

  return null;
}

export { onAuthStateChanged };
export type { User };
