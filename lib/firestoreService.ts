import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { CareerRecord, JobRole, ToneManner } from "@/types/career";
import { INITIAL_CAREER_RECORDS } from "./initialData";

const LOCAL_STORAGE_KEY_PREFIX = "career_pulse_records_user_";

/**
 * 사용자의 주간 커리어 기록 실시간 구독 (Firestore onSnapshot)
 */
export function subscribeUserRecords(
  userId: string,
  isDemo: boolean,
  onUpdate: (records: CareerRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  // 1. Firebase Firestore가 연동된 실사용자 모드
  if (isFirebaseConfigured && db && !isDemo) {
    const userRecordsRef = collection(db, "users", userId, "records");
    const q = query(userRecordsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // 최초 가입자라서 기록이 0건이면 고품질 샘플 데이터 자동 시딩
        if (snapshot.empty) {
          try {
            await seedInitialRecordsToFirestore(userId);
            // 시딩 후 snapshot 리스너가 재발화하므로 리턴
            return;
          } catch (e) {
            console.error("Initial seeding failed:", e);
          }
        }

        const records: CareerRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            createdAt: data.createdAt,
            target_week: data.target_week,
            raw_memo: data.raw_memo,
            weekly_report: data.weekly_report,
            brag_sheet_item: data.brag_sheet_item,
            star_portfolio: data.star_portfolio,
            jobRole: data.jobRole,
            toneManner: data.toneManner,
          } as CareerRecord;
        });

        onUpdate(records);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        if (onError) onError(err);
        // 실패 시 로컬 캐시 폴백
        onUpdate(getLocalUserRecords(userId));
      }
    );

    return unsubscribe;
  }

  // 2. 데모 유저 또는 Firebase 미설정 로컬 모드
  const initial = getLocalUserRecords(userId);
  onUpdate(initial);
  return () => {};
}

/**
 * 신규 가입 사용자를 위한 초기 4개 주간 샘플 데이터 Firestore 자동 등록
 */
export async function seedInitialRecordsToFirestore(userId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  for (const record of INITIAL_CAREER_RECORDS) {
    const docRef = doc(db, "users", userId, "records", record.id);
    await setDoc(docRef, record);
  }
}

/**
 * 신규 주간 기록 저장 (Firestore setDoc)
 */
export async function saveUserRecordToFirestore(
  userId: string,
  isDemo: boolean,
  record: CareerRecord
): Promise<void> {
  if (isFirebaseConfigured && db && !isDemo) {
    const docRef = doc(db, "users", userId, "records", record.id);
    await setDoc(docRef, record);
  } else {
    // 로컬 스토리지에 저장
    const current = getLocalUserRecords(userId);
    const updated = [record, ...current.filter((r) => r.id !== record.id)];
    saveLocalUserRecords(userId, updated);
  }
}

/**
 * 주간 기록 삭제 (Firestore deleteDoc)
 */
export async function deleteUserRecordFromFirestore(
  userId: string,
  isDemo: boolean,
  recordId: string
): Promise<void> {
  if (isFirebaseConfigured && db && !isDemo) {
    const docRef = doc(db, "users", userId, "records", recordId);
    await deleteDoc(docRef);
  } else {
    const current = getLocalUserRecords(userId);
    const updated = current.filter((r) => r.id !== recordId);
    saveLocalUserRecords(userId, updated);
  }
}

/**
 * 사용자 페르소나 설정 저장 (Firestore)
 */
export async function saveUserPersonaToFirestore(
  userId: string,
  isDemo: boolean,
  jobRole: JobRole,
  toneManner: ToneManner
): Promise<void> {
  if (isFirebaseConfigured && db && !isDemo) {
    const docRef = doc(db, "users", userId, "settings", "persona");
    await setDoc(docRef, { jobRole, toneManner, updatedAt: new Date().toISOString() }, { merge: true });
  } else {
    localStorage.setItem(`career_pulse_persona_${userId}`, JSON.stringify({ jobRole, toneManner }));
  }
}

/**
 * 사용자 페르소나 설정 불러오기 (Firestore)
 */
export async function getUserPersonaFromFirestore(
  userId: string,
  isDemo: boolean
): Promise<{ jobRole: JobRole; toneManner: ToneManner } | null> {
  if (isFirebaseConfigured && db && !isDemo) {
    try {
      const docRef = doc(db, "users", userId, "settings", "persona");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.jobRole && data.toneManner) {
          return { jobRole: data.jobRole as JobRole, toneManner: data.toneManner as ToneManner };
        }
      }
    } catch (e) {
      console.warn("Failed to fetch persona from Firestore:", e);
    }
  } else if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`career_pulse_persona_${userId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to parse local persona:", e);
    }
  }
  return null;
}

// ---------------- 로컬 폴백 헬퍼 ----------------
function getLocalUserRecords(userId: string): CareerRecord[] {
  if (typeof window === "undefined") return INITIAL_CAREER_RECORDS;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(INITIAL_CAREER_RECORDS));
      return INITIAL_CAREER_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CAREER_RECORDS;
  } catch {
    return INITIAL_CAREER_RECORDS;
  }
}

function saveLocalUserRecords(userId: string, records: CareerRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(records));
  } catch (e) {
    console.error(e);
  }
}
