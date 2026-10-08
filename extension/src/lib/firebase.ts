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

/**
 * Firestore users/{userId} 및 users/{userId}/usage/summary 문서에 freeUsedCount 원자적 1회 차감 (증가)
 */
export async function deductFreeCreditInFirestore(userId: string): Promise<void> {
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
  } catch (err) {
    console.warn("[Extension Firebase] deductFreeCreditInFirestore error:", err);
  }
}

/**
 * Firestore에서 사용자의 최신 크레딧 상태 직접 1회 조회
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

    const userDocCount = (userData?.freeUsedCount as number) || 0;
    const usageDocCount = (usageData?.freeUsedCount as number) || 0;
    const usedCount = Math.max(userDocCount, usageDocCount);

    const maxCredits = 10;
    const remaining = Math.max(0, maxCredits - usedCount);

    return {
      isPro: false,
      remainingCredits: remaining,
      maxUserCredits: maxCredits,
      isUserExhausted: remaining === 0,
      totalGeneratedCount: usedCount,
    };
  } catch (e) {
    console.warn("[Extension Firebase] fetchUserCreditsFromFirestore notice:", e);
    return {
      isPro: false,
      remainingCredits: 10,
      maxUserCredits: 10,
      isUserExhausted: false,
      totalGeneratedCount: 0,
    };
  }
}

/**
 * Firestore에서 사용자의 실시간 크레딧 및 플랜 상태 직접 구독
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

  const userDocRef = doc(db, "users", userId);
  const userUsageRef = doc(db, "users", userId, "usage", "summary");

  let userData: any = null;
  let usageData: any = null;

  const calculateAndEmit = () => {
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

    const userDocCount = (userData?.freeUsedCount as number) || 0;
    const usageDocCount = (usageData?.freeUsedCount as number) || 0;
    const usedCount = Math.max(userDocCount, usageDocCount);

    const maxCredits = 10;
    const remaining = Math.max(0, maxCredits - usedCount);

    onCredits({
      isPro: false,
      remainingCredits: remaining,
      maxUserCredits: maxCredits,
      isUserExhausted: remaining === 0,
      totalGeneratedCount: usedCount,
    });
  };

  const unsubUser = onSnapshot(
    userDocRef,
    (snap) => {
      userData = snap.exists() ? snap.data() : null;
      calculateAndEmit();
    },
    (err) => console.warn("[Extension Firebase] userDoc credit sub error:", err)
  );

  const unsubUsage = onSnapshot(
    userUsageRef,
    (snap) => {
      usageData = snap.exists() ? snap.data() : null;
      calculateAndEmit();
    },
    (err) => console.warn("[Extension Firebase] userUsage credit sub error:", err)
  );

  return () => {
    unsubUser();
    unsubUsage();
  };
}

export { onAuthStateChanged };
export type { User };
