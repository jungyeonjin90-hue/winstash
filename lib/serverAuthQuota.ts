import { NextRequest } from "next/server";
import { FieldValue, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebaseAdmin";
import { isAdminEmail } from "./adminConfig";
import { verifyFirebaseIdTokenLightweight } from "./lightweightAuth";
import {
  MAX_USER_FREE_CREDITS,
  MAX_FREE_BRAG_SYNTHESIS,
  MAX_FREE_STAR_SYNTHESIS,
  MAX_GLOBAL_SERVICE_CREDITS,
} from "./creditConfig";

export type QuotaReservation =
  | { ok: true; refund: () => Promise<void> }
  | { ok: false; error: string; status: number };

export interface QuotaVerificationResult {
  allowed: boolean;
  userId?: string;
  userEmail?: string | null;
  isPro?: boolean;
  isAdmin?: boolean;
  error?: string;
  status?: number;
  /**
   * Atomically checks the remaining quota and consumes one unit (Firestore transaction).
   * Call it after request validation and BEFORE the paid AI call; call `refund()` if the request
   * then fails without delivering a result. Always present when `allowed` is true.
   */
  reserve?: () => Promise<QuotaReservation>;
}

type QuotaAction = "transform" | "brag" | "star";

// Outside production a quota-store failure is let through so local development without Admin
// credentials keeps working. In production it fails closed (audit H-1).
const FAIL_OPEN = process.env.NODE_ENV !== "production";

const NOOP_RESERVATION: QuotaReservation = { ok: true, refund: async () => {} };
const unlimitedReserve = async (): Promise<QuotaReservation> => NOOP_RESERVATION;

const QUOTA_UNAVAILABLE = {
  allowed: false,
  error: "Usage service is temporarily unavailable. Please try again in a moment.",
  status: 503,
} as const;

const GLOBAL_CAP_ERROR = `The free promotional quota for WinStash (${MAX_GLOBAL_SERVICE_CREDITS.toLocaleString("en-US")} requests) has been exhausted. Please upgrade to WinStash Pro for unlimited access.`;

function quotaRule(action: QuotaAction) {
  if (action === "transform") {
    return {
      usageDoc: "summary",
      field: "freeUsedCount",
      max: MAX_USER_FREE_CREDITS,
      // The global kill switch counts free transformations (lib/creditConfig.ts).
      countsGlobally: true,
      error: `You have used all ${MAX_USER_FREE_CREDITS} free transformations. Please upgrade to WinStash Pro for unlimited access.`,
    };
  }
  const max = action === "brag" ? MAX_FREE_BRAG_SYNTHESIS : MAX_FREE_STAR_SYNTHESIS;
  const featureName = action === "brag" ? "Brag Sheet" : "STAR Portfolio";
  return {
    usageDoc: "synthesis",
    field: action === "brag" ? "bragUsedCount" : "starUsedCount",
    max,
    countsGlobally: false,
    error: `You have reached your ${max} free ${featureName} syntheses. Please upgrade to WinStash Pro for unlimited reviews.`,
  };
}

class QuotaExceededError extends Error {}

/**
 * Builds the transactional reserve() for a free-plan user.
 * The per-user counter (users/{uid}/usage/{doc}) and, for transforms, the global counter (system/usage)
 * are read and incremented in one transaction, so concurrent requests cannot overshoot either limit
 * (audit H-1, H-2).
 */
function createFreePlanReserve(db: Firestore, userId: string, action: QuotaAction) {
  const rule = quotaRule(action);
  const usageRef = db.collection("users").doc(userId).collection("usage").doc(rule.usageDoc);
  const globalRef = db.collection("system").doc("usage");

  return async (): Promise<QuotaReservation> => {
    try {
      await db.runTransaction(async (tx) => {
        const [usageSnap, globalSnap] = await tx.getAll(
          ...(rule.countsGlobally ? [usageRef, globalRef] : [usageRef])
        );
        if (((usageSnap.get(rule.field) as number) || 0) >= rule.max) {
          throw new QuotaExceededError(rule.error);
        }
        if (globalSnap && ((globalSnap.get("totalCount") as number) || 0) >= MAX_GLOBAL_SERVICE_CREDITS) {
          throw new QuotaExceededError(GLOBAL_CAP_ERROR);
        }
        const now = new Date().toISOString();
        tx.set(usageRef, { [rule.field]: FieldValue.increment(1), lastUsedAt: now }, { merge: true });
        if (globalSnap) {
          tx.set(globalRef, { totalCount: FieldValue.increment(1), updatedAt: now }, { merge: true });
        }
      });
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        return { ok: false, error: e.message, status: 403 };
      }
      console.error(`[AuthQuota] Failed to reserve ${action} quota:`, e);
      if (FAIL_OPEN) return NOOP_RESERVATION;
      return { ok: false, error: QUOTA_UNAVAILABLE.error, status: QUOTA_UNAVAILABLE.status };
    }

    let refunded = false;
    return {
      ok: true,
      refund: async () => {
        if (refunded) return;
        refunded = true;
        try {
          const batch = db.batch();
          batch.set(usageRef, { [rule.field]: FieldValue.increment(-1) }, { merge: true });
          if (rule.countsGlobally) {
            batch.set(globalRef, { totalCount: FieldValue.increment(-1) }, { merge: true });
          }
          await batch.commit();
        } catch (e) {
          console.error(`[AuthQuota] Failed to refund ${action} quota:`, e);
        }
      },
    };
  };
}

