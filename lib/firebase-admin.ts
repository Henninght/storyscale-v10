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

function getPrivateKey(): string {
  // Priority 1: Use base64-encoded key (Vercel-safe method)
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
    try {
      const decoded = Buffer.from(
        process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64,
        'base64'
      ).toString('utf-8');

      // Validate decoded key
      if (!decoded.includes('BEGIN PRIVATE KEY') || !decoded.includes('END PRIVATE KEY')) {
        throw new Error('Decoded base64 key is not in valid PEM format');
      }

      return decoded;
    } catch (error) {
      console.error('Failed to decode FIREBASE_ADMIN_PRIVATE_KEY_BASE64:', error);
      throw new Error(
        'FIREBASE_ADMIN_PRIVATE_KEY_BASE64 is invalid. ' +
        'Generate it with: echo "YOUR_PRIVATE_KEY" | base64'
      );
    }
  }

  // Priority 2: Fall back to regular string key
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    throw new Error(
      'Neither FIREBASE_ADMIN_PRIVATE_KEY_BASE64 nor FIREBASE_ADMIN_PRIVATE_KEY is set. ' +
      'For Vercel deployments, use FIREBASE_ADMIN_PRIVATE_KEY_BASE64 (recommended).'
    );
  }

  // Warn if using raw key in production (likely to fail on Vercel)
  if (process.env.VERCEL && !process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
    console.warn(
      '⚠️  WARNING: Using FIREBASE_ADMIN_PRIVATE_KEY on Vercel. ' +
      'This may cause "error:1E08010C:DECODER routines::unsupported". ' +
      'Strongly recommend using FIREBASE_ADMIN_PRIVATE_KEY_BASE64 instead. ' +
      'See VERCEL_DEPLOYMENT_FIX.md for instructions.'
    );
  }

  return formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
}

function initializeFirebaseAdmin(): App {
  if (!getApps().length) {
    try {
      const privateKey = getPrivateKey();

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
