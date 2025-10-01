import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function initializeFirebaseAdmin(): App {
  if (!getApps().length) {
    // Only initialize if we have the required environment variables
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set");
    }

    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
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
