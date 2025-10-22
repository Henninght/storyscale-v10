import { NextRequest, NextResponse } from "next/server";
import { getAdminStorage, getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const draftId = formData.get('draftId') as string;
    const alt = formData.get('alt') as string | null;

    if (!file || !userId || !draftId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, userId, or draftId' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Generate unique image ID
    const imageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const storagePath = `users/${userId}/draft-images/${imageId}.${fileExtension}`;

    // Upload to Firebase Storage using Admin SDK
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const storageFile = bucket.file(storagePath);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await storageFile.save(buffer, {
      contentType: file.type,
      metadata: {
        metadata: {
          uploadedBy: userId,
          originalName: file.name,
        }
      }
    });

    // Make the file publicly accessible
    await storageFile.makePublic();

    // Get download URL
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Create image metadata
    const imageData = {
      id: imageId,
      url,
      storagePath,
      alt: alt || '',
      generatedByAI: false,
      createdAt: new Date(),
    };

    // Update draft in Firestore using Admin SDK
    const db = getAdminDb();
    const draftRef = db.collection('drafts').doc(draftId);

    await draftRef.update({
      images: FieldValue.arrayUnion(imageData),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      image: imageData,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
