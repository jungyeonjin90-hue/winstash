import crypto from "crypto";

/**
 * Firebase custom tokens signed directly with the service account key.
 *
 * firebase-admin/auth cannot always be loaded on Vercel (see lib/firebaseAdmin), so adminAuth may be
 * null in production. A custom token is just an RS256 JWT signed by the service account, which needs
 * nothing but node:crypto. Format: https://firebase.google.com/docs/auth/admin/create-custom-tokens
 */
const CUSTOM_TOKEN_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
// Firebase accepts at most one hour; the extension uses it right away
const CUSTOM_TOKEN_TTL_SECONDS = 60 * 60;

export interface ServiceAccountKey {
  clientEmail: string;
  privateKey: string;
}

export function serviceAccountFromEnv(env: Record<string, string | undefined> = process.env): ServiceAccountKey | null {
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return clientEmail && privateKey ? { clientEmail, privateKey } : null;
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function signCustomToken(uid: string, key: ServiceAccountKey, now: number = Date.now()): string {
  if (!uid || uid.length > 128) throw new Error("uid must be 1-128 characters");
  const iat = Math.floor(now / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: key.clientEmail,
    sub: key.clientEmail,
    aud: CUSTOM_TOKEN_AUDIENCE,
    iat,
    exp: iat + CUSTOM_TOKEN_TTL_SECONDS,
    uid,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput), key.privateKey);
  return `${signingInput}.${base64url(signature)}`;
}
