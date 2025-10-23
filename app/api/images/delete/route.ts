import { NextRequest, NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, draftId, imageId, storagePath, isLibraryImage } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // For library images, require storagePath instead of draftId
    if (isLibraryImage && (!imageId || !storagePath)) {
      return NextResponse.json(
        { error: 'Missing required fields for library image: imageId or storagePath' },
        { status: 400 }
      );
    }

    // For draft images, require draftId and imageId
    if (!isLibraryImage && (!draftId || !imageId)) {
      return NextResponse.json(
        { error: 'Missing required fields: draftId or imageId' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const storage = getAdminStorage();
    const bucket = storage.bucket();

    if (isLibraryImage) {
      // Delete library image
      const libraryImageRef = db.collection('library_images').doc(imageId);
      const libraryImageDoc = await libraryImageRef.get();

      if (!libraryImageDoc.exists) {
        return NextResponse.json(
          { error: 'Library image not found' },
          { status: 404 }
        );
      }

      const libraryImageData = libraryImageDoc.data()!;

      // Verify ownership
      if (libraryImageData.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not own this image' },
          { status: 403 }
        );
      }

      // Delete from Firebase Storage
      const file = bucket.file(storagePath);
      try {
        await file.delete();
        console.log('✅ Library image deleted from Firebase Storage:', storagePath);
      } catch (storageError: any) {
        if (storageError.code === 404) {
          console.warn('⚠️ Image not found in storage (may have been already deleted):', storagePath);
        } else {
          throw storageError;
        }
      }

      // Delete from library collection
      await libraryImageRef.delete();
      console.log('✅ Library image removed from Firestore');

    } else {
      // Delete draft image (original functionality)
      const draftRef = db.collection('drafts').doc(draftId!);
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

      // Delete from Firebase Storage
      const file = bucket.file(imageToDelete.storagePath);
      try {
        await file.delete();
        console.log('✅ Image deleted from Firebase Storage:', imageToDelete.storagePath);
      } catch (storageError: any) {
        if (storageError.code === 404) {
          console.warn('⚠️ Image not found in storage (may have been already deleted):', imageToDelete.storagePath);
        } else {
          throw storageError;
        }
      }

      // Remove from Firestore draft
      await draftRef.update({
        images: FieldValue.arrayRemove(imageToDelete),
      });

      console.log('✅ Image removed from draft in Firestore');
    }

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
