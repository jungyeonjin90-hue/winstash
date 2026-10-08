import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  MAX_USER_FREE_CREDITS,
  MAX_FREE_BRAG_SYNTHESIS,
  MAX_FREE_STAR_SYNTHESIS,
  MAX_GLOBAL_SERVICE_CREDITS,
} from "./creditConfig";
import { isAdminEmail } from "./adminConfig";

const LOCAL_USER_USAGE_KEY = "career_pulse_free_usage_user_";
const LOCAL_GLOBAL_USAGE_KEY = "career_pulse_global_free_usage";
const LOCAL_USER_PLAN_KEY = "winstash_user_plan_";
const LOCAL_BRAG_USAGE_KEY = "winstash_free_synthesis_brag_";
const LOCAL_STAR_USAGE_KEY = "winstash_free_synthesis_star_";

export type UserPlan = "free" | "pro";

export interface CreditStatus {
  plan: UserPlan;
  isPro: boolean;
  isAdmin?: boolean;
  // 주간 메모 입력 및 수정 (기본 10회)
  userUsedCount: number;
  maxUserCredits: number;
  remainingCredits: number;
  isUserExhausted: boolean;
  // 성과평가(Brag) 종합 한도 (기본 3회)
  bragUsedCount: number;
  maxBragCredits: number;
  remainingBragCredits: number;
  isBragExhausted: boolean;
  // 포트폴리오(STAR) 종합 한도 (기본 3회)
  starUsedCount: number;
  maxStarCredits: number;
  remainingStarCredits: number;
  isStarExhausted: boolean;
  // 서비스 전체 킬 스위치
  globalUsedCount: number;
  maxGlobalCredits: number;
  isGlobalExhausted: boolean;
}

/**
 * 로컬 스토리지 기반 개인 사용량 및 플랜 조회
 */
function getLocalNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(key);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function getLocalUserPlan(userId: string): UserPlan {
  if (typeof window === "undefined") return "free";
  try {
    const saved = localStorage.getItem(`${LOCAL_USER_PLAN_KEY}${userId}`);
    return saved === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

/**
 * 현재 사용자의 플랜 및 크레딧 상태 조회
 */
export async function getCreditStatus(
  userId: string,
  isDemo: boolean,
  userEmail?: string | null
): Promise<CreditStatus> {
  const isAdmin = isAdminEmail(userEmail);

  // 0. 관리자 계정은 무조건 Pro 및 무제한
  if (isAdmin) {
    return {
      plan: "pro",
      isPro: true,
      isAdmin: true,
      userUsedCount: 0,
      maxUserCredits: 999999,
      remainingCredits: 999999,
      isUserExhausted: false,
      bragUsedCount: 0,
      maxBragCredits: 999999,
      remainingBragCredits: 999999,
      isBragExhausted: false,
      starUsedCount: 0,
      maxStarCredits: 999999,
      remainingStarCredits: 999999,
      isStarExhausted: false,
      globalUsedCount: 0,
      maxGlobalCredits: 999999,
      isGlobalExhausted: false,
    };
  }

  // 1. Firebase Firestore 연동 모드
  if (isFirebaseConfigured && db && !isDemo) {
    try {
      // 1-1. 유저 프로필 및 플랜 조회
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;
      const planStatus = userData?.planStatus;
      const endsAt = userData?.endsAt ? new Date(userData.endsAt).getTime() : 0;
      const isPro =
        userData?.plan === "pro" &&
        (planStatus === "active" ||
          planStatus === "on_trial" ||
          planStatus === "paid" ||
          (planStatus === "cancelled" && endsAt > Date.now()));
      const plan: UserPlan = isPro ? "pro" : "free";

      // 1-2. 개인 변환 사용량 조회 (서버 경로 및 클라이언트 직기록 경로 모두 합산/최대치 통합)
      const userDocFreeCount = (userData?.freeUsedCount as number) || 0;
      let usageDocCount = 0;
      try {
        const userUsageRef = doc(db, "users", userId, "usage", "summary");
        const userUsageSnap = await getDoc(userUsageRef);
        usageDocCount = userUsageSnap.exists()
          ? (userUsageSnap.data().freeUsedCount as number) || 0
          : 0;
      } catch {}

      const localCount = getLocalNumber(`${LOCAL_USER_USAGE_KEY}${userId}`);
      const userUsedCount = Math.max(usageDocCount, userDocFreeCount, localCount);

      // 1-3. 종합(Synthesis) 사용량 조회
      const synUsageRef = doc(db, "users", userId, "usage", "synthesis");
      const synUsageSnap = await getDoc(synUsageRef);
      const synData = synUsageSnap.exists() ? synUsageSnap.data() : null;
      const bragUsedCount = (synData?.bragUsedCount as number) || 0;
      const starUsedCount = (synData?.starUsedCount as number) || 0;

      // 1-4. 글로벌 사용량 조회
      const globalUsageRef = doc(db, "system", "usage");
      const globalUsageSnap = await getDoc(globalUsageRef);
      const globalUsedCount = globalUsageSnap.exists()
        ? (globalUsageSnap.data().totalCount as number) || 0
        : 0;

      if (isPro) {
        return {
          plan: "pro",
          isPro: true,
          isAdmin: false,
          userUsedCount,
          maxUserCredits: 999999,
          remainingCredits: 999999,
          isUserExhausted: false,
          bragUsedCount,
          maxBragCredits: 999999,
          remainingBragCredits: 999999,
          isBragExhausted: false,
          starUsedCount,
          maxStarCredits: 999999,
          remainingStarCredits: 999999,
          isStarExhausted: false,
          globalUsedCount,
          maxGlobalCredits: MAX_GLOBAL_SERVICE_CREDITS,
          isGlobalExhausted: false,
        };
      }

      const remainingCredits = Math.max(0, MAX_USER_FREE_CREDITS - userUsedCount);
      const remainingBragCredits = Math.max(0, MAX_FREE_BRAG_SYNTHESIS - bragUsedCount);
      const remainingStarCredits = Math.max(0, MAX_FREE_STAR_SYNTHESIS - starUsedCount);

      return {
        plan: "free",
        isPro: false,
        isAdmin: false,
        userUsedCount,
        maxUserCredits: MAX_USER_FREE_CREDITS,
        remainingCredits,
        isUserExhausted: userUsedCount >= MAX_USER_FREE_CREDITS,
        bragUsedCount,
        maxBragCredits: MAX_FREE_BRAG_SYNTHESIS,
        remainingBragCredits,
        isBragExhausted: bragUsedCount >= MAX_FREE_BRAG_SYNTHESIS,
        starUsedCount,
        maxStarCredits: MAX_FREE_STAR_SYNTHESIS,
        remainingStarCredits,
        isStarExhausted: starUsedCount >= MAX_FREE_STAR_SYNTHESIS,
        globalUsedCount,
        maxGlobalCredits: MAX_GLOBAL_SERVICE_CREDITS,
        isGlobalExhausted: globalUsedCount >= MAX_GLOBAL_SERVICE_CREDITS,
      };
    } catch (e) {
      console.warn("Firestore usage fetch failed, using local fallback:", e);
    }
  }

  // 2. 데모 계정 또는 로컬 폴백
  const plan = getLocalUserPlan(userId);
  const isPro = plan === "pro";
  const userUsedCount = getLocalNumber(`${LOCAL_USER_USAGE_KEY}${userId}`);
  const bragUsedCount = getLocalNumber(`${LOCAL_BRAG_USAGE_KEY}${userId}`);
  const starUsedCount = getLocalNumber(`${LOCAL_STAR_USAGE_KEY}${userId}`);
  const globalUsedCount = getLocalNumber(LOCAL_GLOBAL_USAGE_KEY);

  if (isPro) {
    return {
      plan: "pro",
      isPro: true,
      isAdmin: false,
      userUsedCount,
      maxUserCredits: 999999,
      remainingCredits: 999999,
      isUserExhausted: false,
      bragUsedCount,
      maxBragCredits: 999999,
      remainingBragCredits: 999999,
      isBragExhausted: false,
      starUsedCount,
      maxStarCredits: 999999,
      remainingStarCredits: 999999,
      isStarExhausted: false,
      globalUsedCount,
      maxGlobalCredits: MAX_GLOBAL_SERVICE_CREDITS,
      isGlobalExhausted: false,
    };
  }

  const remainingCredits = Math.max(0, MAX_USER_FREE_CREDITS - userUsedCount);
  const remainingBragCredits = Math.max(0, MAX_FREE_BRAG_SYNTHESIS - bragUsedCount);
  const remainingStarCredits = Math.max(0, MAX_FREE_STAR_SYNTHESIS - starUsedCount);

  return {
    plan: "free",
    isPro: false,
    isAdmin: false,
    userUsedCount,
    maxUserCredits: MAX_USER_FREE_CREDITS,
    remainingCredits,
    isUserExhausted: userUsedCount >= MAX_USER_FREE_CREDITS,
    bragUsedCount,
    maxBragCredits: MAX_FREE_BRAG_SYNTHESIS,
    remainingBragCredits,
    isBragExhausted: bragUsedCount >= MAX_FREE_BRAG_SYNTHESIS,
    starUsedCount,
    maxStarCredits: MAX_FREE_STAR_SYNTHESIS,
    remainingStarCredits,
    isStarExhausted: starUsedCount >= MAX_FREE_STAR_SYNTHESIS,
    globalUsedCount,
    maxGlobalCredits: MAX_GLOBAL_SERVICE_CREDITS,
    isGlobalExhausted: globalUsedCount >= MAX_GLOBAL_SERVICE_CREDITS,
  };
}

/**
 * 무료 변환 1회 소모 반영 (서버 차감 후 로컬 캐시/UI 동기화)
 * Pro 유저이거나 관리자인 경우 소모하지 않음
 */
export async function consumeFreeCredit(
  userId: string,
  isDemo: boolean,
  userEmail?: string | null
): Promise<CreditStatus> {
  const status = await getCreditStatus(userId, isDemo, userEmail);
  if (status.isPro || status.isAdmin) {
    return status;
  }

  // 1. 실제 계정의 차감은 서버 API가 usage/summary에 원자적으로 기록함.
  //    freeUsedCount 등 쿼터 필드는 보안 규칙상 클라이언트 쓰기가 금지되어 있음 (감사 C-1)

  // 2. 데모 및 로컬 스토리지 카운트 동기화
  if (typeof window !== "undefined") {
    const currentLocal = getLocalNumber(`${LOCAL_USER_USAGE_KEY}${userId}`);
    const nextUser = Math.max(status.userUsedCount + 1, currentLocal + 1);
    const nextGlobal = getLocalNumber(LOCAL_GLOBAL_USAGE_KEY) + 1;
    localStorage.setItem(`${LOCAL_USER_USAGE_KEY}${userId}`, String(nextUser));
    localStorage.setItem(LOCAL_GLOBAL_USAGE_KEY, String(nextGlobal));
  }

  // 3. 최신 크레딧 계산 및 로컬 캐시 / 이벤트 브로드캐스트
  const nextStatus = await getCreditStatus(userId, isDemo, userEmail);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("winstash_latest_credit_cache", JSON.stringify(nextStatus));
      window.dispatchEvent(new CustomEvent("winstash_credits_updated", { detail: nextStatus }));
    } catch {}
  }

  return nextStatus;
}

