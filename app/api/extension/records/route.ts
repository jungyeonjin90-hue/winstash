import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminEmail } from "@/lib/adminConfig";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: "Server database client not available",
        records: [],
      });
    }

    const snapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("records")
      .orderBy("createdAt", "desc")
      .get();

    const records = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return NextResponse.json({ success: true, records });
  } catch (err: any) {
    console.error("[Extension Records API] GET error:", err);
    return NextResponse.json(
      { success: false, error: err.message, records: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, record, deductCredit, userEmail } = body;

    if (!userId || !record || !record.id) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: userId and record with id required" },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: "Server database client not available",
      });
    }

    // 1. Save or update record in Firestore
    const cleanRecord = JSON.parse(JSON.stringify(record));
    await adminDb
      .collection("users")
      .doc(userId)
      .collection("records")
      .doc(record.id)
      .set(cleanRecord, { merge: true });

    // 2. If credit deduction requested (for free tier modification), atomically increment server-side usage
    if (deductCredit && !isAdminEmail(userEmail)) {
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
      } catch (creditErr) {
        console.warn("[Extension Records API] Credit deduction error:", creditErr);
      }
    }

    return NextResponse.json({ success: true, record: cleanRecord });
  } catch (err: any) {
    console.error("[Extension Records API] POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
