import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify Firebase Admin configuration
 * DO NOT EXPOSE THIS IN PRODUCTION - Remove after testing
 */
export async function GET(req: NextRequest) {
  try {
    // Check for required environment variables
    const checks = {
      FIREBASE_ADMIN_PROJECT_ID: {
        exists: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        value: process.env.FIREBASE_ADMIN_PROJECT_ID || 'MISSING',
        expected: 'storyscale-45a2d',
        matches: process.env.FIREBASE_ADMIN_PROJECT_ID === 'storyscale-45a2d',
      },
      FIREBASE_ADMIN_CLIENT_EMAIL: {
        exists: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        value: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'MISSING',
        expected: 'firebase-adminsdk-fbsvc@storyscale-45a2d.iam.gserviceaccount.com',
        matches: process.env.FIREBASE_ADMIN_CLIENT_EMAIL === 'firebase-adminsdk-fbsvc@storyscale-45a2d.iam.gserviceaccount.com',
      },
      FIREBASE_ADMIN_PRIVATE_KEY_BASE64: {
        exists: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64,
        value: process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64 ?
          `${process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64.substring(0, 20)}...` : 'MISSING',
        expected: 'Base64-encoded private key',
        length: process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64?.length || 0,
        canDecode: false,
      },
      ANTHROPIC_API_KEY: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        value: process.env.ANTHROPIC_API_KEY ?
          `${process.env.ANTHROPIC_API_KEY.substring(0, 15)}...` : 'MISSING',
        expected: 'sk-ant-api03-...',
      },
    };

    // Try to decode the private key if it exists
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64) {
      try {
        const decoded = Buffer.from(
          process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64,
          'base64'
        ).toString('utf-8');
        checks.FIREBASE_ADMIN_PRIVATE_KEY_BASE64.canDecode = true;
        checks.FIREBASE_ADMIN_PRIVATE_KEY_BASE64.value =
          decoded.includes('BEGIN PRIVATE KEY') ? 'Valid PEM format detected' : 'Invalid PEM format';
      } catch (error) {
        checks.FIREBASE_ADMIN_PRIVATE_KEY_BASE64.value = `Decode error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    // Test Firebase Admin initialization
    let firebaseStatus = {
      initialized: false,
      error: null as string | null,
      firestoreTest: { success: false, error: null as string | null }
    };
    try {
      const { getAdminAuth, getAdminDb } = await import('@/lib/firebase-admin');
      const auth = getAdminAuth();
      firebaseStatus.initialized = true;

      // Test Firestore access
      try {
        const db = getAdminDb();
        const testDoc = await db.collection('users').limit(1).get();
        firebaseStatus.firestoreTest.success = true;
      } catch (firestoreError) {
        firebaseStatus.firestoreTest.error = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
      }
    } catch (error) {
      firebaseStatus.error = error instanceof Error ? error.message : String(error);
    }

    const allValid =
      checks.FIREBASE_ADMIN_PROJECT_ID.matches &&
      checks.FIREBASE_ADMIN_CLIENT_EMAIL.matches &&
      checks.FIREBASE_ADMIN_PRIVATE_KEY_BASE64.canDecode &&
      checks.ANTHROPIC_API_KEY.exists &&
      firebaseStatus.initialized;

    return NextResponse.json({
      success: allValid,
      environment: process.env.VERCEL ? 'Vercel' : 'Local',
      checks,
      firebaseStatus,
      message: allValid
        ? '✅ All environment variables are correctly configured!'
        : '⚠️ Some environment variables are missing or incorrect',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
