import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { CareerRecord, JobRole, ToneManner, PersonaProfile, SeniorityLevel, RegionCode, FeedbackReport } from "@/types/career";
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
        // 신규 가입자이거나 기록이 0건인 경우 즉시 빈 배열로 화면 리셋
        if (snapshot.empty) {
          onUpdate([]);
          return;
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
            source: data.source || "web_text",
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
  const normalizedRecord: CareerRecord = {
    ...record,
    source: record.source || "web_text",
  };
  // undefined 필드를 제거하여 Firestore Invalid argument 예외 원천 방지
  const cleanRecord = JSON.parse(JSON.stringify(normalizedRecord));

  if (isFirebaseConfigured && db && !isDemo) {
    try {
      const docRef = doc(db, "users", userId, "records", normalizedRecord.id);
      await setDoc(docRef, cleanRecord);
      console.log(`[Firestore] Successfully saved record: users/${userId}/records/${normalizedRecord.id}`);
    } catch (err) {
      console.error(`[Firestore ERROR] Failed to save record ${normalizedRecord.id}:`, err);
      throw err;
    }
  } else {
    // 로컬 스토리지에 저장
    const current = getLocalUserRecords(userId);
    const updated = [cleanRecord, ...current.filter((r) => r.id !== cleanRecord.id)];
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
    try {
      const docRef = doc(db, "users", userId, "records", recordId);
      await deleteDoc(docRef);
      console.log(`[Firestore] Successfully deleted record: users/${userId}/records/${recordId}`);
    } catch (err) {
      console.error(`[Firestore ERROR] Failed to delete record ${recordId}:`, err);
      throw err;
    }
  } else {
    const current = getLocalUserRecords(userId);
    const updated = current.filter((r) => r.id !== recordId);
    saveLocalUserRecords(userId, updated);
  }
}

/**
 * 사용자의 모든 주간 기록 일괄 삭제 (Firestore writeBatch)
 */
export async function deleteAllUserRecordsFromFirestore(
  userId: string,
  isDemo: boolean
): Promise<void> {
  if (isFirebaseConfigured && db && !isDemo) {
    try {
      const userRecordsRef = collection(db, "users", userId, "records");
      const snapshot = await getDocs(userRecordsRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
        console.log(`[Firestore] Purged all ${snapshot.docs.length} records for user ${userId}`);
      }
    } catch (err) {
      console.error(`[Firestore ERROR] Failed to purge records for user ${userId}:`, err);
      throw err;
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
  }
}

/**
 * 사용자 페르소나 및 벤치마크 프로필 설정 저장 (Firestore)
 */
export async function saveUserPersonaToFirestore(
  userId: string,
  isDemo: boolean,
  jobRole: JobRole,
  toneManner: ToneManner,
  extraProfile?: {
    seniorityLevel?: SeniorityLevel;
    industry?: string;
    region?: RegionCode;
    benchmarkOptIn?: boolean;
  }
): Promise<void> {
  const payload = {
    jobRole,
    toneManner,
    ...(extraProfile || {}),
    updatedAt: new Date().toISOString(),
  };
  if (isFirebaseConfigured && db && !isDemo) {
    const docRef = doc(db, "users", userId, "settings", "persona");
    await setDoc(docRef, payload, { merge: true });
  } else {
    localStorage.setItem(`career_pulse_persona_${userId}`, JSON.stringify({ jobRole, toneManner, ...(extraProfile || {}) }));
  }
}

/**
 * 사용자 페르소나 및 벤치마크 프로필 설정 불러오기 (Firestore)
 */
export async function getUserPersonaFromFirestore(
  userId: string,
  isDemo: boolean
): Promise<PersonaProfile | null> {
  if (isFirebaseConfigured && db && !isDemo) {
    try {
      const docRef = doc(db, "users", userId, "settings", "persona");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.jobRole && data.toneManner) {
          return {
            jobRole: data.jobRole as JobRole,
            toneManner: data.toneManner as ToneManner,
            seniorityLevel: data.seniorityLevel as SeniorityLevel | undefined,
            industry: data.industry as string | undefined,
            region: data.region as RegionCode | undefined,
            benchmarkOptIn: Boolean(data.benchmarkOptIn),
          };
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

export function saveLocalUserRecords(userId: string, records: CareerRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(records));
  } catch (e) {
    console.error(e);
  }
}

/**
 * 기능 이상 및 건의사항(피드백)을 Firestore 'feedbacks' 컬렉션에 저장
 */
export async function submitFeedbackToFirestore(
  feedbackData: Omit<FeedbackReport, "id" | "createdAt" | "status">
): Promise<FeedbackReport> {
  const timestamp = new Date().toISOString();
  const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const feedbackReport: FeedbackReport = {
    ...feedbackData,
    id: feedbackId,
    status: "new",
    createdAt: timestamp,
  };

  // 1. Firebase Firestore 연동 시 저장
  if (isFirebaseConfigured && db) {
    try {
      const feedbackDocRef = doc(db, "feedbacks", feedbackId);
      await setDoc(feedbackDocRef, feedbackReport);
      return feedbackReport;
    } catch (error) {
      console.warn("Firestore feedback submission failed, saving to local fallback:", error);
    }
  }

  // 2. 로컬 브라우저 폴백 저장 (오프라인 또는 Firebase 미설정 시)
  if (typeof window !== "undefined") {
    try {
      const existingKey = "career_pulse_feedbacks_queue";
      const existing = localStorage.getItem(existingKey);
      const list: FeedbackReport[] = existing ? JSON.parse(existing) : [];
      list.unshift(feedbackReport);
      localStorage.setItem(existingKey, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error("Local feedback storage error:", e);
    }
  }

  return feedbackReport;
}
