import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { adminAuth } from '@/lib/firebase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY?.trim() || '',
});

interface ValidationResult {
  scores: {
    clarity: number;
    specificity: number;
    actionability: number;
  };
  overall: number;
  feedback: string;
  suggestions: string[];
  status: 'excellent' | 'good' | 'needs_improvement';
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
    const { text, language, fieldType } = body;

    if (!text || !language || !fieldType) {
      return NextResponse.json(
        { error: 'Missing required fields: text, language, fieldType' },
        { status: 400 }
      );
    }

    // Skip validation for very short inputs
    if (text.length < 10) {
      return NextResponse.json({
        success: true,
        result: {
          scores: { clarity: 0, specificity: 0, actionability: 0 },
          overall: 0,
          feedback: language === 'no' ? 'Skriv litt mer for å få AI-tilbakemelding' : 'Write more to get AI feedback',
          suggestions: [],
          status: 'needs_improvement',
        },
      });
    }

    // Build prompt based on language
    const systemPrompt = language === 'no'
      ? `Du er en ekspert markedsføringsstrateg som hjelper brukere med å skrive effektive kampanjemål.

Analyser kvaliteten på denne kampanje${fieldType === 'theme' ? 'målsettingen' : 'beskrivelsen'} og gi konstruktiv tilbakemelding.

Vurder:
1. Klarhet (1-10): Er målsettingen tydelig og forståelig?
2. Spesifisitet (1-10): Er målsettingen spesifikk nok? Inkluderer den målbare mål?
3. Handlingsrettethet (1-10): Kan man lage konkrete innlegg fra denne målsettingen?

Return your response as valid JSON with this structure:
{
  "scores": {
    "clarity": 7,
    "specificity": 6,
    "actionability": 8
  },
  "overall": 7,
  "feedback": "Din målsettingen er god, men...",
  "suggestions": [
    "Vurder å legge til...",
    "Prøv å spesifisere...",
    "Det kan hjelpe å inkludere..."
  ],
  "status": "good"
}

Status kan være: "excellent" (overall >= 8), "good" (overall >= 6), "needs_improvement" (overall < 6)

Gi 2-3 konkrete forslag. Vær oppmuntrende og hjelpsom. Skriv på norsk.

Generate ONLY valid JSON. No markdown, no explanations.`
      : `You are an expert marketing strategist helping users write effective campaign goals.

Analyze the quality of this campaign ${fieldType} and provide constructive feedback.

Evaluate:
1. Clarity (1-10): Is the goal clear and understandable?
2. Specificity (1-10): Is the goal specific enough? Does it include measurable outcomes?
3. Actionability (1-10): Can specific posts be created from this goal?

Return your response as valid JSON with this structure:
{
  "scores": {
    "clarity": 7,
    "specificity": 6,
    "actionability": 8
  },
  "overall": 7,
  "feedback": "Your goal is clear but could be more specific...",
  "suggestions": [
    "Consider adding measurable outcomes like...",
    "Try specifying the target audience more clearly...",
    "It would help to include a timeline or specific metric..."
  ],
  "status": "good"
}

Status should be: "excellent" (overall >= 8), "good" (overall >= 6), "needs_improvement" (overall < 6)

Provide 2-3 specific, actionable suggestions. Be encouraging and helpful. Write in English.

Generate ONLY valid JSON. No markdown, no explanations.`;

    const userMessage = `Input to validate: "${text}"`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
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
        { error: 'Failed to validate input' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let result: ValidationResult;
    try {
      const cleanJson = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      result = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI validation response:', generatedContent);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
