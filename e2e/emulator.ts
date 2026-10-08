import { test } from "@playwright/test";
import crypto from "crypto";
import { E2E_AUTH_EMULATOR_HOST, E2E_FIRESTORE_EMULATOR_HOST, E2E_PROJECT_ID } from "./constants";

/**
 * Helpers for tests that need a real signed-in user. Everything here talks to the local
 * Firebase emulators started by `npm run test:e2e` (project demo-winstash-e2e) — never production.
 */

const AUTH = `http://${E2E_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1`;
const FIRESTORE = `http://${E2E_FIRESTORE_EMULATOR_HOST}/v1/projects/${E2E_PROJECT_ID}/databases/(default)/documents`;
// "Bearer owner" is the emulator's admin bypass for security rules.
const ADMIN_HEADERS = { Authorization: "Bearer owner", "Content-Type": "application/json" };

export async function emulatorsAvailable(): Promise<boolean> {
  try {
    const [auth, fs] = await Promise.all([
      fetch(`http://${E2E_AUTH_EMULATOR_HOST}/`),
      fetch(`http://${E2E_FIRESTORE_EMULATOR_HOST}/`),
    ]);
    return auth.ok && fs.ok;
  } catch {
    return false;
  }
}

/** Skips the current describe block unless the emulators are up and we manage the server. */
export function requireEmulators() {
  test.skip(!!process.env.E2E_BASE_URL, "Emulator-backed tests need the E2E-managed server");
  test.beforeAll(async () => {
    test.skip(!(await emulatorsAvailable()), "Firebase emulators not running — use `npm run test:e2e`");
  });
}

export interface TestUser {
  uid: string;
  email: string;
  idToken: string;
}

/** Creates a fresh email/password user in the Auth emulator and returns its ID token. */
export async function createTestUser(): Promise<TestUser> {
  const email = `e2e-${crypto.randomUUID()}@example.com`;
  const res = await fetch(`${AUTH}/accounts:signUp?key=e2e-fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "e2e-password-123", returnSecureToken: true }),
  });
  if (!res.ok) throw new Error(`Auth emulator signUp failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return { uid: json.localId, email, idToken: json.idToken };
}

type FirestoreValue = string | number | boolean;

function toFields(data: Record<string, FirestoreValue>) {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      typeof v === "number"
        ? { integerValue: String(v) }
        : typeof v === "boolean"
          ? { booleanValue: v }
          : { stringValue: v },
    ])
  );
}

/** Writes a document with security rules bypassed (test fixture setup). */
export async function seedDoc(path: string, data: Record<string, FirestoreValue>) {
  const res = await fetch(`${FIRESTORE}/${path}`, {
    method: "PATCH",
    headers: ADMIN_HEADERS,
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`seedDoc(${path}) failed: ${res.status} ${await res.text()}`);
}

/** Reads a document with rules bypassed; returns null when it does not exist. */
export async function readDoc(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${FIRESTORE}/${path}`, { headers: ADMIN_HEADERS });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`readDoc(${path}) failed: ${res.status}`);
  return (await res.json()).fields ?? {};
}

export async function readFreeUsedCount(uid: string): Promise<number> {
  const fields = await readDoc(`users/${uid}/usage/summary`);
  const v = fields?.freeUsedCount as { integerValue?: string } | undefined;
  return v?.integerValue ? parseInt(v.integerValue, 10) : 0;
}

export async function listRecordIds(uid: string): Promise<string[]> {
  const res = await fetch(`${FIRESTORE}/users/${uid}/records?pageSize=100`, { headers: ADMIN_HEADERS });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.documents ?? []).map((d: { name: string }) => d.name.split("/").pop());
}
