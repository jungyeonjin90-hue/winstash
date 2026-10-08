import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

/**
 * Firebase Admin SDK Singleton for Server-Side Route Handlers
 * Used by webhooks and background jobs to safely bypass client Firestore Security Rules.
 */
function initializeFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle multiline private key formats with escaped newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  // If Service Account credentials are fully provided via environment variables
  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error("[FirebaseAdmin] Initialization error with cert:", error);
      return null;
    }
  }

  // A credential-less app only works against the local emulators or where Application Default
  // Credentials exist (GCP runtimes / GOOGLE_APPLICATION_CREDENTIALS). Anywhere else (e.g. Vercel) it
  // looks configured but every call fails with "Could not load the default credentials", so callers
  // silently lose writes (audit M-1). Leave adminDb null instead so the failure is explicit.
  const usesEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
  const hasAmbientCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE);
  if (projectId && (usesEmulator || hasAmbientCredentials)) {
    try {
      return initializeApp({ projectId });
    } catch (error) {
      console.error("[FirebaseAdmin] Default app initialization error:", error);
      return null;
    }
  }

  const message =
    "[FirebaseAdmin] Service account credentials are not configured (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Server-side quota, persistence and webhooks are unavailable.";
  if (process.env.NODE_ENV === "production") {
    console.error(message);
  } else {
    console.warn(message);
  }
  return null;
}

const adminApp = initializeFirebaseAdmin();

export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;

// firebase-admin/auth pulls in jwks-rsa -> ESM-only jose, which can throw
// ERR_REQUIRE_ESM at load time on some serverless runtimes. Load it defensively
// so a failure degrades gracefully instead of crashing every API route.
let _adminAuth: Auth | null = null;
if (adminApp) {
  try {
    const authModule = await import("firebase-admin/auth");
    _adminAuth = authModule.getAuth(adminApp);
  } catch (error) {
    console.error("[FirebaseAdmin] Failed to load firebase-admin/auth:", error);
  }
}
export const adminAuth: Auth | null = _adminAuth;

export function isFirebaseAdminConfigured(): boolean {
  return adminDb !== null;
}
