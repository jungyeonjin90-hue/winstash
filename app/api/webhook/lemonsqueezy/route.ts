import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Lemon Squeezy Webhook Handler
 * Synchronizes subscription status directly with Firebase Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    // 1. Verify Webhook Signature if secret is configured
    if (secret) {
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
    }

    const payload = JSON.parse(rawBody);
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
    // Active subscription statuses: "active", "on_trial", "past_due" (grace period)
    const isPro =
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_resumed" ||
      eventName === "order_created" ||
      status === "active" ||
      status === "paid" ||
      status === "on_trial";

    const isExpired =
      eventName === "subscription_expired" ||
      status === "expired" ||
      (eventName === "subscription_cancelled" && status !== "active");

    if (db) {
      const userRef = doc(db, "users", userId);
      await setDoc(
        userRef,
        {
          plan: isExpired ? "free" : isPro ? "pro" : "free",
          planStatus: status,
          lemonSqueezyCustomerId: String(attributes.customer_id || ""),
          lemonSqueezySubscriptionId: String(data.id || ""),
          renewsAt: attributes.renews_at || null,
          endsAt: attributes.ends_at || null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log(`[LemonSqueezy Webhook] Updated user ${userId} plan to ${isExpired ? "free" : isPro ? "pro" : "free"}`);
    }

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
