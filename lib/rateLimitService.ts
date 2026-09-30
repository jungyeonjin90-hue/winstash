import { MAX_DAILY_SYNTHESIS_LIMIT, SYNTHESIS_COOLDOWN_MS } from "./creditConfig";
import { isAdminEmail } from "./adminConfig";

const DAILY_KEY_PREFIX = "winstash_synthesis_daily_";
const COOLDOWN_KEY_PREFIX = "winstash_synthesis_last_";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface DailySynthesisStatus {
  allowed: boolean;
  usedCount: number;
  remaining: number;
  maxLimit: number;
  resetDate: string;
}

export interface CooldownStatus {
  inCooldown: boolean;
  remainingSeconds: number;
}

/**
 * 사용자당 일일 AI 종합(Brag/STAR) 생성 한도 확인
 */
export function checkDailySynthesisLimit(
  userId: string,
  userEmail?: string | null
): DailySynthesisStatus {
  // 관리자는 무제한
  if (isAdminEmail(userEmail)) {
    return {
      allowed: true,
      usedCount: 0,
      remaining: 999999,
      maxLimit: 999999,
      resetDate: getTodayKey(),
    };
  }

  if (typeof window === "undefined") {
    return {
      allowed: true,
      usedCount: 0,
      remaining: MAX_DAILY_SYNTHESIS_LIMIT,
      maxLimit: MAX_DAILY_SYNTHESIS_LIMIT,
      resetDate: getTodayKey(),
    };
  }

  const today = getTodayKey();
  const storageKey = `${DAILY_KEY_PREFIX}${userId}_${today}`;
  const raw = localStorage.getItem(storageKey);
  const usedCount = raw ? parseInt(raw, 10) || 0 : 0;
  const remaining = Math.max(0, MAX_DAILY_SYNTHESIS_LIMIT - usedCount);

  return {
    allowed: usedCount < MAX_DAILY_SYNTHESIS_LIMIT,
    usedCount,
    remaining,
    maxLimit: MAX_DAILY_SYNTHESIS_LIMIT,
    resetDate: today,
  };
}

/**
 * 일일 AI 종합 사용 횟수 1 증가
 */
export function recordDailySynthesisUsage(
  userId: string,
  userEmail?: string | null
): DailySynthesisStatus {
  if (isAdminEmail(userEmail)) {
    return checkDailySynthesisLimit(userId, userEmail);
  }

  if (typeof window === "undefined") {
    return checkDailySynthesisLimit(userId, userEmail);
  }

  const today = getTodayKey();
  const storageKey = `${DAILY_KEY_PREFIX}${userId}_${today}`;
  const current = checkDailySynthesisLimit(userId, userEmail);
  const nextCount = current.usedCount + 1;

  try {
    localStorage.setItem(storageKey, String(nextCount));
  } catch (e) {
    console.warn("Failed to persist daily synthesis count to localStorage:", e);
  }

  return {
    allowed: nextCount < MAX_DAILY_SYNTHESIS_LIMIT,
    usedCount: nextCount,
    remaining: Math.max(0, MAX_DAILY_SYNTHESIS_LIMIT - nextCount),
    maxLimit: MAX_DAILY_SYNTHESIS_LIMIT,
    resetDate: today,
  };
}

/**
 * 연타 방지 쿨다운 확인 (기본 10초, 관리자는 0초)
 */
export function checkSynthesisCooldown(
  userId: string,
  userEmail?: string | null
): CooldownStatus {
  if (isAdminEmail(userEmail)) {
    return { inCooldown: false, remainingSeconds: 0 };
  }

  if (typeof window === "undefined") {
    return { inCooldown: false, remainingSeconds: 0 };
  }

  const storageKey = `${COOLDOWN_KEY_PREFIX}${userId}`;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return { inCooldown: false, remainingSeconds: 0 };

  const lastTime = parseInt(raw, 10) || 0;
  const elapsed = Date.now() - lastTime;

  if (elapsed < SYNTHESIS_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((SYNTHESIS_COOLDOWN_MS - elapsed) / 1000);
    return { inCooldown: true, remainingSeconds };
  }

  return { inCooldown: false, remainingSeconds: 0 };
}

/**
 * 쿨다운 타이머 시작 기록
 */
export function recordSynthesisCooldown(
  userId: string,
  userEmail?: string | null
): void {
  if (isAdminEmail(userEmail)) return;
  if (typeof window === "undefined") return;

  const storageKey = `${COOLDOWN_KEY_PREFIX}${userId}`;
  try {
    localStorage.setItem(storageKey, String(Date.now()));
  } catch (e) {
    console.warn("Failed to persist cooldown timestamp to localStorage:", e);
  }
}
