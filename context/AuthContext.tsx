"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { identifyUser, resetUser, trackEvent } from "@/lib/analytics";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirebaseConfigured: false,
  signInWithGoogle: async () => {},
  signInWithDemo: () => {},
  signOut: async () => {},
});

const DEMO_USER_STORAGE_KEY = "career_pulse_demo_user";
const LAST_ACTIVITY_KEY = "winstash_last_activity_timestamp";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function getStoredDemoUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AppUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => getStoredDemoUser());
  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured);

  const signOut = useCallback(async () => {
    try {
      trackEvent("user_signed_out");
      resetUser();
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
      setUser(null);
    } catch (err: unknown) {
      console.error("Sign out error:", err);
    }
  }, []);

  const signOutRef = useRef(signOut);
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  // 1. Firebase Auth state listener
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            photoURL: fbUser.photoURL,
            isDemo: false,
          });
          identifyUser(fbUser.uid, {
            email: fbUser.email,
            displayName: fbUser.displayName,
          });
          trackEvent("user_authenticated", { method: "google" });
        } else {
          setUser(getStoredDemoUser());
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // 2. 30-Minute Inactivity Auto Sign-Out System
  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
      return;
    }

    const updateLastActivity = () => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      } catch {
        // ignore quota errors
      }
    };

    // Ensure timestamp exists immediately upon login
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      updateLastActivity();
    }

    let lastWriteTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage updates to once every 5 seconds to preserve high performance
      if (now - lastWriteTime > 5000) {
        lastWriteTime = now;
        updateLastActivity();
      }
    };

    const checkInactivity = () => {
      const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = stored ? Number(stored) : Date.now();
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(LAST_ACTIVITY_KEY);
        }
        signOutRef.current?.();
        alert(
          "You have been automatically signed out due to 30 minutes of inactivity for your security."
        );
      }
    };

    // Activity tracking events
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check inactivity on visibility change and window focus (e.g. user returns to inactive tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkInactivity);

    // Periodic background evaluation every 15 seconds
    const intervalId = setInterval(checkInactivity, 15000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkInactivity);
      clearInterval(intervalId);
    };
  }, [user]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase configuration is missing. Please check .env.local or try Demo mode."
      );
    }

    try {
      setLoading(true);
      trackEvent("sign_in_google_clicked");
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error("Google sign in error:", err);
      setLoading(false);
      throw err;
    }
  };

  const signInWithDemo = () => {
    const demoUser: AppUser = {
      uid: "demo-user-1234",
      email: "demo.pro@careerpulse.io",
      displayName: "Demo User",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      isDemo: true,
    };
    try {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch (e) {
      console.error(e);
    }
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        signInWithGoogle,
        signInWithDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
