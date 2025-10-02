import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    // Parse request body
    const body = await req.json();
    const { wizardSettings } = body;

    if (!wizardSettings) {
      return NextResponse.json({ error: 'Missing wizard settings' }, { status: 400 });
    }

    // Get user profile from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const profile = userData?.profile || {};
    const subscription = userData?.subscription || { tier: 'free' };
    const postsUsedThisMonth = userData?.postsUsedThisMonth || 0;

    // Check if trial has expired
    if (subscription.tier === 'trial' && subscription.trialEndDate) {
      const trialEndDate = subscription.trialEndDate.toDate ? subscription.trialEndDate.toDate() : new Date(subscription.trialEndDate);
      if (new Date() > trialEndDate) {
        // Trial expired, revert to free tier
        await adminDb.collection('users').doc(userId).update({
          'subscription.tier': 'free',
        });
        subscription.tier = 'free';
      }
    }

    // Check usage limits
    const limits = {
      free: 5,
      trial: 50,
      pro: 50,
      enterprise: Infinity,
    };

    const limit = limits[subscription.tier as keyof typeof limits] || 5;

    if (postsUsedThisMonth >= limit) {
      return NextResponse.json(
        { error: 'Monthly post limit reached. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Build system prompt with user profile
    const systemPrompt = buildSystemPrompt(profile, wizardSettings);

    // Build user message
    const userMessage = buildUserMessage(wizardSettings);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract generated content
    const generatedContent =
      message.content[0].type === 'text' ? message.content[0].text : '';

    if (!generatedContent) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    // Create draft in Firestore
    const draftRef = adminDb.collection('drafts').doc();
    const now = new Date();

    await draftRef.set({
      userId,
      content: generatedContent,
      status: 'in_progress',
      language: wizardSettings.language,
      tags: [],
      scheduledDate: null,
      wizardSettings,
      campaignId: wizardSettings.campaignId || null,
      createdAt: now,
      updatedAt: now,
    });

    // If this is part of a campaign, increment campaign post count
    if (wizardSettings.campaignId) {
      const campaignRef = adminDb.collection('campaigns').doc(wizardSettings.campaignId);
      const campaignDoc = await campaignRef.get();

      if (campaignDoc.exists) {
        const currentCount = campaignDoc.data()?.postsGenerated || 0;
        await campaignRef.update({
          postsGenerated: currentCount + 1,
          updatedAt: now,
        });
      }
    }

    // Increment usage counter
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        postsUsedThisMonth: postsUsedThisMonth + 1,
      });

    return NextResponse.json({
      success: true,
      draftId: draftRef.id,
      content: generatedContent,
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(profile: any, wizardSettings: any): string {
  const toneDescriptions: Record<string, string> = {
    professional: 'professional and authoritative',
    casual: 'conversational and approachable',
    inspirational: 'motivating and uplifting',
    educational: 'informative and clear',
  };

  const purposeDescriptions: Record<string, string> = {
    engagement: 'encourage discussion and interaction',
    lead_generation: 'attract potential clients and showcase expertise',
    brand_awareness: 'build visibility and establish presence',
    thought_leadership: 'demonstrate expertise and unique insights',
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
    minimal: 'Use 1-2 relevant emojis sparingly.',
    moderate: 'Use 3-5 emojis to enhance readability and engagement.',
  };

  const accountType = profile.accountType || 'private';
  const isCompany = accountType === 'company';

  // Build profile context based on account type
  const profileContext = isCompany
    ? `**Company Profile:**
- Company Name: ${profile.companyName || 'Not specified'}
- Industry: ${profile.companyIndustry || 'Not specified'}
- Company Background: ${profile.background || 'Company background not specified'}
- Areas of Expertise: ${profile.expertise?.join(', ') || 'Not specified'}
- Target Audience: ${profile.targetAudience || 'Professionals'}
- Company Goals: ${profile.goals || 'Not specified'}
- Writing Style: ${profile.writingStyle || 'Professional'}
- Brand Voice: ${profile.brandVoice || 'Professional and authentic'}`
    : `**User Profile:**
- Background: ${profile.background || 'Professional background not specified'}
- Expertise: ${profile.expertise?.join(', ') || 'Not specified'}
- Target Audience: ${profile.targetAudience || 'Professionals'}
- Goals: ${profile.goals || 'Not specified'}
- Writing Style: ${profile.writingStyle || 'Professional'}
- Brand Voice: ${profile.brandVoice || 'Authentic and professional'}`;

  // Voice and perspective guidelines based on account type
  const voiceGuidelines = isCompany
    ? `**Company Voice Guidelines:**
1. Use first-person plural ("we", "our", "us") to represent the company
2. Emphasize team achievements and collective expertise
3. Maintain brand consistency throughout the post
4. Showcase company values, culture, and capabilities
5. Focus on how the company helps clients/customers
6. Share company insights, not individual personal stories
7. Keep the tone professional yet approachable
8. Highlight company achievements as team efforts`
    : `**Personal Voice Guidelines:**
1. Use first-person ("I", "my", "me") for authentic personal perspective
2. Share individual experiences and personal insights
3. Emphasize your unique expertise and perspective
4. Tell personal stories and lessons learned
5. Build your personal brand and thought leadership
6. Connect on a human level with your audience
7. Show vulnerability and authenticity when appropriate
8. Highlight your individual achievements and growth`;

  return `You are an expert LinkedIn content writer creating posts for a ${isCompany ? 'company' : 'professional individual'}.

${profileContext}

**Post Requirements:**
- Tone: ${toneDescriptions[wizardSettings.tone] || wizardSettings.tone}
- Purpose: ${purposeDescriptions[wizardSettings.purpose] || wizardSettings.purpose}
- Target Audience: ${wizardSettings.audience}
- Style: ${styleDescriptions[wizardSettings.style] || wizardSettings.style}
- Length: ${lengthDescriptions[wizardSettings.length] || wizardSettings.length}
- Language: ${wizardSettings.language === 'en' ? 'English' : 'Norwegian'}
- Call-to-Action: ${wizardSettings.includeCTA ? 'Include a compelling CTA that encourages engagement' : 'Do not include a CTA'}
- Emojis: ${emojiGuidelines[wizardSettings.emojiUsage]}

${voiceGuidelines}

**Critical Writing Rules:**
1. Write like a human, not a corporate robot
2. Avoid AI clichés and overused phrases like "delve into", "in today's digital age", "game-changer", "unlock", etc.
3. Use specific, concrete examples over vague generalizations
4. Keep sentences varied in length - mix short punchy ones with longer explanatory ones
5. Start strong - hook the reader in the first line
6. Be authentic and relatable, not salesy or promotional
7. Format for readability on LinkedIn - use line breaks, not walls of text
8. If telling a story, make it ${isCompany ? 'about the company or team' : 'personal and specific'}
9. Avoid corporate jargon - write like you're talking to a colleague
10. End with substance, not empty platitudes

Generate ONLY the post content. Do not include any meta-commentary, explanations, or labels.`;
}

function buildUserMessage(wizardSettings: any): string {
  let message = `Create a LinkedIn post based on this input:\n\n${wizardSettings.input}`;

  if (wizardSettings.referenceUrls?.some((url: string) => url.trim())) {
    const validUrls = wizardSettings.referenceUrls.filter((url: string) => url.trim());
    message += `\n\nReference URLs for additional context:\n${validUrls.join('\n')}`;
  }

  if (wizardSettings.campaignId) {
    message += `\n\nThis is post ${wizardSettings.postNumber || 1} in a campaign series about: ${wizardSettings.campaignTheme}`;

    if (wizardSettings.previousContent) {
      message += `\n\nPrevious post for context (maintain continuity but don't repeat):\n${wizardSettings.previousContent}`;
    }
  }

  return message;
}
