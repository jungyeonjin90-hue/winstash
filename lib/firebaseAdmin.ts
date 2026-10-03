import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
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
    }
  }

  // Fallback: Default initialization if projectId exists
  if (projectId) {
    try {
      return initializeApp({
        projectId,
      });
    } catch (error) {
      console.warn("[FirebaseAdmin] Default app initialization error:", error);
    }
  }

  console.warn(
    "[FirebaseAdmin] Service account credentials not configured. Server-side admin writes will be unavailable until FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set."
  );
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