/**
 * 성과평가(Brag) / 포트폴리오(STAR) 종합 쿼터 확인
 */
export async function checkSynthesisQuota(
  userId: string,
  type: "brag" | "star",
  isDemo: boolean,
  userEmail?: string | null
): Promise<{ allowed: boolean; remaining: number; maxLimit: number; isPro: boolean }> {
  const status = await getCreditStatus(userId, isDemo, userEmail);
  if (status.isPro || status.isAdmin) {
    return {
      allowed: true,
      remaining: 999999,
      maxLimit: 999999,
      isPro: true,
    };
  }

  if (type === "brag") {
    return {
      allowed: !status.isBragExhausted,
      remaining: status.remainingBragCredits,
      maxLimit: status.maxBragCredits,
      isPro: false,
    };
  } else {
    return {
      allowed: !status.isStarExhausted,
      remaining: status.remainingStarCredits,
      maxLimit: status.maxStarCredits,
      isPro: false,
    };
  }
}

/**
 * 성과평가(Brag) / 포트폴리오(STAR) 종합 1회 소모 기록
 */
export async function consumeSynthesisQuota(
  userId: string,
  type: "brag" | "star",
  isDemo: boolean,
  userEmail?: string | null
): Promise<CreditStatus> {
  const status = await getCreditStatus(userId, isDemo, userEmail);
  if (status.isPro || status.isAdmin) {
    return status;
  }

  // 1. 실제 계정의 크레딧 차감은 서버 API에서 원자 차감되므로 클라이언트 중복 차감 방지 (M-1)
  if (isFirebaseConfigured && db && !isDemo) {
    return getCreditStatus(userId, isDemo, userEmail);
  }

  if (typeof window !== "undefined") {
    const key = type === "brag" ? `${LOCAL_BRAG_USAGE_KEY}${userId}` : `${LOCAL_STAR_USAGE_KEY}${userId}`;
    const next = getLocalNumber(key) + 1;
    localStorage.setItem(key, String(next));
  }

  return getCreditStatus(userId, isDemo, userEmail);
}

/**
 * 사용자 플랜 수동 설정 (로컬 테스트 및 데모 시뮬레이션용)
 */
export async function setUserPlan(
  userId: string,
  plan: UserPlan,
  isDemo: boolean
): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${LOCAL_USER_PLAN_KEY}${userId}`, plan);
  }

  if (isFirebaseConfigured && db && !isDemo) {
    try {
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          plan,
          planStatus: plan === "pro" ? "active" : "inactive",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Failed to set user plan in Firestore:", e);
    }
  }
}

/**
 * 실시간 사용자 크레딧 및 플랜 상태 구독 (Firestore onSnapshot)
 */
export function subscribeCreditStatus(
  userId: string,
  isDemo: boolean,
  onUpdate: (status: CreditStatus) => void,
  userEmail?: string | null
): () => void {
  // 관리자 계정은 즉시 무제한 반환
  if (isAdminEmail(userEmail)) {
    getCreditStatus(userId, isDemo, userEmail).then(onUpdate);
    return () => {};
  }

  if (isFirebaseConfigured && db && !isDemo) {
    const userDocRef = doc(db, "users", userId);
    const userUsageRef = doc(db, "users", userId, "usage", "summary");
    const synUsageRef = doc(db, "users", userId, "usage", "synthesis");

    const refresh = async () => {
      const status = await getCreditStatus(userId, isDemo, userEmail);
      onUpdate(status);
    };

    const unsubUser = onSnapshot(userDocRef, refresh, refresh);
    const unsubUsage = onSnapshot(userUsageRef, refresh, refresh);
    const unsubSyn = onSnapshot(synUsageRef, refresh, refresh);

    return () => {
      unsubUser();
      unsubUsage();
      unsubSyn();
    };
  }

  // 로컬 폴백
  getCreditStatus(userId, isDemo, userEmail).then(onUpdate);
  return () => {};
}
