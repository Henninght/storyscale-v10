import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminStorage } from "@/lib/firebase-admin";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, draftId, prompt, size = "1024x1024", quality = "standard" } = body;

    if (!userId || !draftId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, draftId, or prompt' },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Valid options: ${validSizes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate quality
    const validQualities = ["standard", "hd"];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: `Invalid quality. Valid options: ${validQualities.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('🎨 Generating image with DALL-E 3...');
    console.log('Prompt:', prompt);
    console.log('Size:', size);
    console.log('Quality:', quality);

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: quality as "standard" | "hd",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    console.log('✅ Image generated successfully');

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Generate unique image ID
    const imageId = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const storagePath = `users/${userId}/draft-images/${imageId}.png`;

    // Upload to Firebase Storage using Admin SDK
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);

    await file.save(imageBuffer, {
      contentType: 'image/png',
      metadata: {
        metadata: {
          generatedByAI: 'true',
          prompt: prompt,
        }
      }
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get download URL
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Create image metadata
    const imageData = {
      id: imageId,
      url,
      storagePath,
      alt: prompt.substring(0, 100), // Use prompt as alt text (truncated)
      generatedByAI: true,
      prompt: prompt,
      createdAt: new Date(),
    };

    // Update draft in Firestore using Admin SDK
    const db = getAdminDb();
    const draftRef = db.collection('drafts').doc(draftId);

    await draftRef.update({
      images: FieldValue.arrayUnion(imageData),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('✅ Image saved to Firebase Storage and Firestore');

    return NextResponse.json({
      success: true,
      image: imageData,
      message: 'Image generated successfully',
    });
  } catch (error) {
    console.error('AI image generation error:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'OpenAI API error',
          details: error.message,
          status: error.status
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
