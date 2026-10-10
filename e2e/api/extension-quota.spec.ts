import { test, expect } from "@playwright/test";
import { SAMPLE_MEMO, uniqueIp } from "../helpers";
import {
  createTestUser,
  listRecordIds,
  readFreeUsedCount,
  requireEmulators,
  seedDoc,
} from "../emulator";

/**
 * C-3 regression: the Chrome extension routes must enforce the same server-side free quota as the web app.
 * Real (emulator) users and ID tokens; the server's Admin SDK reads/writes the Firestore emulator.
 * Free plan: new entries and edits share MAX_USER_FREE_CREDITS = 10 (lib/creditConfig.ts).
 */

requireEmulators();

const submit = (request: import("@playwright/test").APIRequestContext, token: string, data: object) =>
  request.post("/api/extension/submit", {
    headers: { Authorization: `Bearer ${token}`, "x-forwarded-for": uniqueIp() },
    data,
  });

test.describe("POST /api/extension/submit quota (C-3)", () => {
  test("a NEW entry consumes one free credit and is persisted", async ({ request }) => {
    const user = await createTestUser();

    const res = await submit(request, user.idToken, { rawNote: SAMPLE_MEMO });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.record.source).toBe("chrome_extension");
    expect(json.credits).toMatchObject({ isPro: false, totalGeneratedCount: 1, remainingCredits: 9 });

    expect(await readFreeUsedCount(user.uid)).toBe(1);
    expect(await listRecordIds(user.uid)).toContain(json.record.id);
  });

  test("a new record's createdAt is its week's date, savedAt is the save time", async ({ request }) => {
    const user = await createTestUser();
    const target_week = { year: 2026, month: 8, weekOfMonth: 1, startDate: "2026-08-02", endDate: "2026-08-08", label: "Week 1" };
    const res = await submit(request, user.idToken, { rawNote: SAMPLE_MEMO, target_week });
    expect(res.status()).toBe(200);
    const { record } = await res.json();
    expect(record.createdAt).toBe("2026-08-08T09:00:00.000Z");
    expect(Date.now() - Date.parse(record.savedAt)).toBeLessThan(60_000);
  });

  test("editing an existing entry also consumes one credit", async ({ request }) => {
    const user = await createTestUser();
    const first = await (await submit(request, user.idToken, { rawNote: SAMPLE_MEMO })).json();

    const res = await submit(request, user.idToken, {
      rawNote: `${SAMPLE_MEMO} Also shipped Grafana alerts.`,
      existingRecordId: first.record.id,
      existingCreatedAt: first.record.createdAt,
    });
    expect(res.status()).toBe(200);
    expect(await readFreeUsedCount(user.uid)).toBe(2);
    expect(await listRecordIds(user.uid)).toEqual([first.record.id]);
  });

  test("usage counter is incremented, never reset (was overwritten to 1 before the fix)", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 7 });

    const res = await submit(request, user.idToken, { rawNote: SAMPLE_MEMO });
    expect(res.status()).toBe(200);
    expect((await res.json()).credits.totalGeneratedCount).toBe(8);
    expect(await readFreeUsedCount(user.uid)).toBe(8);
  });

  test("an exhausted free user is blocked with 403 and nothing is written", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 10 });

    const res = await submit(request, user.idToken, { rawNote: SAMPLE_MEMO });
    expect(res.status()).toBe(403);
    expect(await readFreeUsedCount(user.uid)).toBe(10);
    expect(await listRecordIds(user.uid)).toEqual([]);
  });

  test("Pro users are not charged", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}`, { plan: "pro", planStatus: "active" });
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 10 });

    const res = await submit(request, user.idToken, { rawNote: SAMPLE_MEMO });
    expect(res.status()).toBe(200);
    expect((await res.json()).credits.isPro).toBe(true);
    expect(await readFreeUsedCount(user.uid)).toBe(10);
  });

  test("memo over 5,000 chars -> 400 without charging", async ({ request }) => {
    const user = await createTestUser();
    const res = await submit(request, user.idToken, { rawNote: "a".repeat(5001) });
    expect(res.status()).toBe(400);
    expect(await readFreeUsedCount(user.uid)).toBe(0);
  });

  test("invalid JSON -> 400 without charging", async ({ request }) => {
    const user = await createTestUser();
    const res = await request.post("/api/extension/submit", {
      headers: {
        Authorization: `Bearer ${user.idToken}`,
        "x-forwarded-for": uniqueIp(),
        "content-type": "application/json",
      },
      data: Buffer.from("{broken"),
    });
    expect(res.status()).toBe(400);
    expect(await readFreeUsedCount(user.uid)).toBe(0);
  });

  test("13th request per minute from one IP -> 429", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 10 }); // keep requests cheap (403)
    const ip = uniqueIp();
    let last = 0;
    for (let i = 0; i < 13; i++) {
      const res = await request.post("/api/extension/submit", {
        headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": ip },
        data: { rawNote: SAMPLE_MEMO },
      });
      last = res.status();
    }
    expect(last).toBe(429);
  });
});

test.describe("GET /api/extension/status credits (C-3)", () => {
  test("reports the same server counter that submit enforces", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 4 });

    const res = await request.get("/api/extension/status", {
      headers: { Authorization: `Bearer ${user.idToken}` },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).credits).toMatchObject({
      isPro: false,
      totalGeneratedCount: 4,
      remainingCredits: 6,
      maxUserCredits: 10,
      isUserExhausted: false,
    });
  });

  test("a new account with no records gets an empty list without slow fallbacks", async ({ request }) => {
    const user = await createTestUser();
    const call = () =>
      request.get("/api/extension/status", { headers: { Authorization: `Bearer ${user.idToken}` } });
    await call(); // warm-up (dev server compiles the route on first use)

    const started = Date.now();
    const res = await call();
    const elapsed = Date.now() - started;
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.records).toEqual([]);
    expect(json.credits).toMatchObject({ totalGeneratedCount: 0, remainingCredits: 10 });
    expect(elapsed).toBeLessThan(1500);
  });

  test("an exhausted user is reported as exhausted", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 10 });
    const json = await (
      await request.get("/api/extension/status", { headers: { Authorization: `Bearer ${user.idToken}` } })
    ).json();
    expect(json.credits).toMatchObject({ isUserExhausted: true, remainingCredits: 0 });
  });
});

test.describe("web /api/transform shares the same counter", () => {
  test("a web transform and an extension submit draw from one 10-credit pool", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 9 });

    const web = await request.post("/api/transform", {
      headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() },
      data: { raw_memo: SAMPLE_MEMO },
    });
    expect(web.status()).toBe(200);
    expect(await readFreeUsedCount(user.uid)).toBe(10);

    const ext = await submit(request, user.idToken, { rawNote: SAMPLE_MEMO });
    expect(ext.status()).toBe(403);
  });
});
