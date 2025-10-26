import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { fetchMultipleUrls } from '@/lib/urlFetcher';
import Anthropic from '@anthropic-ai/sdk';

// Use Haiku for fast, cheap previews
const PREVIEW_MODEL = 'claude-3-5-haiku-20241022';

// Lazy initialization to avoid build-time errors
function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Simple in-memory cache (5 minutes TTL)
const previewCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(settings: any): string {
  return JSON.stringify({
    input: settings.input,
    tone: settings.tone,
    style: settings.style,
    length: settings.length,
    language: settings.language,
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
        cached: true,
      });
    }

    // Fetch reference URL content if provided
    let referenceContent: Array<{ url: string; content: string; error?: string }> = [];
    if (wizardSettings.referenceUrls?.some((url: string) => url.trim())) {
      const validUrls = wizardSettings.referenceUrls.filter((url: string) => url.trim());
      referenceContent = await fetchMultipleUrls(validUrls);
    }

    // Build simplified preview prompt
    const systemPrompt = buildPreviewPrompt(wizardSettings);
    const userMessage = buildPreviewUserMessage(wizardSettings, referenceContent);

    // Call Claude API with Haiku (fast & cheap)
    const anthropic = getAnthropic();
    const message = await anthropic.messages.create({
      model: PREVIEW_MODEL,
      max_tokens: 400, // Shorter for preview
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

    // Cache the result
    previewCache.set(cacheKey, {
      content: previewContent,
      timestamp: Date.now(),
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

function buildPreviewPrompt(wizardSettings: any): string {
  const toneDescriptions: Record<string, string> = {
    professional: 'professional and authoritative',
    casual: 'conversational and approachable',
    inspirational: 'motivating and uplifting',
    educational: 'informative and clear',
  };

  const styleDescriptions: Record<string, string> = {
    'story-based': 'Use storytelling with a clear narrative arc',
    list_format: 'Structure as a numbered or bulleted list',
    'question-based': 'Open with a compelling question to hook readers',
    'how-to': 'Provide step-by-step guidance or instructions',
  };

  const lengthDescriptions: Record<string, string> = {
    short: '50-150 words',
    medium: '150-300 words',
    long: '300-500 words',
  };

  const emojiGuidelines: Record<string, string> = {
    none: 'Do not use any emojis.',
    minimal: 'Use 1-2 relevant emojis sparingly to enhance key points.',
    moderate: 'Use 3-5 emojis strategically throughout the post for engagement.',
  };

  return `You are an expert LinkedIn content writer creating a PREVIEW of a post.

**Post Requirements:**
- Tone: ${toneDescriptions[wizardSettings.tone] || wizardSettings.tone}
- Style: ${styleDescriptions[wizardSettings.style] || wizardSettings.style}
- Length: ${lengthDescriptions[wizardSettings.length] || wizardSettings.length}
- Language: ${wizardSettings.language === 'en' ? 'English' : 'Norwegian'}
- Emojis: ${emojiGuidelines[wizardSettings.emojiUsage || 'minimal']}

**Critical Rules:**
1. Write like a human, not a corporate robot
2. Avoid AI clichés like "delve into", "game-changer", "unlock", etc.
3. Use specific examples over vague generalizations
4. Hook the reader in the first line
5. Format for LinkedIn readability - use line breaks
6. This is a PREVIEW - show the general direction and tone
7. IMPORTANT: Follow the emoji usage guideline exactly

**ANTI-HALLUCINATION:**
⚠️ NEVER invent statistics, numbers, percentages, or facts
⚠️ If reference content is provided, use ONLY data from it
⚠️ Better to be general and accurate than specific and wrong

Generate ONLY the post content. No meta-commentary.`;
}

function buildPreviewUserMessage(
  wizardSettings: any,
  referenceContent: Array<{ url: string; content: string; error?: string }> = []
): string {
  let message = `Create a LinkedIn post preview based on this input:\n\n${wizardSettings.input}`;

  // Add fetched reference content
  if (referenceContent.length > 0) {
    message += `\n\n**REFERENCE CONTENT:**\n`;

    referenceContent.forEach((ref, index) => {
      if (ref.error) {
        message += `\n[Reference ${index + 1}] ${ref.url}\nError: ${ref.error}\n`;
      } else {
        // Truncate reference content for preview (first 500 chars)
        const truncated = ref.content.slice(0, 500);
        message += `\n[Reference ${index + 1}] ${ref.url}\nContent:\n${truncated}...\n`;
      }
    });
  }

  // Add custom instructions if provided
  if (wizardSettings.customInstructions?.trim()) {
    message += `\n\n**CUSTOM INSTRUCTIONS:**\n${wizardSettings.customInstructions.trim()}\n`;
  }

  return message;
}

// Ensure this route runs server-side only and is not pre-rendered
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
