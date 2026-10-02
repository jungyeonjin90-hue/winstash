import { SYNTHESIS_COOLDOWN_MS } from "./creditConfig";
import { isAdminEmail } from "./adminConfig";

const COOLDOWN_KEY_PREFIX = "winstash_synthesis_last_";

export interface CooldownStatus {
  inCooldown: boolean;
  remainingSeconds: number;
}

/**
 * 연속 클릭 방지 쿨다운 확인 (기본 10초, 관리자는 0초)
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
 * 쿨다운 타이머 시작 기록 (10초 카운트다운)
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
