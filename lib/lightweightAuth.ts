import crypto from "crypto";

export interface DecodedFirebaseToken {
  uid: string;
  email?: string | null;
  [key: string]: unknown;
}

// In-memory cache for Google x509 public certificates
let cachedCertificates: Record<string, string> | null = null;
let certsExpiryTime = 0;

/**
 * Fetches Google's public x509 certificates used to sign Firebase ID tokens.
 * Caches certificates in memory respecting cache headers or defaulting to 1 hour.
 */
async function getGoogleCertificates(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCertificates && now < certsExpiryTime) {
    return cachedCertificates;
  }

  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch Google public certs: HTTP ${res.status}`);
  }

  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const ttlSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  cachedCertificates = (await res.json()) as Record<string, string>;
  certsExpiryTime = now + ttlSeconds * 1000;
  return cachedCertificates;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Lightweight, zero-dependency Firebase ID Token verifier.
 * Directly verifies Google's RS256 signature using native Node.js crypto.
 * Completely immune to CommonJS/ESM bundling conflicts (jwks-rsa/jose).
 */
export async function verifyFirebaseIdTokenLightweight(
  token: string,
  expectedProjectId?: string
): Promise<DecodedFirebaseToken> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Decode and validate header
  let header: { alg?: string; kid?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch {
    throw new Error("Failed to parse JWT header");
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("JWT must be RS256 signed with a valid key ID (kid)");
  }

  // 2. Decode and validate payload claims
  let payload: {
    iss?: string;
    aud?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    [key: string]: unknown;
  };
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new Error("Failed to parse JWT payload");
  }

  const nowSec = Math.floor(Date.now() / 1000);

  // Check expiration (allow 5 min clock skew)
  if (!payload.exp || payload.exp < nowSec - 300) {
    throw new Error("Firebase ID token has expired");
  }

  // Check issued at (allow 5 min future clock skew)
  if (!payload.iat || payload.iat > nowSec + 300) {
    throw new Error("Firebase ID token issued in the future");
  }

  // Check sub (UID)
  if (!payload.sub || typeof payload.sub !== "string" || payload.sub.trim() === "") {
    throw new Error("Firebase ID token has no subject (uid)");
  }

  // Check Project ID / Audience
  const targetProject =
    expectedProjectId ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (targetProject) {
    if (payload.aud !== targetProject) {
      throw new Error(`Firebase ID token audience mismatch: expected ${targetProject}, got ${payload.aud}`);
    }
    const expectedIssuer = `https://securetoken.google.com/${targetProject}`;
    if (payload.iss !== expectedIssuer) {
      throw new Error(`Firebase ID token issuer mismatch: expected ${expectedIssuer}, got ${payload.iss}`);
    }
  }

  // 3. Fetch Google public certificate and verify RS256 signature
  let certs = await getGoogleCertificates();
  let cert = certs[header.kid];

  if (!cert) {
    // Retry once by invalidating cache in case of Google key rotation
    cachedCertificates = null;
    certs = await getGoogleCertificates();
    cert = certs[header.kid];
  }

  if (!cert) {
    throw new Error(`Public key for kid "${header.kid}" not found in Google certificates`);
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);

  const signature = Buffer.from(
    signatureB64.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );

  const isValid = verifier.verify(cert, signature);
  if (!isValid) {
    throw new Error("Firebase ID token signature verification failed");
  }

  return {
    ...payload,
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
  };
}
