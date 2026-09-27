"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

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

  useEffect(() => {
    // Firebase가 설정된 경우 Firebase Auth 상태 구독
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "사용자",
            photoURL: fbUser.photoURL,
            isDemo: false,
          });
        } else {
          // Firebase 유저가 없으면 데모 유저 확인
          setUser(getStoredDemoUser());
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        "Firebase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하거나 데모 모드로 체험해 보세요."
      );
    }

    try {
      setLoading(true);
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
      displayName: "김커리어 (체험 계정)",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      isDemo: true,
    };
    try {
      localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
    } catch (e) {
      console.error(e);
    }
    setUser(demoUser);
  };

  const signOut = async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      setUser(null);
    } catch (err: unknown) {
      console.error("Sign out error:", err);
    }
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
