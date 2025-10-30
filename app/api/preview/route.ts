import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { fetchMultipleUrls } from '@/lib/urlFetcher';
import Anthropic from '@anthropic-ai/sdk';

// Use same model as generate for consistency (95%+ preview/draft match)
const PREVIEW_MODEL = 'claude-sonnet-4-20250514';

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
      max_tokens: 800, // Match expected preview length
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
    warm_friendly: 'warm and friendly for genuine connection-building',
    inspirational: 'motivating and uplifting',
    educational: 'informative and clear',
  };

  const purposeDescriptions: Record<string, string> = {
    engagement: 'encourage discussion and interaction',
    lead_generation: 'attract potential clients and showcase expertise',
    brand_awareness: 'build visibility and establish presence',
    thought_leadership: 'demonstrate expertise and unique insights',
    network_building: 'build genuine connections and expand network',
    personal_sharing: 'share life updates and personal moments authentically',
  };

  const styleDescriptions: Record<string, string> = {
    direct: 'Direct and conversational—straight to the point, 2-4 sentences, no buildup',
    'story-based': 'Use storytelling with a clear narrative arc',
    list_format: 'Structure as a numbered or bulleted list',
    'question-based': 'Open with a compelling question to hook readers',
    'how-to': 'Provide step-by-step guidance or instructions',
  };

  const lengthDescriptions: Record<string, string> = {
    very_short: '30-60 words (2-4 sentences)',
    short: '50-150 words',
    medium: '150-300 words',
    long: '300-500 words',
  };

  const emojiGuidelines: Record<string, string> = {
    none: 'Do not use any emojis.',
    minimal: 'Use 1-2 relevant emojis sparingly.',
    moderate: 'Use 3-5 emojis to enhance readability and engagement.',
  };

  // Norwegian-specific guidelines for preview consistency
  const norwegianGuidelines = wizardSettings.language === 'no' ? `

**NORWEGIAN WRITING GUIDELINES (2025):**
- ❌ Avoid "Siden" (weak opener) → Use "Da" or state directly
- ❌ Eliminate "men" mid-sentence → Use periods, restart positive
- ✅ Positive framing: Replace "ikke" with affirmative language
- ✅ White space: "leseren får tid til å puste" (give reader breathing room)
- ✅ Authentic 2025 tone: Genuine over polished, vulnerable over perfect
- ✅ Direct but polite: Norwegian business culture values straightforwardness
- ✅ Open questions for engagement (algorithm rewards 15+ word comments)
- ✅ 3-5 hashtags maximum
` : '';

  return `You are an expert LinkedIn content writer creating a PREVIEW of a post.

**Post Requirements:**
- Tone: ${toneDescriptions[wizardSettings.tone] || wizardSettings.tone}
- Purpose: ${purposeDescriptions[wizardSettings.purpose] || wizardSettings.purpose}
- Target Audience: ${wizardSettings.audience}
- Style: ${styleDescriptions[wizardSettings.style] || wizardSettings.style}
- Length: ${lengthDescriptions[wizardSettings.length] || wizardSettings.length}
- Language: ${wizardSettings.language === 'en' ? 'English' : 'Norwegian'}
- Call-to-Action: ${wizardSettings.includeCTA ? 'Include a compelling CTA that encourages engagement' : 'Do not include a CTA'}
- Emojis: ${emojiGuidelines[wizardSettings.emojiUsage || 'minimal']}
${norwegianGuidelines}
**Critical Writing Rules:**
1. Write like a human, not a corporate robot
2. Avoid AI clichés and overused phrases like "delve into", "in today's digital age", "game-changer", "unlock", etc.
3. Use specific, concrete examples over vague generalizations
4. Keep sentences varied in length - mix short punchy ones with longer explanatory ones
5. Start strong - hook the reader in the first line
6. Be authentic and relatable, not salesy or promotional
7. Format for readability on LinkedIn - use line breaks, not walls of text
8. Avoid corporate jargon - write like you're talking to a colleague
9. End with substance, not empty platitudes
10. IMPORTANT: Follow the emoji usage guideline exactly

**2025 ENGAGEMENT TACTICS:**
- Personal stories = 4.2x more comments than pure advice
- Questions in first line = 2.8x more replies
- Posts under 150 words = 35% higher read rate
- Vulnerability beats credentials (2x engagement)
- Dwell time matters: Keep readers engaged longer

**ANTI-HALLUCINATION RULES (CRITICAL):**
⚠️ NEVER invent, estimate, or make up statistics, numbers, percentages, dates, or facts
⚠️ If reference content is provided, use ONLY the specific data contained within it
⚠️ If you don't have verified data for a claim, rephrase to avoid requiring specific numbers
⚠️ Better to be general and accurate than specific and wrong
⚠️ When in doubt, focus on qualitative insights rather than quantitative claims

**IMPORTANT:** This preview should match the final draft at 95%+ accuracy. Write the actual post content, not a sketch.

Generate ONLY the post content. Do not include any meta-commentary, explanations, or labels.`;
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
