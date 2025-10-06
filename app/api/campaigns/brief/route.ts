import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminAuth } from '@/lib/firebase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY?.trim() || '',
});

interface PostBlueprint {
  position: number;
  topic: string;
  goal: string;
}

interface CampaignBrief {
  strategicOverview: string;
  narrativeArc: string;
  postBlueprints: PostBlueprint[];
  successMarkers: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    // Parse request body
    const body = await req.json();
    const { campaignGoal, postCount, style, tone, purpose, audience } = body;

    if (!campaignGoal || !postCount) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignGoal, postCount' },
        { status: 400 }
      );
    }

    // Build system prompt
    const systemPrompt = `You are an expert marketing strategist creating LinkedIn campaign strategies.

Your task is to analyze a campaign goal and create a strategic plan with specific post topics.

Return your response as valid JSON with this structure:
{
  "strategicOverview": "3-4 sentence explanation of why this campaign will work",
  "narrativeArc": "Brief description of how posts build on each other (e.g., 'Build anticipation → Educate → Convert')",
  "postBlueprints": [
    {
      "position": 1,
      "topic": "Specific topic for this post",
      "goal": "What this post should accomplish"
    }
  ],
  "successMarkers": ["Key indicator 1", "Key indicator 2", "Key indicator 3"]
}

**Strategic Principles:**
1. Create a logical progression that builds momentum
2. Each post should have a clear, distinct purpose
3. Posts should reference/build on previous ones
4. Include variety in approach (mix of formats, angles)
5. Balance education with engagement
6. Lead with value, close with conversion

**Content Style Context:**
- Style: ${style || 'story-based'}
- Tone: ${tone || 'professional'}
- Purpose: ${purpose || 'engagement'}
- Target Audience: ${audience || 'professionals'}

Tailor the campaign strategy and post topics to resonate with this specific audience.

Generate ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

    // Build user message
    const userMessage = `Campaign Goal: ${campaignGoal}

Number of Posts: ${postCount}

Create a strategic campaign plan that achieves this goal through ${postCount} LinkedIn posts.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
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
        { error: 'Failed to generate campaign brief' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let brief: CampaignBrief;
    try {
      // Remove any markdown code blocks if present
      const cleanJson = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      brief = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      return NextResponse.json(
        { error: 'Invalid AI response format', details: generatedContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brief,
    });
  } catch (error) {
    console.error('Campaign brief API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
