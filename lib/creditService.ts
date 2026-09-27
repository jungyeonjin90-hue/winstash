import {
  doc,
  getDoc,
  setDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { MAX_USER_FREE_CREDITS, MAX_GLOBAL_SERVICE_CREDITS } from "./creditConfig";

const LOCAL_USER_USAGE_KEY = "career_pulse_free_usage_user_";
const LOCAL_GLOBAL_USAGE_KEY = "career_pulse_global_free_usage";

export interface CreditStatus {
  userUsedCount: number;
  maxUserCredits: number;
  remainingCredits: number;
  isUserExhausted: boolean;
  globalUsedCount: number;
  maxGlobalCredits: number;
  isGlobalExhausted: boolean;
}

/**
 * 로컬 스토리지 기반 개인 사용량 가져오기
 */
function getLocalUserUsage(userId: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`${LOCAL_USER_USAGE_KEY}${userId}`);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * 로컬 스토리지 기반 글로벌 사용량 가져오기
 */
function getLocalGlobalUsage(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LOCAL_GLOBAL_USAGE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * 현재 사용자의 무료 크레딧 사용 상태를 조회
 */
export async function getCreditStatus(
  userId: string,
  isDemo: boolean
): Promise<CreditStatus> {
  // 1. Firebase Firestore 연동 모드
  if (isFirebaseConfigured && db && !isDemo) {
    try {
      // 1-1. 개인 사용량 조회
      const userUsageRef = doc(db, "users", userId, "usage", "summary");
      const userUsageSnap = await getDoc(userUsageRef);
      const userUsedCount = userUsageSnap.exists()
        ? (userUsageSnap.data().freeUsedCount as number) || 0
        : 0;

      // 1-2. 서비스 전체 사용량 조회
      const globalUsageRef = doc(db, "system", "usage");
      const globalUsageSnap = await getDoc(globalUsageRef);
      const globalUsedCount = globalUsageSnap.exists()
        ? (globalUsageSnap.data().totalCount as number) || 0
        : 0;

      const remainingCredits = Math.max(0, MAX_USER_FREE_CREDITS - userUsedCount);

      return {
        userUsedCount,
        maxUserCredits: MAX_USER_FREE_CREDITS,
        remainingCredits,
        isUserExhausted: userUsedCount >= MAX_USER_FREE_CREDITS,
        globalUsedCount,
        maxGlobalCredits: MAX_GLOBAL_SERVICE_CREDITS,
        isGlobalExhausted: globalUsedCount >= MAX_GLOBAL_SERVICE_CREDITS,
      };
    } catch (e) {
      console.warn("Firestore usage fetch failed, using local fallback:", e);
    }
  }

  // 2. 데모 계정 또는 로컬 폴백
  const userUsedCount = getLocalUserUsage(userId);
  const globalUsedCount = getLocalGlobalUsage();
  const remainingCredits = Math.max(0, MAX_USER_FREE_CREDITS - userUsedCount);

  return {
    userUsedCount,
    maxUserCredits: MAX_USER_FREE_CREDITS,
    remainingCredits,
    isUserExhausted: userUsedCount >= MAX_USER_FREE_CREDITS,
    globalUsedCount,
    maxGlobalCredits: MAX_GLOBAL_SERVICE_CREDITS,
    isGlobalExhausted: globalUsedCount >= MAX_GLOBAL_SERVICE_CREDITS,
  };
}

/**
 * 무료 변환 1회 소모 기록 (원자적 increment)
 */
export async function consumeFreeCredit(
  userId: string,
  isDemo: boolean
): Promise<CreditStatus> {
  // 1. Firebase Firestore 실시간 업데이트
  if (isFirebaseConfigured && db && !isDemo) {
    try {
      // 1-1. 유저 개인 사용량 +1
      const userUsageRef = doc(db, "users", userId, "usage", "summary");
      await setDoc(
        userUsageRef,
        {
          freeUsedCount: increment(1),
          lastUsedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 1-2. 서비스 전체 사용량 +1
      const globalUsageRef = doc(db, "system", "usage");
      await setDoc(
        globalUsageRef,
        {
          totalCount: increment(1),
          lastUsedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return getCreditStatus(userId, isDemo);
    } catch (e) {
      console.warn("Firestore consume failed, falling back to local:", e);
    }
  }

  // 2. 데모 또는 로컬 스토리지 카운트 증가
  if (typeof window !== "undefined") {
    const nextUser = getLocalUserUsage(userId) + 1;
    const nextGlobal = getLocalGlobalUsage() + 1;
    localStorage.setItem(`${LOCAL_USER_USAGE_KEY}${userId}`, String(nextUser));
    localStorage.setItem(LOCAL_GLOBAL_USAGE_KEY, String(nextGlobal));
  }

  return getCreditStatus(userId, isDemo);
}

/**
 * 실시간 사용자 크레딧 구독 (Firestore onSnapshot)
 */
export function subscribeCreditStatus(
  userId: string,
  isDemo: boolean,
  onUpdate: (status: CreditStatus) => void
): () => void {
  if (isFirebaseConfigured && db && !isDemo) {
    const userUsageRef = doc(db, "users", userId, "usage", "summary");
    const unsubscribe = onSnapshot(
      userUsageRef,
      async () => {
        const status = await getCreditStatus(userId, isDemo);
        onUpdate(status);
      },
      async () => {
        const status = await getCreditStatus(userId, isDemo);
        onUpdate(status);
      }
    );
    return unsubscribe;
  }

  // 로컬 폴백
  getCreditStatus(userId, isDemo).then(onUpdate);
  return () => {};
}
