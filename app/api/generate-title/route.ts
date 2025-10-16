import { NextRequest, NextResponse } from 'next/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Generate a short, catchy title (max 60 characters) for this LinkedIn post. The title should capture the main theme or hook. Return ONLY the title, nothing else.

Post content:
${content}`,
        },
      ],
    });

    const title = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