/**
 * Server-Side Authentication & Quota Enforcement Guardrail
 * Verifies the Firebase ID token, resolves the plan, runs a cheap early quota check for fast feedback,
 * and returns reserve(), which enforces the quota atomically.
 */
export async function verifyServerAuthAndQuota(
  req: NextRequest,
  action: QuotaAction
): Promise<QuotaVerificationResult> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const isDemoRequest = req.headers.get("x-demo-user") === "true";

  // 1. Demo User request handling (Strictly prohibited in production to prevent unauthenticated LLM abuse)
  // In production, every request MUST provide a valid authenticated Firebase Google user token.
  if (isDemoRequest && process.env.NODE_ENV !== "production") {
    return { allowed: true, userId: "demo-user-1234", isPro: false, reserve: unlimitedReserve };
  }

  // 2. Reject unauthenticated requests in production
  if (!token) {
    return {
      allowed: false,
      error: "Authentication required. Please sign in with your Google account.",
      status: 401,
    };
  }

  // 3. Verify ID Token (Robust dual-check: adminAuth if ready, lightweight crypto verifier as rock-solid primary)
  let decoded: { uid: string; email?: string | null };
  try {
    if (adminAuth) {
      decoded = await adminAuth.verifyIdToken(token);
    } else {
      decoded = await verifyFirebaseIdTokenLightweight(token);
    }
  } catch {
    try {
      // If adminAuth threw or wasn't loaded, verify directly via Google x509 public certificates
      decoded = await verifyFirebaseIdTokenLightweight(token);
    } catch (err) {
      console.warn("[AuthQuota] Invalid ID token received:", err);
      return {
        allowed: false,
        error: "Authentication session expired or invalid. Please refresh and try again.",
        status: 401,
      };
    }
  }

  const userId = decoded.uid;
  const userEmail = decoded.email || null;

  // 4. Admin Bypass
  if (isAdminEmail(userEmail)) {
    return { allowed: true, userId, userEmail, isPro: true, isAdmin: true, reserve: unlimitedReserve };
  }

  // 5. Quota store unavailable (no Admin SDK)
  if (!adminDb) {
    console.error("[AuthQuota] Firebase Admin is not configured; cannot enforce quota.");
    return FAIL_OPEN
      ? { allowed: true, userId, userEmail, isPro: false, reserve: unlimitedReserve }
      : { ...QUOTA_UNAVAILABLE };
  }

  // 6. Plan lookup + early (non-authoritative) quota check for fast feedback
  try {
    const rule = quotaRule(action);
    const userRef = adminDb.collection("users").doc(userId);
    const [userSnap, usageSnap, globalSnap] = await adminDb.getAll(
      userRef,
      userRef.collection("usage").doc(rule.usageDoc),
      adminDb.collection("system").doc("usage")
    );

    // Pro members have unlimited access
    if (isProPlan(userSnap.data())) {
      return { allowed: true, userId, userEmail, isPro: true, reserve: unlimitedReserve };
    }

    if (((usageSnap.get(rule.field) as number) || 0) >= rule.max) {
      return { allowed: false, error: rule.error, status: 403 };
    }
    if (rule.countsGlobally && ((globalSnap.get("totalCount") as number) || 0) >= MAX_GLOBAL_SERVICE_CREDITS) {
      return { allowed: false, error: GLOBAL_CAP_ERROR, status: 403 };
    }

    return {
      allowed: true,
      userId,
      userEmail,
      isPro: false,
      reserve: createFreePlanReserve(adminDb, userId, action),
    };
  } catch (dbError) {
    console.error("[AuthQuota] Error checking Firestore user quota:", dbError);
    return FAIL_OPEN
      ? { allowed: true, userId, userEmail, isPro: false, reserve: unlimitedReserve }
      : { ...QUOTA_UNAVAILABLE };
  }
}

