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
import { CareerRecord } from "../types/career";

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

/**
 * Firestore에서 사용자의 모든 주간 기록 실시간 구독
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
        return {
          id: docSnap.id,
          createdAt: d.createdAt,
          target_week: d.target_week,
          raw_memo: d.raw_memo,
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
      console.error("Firestore onSnapshot error in extension:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Firestore에 주간 기록 직접 저장
 */
export async function saveRecordToFirestore(
  userId: string,
  record: CareerRecord
): Promise<void> {
  const docRef = doc(db, "users", userId, "records", record.id);
  const cleanData = JSON.parse(JSON.stringify(record));
  await setDoc(docRef, cleanData);
}

/**
 * Firestore users/{userId} 문서에 freeUsedCount 원자적 1회 차감 (증가)
 */
export async function deductFreeCreditInFirestore(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(
      userDocRef,
      {
        freeUsedCount: increment(1),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[Extension Firebase] deductFreeCreditInFirestore error:", err);
  }
}

export { onAuthStateChanged };
export type { User };
