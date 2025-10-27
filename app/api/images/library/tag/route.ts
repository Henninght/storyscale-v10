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

    // Also update the Draft's images array to maintain bidirectional relationship
    if (draftId) {
      const draftRef = db.collection('drafts').doc(draftId);
      const draftDoc = await draftRef.get();

      if (!draftDoc.exists) {
        console.warn(`⚠️ Draft ${draftId} not found, skipping draft update`);
      } else {
        if (action === 'attach') {
          // Create DraftImage object to add to draft
          const draftImage = {
            id: imageId,
            url: imageData.url,
            storagePath: imageData.storagePath,
            generatedByAI: true,
            prompt: imageData.prompt || '',
            createdAt: FieldValue.serverTimestamp()
          };

          await draftRef.update({
            images: FieldValue.arrayUnion(draftImage),
            updatedAt: FieldValue.serverTimestamp()
          });

          console.log(`✅ Image added to draft.images array`);
        } else if (action === 'detach') {
          // Remove image from draft's images array
          const draftData = draftDoc.data();
          const images = draftData?.images || [];
          const updatedImages = images.filter((img: any) => img.id !== imageId);

          await draftRef.update({
            images: updatedImages,
            updatedAt: FieldValue.serverTimestamp()
          });

          console.log(`✅ Image removed from draft.images array`);
        }
      }
    }

    // Handle campaign image attachments (campaigns don't have images array, just tracking)
    if (campaignId) {
      console.log(`✅ Image ${action === 'attach' ? 'attached to' : 'detached from'} campaign ${campaignId}`);
    }

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
