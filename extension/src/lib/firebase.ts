import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  increment,
  getDocs,
} from "firebase/firestore";
import { CareerRecord, CreditStatus } from "../types/career";
import { isAdminEmail } from "./adminConfig";

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
export const db = getFirestore(app);

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
    console.warn("Failed to get current user token:", err);
  }

  // Fallback: check chrome.storage.local bridge token
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    try {
      const res: any = await new Promise((resolve) =>
        chrome.storage.local.get(["winstash_ext_token"], resolve)
      );
      if (res && res.winstash_ext_token) {
        return res.winstash_ext_token;
      }
    } catch {}
  }

  return null;
}

/**
 * Firestore에서 사용자의 모든 주간 기록 실시간 구독 (Source of Truth)
 */
export function subscribeToUserRecords(
  userId: string,
  onRecords: (records: CareerRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  const recordsRef = collection(db, "users", userId, "records");
  const q = query(recordsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: CareerRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const note = d.rawNote || d.raw_memo || "";
        return {
          id: docSnap.id,
          createdAt: d.createdAt,
          target_week: d.target_week,
          raw_memo: note,
          rawNote: note,
          weekly_report: d.weekly_report,
          brag_sheet_item: d.brag_sheet_item,
          star_portfolio: d.star_portfolio,
          jobRole: d.jobRole,
          toneManner: d.toneManner,
          source: d.source || "chrome_extension",
        } as CareerRecord;
      });
      onRecords(records);
    },
    (err) => {
      console.warn("Firestore onSnapshot notice in extension:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Firestore에서 사용자의 모든 주간 기록 직접 1회 조회 (Direct getDocs)
 */
export async function fetchUserRecordsFromFirestore(userId: string): Promise<CareerRecord[]> {
  try {
    const recordsRef = collection(db, "users", userId, "records");
    const q = query(recordsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const d = docSnap.data();
      const note = d.rawNote || d.raw_memo || "";
      return {
        id: docSnap.id,
        createdAt: d.createdAt,
        target_week: d.target_week,
        raw_memo: note,
        rawNote: note,
        weekly_report: d.weekly_report,
        brag_sheet_item: d.brag_sheet_item,
        star_portfolio: d.star_portfolio,
        jobRole: d.jobRole,
        toneManner: d.toneManner,
        source: d.source || "chrome_extension",
      } as CareerRecord;
    });
  } catch (err) {
    console.warn("Firestore direct getDocs notice:", err);
    return [];
  }
}

/**
 * Firestore에 주간 기록 직접 저장/수정 (setDoc with merge)
 */
export async function saveRecordToFirestore(
  userId: string,
  record: CareerRecord
): Promise<void> {
  const docRef = doc(db, "users", userId, "records", record.id);
  const note = record.raw_memo || (record as any).rawNote || "";
  const cleanData = JSON.parse(
    JSON.stringify({
      ...record,
      raw_memo: note,
      rawNote: note,
      updatedAt: new Date().toISOString(),
    })
  );
  await setDoc(docRef, cleanData, { merge: true });
}

export const MAX_USER_FREE_CREDITS = 10;
const FIREBASE_PROJECT_ID = "careerpulse-c2213";

/**
 * Firestore REST API를 통해 users/{uid} 및 users/{uid}/usage/summary 문서를 안전하게 조회
 * (익스텐션 SDK 세션이 비어있는 브릿지 환경에서도 Bearer Token으로 100% 인증 조회 보장)
 */
export async function fetchUserCreditsViaRest(
  userId: string,
  userEmail?: string | null
): Promise<CreditStatus | null> {
  if (isAdminEmail(userEmail)) {
    return {
      isPro: true,
      remainingCredits: 999999,
      maxUserCredits: 999999,
      isUserExhausted: false,
      totalGeneratedCount: 0,
    };
  }

  const token = await getAuthToken();
  if (!token) {
    console.warn("[Extension Firebase] fetchUserCreditsViaRest: No auth token found.");
    return null;
  }

  try {
    const [userRes, usageRes] = await Promise.allSettled([
      fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/usage/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);

    let userDocCount = 0;
    let isPro = false;

    if (userRes.status === "fulfilled" && userRes.value.ok) {
      const uDoc = await userRes.value.json();
      const plan = uDoc?.fields?.plan?.stringValue || "free";
      const planStatus = uDoc?.fields?.planStatus?.stringValue;
      isPro = plan === "pro" && (planStatus === "active" || planStatus === "paid" || planStatus === "on_trial");
      userDocCount = parseInt(uDoc?.fields?.freeUsedCount?.integerValue || "0", 10);
    }

    if (isPro) {
      return {
        isPro: true,
        remainingCredits: 999999,
        maxUserCredits: 999999,
        isUserExhausted: false,
        totalGeneratedCount: 0,
      };
    }

    let usageDocCount = 0;
    if (usageRes.status === "fulfilled" && usageRes.value.ok) {
      const usDoc = await usageRes.value.json();
      usageDocCount = parseInt(usDoc?.fields?.freeUsedCount?.integerValue || "0", 10);
    }

    // Exact web formula: Math.max(userDocCount, usageDocCount)
    const usedCount = Math.max(userDocCount, usageDocCount);
    const remaining = Math.max(0, MAX_USER_FREE_CREDITS - usedCount);

    console.info(`[Extension Credit REST] userDocCount=${userDocCount}, usageDocCount=${usageDocCount} => used=${usedCount}, remaining=${remaining}/${MAX_USER_FREE_CREDITS}`);

    return {
      isPro: false,
      remainingCredits: remaining,
      maxUserCredits: MAX_USER_FREE_CREDITS,
      isUserExhausted: remaining === 0,
      totalGeneratedCount: usedCount,
    };
  } catch (err) {
    console.warn("[Extension Firebase] REST credit fetch error:", err);
    return null;
  }
}

/**
 * Firestore users/{userId} 및 users/{userId}/usage/summary 문서에 freeUsedCount 원자적 1회 차감 (증가)
 */
export async function deductFreeCreditInFirestore(userId: string): Promise<void> {
  const token = await getAuthToken();

  // 1. Client SDK direct increment if auth.currentUser is ready
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const userDocRef = doc(db, "users", userId);
      const userUsageRef = doc(db, "users", userId, "usage", "summary");
      await Promise.allSettled([
        setDoc(
          userDocRef,
          {
            freeUsedCount: increment(1),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ),
        setDoc(
          userUsageRef,
          {
            freeUsedCount: increment(1),
            lastUsedAt: new Date().toISOString(),
          },
          { merge: true }
        ),
      ]);
      return;
    } catch (sdkErr) {
      console.warn("[Extension Firebase] Client SDK deduct failed, using REST fallback:", sdkErr);
    }
  }

  // 2. Fallback to Firestore REST API with token
  if (token) {
    try {
      const current = await fetchUserCreditsViaRest(userId);
      const currentCount = current?.totalGeneratedCount || 0;
      const nextCount = currentCount + 1;

      await Promise.allSettled([
        fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=freeUsedCount&updateMask.fieldPaths=updatedAt`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fields: {
                freeUsedCount: { integerValue: String(nextCount) },
                updatedAt: { stringValue: new Date().toISOString() },
              },
            }),
          }
        ),
        fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}/usage/summary?updateMask.fieldPaths=freeUsedCount&updateMask.fieldPaths=lastUsedAt`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fields: {
                freeUsedCount: { integerValue: String(nextCount) },
                lastUsedAt: { stringValue: new Date().toISOString() },
              },
            }),
          }
        ),
      ]);
    } catch (restErr) {
      console.warn("[Extension Firebase] REST deduct error:", restErr);
    }
  }
}

