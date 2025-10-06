import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function formatPrivateKey(key: string): string {
  // Handle different formats of private keys from environment variables
  // Vercel may store the key with literal \n or with actual newlines

  let formattedKey = key;

  // Check if key has literal \n strings (not actual newlines)
  // This checks for the two-character sequence: backslash followed by 'n'
  if (!key.includes('\n') && key.includes('\\n')) {
    // Replace literal \n with actual newlines
    formattedKey = key.replace(/\\n/g, '\n');
  }

  // Validate that it looks like a PEM key after formatting
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
