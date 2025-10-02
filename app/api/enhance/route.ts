import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // Get the authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get request body
    const { currentContent, draftId } = await req.json();

    if (!currentContent || !draftId) {
      return NextResponse.json(
        { error: 'Missing required fields: currentContent and draftId' },
        { status: 400 }
      );
    }

    // Fetch user profile and draft settings
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Fetch draft to get original wizard settings
    const draftDoc = await adminDb.collection('drafts').doc(draftId).get();
    const draftData = draftDoc.data();

    if (!draftData || draftData.userId !== userId) {
      return NextResponse.json(
        { error: 'Draft not found or access denied' },
        { status: 404 }
      );
    }

    const profile = userData.profile || {};
    const wizardSettings = draftData.wizardSettings || {};
    const accountType = profile.accountType || 'private';
    const isCompany = accountType === 'company';

    // Build profile context based on account type
    const profileContext = isCompany
      ? `**Company Profile Context:**
- Company Name: ${profile.companyName || 'Not specified'}
- Industry: ${profile.companyIndustry || 'Not specified'}
- Company Background: ${profile.background || 'Not specified'}
- Expertise: ${Array.isArray(profile.expertise) ? profile.expertise.join(', ') : 'Not specified'}
- Target Audience: ${profile.targetAudience || 'Not specified'}
- Company Goals: ${profile.goals || 'Not specified'}
- Writing Style: ${profile.writingStyle || 'Not specified'}
- Brand Voice: ${profile.brandVoice || 'Not specified'}`
      : `**User Profile Context:**
- Background: ${profile.background || 'Not specified'}
- Expertise: ${Array.isArray(profile.expertise) ? profile.expertise.join(', ') : 'Not specified'}
- Target Audience: ${profile.targetAudience || 'Not specified'}
- Goals: ${profile.goals || 'Not specified'}
- Writing Style: ${profile.writingStyle || 'Not specified'}
- Brand Voice: ${profile.brandVoice || 'Not specified'}`;

    const voiceNote = isCompany
      ? 'This content is for a company account. Use first-person plural ("we", "our", "us") and emphasize team/company perspective, achievements, and brand voice.'
      : 'This content is for a personal/private account. Use first-person ("I", "my", "me") and emphasize personal perspective, individual experiences, and authentic voice.';

    // Build enhancement system prompt
    const systemPrompt = `You are an expert LinkedIn content strategist and copywriter. Your task is to enhance existing LinkedIn content while maintaining the core message and ${isCompany ? "the company's brand" : "the user's authentic"} voice.

${profileContext}

**Account Type Note:**
${voiceNote}

**Original Content Settings:**
- Tone: ${wizardSettings.tone || 'Not specified'}
- Purpose: ${wizardSettings.purpose || 'Not specified'}
- Target Audience: ${wizardSettings.audience || 'Not specified'}
- Post Style: ${wizardSettings.style || 'Not specified'}
- Post Length: ${wizardSettings.length || 'Not specified'}
- Include CTA: ${wizardSettings.includeCTA ? 'Yes' : 'No'}
- Emoji Usage: ${wizardSettings.emojiUsage || 'Not specified'}
- Language: ${draftData.language === 'no' ? 'Norwegian' : 'English'}

**Enhancement Guidelines:**
1. **Preserve Core Message**: Keep the main idea and key points intact
2. **Improve Clarity**: Make the message more concise and easier to understand
3. **Enhance Engagement**: Strengthen hooks, storytelling, and emotional resonance
4. **Optimize Structure**: Improve flow, paragraph breaks, and readability
5. **Refine Language**: Remove redundancy, strengthen verbs, eliminate jargon
6. **Maintain Voice**: Keep the ${isCompany ? "company's brand" : "user's authentic personal"} voice and perspective (${isCompany ? "we/our/us" : "I/my/me"})
7. **Respect Settings**: Honor the original tone, purpose, style, and preferences
8. **LinkedIn Best Practices**: Apply proven engagement techniques (hooks, white space, CTA)

**What NOT to do:**
- Don't change the fundamental topic or message
- Don't add corporate jargon or clichés
- Don't make it sound robotic or overly formal (unless tone is "Professional")
- Don't add emojis if usage was "None"
- Don't exceed the original length category significantly
- Don't change the language
- Don't switch perspective (keep ${isCompany ? "company voice (we/our)" : "personal voice (I/my)"})

Return ONLY the enhanced content, with no preamble or explanation.`;

    const userMessage = `Please enhance the following LinkedIn post while maintaining its core message and the user's authentic voice:

${currentContent}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract generated content
    const enhancedContent = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    if (!enhancedContent) {
      return NextResponse.json(
        { error: 'Failed to generate enhanced content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enhancedContent,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });

  } catch (error: unknown) {
    console.error('Enhance API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to enhance content', details: errorMessage },
      { status: 500 }
    );
  }
}
