/**
 * Firestore Security Rules tests (runs against the local emulator, never production).
 *
 *   npm run test:rules
 *
 * Tests assert the INTENDED policy. Ones marked `gap(<audit id>)` currently fail because of a defect
 * documented in docs/AUDIT_REPORT.md; they are reported as TODO (non-fatal) unless STRICT_SECURITY=1.
 */
import { after, before, beforeEach, describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const STRICT = Boolean(process.env.STRICT_SECURITY);
const gap = (id) => (STRICT ? {} : { todo: `Known defect ${id} (docs/AUDIT_REPORT.md)` });

const ALICE = "alice";
const BOB = "bob";
const ADMIN_EMAIL = "jungyeonjin90@gmail.com";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-winstash-rules",
    firestore: { rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users", ALICE), { plan: "free", planStatus: "inactive", email: "alice@example.com" });
    await setDoc(doc(db, "users", ALICE, "usage", "summary"), { freeUsedCount: 10 });
    await setDoc(doc(db, "users", ALICE, "usage", "synthesis"), { bragUsedCount: 3, starUsedCount: 3 });
    await setDoc(doc(db, "users", ALICE, "records", "rec-1"), { raw_memo: "secret work", createdAt: "2026-10-01" });
    await setDoc(doc(db, "users", BOB), { plan: "free" });
    await setDoc(doc(db, "system", "usage"), { totalCount: 42 });
    await setDoc(doc(db, "pro_waitlist", "alice@example.com"), { email: "alice@example.com", userId: "anonymous", source: "original" });
  });
});

const as = (uid, claims = {}) => env.authenticatedContext(uid, { email: `${uid}@example.com`, ...claims }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("users/{uid} profile", () => {
  test("owner can read own profile", async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), "users", ALICE)));
  });

  test("other users cannot read someone else's profile", async () => {
    await assertFails(getDoc(doc(as(BOB), "users", ALICE)));
  });

  test("anonymous cannot read profiles", async () => {
    await assertFails(getDoc(doc(anon(), "users", ALICE)));
  });

  test("owner can update harmless fields", async () => {
    await assertSucceeds(updateDoc(doc(as(ALICE), "users", ALICE), { displayName: "Alice" }));
  });

  test("[C-1] owner must NOT be able to self-upgrade plan to pro", async () => {
    await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { plan: "pro", planStatus: "active" }));
  });

  test("[C-1] owner must NOT be able to set lemonSqueezy* billing ids", async () => {
    await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { lemonSqueezySubscriptionId: "fake" }));
  });

  test("[C-1] new profile must NOT be creatable with plan=pro", async () => {
    const carol = as("carol");
    await assertFails(setDoc(doc(carol, "users", "carol"), { plan: "pro", planStatus: "active" }));
  });

  test("new profile must NOT carry other protected fields", async () => {
    await assertFails(setDoc(doc(as("erin"), "users", "erin"), { freeUsedCount: -100 }));
    await assertFails(setDoc(doc(as("erin"), "users", "erin"), { endsAt: "2099-01-01" }));
  });

  test("owner must NOT be able to extend endsAt (cancelled-plan grace period)", async () => {
    await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { endsAt: "2099-01-01T00:00:00Z" }));
  });

  test("waitlist dual-write to own profile still works (UpgradeModal / PricingWaitlistButton)", async () => {
    await assertSucceeds(
      setDoc(
        doc(as(ALICE), "users", ALICE),
        { waitlistJoined: true, waitlistEmail: "alice@example.com", waitlistReason: "pricing_page" },
        { merge: true }
      )
    );
    // ...including for a user whose profile doc does not exist yet (merge -> create)
    await assertSucceeds(setDoc(doc(as("frank"), "users", "frank"), { waitlistJoined: true }, { merge: true }));
  });

  test("new profile with plan=free is allowed", async () => {
    await assertSucceeds(setDoc(doc(as("dave"), "users", "dave"), { plan: "free", planStatus: "inactive" }));
  });

  test("[C-1] owner must NOT be able to reset freeUsedCount on the profile doc", async () => {
    await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { freeUsedCount: 0 }));
  });
});