/**
 * Firestore에서 사용자의 최신 크레딧 상태 직접 1회 조회 (100% 웹 creditService.ts 수식 동일)
 */
export async function fetchUserCreditsFromFirestore(
  userId: string,
  userEmail?: string | null
): Promise<CreditStatus> {
  if (isAdminEmail(userEmail)) {
    return {
      isPro: true,
      remainingCredits: 999999,
      maxUserCredits: 999999,
      isUserExhausted: false,
      totalGeneratedCount: 0,
    };
  }

  // 1. Try Firebase Client SDK first if authenticated
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const userDocRef = doc(db, "users", userId);
      const userUsageRef = doc(db, "users", userId, "usage", "summary");

      const [userSnap, usageSnap] = await Promise.all([
        getDoc(userDocRef),
        getDoc(userUsageRef),
      ]);

      const userData = userSnap.exists() ? userSnap.data() : null;
      const usageData = usageSnap.exists() ? usageSnap.data() : null;

      const isPro =
        userData?.plan === "pro" &&
        (userData?.planStatus === "active" ||
          userData?.planStatus === "paid" ||
          userData?.planStatus === "on_trial");

      if (isPro) {
        return {
          isPro: true,
          remainingCredits: 999999,
          maxUserCredits: 999999,
          isUserExhausted: false,
          totalGeneratedCount: 0,
        };
      }

      const userDocCount = Number(userData?.freeUsedCount || 0);
      const usageDocCount = Number(usageData?.freeUsedCount || 0);
      const usedCount = Math.max(userDocCount, usageDocCount);
      const remaining = Math.max(0, MAX_USER_FREE_CREDITS - usedCount);

      return {
        isPro: false,
        remainingCredits: remaining,
        maxUserCredits: MAX_USER_FREE_CREDITS,
        isUserExhausted: remaining === 0,
        totalGeneratedCount: usedCount,
      };
    } catch (sdkErr) {
      console.warn("[Extension Firebase] Client SDK getDoc notice, falling back to REST:", sdkErr);
    }
  }

  // 2. Fallback to Firestore REST API using user's Bearer token
  const restResult = await fetchUserCreditsViaRest(userId, userEmail);
  if (restResult) {
    return restResult;
  }

  return {
    isPro: false,
    remainingCredits: MAX_USER_FREE_CREDITS,
    maxUserCredits: MAX_USER_FREE_CREDITS,
    isUserExhausted: false,
    totalGeneratedCount: 0,
  };
}

