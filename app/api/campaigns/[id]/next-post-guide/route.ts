import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface PostGuide {
  postGoal: string;
  connectionToPrevious: string;
  suggestedAngle: string;
  contextualTips: string[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const campaignId = params.id;

    // Parse request body
    const body = await req.json();
    const { postNumber, postTopic, previousPostTopic } = body;

    if (!postNumber || !postTopic) {
      return NextResponse.json(
        { error: 'Missing required fields: postNumber, postTopic' },
        { status: 400 }
      );
    }

    // Get campaign data
    const campaignDoc = await adminDb.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaignData = campaignDoc.data();
    if (campaignData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { theme, targetPostCount, aiStrategy } = campaignData;

    // Determine position in campaign (early/mid/late)
    let positionPhase = 'early';
    const progress = postNumber / targetPostCount;
    if (progress > 0.66) {
      positionPhase = 'late';
    } else if (progress > 0.33) {
      positionPhase = 'mid';
    }

    // Build system prompt
    const systemPrompt = `You are a marketing strategist providing guidance for creating a specific post in a LinkedIn campaign.

Return your response as valid JSON with this structure:
{
  "postGoal": "Clear, specific goal for this post (1-2 sentences)",
  "connectionToPrevious": "How this post builds on the previous one (1-2 sentences)",
  "suggestedAngle": "Recommended approach or hook (1-2 sentences)",
  "contextualTips": ["Tip 1", "Tip 2", "Tip 3"]
}

**Campaign Context:**
- Theme: ${theme}
- Post ${postNumber} of ${targetPostCount}
- Phase: ${positionPhase} stage of campaign
- Overall Strategy: ${aiStrategy?.overallApproach || 'Build engagement and convert'}

**Position Guidelines:**
- Early posts: Hook audience, establish credibility, introduce concepts
- Mid posts: Deepen understanding, provide value, build momentum
- Late posts: Drive action, reinforce key messages, create urgency

Generate ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

    // Build user message
    const userMessage = `Post ${postNumber}: ${postTopic}
${previousPostTopic ? `Previous Post: ${previousPostTopic}` : 'This is the first post in the campaign'}

Provide specific guidance for creating this post in the campaign context.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
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
      return NextResponse.json(
        { error: 'Failed to generate post guide' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let guide: PostGuide;
    try {
      const cleanJson = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      guide = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      return NextResponse.json(
        { error: 'Invalid AI response format', details: generatedContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      guide,
      postNumber,
      totalPosts: targetPostCount,
      campaignPhase: positionPhase,
    });
  } catch (error) {
    console.error('Next post guide API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
