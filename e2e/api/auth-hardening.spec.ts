import { test, expect } from "@playwright/test";
import { SAMPLE_MEMO, uniqueIp } from "../helpers";
import { E2E_ADMIN_EMAIL } from "../constants";
import { clearAuthUsers, createTestUser, readDoc, readFreeUsedCount, requireEmulators, seedDoc } from "../emulator";

/**
 * H-3: per-account rate limit on top of the per-IP limit.
 * H-4: admin bypass requires a verified email on the allow-list.
 * The E2E server's admin allow-list is E2E_ADMIN_EMAIL (playwright.config.ts).
 */

requireEmulators();

test.describe("H-3: per-account rate limit", () => {
  test("one account rotating IPs is still limited (13th request/min -> 429)", async ({ request }) => {
    // Pro: unlimited quota, so every request would otherwise succeed.
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}`, { plan: "pro", planStatus: "active" });

    const statuses: number[] = [];
    for (let i = 0; i < 13; i++) {
      const res = await request.post("/api/transform", {
        headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() },
        data: { raw_memo: SAMPLE_MEMO },
      });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 12).every((s) => s === 200)).toBe(true);
    expect(statuses[12]).toBe(429);
  });

  test("the per-account counter lives in Firestore, shared by all server instances", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}`, { plan: "pro", planStatus: "active" });
    for (let i = 0; i < 13; i++) {
      await request.post("/api/transform", {
        headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() },
        data: { raw_memo: SAMPLE_MEMO },
      });
    }
    const doc = await readDoc(`users/${user.uid}/usage/rate_transform`);
    expect((doc?.count as { integerValue: string }).integerValue).toBe("12");
  });

  test("the limit is per account: another account is unaffected", async ({ request }) => {
    const a = await createTestUser();
    const b = await createTestUser();
    await seedDoc(`users/${a.uid}`, { plan: "pro", planStatus: "active" });
    for (let i = 0; i < 12; i++) {
      await request.post("/api/transform", {
        headers: { Authorization: `Bearer ${a.idToken}`, "x-forwarded-for": uniqueIp() },
        data: { raw_memo: SAMPLE_MEMO },
      });
    }
    const res = await request.post("/api/transform", {
      headers: { Authorization: `Bearer ${b.idToken}`, "x-forwarded-for": uniqueIp() },
      data: { raw_memo: SAMPLE_MEMO },
    });
    expect(res.status()).toBe(200);
  });
});

test.describe("H-4: admin bypass requires a verified email", () => {
  test.beforeEach(async () => {
    await clearAuthUsers();
  });

  test("allow-listed but UNVERIFIED email gets free-plan limits", async ({ request }) => {
    const impostor = await createTestUser({ email: E2E_ADMIN_EMAIL, emailVerified: false });
    await seedDoc(`users/${impostor.uid}/usage/summary`, { freeUsedCount: 10 });

    const res = await request.post("/api/transform", {
      headers: { Authorization: `Bearer ${impostor.idToken}`, "x-forwarded-for": uniqueIp() },
      data: { raw_memo: SAMPLE_MEMO },
    });
    expect(res.status()).toBe(403);

    const status = await request.get("/api/extension/status", {
      headers: { Authorization: `Bearer ${impostor.idToken}` },
    });
    expect((await status.json()).credits).toMatchObject({ isPro: false, isUserExhausted: true });
  });

  test("allow-listed VERIFIED email is treated as admin (unlimited, not charged)", async ({ request }) => {
    const admin = await createTestUser({ email: E2E_ADMIN_EMAIL, emailVerified: true });
    await seedDoc(`users/${admin.uid}/usage/summary`, { freeUsedCount: 10 });

    const res = await request.post("/api/transform", {
      headers: { Authorization: `Bearer ${admin.idToken}`, "x-forwarded-for": uniqueIp() },
      data: { raw_memo: SAMPLE_MEMO },
    });
    expect(res.status()).toBe(200);
    expect(await readFreeUsedCount(admin.uid)).toBe(10);

    const status = await request.get("/api/extension/status", {
      headers: { Authorization: `Bearer ${admin.idToken}` },
    });
    expect((await status.json()).credits).toMatchObject({ isPro: true, isUserExhausted: false });
  });
});
