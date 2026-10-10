import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { shouldIgnoreTestModeEvent } from "@/lib/webhookPolicy";

// Subscription lifecycle events: payload `data` is the subscription object.
const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);

// Refund events revoke Pro: payload `data` is an order or subscription invoice.
const REFUND_EVENTS = new Set(["order_refunded", "subscription_payment_refunded"]);

/** The Lemon Squeezy webhook fields this handler reads (everything else is ignored). */
interface LemonSqueezyWebhookPayload {
  meta?: { event_name?: string; test_mode?: boolean; custom_data?: { user_id?: unknown } };
  data?: {
    id?: string | number;
    type?: string;
    attributes?: {
      status?: string;
      customer_id?: string | number;
      user_email?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      updated_at?: string;
      created_at?: string;
    };
  };
}

// Firebase Auth uids are 1-128 chars; reject anything that could form a different Firestore path.
const FIREBASE_UID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

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

    let payload: LemonSqueezyWebhookPayload;
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

    // Test purchases must not grant real Pro access unless explicitly enabled for testing.
    if (shouldIgnoreTestModeEvent(payload.meta)) {
      console.log(`[LemonSqueezy Webhook] Ignored test-mode ${eventName} (LEMON_SQUEEZY_ACCEPT_TEST_EVENTS is off)`);
      return NextResponse.json({ received: true, ignored: true, note: "Test-mode event ignored" });
    }

    const isSubscriptionEvent = SUBSCRIPTION_EVENTS.has(eventName);
    const isRefundEvent = REFUND_EVENTS.has(eventName);

    // Plans are driven by subscription objects only. Other events (e.g. order_created, which carries an
    // *order* id) are acknowledged without touching the profile (audit M-6).
    if (!isSubscriptionEvent && !isRefundEvent) {
      return NextResponse.json({ received: true, ignored: true, note: `Event ${eventName} does not change plans` });
    }

    if (!userId) {
      console.warn("[LemonSqueezy Webhook] No userId found in custom_data. Payload attributes email:", attributes.user_email);
      // Return 200 OK so Lemon Squeezy does not indefinitely retry
      return NextResponse.json({ received: true, note: "No user_id found in custom_data" });
    }
    if (typeof userId !== "string" || !FIREBASE_UID_PATTERN.test(userId)) {
      console.warn("[LemonSqueezy Webhook] Ignoring malformed custom_data.user_id");
      return NextResponse.json({ received: true, ignored: true, note: "Malformed user_id" });
    }

    // When this state change happened at Lemon Squeezy. Used to drop stale / re-delivered events.
    const parsedEventTime = Date.parse(attributes.updated_at || attributes.created_at || "");
    const eventAt = new Date(Number.isNaN(parsedEventTime) ? Date.now() : parsedEventTime).toISOString();

    let updateData: Record<string, unknown>;
    let finalPlan: "pro" | "free";

    if (isRefundEvent) {
      // A refunded payment revokes Pro. Keep the subscription/customer ids (the payload is an
      // order or invoice, not the subscription).
      finalPlan = "free";
      updateData = { plan: finalPlan, planStatus: "refunded" };
    } else {
      // Active states: active, on_trial. Cancelled keeps Pro until ends_at (grace period).
      // past_due keeps Pro while Lemon Squeezy retries the payment (capped by pastDueSince, see
      // lib/subscriptionAccess). Inactive states: expired, unpaid, paused
      const isExplicitlyExpired =
        eventName === "subscription_expired" || status === "expired" || status === "unpaid";
      const isCurrentlyActive =
        (status === "active" || status === "on_trial" || status === "past_due") && !isExplicitlyExpired;
      const endsAtTime = attributes.ends_at ? new Date(attributes.ends_at).getTime() : 0;
      const hasRemainingPeriod = status === "cancelled" && endsAtTime > Date.now();

      finalPlan = isCurrentlyActive || hasRemainingPeriod ? "pro" : "free";
      updateData = {
        plan: finalPlan,
        planStatus: status,
        lemonSqueezyCustomerId: String(attributes.customer_id || ""),
        lemonSqueezySubscriptionId: String(data.id || ""),
        renewsAt: attributes.renews_at || null,
        endsAt: attributes.ends_at || null,
      };
    }
    updateData = {
      ...updateData,
      lemonSqueezyEventAt: eventAt,
      lemonSqueezyLastEvent: eventName,
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

    // Apply only if this event is not older than the last one applied. Lemon Squeezy retries and does
    // not guarantee ordering; re-delivering the same event rewrites identical data (idempotent).
    const db = adminDb;
    const userRef = db.collection("users").doc(userId);
    const outcome = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const lastAppliedAt = snap.get("lemonSqueezyEventAt") as string | undefined;
      if (lastAppliedAt && Date.parse(lastAppliedAt) > Date.parse(eventAt)) {
        return "stale" as const;
      }
      // Start of the payment-retry grace: kept across repeated past_due events, cleared otherwise
      let pastDueSince: string | null = null;
      if (updateData.planStatus === "past_due") {
        const previous = snap.get("pastDueSince");
        pastDueSince = snap.get("planStatus") === "past_due" && typeof previous === "string" ? previous : eventAt;
      }
      tx.set(userRef, { ...updateData, pastDueSince }, { merge: true });
      return "applied" as const;
    });

    if (outcome === "stale") {
      console.log(`[LemonSqueezy Webhook] Ignored stale ${eventName} for user ${userId} (event at ${eventAt})`);
      return NextResponse.json({ received: true, ignored: true, note: "Stale event" });
    }

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
