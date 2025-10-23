import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, imageId, draftId, campaignId, action } = body;

    if (!userId || !imageId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, imageId, or action' },
        { status: 400 }
      );
    }

    if (!draftId && !campaignId) {
      return NextResponse.json(
        { error: 'Must provide either draftId or campaignId' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const imageRef = db.collection('library_images').doc(imageId);
    const imageDoc = await imageRef.get();

    if (!imageDoc.exists) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const imageData = imageDoc.data()!;

    // Verify ownership
    if (imageData.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not own this image' },
        { status: 403 }
      );
    }

    // Update attachment arrays
    const updateData: any = {};

    if (action === 'attach') {
      if (draftId) {
        updateData.attachedToDrafts = FieldValue.arrayUnion(draftId);
      }
      if (campaignId) {
        updateData.attachedToCampaigns = FieldValue.arrayUnion(campaignId);
      }
    } else if (action === 'detach') {
      if (draftId) {
        updateData.attachedToDrafts = FieldValue.arrayRemove(draftId);
      }
      if (campaignId) {
        updateData.attachedToCampaigns = FieldValue.arrayRemove(campaignId);
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "attach" or "detach"' },
        { status: 400 }
      );
    }

    await imageRef.update(updateData);

    console.log(`✅ Image ${action === 'attach' ? 'attached to' : 'detached from'} ${draftId ? 'draft' : 'campaign'}`);

    return NextResponse.json({
      success: true,
      message: `Image ${action === 'attach' ? 'attached' : 'detached'} successfully`,
    });
  } catch (error) {
    console.error('Library tag error:', error);
    return NextResponse.json(
      {
        error: 'Failed to tag image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
