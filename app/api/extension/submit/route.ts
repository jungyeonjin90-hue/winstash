import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdTokenLightweight } from "@/lib/lightweightAuth";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getCreditStatus, consumeFreeCredit } from "@/lib/creditService";
import { CareerRecord, JobRole, ToneManner } from "@/types/career";
import { executeAiTransformation } from "@/lib/transformService";
import { saveUserRecordToFirestore } from "@/lib/firestoreService";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 1. Verify User Token
    let userId = "";
    let userEmail: string | null = null;

    try {
      if (adminAuth) {
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
        userEmail = decoded.email || null;
      } else {
        const decoded = await verifyFirebaseIdTokenLightweight(token);
        userId = decoded.uid;
        userEmail = decoded.email || null;
      }
    } catch (authErr) {
      const isDemo = req.headers.get("x-demo-user") === "true";
      if (isDemo && process.env.NODE_ENV !== "production") {
        userId = "demo-user-1234";
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }

    // 2. Parse Request Body
    const body = await req.json();
    const {
      raw_memo,
      target_week,
      existingRecordId,
      existingCreatedAt,
      job_role = "engineering",
      tone_manner = "impact",
    } = body;

    if (!raw_memo || typeof raw_memo !== "string" || raw_memo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Memo content is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 3. Check Quota / Credit Status
    const currentCredit = await getCreditStatus(userId, false, userEmail);
    const isModifyingExisting = Boolean(existingRecordId);
    const shouldDeduct = !currentCredit.isPro && !currentCredit.isAdmin && isModifyingExisting;

    if (shouldDeduct && currentCredit.isUserExhausted) {
      return NextResponse.json(
        {
          success: false,
          error: "Weekly modification credits exhausted. Upgrade to Pro for unlimited edits.",
        },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    // 4. Server-Side AI 3-Way Transformation (Weekly Report, Brag Sheet, STAR Portfolio)
    const transformation = await executeAiTransformation(
      raw_memo.trim(),
      job_role as JobRole,
      tone_manner as ToneManner
    );

    // 5. Construct Complete Canonical CareerRecord
    const recordId = existingRecordId || `rec-${Date.now()}`;
    const cleanRecord: CareerRecord = {
      id: recordId,
      createdAt: existingCreatedAt || new Date().toISOString(),
      target_week: target_week || undefined,
      raw_memo: raw_memo.trim(),
      weekly_report: transformation.weekly_report,
      brag_sheet_item: transformation.brag_sheet_item,
      star_portfolio: transformation.star_portfolio,
      jobRole: job_role,
      toneManner: tone_manner,
      source: "chrome_extension",
    };

    // 6. Save to Firestore (adminDb primary, client SDK fallback)
    let saved = false;
    if (adminDb) {
      try {
        await adminDb
          .collection("users")
          .doc(userId)
          .collection("records")
          .doc(recordId)
          .set(JSON.parse(JSON.stringify(cleanRecord)), { merge: true });
        saved = true;
      } catch (adminDbErr) {
        console.warn("[Extension Submit API] adminDb save failed, using fallback:", adminDbErr);
      }
    }

    if (!saved) {
      await saveUserRecordToFirestore(userId, false, cleanRecord);
    }

    // 7. Deduct Credit if applicable
    let updatedCredits = currentCredit;
    if (shouldDeduct) {
      try {
        updatedCredits = await consumeFreeCredit(userId, false, userEmail);
      } catch {}

      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "careerpulse-c2213";
        const currentCount = updatedCredits.userUsedCount || 0;
        await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=freeUsedCount&updateMask.fieldPaths=updatedAt`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              fields: {
                freeUsedCount: { integerValue: String(currentCount + 1) },
                updatedAt: { stringValue: new Date().toISOString() },
              },
            }),
          }
        );
      } catch {}
    }

    return NextResponse.json(
      {
        success: true,
        record: cleanRecord,
        credits: {
          isPro: updatedCredits.isPro || updatedCredits.isAdmin,
          remainingCredits: updatedCredits.remainingCredits,
          maxUserCredits: updatedCredits.maxUserCredits,
          isUserExhausted: updatedCredits.isUserExhausted,
          totalGeneratedCount: updatedCredits.userUsedCount,
        },
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[Extension Submit API] Fatal error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process record" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
