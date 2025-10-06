import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function formatPrivateKey(key: string): string {
  // Handle different formats of private keys from environment variables
  // 1. If key already has real newlines, use as-is
  // 2. If key has literal \n strings, replace them
  // 3. Validate PEM format

  let formattedKey = key;

  // If the key contains literal \n (not actual newlines), replace them
  if (key.includes('\\n')) {
    formattedKey = key.replace(/\\n/g, '\n');
  }

  // Validate that it looks like a PEM key
  if (!formattedKey.includes('BEGIN PRIVATE KEY') || !formattedKey.includes('END PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_ADMIN_PRIVATE_KEY is not in valid PEM format. ' +
      'Expected format: -----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----'
    );
  }

  return formattedKey;
}

function initializeFirebaseAdmin(): App {
  if (!getApps().length) {
    // Only initialize if we have the required environment variables
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set");
    }

    try {
      const privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw error;
    }
  }
  return getApps()[0];
}

// Lazy getters to avoid initialization during build
export function getAdminAuth(): Auth {
  const app = initializeFirebaseAdmin();
  return getAuth(app);
}

export function getAdminDb(): Firestore {
  const app = initializeFirebaseAdmin();
  return getFirestore(app);
}

// Maintain backward compatibility
export const adminAuth = new Proxy({} as Auth, {
  get: (target, prop) => {
    return getAdminAuth()[prop as keyof Auth];
  }
});

export const adminDb = new Proxy({} as Firestore, {
  get: (target, prop) => {
    return getAdminDb()[prop as keyof Firestore];
  }
});
