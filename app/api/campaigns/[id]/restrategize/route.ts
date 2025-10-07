import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { anthropic } from '@/lib/anthropic';

interface PostPlan {
  position: number;
  topic: string;
  goal?: string;
  locked: boolean;
  userCustomized?: boolean;
}

interface UpdatedPost {
  position: number;
  topic: string;
  goal: string;
  reason: string;
}

interface RestrategizeResponse {
  updatedStrategy: string;
  updatedPosts: UpdatedPost[];
  impactedPositions: number[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: campaignId } = await params;

    // Parse request body
    const body = await req.json();
    const { currentPosts, userEdit, campaignGoal, campaignTheme } = body;

    if (!currentPosts || !userEdit) {
      return NextResponse.json(
        { error: 'Missing required fields: currentPosts, userEdit' },
        { status: 400 }
      );
    }

    // Verify campaign ownership
    const campaignDoc = await adminDb.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const campaignData = campaignDoc.data();
    if (campaignData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const posts = currentPosts as PostPlan[];
    const { position: editPosition, newTopic } = userEdit;

    // Build system prompt
    const systemPrompt = `You are a marketing strategist helping refine a LinkedIn campaign strategy.

The user has edited a post topic in their campaign. Your job is to adjust subsequent posts to maintain narrative flow and campaign coherence.

Return your response as valid JSON with this structure:
{
  "updatedStrategy": "Brief narrative arc description (e.g., 'Story → Build → Reveal → Convert')",
  "updatedPosts": [
    {
      "position": 4,
      "topic": "Updated topic for this post",
      "goal": "What this post should accomplish",
      "reason": "Why this was adjusted (one sentence)"
    }
  ],
  "impactedPositions": [4, 5]
}

**Strategic Rules:**
1. NEVER change locked posts (already generated/posted)
2. Maintain logical progression from the edited post
3. Keep campaign goal aligned
4. Ensure each post builds on previous ones
5. Only update posts that need adjustment
6. Preserve user customizations where possible

**Campaign Context:**
- Goal: ${campaignGoal || 'Not specified'}
- Theme: ${campaignTheme || 'Not specified'}

Generate ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

    // Build context of posts
    const postsContext = posts
      .map((p) => {
        const status = p.locked ? '[LOCKED]' : '[EDITABLE]';
        const custom = p.userCustomized ? '[USER CUSTOM]' : '[AI GENERATED]';
        return `Post ${p.position}: ${p.topic} ${status} ${custom}`;
      })
      .join('\n');

    // Build user message
    const userMessage = `Current Campaign Posts:
${postsContext}

User Edit:
Post ${editPosition} changed to: "${newTopic}"

Please adjust posts ${editPosition + 1} and beyond to maintain campaign flow. Keep locked posts unchanged. Return the updated strategy and only the posts that need to change.`;

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
      return NextResponse.json(
        { error: 'Failed to generate strategy update' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let response: RestrategizeResponse;
    try {
      const cleanJson = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      response = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      return NextResponse.json(
        { error: 'Invalid AI response format', details: generatedContent },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error('Restrategize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
