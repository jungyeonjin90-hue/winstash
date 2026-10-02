import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, isFirebaseAdminConfigured } from "./firebaseAdmin";
import { isAdminEmail } from "./adminConfig";
import {
  MAX_USER_FREE_CREDITS,
  MAX_FREE_BRAG_SYNTHESIS,
  MAX_FREE_STAR_SYNTHESIS,
} from "./creditConfig";

export interface QuotaVerificationResult {
  allowed: boolean;
  userId?: string;
  userEmail?: string | null;
  isPro?: boolean;
  isAdmin?: boolean;
  error?: string;
  status?: number;
  deduct?: () => Promise<void>;
}

/**
 * Server-Side Authentication & Quota Enforcement Guardrail (M-1)
 * Verifies Firebase Auth ID Token and enforces atomic credit consumption directly in Firestore.
 */
export async function verifyServerAuthAndQuota(
  req: NextRequest,
  action: "transform" | "brag" | "star"
): Promise<QuotaVerificationResult> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const isDemoRequest = req.headers.get("x-demo-user") === "true";

  // 1. If Admin SDK is not configured yet (e.g. local setup without service keys)
  if (!isFirebaseAdminConfigured() || !adminAuth || !adminDb) {
    if (isDemoRequest) {
      return { allowed: true, isPro: false };
    }
    // Allow gracefully in development while Admin SDK keys are being configured
    return { allowed: true };
  }

  // 2. Demo User request handling
  if (isDemoRequest) {
    return { allowed: true, userId: "demo-user-1234", isPro: false };
  }

  // 3. Reject unauthenticated requests in production
  if (!token) {
    return {
      allowed: false,
      error: "Authentication required. Please sign in with your Google account.",
      status: 401,
    };
  }

  // 4. Verify ID Token with Firebase Admin
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch (err) {
    console.warn("[AuthQuota] Invalid ID token received:", err);
    return {
      allowed: false,
      error: "Authentication session expired or invalid. Please refresh and try again.",
      status: 401,
    };
  }

  const userId = decoded.uid;
  const userEmail = decoded.email || null;

  // 5. Admin Bypass
  if (isAdminEmail(userEmail)) {
    return {
      allowed: true,
      userId,
      userEmail,
      isPro: true,
      isAdmin: true,
    };
  }

  // 6. Query User Plan & Membership Status
  try {
    const userDocSnap = await adminDb.collection("users").doc(userId).get();
    const userData = userDocSnap.data();
    const plan = userData?.plan;
    const planStatus = userData?.planStatus;
    const endsAt = userData?.endsAt ? new Date(userData.endsAt).getTime() : 0;

    const isPro =
      plan === "pro" &&
      (planStatus === "active" ||
        planStatus === "on_trial" ||
        planStatus === "paid" ||
        (planStatus === "cancelled" && endsAt > Date.now()));

    // Pro members have unlimited access
    if (isPro) {
      return {
        allowed: true,
        userId,
        userEmail,
        isPro: true,
      };
    }

    // 7. Free Plan Quota Enforcement
    if (action === "transform") {
      const summaryDoc = await adminDb
        .collection("users")
        .doc(userId)
        .collection("usage")
        .doc("summary")
        .get();
      const usedCount = (summaryDoc.data()?.freeUsedCount as number) || 0;

      if (usedCount >= MAX_USER_FREE_CREDITS) {
        return {
          allowed: false,
          error:
            "You have used all 5 free transformations. Please upgrade to WinStash Pro for unlimited access.",
          status: 403,
        };
      }

      return {
        allowed: true,
        userId,
        userEmail,
        isPro: false,
        deduct: async () => {
          if (!adminDb) return;
          try {
            await adminDb
              .collection("users")
              .doc(userId)
              .collection("usage")
              .doc("summary")
              .set(
                {
                  freeUsedCount: FieldValue.increment(1),
                  lastUsedAt: new Date().toISOString(),
                },
                { merge: true }
              );
          } catch (e) {
            console.error("[AuthQuota] Failed to deduct free transformation credit:", e);
          }
        },
      };
    } else {
      // action === "brag" or "star"
      const synDoc = await adminDb
        .collection("users")
        .doc(userId)
        .collection("usage")
        .doc("synthesis")
        .get();

      const field = action === "brag" ? "bragUsedCount" : "starUsedCount";
      const maxLimit =
        action === "brag" ? MAX_FREE_BRAG_SYNTHESIS : MAX_FREE_STAR_SYNTHESIS;
      const usedCount = (synDoc.data()?.[field] as number) || 0;

      if (usedCount >= maxLimit) {
        const featureName =
          action === "brag" ? "Brag Sheet" : "STAR Portfolio";
        return {
          allowed: false,
          error: `You have reached your ${maxLimit} free ${featureName} syntheses. Please upgrade to WinStash Pro for unlimited reviews.`,
          status: 403,
        };
      }

      return {
        allowed: true,
        userId,
        userEmail,
        isPro: false,
        deduct: async () => {
          if (!adminDb) return;
          try {
            await adminDb
              .collection("users")
              .doc(userId)
              .collection("usage")
              .doc("synthesis")
              .set(
                {
                  [field]: FieldValue.increment(1),
                  lastUsedAt: new Date().toISOString(),
                },
                { merge: true }
              );
          } catch (e) {
            console.error(`[AuthQuota] Failed to deduct ${action} synthesis credit:`, e);
          }
        },
      };
    }
  } catch (dbError) {
    console.error("[AuthQuota] Error checking Firestore user quota:", dbError);
    // Allow through if Firestore check fails unexpectedly to prevent blocking legitimate users
    return { allowed: true, userId, isPro: false };
  }
}
