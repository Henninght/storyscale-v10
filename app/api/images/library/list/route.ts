import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const imagesRef = db.collection('library_images');
    const query = imagesRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
    const snapshot = await query.get();

    const images = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error('Library list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch library images',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
