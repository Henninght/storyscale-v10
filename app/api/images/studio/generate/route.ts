import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminStorage, getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Smart prompt builder based on style and sub-style
function buildPrompt(style: string, subStyle: string, additionalDetails: string): string {
  const stylePrompts: Record<string, Record<string, string>> = {
    artistic: {
      'Modern': 'Create a modern artistic image with clean lines, contemporary style, bold colors',
      'Classical': 'Create a classical artistic image inspired by traditional art, refined composition',
      'Abstract': 'Create an abstract artistic image with geometric shapes, creative interpretation',
      'Vibrant': 'Create a vibrant artistic image with bright, energetic colors, dynamic composition',
    },
    infographic: {
      'Data Chart': 'Create a professional infographic showing data charts and statistics, clean design, business-appropriate',
      'Process Flow': 'Create a professional infographic showing a process flow diagram, clear steps, modern design',
      'Comparison': 'Create a professional infographic showing a comparison layout, side-by-side elements, clear structure',
      'Timeline': 'Create a professional infographic showing a timeline, chronological flow, modern design',
    },
    photo: {
      'Portrait': 'Create a professional photograph showing a portrait, high-quality photography, professional lighting',
      'Landscape': 'Create a professional landscape photograph, wide-angle view, natural lighting, high quality',
      'Product': 'Create a professional product photograph, clean background, studio lighting, commercial quality',
      'Office': 'Create a professional office photograph, modern workspace, natural lighting, business setting',
    },
    illustration: {
      'Line Art': 'Create a line art illustration with clean, minimalist lines, simple and elegant',
      'Cartoon': 'Create a cartoon-style illustration, friendly and approachable, colorful',
      'Technical': 'Create a technical illustration with precise details, diagram-like quality, professional',
      'Hand-drawn': 'Create a hand-drawn illustration with natural, sketch-like quality, artistic feel',
    },
  };

  const basePrompt = stylePrompts[style]?.[subStyle] || 'Create a professional image';
  const fullPrompt = additionalDetails
    ? `${basePrompt}. ${additionalDetails}. Suitable for LinkedIn post.`
    : `${basePrompt}, suitable for LinkedIn post.`;

  return fullPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, style, subStyle, additionalDetails = '', size = '1024x1024', quality = 'standard' } = body;

    if (!userId || !style || !subStyle) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, style, or subStyle' },
        { status: 400 }
      );
    }

    // Build smart prompt
    const prompt = buildPrompt(style, subStyle, additionalDetails);

    console.log('🎨 Generating studio image with DALL-E 3...');
    console.log('Style:', style);
    console.log('Sub-style:', subStyle);
    console.log('Generated prompt:', prompt);

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
    const imageId = `studio-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const storagePath = `users/${userId}/library-images/${imageId}.png`;

    // Upload to Firebase Storage
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);

    await file.save(imageBuffer, {
      contentType: 'image/png',
      metadata: {
        metadata: {
          generatedByAI: 'true',
          style,
          subStyle,
          prompt: prompt,
        }
      }
    });

    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Save to library_images collection
    const db = getAdminDb();
    const libraryImagesRef = db.collection('library_images');

    const imageData = {
      userId,
      url,
      storagePath,
      style,
      subStyle,
      prompt,
      attachedToDrafts: [],
      attachedToCampaigns: [],
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await libraryImagesRef.add(imageData);

    console.log('✅ Image saved to library');

    return NextResponse.json({
      success: true,
      image: {
        id: docRef.id,
        ...imageData,
        createdAt: new Date(),
      },
      message: 'Image generated and saved to library',
    });
  } catch (error) {
    console.error('Studio image generation error:', error);

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