/**
 * Firestore에서 사용자의 실시간 크레딧 및 플랜 상태 직접 구독 (Source of Truth)
 */
export function subscribeToUserCredits(
  userId: string,
  userEmail: string | null | undefined,
  onCredits: (credits: CreditStatus) => void
): () => void {
  if (isAdminEmail(userEmail)) {
    onCredits({
      isPro: true,
      remainingCredits: 999999,
      maxUserCredits: 999999,
      isUserExhausted: false,
      totalGeneratedCount: 0,
    });
    return () => {};
  }

  let isCancelled = false;
  let userData: any = null;
  let usageData: any = null;

  const calculateAndEmit = () => {
    if (isCancelled) return;
    const isPro =
      userData?.plan === "pro" &&
      (userData?.planStatus === "active" ||
        userData?.planStatus === "paid" ||
        userData?.planStatus === "on_trial");

    if (isPro) {
      onCredits({
        isPro: true,
        remainingCredits: 999999,
        maxUserCredits: 999999,
        isUserExhausted: false,
        totalGeneratedCount: 0,
      });
      return;
    }

    const userDocCount = Number(userData?.freeUsedCount || 0);
    const usageDocCount = Number(usageData?.freeUsedCount || 0);
    const usedCount = Math.max(userDocCount, usageDocCount);
    const remaining = Math.max(0, MAX_USER_FREE_CREDITS - usedCount);

    onCredits({
      isPro: false,
      remainingCredits: remaining,
      maxUserCredits: MAX_USER_FREE_CREDITS,
      isUserExhausted: remaining === 0,
      totalGeneratedCount: usedCount,
    });
  };

  // Immediate 1-time fetch via SDK or REST
  fetchUserCreditsFromFirestore(userId, userEmail).then((initialCredits) => {
    if (!isCancelled && initialCredits) {
      onCredits(initialCredits);
    }
  });

  let unsubUser: (() => void) | null = null;
  let unsubUsage: (() => void) | null = null;

  try {
    const userDocRef = doc(db, "users", userId);
    const userUsageRef = doc(db, "users", userId, "usage", "summary");

    unsubUser = onSnapshot(
      userDocRef,
      (snap) => {
        userData = snap.exists() ? snap.data() : null;
        calculateAndEmit();
      },
      (err) => {
        console.warn("[Extension Firebase] userDoc onSnapshot permission notice:", err.message);
        fetchUserCreditsViaRest(userId, userEmail).then((res) => {
          if (!isCancelled && res) onCredits(res);
        });
      }
    );

    unsubUsage = onSnapshot(
      userUsageRef,
      (snap) => {
        usageData = snap.exists() ? snap.data() : null;
        calculateAndEmit();
      },
      (err) => {
        console.warn("[Extension Firebase] userUsage onSnapshot permission notice:", err.message);
        fetchUserCreditsViaRest(userId, userEmail).then((res) => {
          if (!isCancelled && res) onCredits(res);
        });
      }
    );
  } catch (subErr) {
    console.warn("[Extension Firebase] Subscription initialization notice:", subErr);
  }

  return () => {
    isCancelled = true;
    if (unsubUser) unsubUser();
    if (unsubUsage) unsubUsage();
  };
}

export { onAuthStateChanged };
export type { User };
