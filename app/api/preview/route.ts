import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { fetchMultipleUrls } from '@/lib/urlFetcher';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic';
import { buildPrompt, buildUserMessage } from '@/lib/promptBuilder';
import { getContentHash } from '@/lib/contentHash';

// Simple in-memory cache (5 minutes TTL)
const previewCache = new Map<string, { content: string; timestamp: number; hash: string }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(settings: any): string {
  return JSON.stringify({
    input: settings.input,
    tone: settings.tone,
    style: settings.style,
    length: settings.length,
    language: settings.language,
    emojiUsage: settings.emojiUsage,
    purpose: settings.purpose,
    audience: settings.audience,
    includeCTA: settings.includeCTA,
    customInstructions: settings.customInstructions,
    referenceUrls: settings.referenceUrls,
  });
}

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

    // Get user profile from Firestore (needed for consistent prompting)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const profile = userData?.profile || {};

    // Parse request body
    const body = await req.json();
    const { wizardSettings } = body;

    if (!wizardSettings || !wizardSettings.input) {
      return NextResponse.json({ error: 'Missing wizard settings' }, { status: 400 });
    }

    // Check input length
    if (wizardSettings.input.length < 50) {
      return NextResponse.json(
        { error: 'Input too short. Please add at least 50 characters.' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(wizardSettings);
    const cached = previewCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        preview: cached.content,
        hash: cached.hash,
        cached: true,
      });
    }

    // Fetch reference URL content if provided
    let referenceContent: Array<{ url: string; content: string; error?: string }> = [];
    if (wizardSettings.referenceUrls?.some((url: string) => url.trim())) {
      const validUrls = wizardSettings.referenceUrls.filter((url: string) => url.trim());
      referenceContent = await fetchMultipleUrls(validUrls);
    }

    // Build system prompt using shared module (NO recent posts, NO duplication detection for preview)
    const systemPrompt = buildPrompt(profile, wizardSettings, [], false);
    const userMessage = buildUserMessage(wizardSettings, referenceContent);

    // Call Claude API with same model as Generate for consistency
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000, // Match Generate API for consistent output length
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract generated content
    const previewContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    if (!previewContent) {
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }

    // Calculate content hash for validation
    const contentHash = getContentHash({
      input: wizardSettings.input,
      settings: {
        tone: wizardSettings.tone,
        style: wizardSettings.style,
        length: wizardSettings.length,
        language: wizardSettings.language,
        purpose: wizardSettings.purpose,
        audience: wizardSettings.audience,
        emojiUsage: wizardSettings.emojiUsage,
        includeCTA: wizardSettings.includeCTA,
        customInstructions: wizardSettings.customInstructions,
      },
      referenceContent,
    });

    // Cache the result with hash
    previewCache.set(cacheKey, {
      content: previewContent,
      timestamp: Date.now(),
      hash: contentHash,
    });

    // Clean old cache entries (basic cleanup)
    if (previewCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of previewCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          previewCache.delete(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      preview: previewContent,
      hash: contentHash,
      cached: false,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Ensure this route runs server-side only and is not pre-rendered
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
