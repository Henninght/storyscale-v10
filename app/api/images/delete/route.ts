import { NextRequest, NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, draftId, imageId } = body;

    if (!userId || !draftId || !imageId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, draftId, or imageId' },
        { status: 400 }
      );
    }

    // Get draft to find the image using Admin SDK
    const db = getAdminDb();
    const draftRef = db.collection('drafts').doc(draftId);
    const draftDoc = await draftRef.get();

    if (!draftDoc.exists) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    const draftData = draftDoc.data()!;
    const images = draftData.images || [];

    // Find the image to delete
    const imageToDelete = images.find((img: any) => img.id === imageId);

    if (!imageToDelete) {
      return NextResponse.json(
        { error: 'Image not found in draft' },
        { status: 404 }
      );
    }

    // Verify user owns this draft
    if (draftData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this draft' },
        { status: 403 }
      );
    }

    // Delete from Firebase Storage using Admin SDK
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(imageToDelete.storagePath);

    try {
      await file.delete();
      console.log('✅ Image deleted from Firebase Storage:', imageToDelete.storagePath);
    } catch (storageError: any) {
      // If file doesn't exist in storage, log but continue (maybe already deleted)
      if (storageError.code === 404) {
        console.warn('⚠️ Image not found in storage (may have been already deleted):', imageToDelete.storagePath);
      } else {
        throw storageError;
      }
    }

    // Remove from Firestore draft using Admin SDK
    await draftRef.update({
      images: FieldValue.arrayRemove(imageToDelete),
    });

    console.log('✅ Image removed from draft in Firestore');

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
