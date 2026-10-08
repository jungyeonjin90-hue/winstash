import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseIdTokenLightweight } from "@/lib/lightweightAuth";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getServerCreditStatus, isProPlan, toExtensionCredits } from "@/lib/serverAuthQuota";
import { MAX_USER_FREE_CREDITS } from "@/lib/creditConfig";
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

    // 2. Credit status from the canonical server counter (users/{uid}/usage/summary),
    //    the same one /api/extension/submit and /api/transform enforce.
    let creditStatus = await getServerCreditStatus(userId, userEmail);

    // Admin SDK unavailable: read the same docs via Firestore REST with the user's own token (owner-readable)
    if (!creditStatus) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "careerpulse-c2213";
      const docUrl = (path: string) =>
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
      try {
        const [userRestRes, usageRestRes] = await Promise.all([
          fetch(docUrl(`users/${userId}`), { headers: { Authorization: `Bearer ${token}` } }),
          fetch(docUrl(`users/${userId}/usage/summary`), { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (userRestRes.ok || userRestRes.status === 404) {
          const fields = userRestRes.ok ? (await userRestRes.json())?.fields ?? {} : {};
          const usageFields = usageRestRes.ok ? (await usageRestRes.json())?.fields ?? {} : {};
          const usedCount = parseInt(usageFields.freeUsedCount?.integerValue || "0", 10);
          const isPro = isProPlan({
            plan: fields.plan?.stringValue,
            planStatus: fields.planStatus?.stringValue,
            endsAt: fields.endsAt?.stringValue,
          });
          creditStatus = {
            isPro,
            isAdmin: false,
            usedCount,
            maxUserCredits: isPro ? 999999 : MAX_USER_FREE_CREDITS,
            remainingCredits: isPro ? 999999 : Math.max(0, MAX_USER_FREE_CREDITS - usedCount),
            isUserExhausted: !isPro && usedCount >= MAX_USER_FREE_CREDITS,
          };
        }
      } catch (restErr) {
        console.warn("[Extension Status API] REST credit fallback failed:", restErr);
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

        records = (snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const note = d.rawNote || d.raw_memo || "";
          return {
            id: docSnap.id,
            ...d,
            rawNote: note,
            raw_memo: note,
          };
        }) as unknown) as CareerRecord[];
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
        records = (snap.docs.map((docSnap) => {
          const d = docSnap.data();
          const note = d.rawNote || d.raw_memo || "";
          return {
            id: docSnap.id,
            ...d,
            rawNote: note,
            raw_memo: note,
          };
        }) as unknown) as CareerRecord[];
      } catch (clientErr) {
        console.warn("[Extension Status API] clientDb fetch error:", clientErr);
      }
    }

    // Secondary fallback using Firestore REST API with Bearer token
    if (records.length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "careerpulse-c2213";
      try {
        const recordsRestRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/records?pageSize=30`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (recordsRestRes.ok) {
          const rJson = await recordsRestRes.json();
          if (Array.isArray(rJson.documents)) {
            records = rJson.documents.map((doc: any) => {
              const id = doc.name.split("/").pop();
              const fields = doc.fields || {};
              const rawMemo = fields.raw_memo?.stringValue || fields.rawNote?.stringValue || "";
              const createdAt = fields.createdAt?.stringValue || "";
              let target_week = undefined;
              if (fields.target_week?.mapValue?.fields) {
                const tw = fields.target_week.mapValue.fields;
                target_week = {
                  year: parseInt(tw.year?.integerValue || "0", 10),
                  month: parseInt(tw.month?.integerValue || "0", 10),
                  weekOfMonth: parseInt(tw.weekOfMonth?.integerValue || "0", 10),
                  label: tw.label?.stringValue || "",
                  startDate: tw.startDate?.stringValue || "",
                  endDate: tw.endDate?.stringValue || "",
                };
              }
              return ({
                id,
                createdAt,
                target_week,
                raw_memo: rawMemo,
                rawNote: rawMemo,
              } as unknown) as CareerRecord;
            });
          }
        }
      } catch (restErr) {
        console.warn("[Extension Status API] REST records fallback notice:", restErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: { uid: userId, email: userEmail },
        // Omitted when unknown so the extension never shows a fabricated balance.
        credits: creditStatus ? toExtensionCredits(creditStatus) : undefined,
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
