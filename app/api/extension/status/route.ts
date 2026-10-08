import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdTokenLightweight } from "@/lib/lightweightAuth";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getCreditStatus } from "@/lib/creditService";
import { CareerRecord } from "@/types/career";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 1. Verify Token
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
      // Demo fallback in dev
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

    // 2. Fetch Latest Credit Status directly from DB
    let creditStatus = await getCreditStatus(userId, false, userEmail);

    // If server cannot reach Firestore via adminDb/clientDb, query Firestore REST API using the user's Bearer token
    if (!creditStatus.isPro && !creditStatus.isAdmin && creditStatus.userUsedCount === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "careerpulse-c2213";
      try {
        const userRestRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (userRestRes.ok) {
          const uDoc = await userRestRes.json();
          const plan = uDoc?.fields?.plan?.stringValue || "free";
          const planStatus = uDoc?.fields?.planStatus?.stringValue;
          const isPro = plan === "pro" && (planStatus === "active" || planStatus === "paid" || planStatus === "on_trial");
          const freeCount = parseInt(uDoc?.fields?.freeUsedCount?.integerValue || "0", 10);
          
          let usageCount = 0;
          try {
            const usageRestRes = await fetch(
              `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/usage/summary`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (usageRestRes.ok) {
              const usDoc = await usageRestRes.json();
              usageCount = parseInt(usDoc?.fields?.freeUsedCount?.integerValue || "0", 10);
            }
          } catch {}

          const effectiveCount = Math.max(freeCount, usageCount);
          creditStatus = {
            ...creditStatus,
            plan: isPro ? "pro" : "free",
            isPro,
            userUsedCount: effectiveCount,
            remainingCredits: isPro ? 999999 : Math.max(0, 10 - effectiveCount),
            isUserExhausted: !isPro && effectiveCount >= 10,
          };
        }
      } catch (restErr) {
        console.warn("[Extension Status API] REST fallback check notice:", restErr);
      }
    }

    // 3. Fetch User Records (Last 30 records)
    let records: CareerRecord[] = [];
    if (adminDb) {
      try {
        const snap = await adminDb
          .collection("users")
          .doc(userId)
          .collection("records")
          .orderBy("createdAt", "desc")
          .limit(30)
          .get();

        records = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as CareerRecord[];
      } catch (dbErr) {
        console.warn("[Extension Status API] adminDb fetch error:", dbErr);
      }
    }

    // Fallback using client SDK if adminDb is unavailable
    if (records.length === 0 && isFirebaseConfigured && db) {
      try {
        const recordsRef = collection(db, "users", userId, "records");
        const q = query(recordsRef, orderBy("createdAt", "desc"), limit(30));
        const snap = await getDocs(q);
        records = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as CareerRecord[];
      } catch (clientErr) {
        console.warn("[Extension Status API] clientDb fetch error:", clientErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: { uid: userId, email: userEmail },
        credits: {
          isPro: creditStatus.isPro || creditStatus.isAdmin,
          remainingCredits: creditStatus.remainingCredits,
          maxUserCredits: creditStatus.maxUserCredits,
          isUserExhausted: creditStatus.isUserExhausted,
          totalGeneratedCount: creditStatus.userUsedCount,
        },
        records,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[Extension Status API] Fatal error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
