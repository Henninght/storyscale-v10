import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body = await req.json();
    const { rating, category, description, email } = body;

    // Validate required fields
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be a number between 1 and 5.' },
        { status: 400 }
      );
    }

    if (!category || !['bug', 'feature', 'design', 'other'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be bug, feature, design, or other.' },
        { status: 400 }
      );
    }

    // Get user agent and referrer for debugging context
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const referer = req.headers.get('referer') || 'Unknown';

    // Store feedback in Firestore
    const db = getFirestore();
    const feedbackRef = await db.collection('feedback').add({
      userId,
      rating,
      category,
      description: description || '',
      email: email || null,
      userAgent,
      page: referer,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      feedbackId: feedbackRef.id,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