describe("users/{uid}/usage (server-managed quota)", () => {
  test("owner can read own usage", async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), "users", ALICE, "usage", "summary")));
  });

  test("[C-1] owner must NOT be able to reset free transform counter", async () => {
    await assertFails(setDoc(doc(as(ALICE), "users", ALICE, "usage", "summary"), { freeUsedCount: 0 }));
  });

  test("[C-1] owner must NOT be able to reset synthesis counters", async () => {
    await assertFails(setDoc(doc(as(ALICE), "users", ALICE, "usage", "synthesis"), { bragUsedCount: 0 }));
  });

  test("[C-1] owner must NOT be able to delete usage docs", async () => {
    await assertFails(deleteDoc(doc(as(ALICE), "users", ALICE, "usage", "summary")));
  });

  test("other users cannot read or write someone else's usage", async () => {
    await assertFails(getDoc(doc(as(BOB), "users", ALICE, "usage", "summary")));
    await assertFails(setDoc(doc(as(BOB), "users", ALICE, "usage", "summary"), { freeUsedCount: 99 }));
  });
});

describe("users/{uid}/records", () => {
  test("owner can read and write own records", async () => {
    const db = as(ALICE);
    await assertSucceeds(getDoc(doc(db, "users", ALICE, "records", "rec-1")));
    await assertSucceeds(setDoc(doc(db, "users", ALICE, "records", "rec-2"), { raw_memo: "new" }));
  });

  test("other users cannot read records (cross-tenant isolation)", async () => {
    await assertFails(getDoc(doc(as(BOB), "users", ALICE, "records", "rec-1")));
  });

  test("other users cannot inject records", async () => {
    await assertFails(setDoc(doc(as(BOB), "users", ALICE, "records", "evil"), { raw_memo: "x" }));
  });

  test("anonymous cannot read records", async () => {
    await assertFails(getDoc(doc(anon(), "users", ALICE, "records", "rec-1")));
  });
});

describe("other users/{uid} subcollections", () => {
  test("owner can read/write settings/persona", async () => {
    const ref = doc(as(ALICE), "users", ALICE, "settings", "persona");
    await assertSucceeds(setDoc(ref, { jobRole: "engineering", toneManner: "impact" }));
    await assertSucceeds(getDoc(ref));
  });

  test("owner can read/write summary_cache", async () => {
    const ref = doc(as(ALICE), "users", ALICE, "summary_cache", "latest_brag");
    await assertSucceeds(setDoc(ref, { items: [] }));
    await assertSucceeds(getDoc(ref));
  });

  test("other users cannot touch settings or summary_cache", async () => {
    await assertFails(getDoc(doc(as(BOB), "users", ALICE, "settings", "persona")));
    await assertFails(setDoc(doc(as(BOB), "users", ALICE, "summary_cache", "x"), { items: [] }));
  });

  test("unknown subcollections are denied by default", async () => {
    await assertFails(setDoc(doc(as(ALICE), "users", ALICE, "anything", "x"), { a: 1 }));
    await assertFails(setDoc(doc(as(ALICE), "users", ALICE, "records", "r1", "nested", "x"), { a: 1 }));
  });
});

describe("system/usage (global kill switch counter)", () => {
  test("anyone can read", async () => {
    await assertSucceeds(getDoc(doc(anon(), "system", "usage")));
  });

  test("anonymous cannot write", async () => {
    await assertFails(setDoc(doc(anon(), "system", "usage"), { totalCount: 0 }));
  });

  test("[H-5] signed-in users must NOT be able to overwrite the global counter", async () => {
    await assertFails(setDoc(doc(as(ALICE), "system", "usage"), { totalCount: 999999 }));
  });

  test("other system docs are read-only", async () => {
    await assertFails(setDoc(doc(as(ALICE), "system", "config"), { killSwitch: false }));
  });
});

