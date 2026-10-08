import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Lemon Squeezy Webhook Handler
 * Synchronizes subscription status directly with Firebase Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    // 1. Verify Webhook Signature (Fail-Closed)
    if (!secret) {
      console.error("[LemonSqueezy Webhook] Missing LEMON_SQUEEZY_WEBHOOK_SECRET in environment variables.");
      return NextResponse.json(
        { error: "Webhook secret is not configured on server" },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-signature header" },
        { status: 401 }
      );
    }

    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (
      digest.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(digest, signatureBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON webhook payload" },
        { status: 400 }
      );
    }
    const eventName = payload.meta?.event_name as string;
    const customData = payload.meta?.custom_data || {};
    const userId = customData.user_id as string | undefined;
    const data = payload.data || {};
    const attributes = data.attributes || {};
    const status = (attributes.status as string) || "inactive";

    console.log(`[LemonSqueezy Webhook] Received event: ${eventName}, user: ${userId}, status: ${status}`);

    if (!userId) {
      console.warn("[LemonSqueezy Webhook] No userId found in custom_data. Payload attributes email:", attributes.user_email);
      // Return 200 OK so Lemon Squeezy does not indefinitely retry
      return NextResponse.json({ received: true, note: "No user_id found in custom_data" });
    }

    // Determine Pro membership status
    // Active states: active, on_trial, paid (orders or recurring)
    // Inactive states: expired, past_due, unpaid, paused, refunded
    const isRefunded =
      eventName === "order_refunded" ||
      eventName === "subscription_payment_refunded";

    const isExplicitlyExpired =
      eventName === "subscription_expired" ||
      status === "expired" ||
      status === "unpaid";

    const isCurrentlyActive =
      (status === "active" || status === "on_trial" || status === "paid") &&
      !isRefunded &&
      !isExplicitlyExpired;

    // Grace period for cancelled subscription before ends_at
    const endsAtTime = attributes.ends_at ? new Date(attributes.ends_at).getTime() : 0;
    const hasRemainingPeriod =
      status === "cancelled" && endsAtTime > Date.now() && !isRefunded;

    const isPro = (isCurrentlyActive || hasRemainingPeriod) && !isRefunded && !isExplicitlyExpired;
    const finalPlan = isPro ? "pro" : "free";

    const updateData = {
      plan: finalPlan,
      planStatus: status,
      lemonSqueezyCustomerId: String(attributes.customer_id || ""),
      lemonSqueezySubscriptionId: String(data.id || ""),
      renewsAt: attributes.renews_at || null,
      endsAt: attributes.ends_at || null,
      updatedAt: new Date().toISOString(),
    };

    // Plan fields are server-only under firestore.rules, so only the Admin SDK can persist them.
    // Return 503 so Lemon Squeezy retries once the server is configured (audit M-1).
    if (!adminDb) {
      console.error("[LemonSqueezy Webhook] Firebase Admin is not configured; cannot persist subscription.");
      return NextResponse.json(
        { error: "Database service unavailable to persist subscription" },
        { status: 503 }
      );
    }
    await adminDb.collection("users").doc(userId).set(updateData, { merge: true });
    console.log(`[LemonSqueezy Webhook] Updated user ${userId} plan to ${finalPlan} (status: ${status})`);

    return NextResponse.json({
      received: true,
      event: eventName,
      userId,
      status,
    });
  } catch (error) {
    console.error("[LemonSqueezy Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook handler failed internally" },
      { status: 500 }
    );
  }
}
