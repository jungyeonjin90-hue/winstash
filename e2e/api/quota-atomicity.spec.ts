import { test, expect, type APIRequestContext } from "@playwright/test";
import { SAMPLE_MEMO, uniqueIp } from "../helpers";
import { createTestUser, readDoc, readFreeUsedCount, requireEmulators, seedDoc, type TestUser } from "../emulator";

/**
 * H-1: quota is reserved atomically (Firestore transaction) before the AI call,
 *      so concurrent requests cannot overshoot the free limit.
 * H-2: the global free-usage kill switch (system/usage.totalCount, MAX_GLOBAL_SERVICE_CREDITS = 10,000)
 *      is enforced and counted on the server.
 * Real (emulator) users and tokens; see e2e/emulator.ts.
 */

requireEmulators();

const transform = (request: APIRequestContext, user: TestUser) =>
  request.post("/api/transform", {
    headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() },
    data: { raw_memo: SAMPLE_MEMO },
  });

const extensionSubmit = (request: APIRequestContext, user: TestUser) =>
  request.post("/api/extension/submit", {
    headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() },
    data: { rawNote: SAMPLE_MEMO },
  });

const synthesize = (request: APIRequestContext, user: TestUser) =>
  request.post("/api/synthesize/en", {
    headers: { Authorization: `Bearer ${user.idToken}`, "x-forwarded-for": uniqueIp() },
    data: {
      type: "brag",
      scope: 3,
      records: [{ id: "r1", createdAt: new Date().toISOString(), raw_memo: SAMPLE_MEMO }],
    },
  });

async function readGlobalCount(): Promise<number> {
  const fields = await readDoc("system/usage");
  const v = fields?.totalCount as { integerValue?: string } | undefined;
  return v?.integerValue ? parseInt(v.integerValue, 10) : 0;
}

// system/usage is shared by every test in the run: always leave it far below the cap.
test.afterEach(async () => {
  await seedDoc("system/usage", { totalCount: 0 });
});

test.describe("H-1: concurrent requests cannot overshoot the free limit", () => {
  test("web transform: 2 credits left, 6 parallel requests -> exactly 2 succeed", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 8 });

    const statuses = (await Promise.all(Array.from({ length: 6 }, () => transform(request, user)))).map((r) =>
      r.status()
    );

    expect(statuses.filter((s) => s === 200)).toHaveLength(2);
    expect(statuses.filter((s) => s === 403)).toHaveLength(4);
    expect(await readFreeUsedCount(user.uid)).toBe(10);
  });

  test("web + extension mixed: 1 credit left, 4 parallel requests -> exactly 1 succeeds", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/summary`, { freeUsedCount: 9 });

    const statuses = (
      await Promise.all([
        transform(request, user),
        extensionSubmit(request, user),
        transform(request, user),
        extensionSubmit(request, user),
      ])
    ).map((r) => r.status());

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(await readFreeUsedCount(user.uid)).toBe(10);
  });

  test("brag synthesis: 1 credit left, 4 parallel requests -> exactly 1 succeeds", async ({ request }) => {
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}/usage/synthesis`, { bragUsedCount: 2 });

    const statuses = (await Promise.all(Array.from({ length: 4 }, () => synthesize(request, user)))).map((r) =>
      r.status()
    );

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    const syn = await readDoc(`users/${user.uid}/usage/synthesis`);
    expect((syn?.bragUsedCount as { integerValue: string }).integerValue).toBe("3");
  });
});

test.describe("H-2: global free-usage kill switch is enforced server-side", () => {
  test("each free transform increments system/usage.totalCount", async ({ request }) => {
    await seedDoc("system/usage", { totalCount: 50 });
    const user = await createTestUser();

    expect((await transform(request, user)).status()).toBe(200);
    expect((await extensionSubmit(request, user)).status()).toBe(200);
    expect(await readGlobalCount()).toBe(52);
  });

  test("when the global cap is reached, free users get 403 even with personal credits left", async ({ request }) => {
    await seedDoc("system/usage", { totalCount: 10_000 });
    const user = await createTestUser();

    for (const res of [await transform(request, user), await extensionSubmit(request, user)]) {
      expect(res.status()).toBe(403);
      expect(JSON.stringify(await res.json())).toMatch(/free promotional quota/);
    }
    expect(await readFreeUsedCount(user.uid)).toBe(0);
    expect(await readGlobalCount()).toBe(10_000);
  });

  test("Pro users are not affected by the global cap and are not counted", async ({ request }) => {
    await seedDoc("system/usage", { totalCount: 10_000 });
    const user = await createTestUser();
    await seedDoc(`users/${user.uid}`, { plan: "pro", planStatus: "active" });

    expect((await transform(request, user)).status()).toBe(200);
    expect(await readGlobalCount()).toBe(10_000);
  });

  test("1 global slot left, 4 different users in parallel -> exactly 1 succeeds", async ({ request }) => {
    await seedDoc("system/usage", { totalCount: 9_999 });
    const users = await Promise.all(Array.from({ length: 4 }, () => createTestUser()));

    const statuses = (await Promise.all(users.map((u) => transform(request, u)))).map((r) => r.status());

    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(await readGlobalCount()).toBe(10_000);
  });
});