describe("feedbacks", () => {
  test("signed-in users can submit feedback", async () => {
    await assertSucceeds(setDoc(doc(as(ALICE), "feedbacks", "f1"), { message: "hi" }));
  });

  test("anonymous cannot submit feedback", async () => {
    await assertFails(setDoc(doc(anon(), "feedbacks", "f2"), { message: "spam" }));
  });

  test("non-admin cannot read feedback", async () => {
    await assertFails(getDoc(doc(as(BOB), "feedbacks", "f1")));
  });

  test("admin can read feedback", async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "feedbacks", "f1"), { message: "hi" }));
    await assertSucceeds(getDoc(doc(as("admin", { email: ADMIN_EMAIL, email_verified: true }), "feedbacks", "f1")));
  });

  test("[H-4] admin email WITHOUT email_verified cannot read feedback", async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "feedbacks", "f1"), { message: "hi" }));
    await assertFails(getDoc(doc(as("impostor", { email: ADMIN_EMAIL, email_verified: false }), "feedbacks", "f1")));
    await assertFails(getDoc(doc(as("impostor2", { email: ADMIN_EMAIL }), "feedbacks", "f1")));
  });
});

describe("pro_waitlist", () => {
  // Same shape as components/pricing/PricingWaitlistButton.tsx and components/UpgradeModal.tsx
  const entry = (email, userId = "anonymous", extra = {}) => ({
    email,
    userId,
    displayName: "",
    triggerReason: "pricing_page",
    joinedAt: serverTimestamp(),
    source: "pricing_page_card",
    ...extra,
  });

  test("anonymous visitors can join the waitlist", async () => {
    await assertSucceeds(setDoc(doc(anon(), "pro_waitlist", "new@example.com"), entry("new@example.com"), { merge: true }));
  });

  test("signed-in users can join with their own uid", async () => {
    await assertSucceeds(
      setDoc(doc(as(BOB), "pro_waitlist", "bob@example.com"), entry("bob@example.com", BOB), { merge: true })
    );
  });

  test("entries cannot be read by the public", async () => {
    await assertFails(getDoc(doc(anon(), "pro_waitlist", "alice@example.com")));
  });

  test("[M-8] anonymous must NOT be able to overwrite someone else's entry", async () => {
    await assertFails(
      setDoc(doc(anon(), "pro_waitlist", "alice@example.com"), entry("alice@example.com", "anonymous", { source: "hijacked" }))
    );
    await assertFails(
      setDoc(doc(anon(), "pro_waitlist", "alice@example.com"), { email: "attacker@example.com" }, { merge: true })
    );
  });

  test("[M-8] doc id must match the submitted email", async () => {
    await assertFails(setDoc(doc(anon(), "pro_waitlist", "whatever"), entry("someone@example.com")));
  });

  test("[M-8] signed-in users cannot attribute an entry to another uid", async () => {
    await assertFails(setDoc(doc(as(BOB), "pro_waitlist", "x@example.com"), entry("x@example.com", ALICE)));
  });

  test("[M-8] anonymous visitors cannot claim a uid", async () => {
    await assertFails(setDoc(doc(anon(), "pro_waitlist", "y@example.com"), entry("y@example.com", ALICE)));
  });

  test("[M-8] unexpected fields, invalid emails and oversized values are rejected", async () => {
    await assertFails(setDoc(doc(anon(), "pro_waitlist", "z@example.com"), entry("z@example.com", "anonymous", { admin: true })));
    await assertFails(setDoc(doc(anon(), "pro_waitlist", "not-an-email"), entry("not-an-email")));
    await assertFails(
      setDoc(doc(anon(), "pro_waitlist", "w@example.com"), entry("w@example.com", "anonymous", { displayName: "x".repeat(101) }))
    );
  });
});

describe("webhook bookkeeping fields on users/{uid}", () => {
  test("[M-6] owner cannot set lemonSqueezyEventAt (would block future webhook updates)", async () => {
    await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { lemonSqueezyEventAt: "2999-01-01T00:00:00Z" }));
    await assertFails(setDoc(doc(as("gina"), "users", "gina"), { lemonSqueezyEventAt: "2999-01-01T00:00:00Z" }));
  });

  test("[M-6] owner cannot set lemonSqueezyLastEvent", async () => {
    await assertFails(updateDoc(doc(as(ALICE), "users", ALICE), { lemonSqueezyLastEvent: "subscription_created" }));
  });
});
