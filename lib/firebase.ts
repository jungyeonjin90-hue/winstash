import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
const googleProvider = new GoogleAuthProvider();

// Google 로그인 시 항상 계정 선택 창이 뜨도록 설정
googleProvider.setCustomParameters({
  prompt: "select_account",
});

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    if (typeof window !== "undefined") {
      auth = getAuth(app);
      // IndexedDB 기반 오프라인 캐시 및 다중 탭 동기화 설정, undefined 필드 자동 무시
      try {
        db = initializeFirestore(app, {
          ignoreUndefinedProperties: true,
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        db = getFirestore(app);
      }

      // Google Analytics (Firebase Analytics) 브라우저 환경 지원 시 자동 초기화
      isSupported()
        .then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app);
          }
        })
        .catch((e) => {
          console.warn("Firebase Analytics isSupported check failed:", e);
        });
    } else {
      // Server-side (Next.js API Routes / Webhook Handlers)
      db = getFirestore(app);
    }
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined" || !auth || !auth.currentUser) {
    return null;
  }
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    console.warn("Failed to get Firebase Auth ID token:", err);
    return null;
  }
}

export { app, auth, db, googleProvider, analytics };