/**
 * Pro membership check shared by quota enforcement and credit reporting.
 * A cancelled subscription stays Pro until its paid period (endsAt) runs out.
 */
export function isProPlan(userData: DocumentData | undefined): boolean {
  const planStatus = userData?.planStatus;
  const endsAt = userData?.endsAt ? new Date(userData.endsAt).getTime() : 0;
  return (
    userData?.plan === "pro" &&
    (planStatus === "active" ||
      planStatus === "on_trial" ||
      planStatus === "paid" ||
      (planStatus === "cancelled" && endsAt > Date.now()))
  );
}

export interface ServerCreditStatus {
  isPro: boolean;
  isAdmin: boolean;
  usedCount: number;
  maxUserCredits: number;
  remainingCredits: number;
  isUserExhausted: boolean;
}

const UNLIMITED = 999999;

/**
 * Reads the canonical free-transform usage (users/{uid}/usage/summary) with the Admin SDK.
 * This is the same counter verifyServerAuthAndQuota() enforces, so what we report matches what we block.
 * Returns null when the Admin SDK is unavailable or the read fails.
 */
export async function getServerCreditStatus(
  userId: string,
  userEmail?: string | null
): Promise<ServerCreditStatus | null> {
  if (isAdminEmail(userEmail)) {
    return {
      isPro: true,
      isAdmin: true,
      usedCount: 0,
      maxUserCredits: UNLIMITED,
      remainingCredits: UNLIMITED,
      isUserExhausted: false,
    };
  }
  if (!adminDb) return null;

  try {
    const userRef = adminDb.collection("users").doc(userId);
    const [userSnap, summarySnap] = await Promise.all([
      userRef.get(),
      userRef.collection("usage").doc("summary").get(),
    ]);
    const usedCount = (summarySnap.data()?.freeUsedCount as number) || 0;

    if (isProPlan(userSnap.data())) {
      return {
        isPro: true,
        isAdmin: false,
        usedCount,
        maxUserCredits: UNLIMITED,
        remainingCredits: UNLIMITED,
        isUserExhausted: false,
      };
    }
    return {
      isPro: false,
      isAdmin: false,
      usedCount,
      maxUserCredits: MAX_USER_FREE_CREDITS,
      remainingCredits: Math.max(0, MAX_USER_FREE_CREDITS - usedCount),
      isUserExhausted: usedCount >= MAX_USER_FREE_CREDITS,
    };
  } catch (e) {
    console.error("[AuthQuota] Failed to read server credit status:", e);
    return null;
  }
}

/** Credit payload shape consumed by the Chrome extension (extension/src/App.tsx). */
export function toExtensionCredits(s: ServerCreditStatus) {
  return {
    isPro: s.isPro || s.isAdmin,
    remainingCredits: s.remainingCredits,
    maxUserCredits: s.maxUserCredits,
    isUserExhausted: s.isUserExhausted,
    totalGeneratedCount: s.usedCount,
  };
}
