import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { anthropic } from '@/lib/anthropic';
import * as mammoth from 'mammoth';
import officeParser from 'officeparser';

interface ExtractedData {
  name?: string;
  theme?: string;
  description?: string;
  suggestedAudience?: string;
  suggestedTone?: string;
  suggestedStyle?: string;
  suggestedPurpose?: string;
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

    // Parse form data with files
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    const maxSize = 7 * 1024 * 1024; // 7MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    ];

    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 7MB limit` },
          { status: 400 }
        );
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported type. Only PDF, DOCX, and PPTX are allowed.` },
          { status: 400 }
        );
      }
    }

    // Process each file and extract text
    const extractedTexts: string[] = [];
    const fileNames: string[] = [];

    for (const file of files) {
      fileNames.push(file.name);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let text = '';

        if (file.type === 'application/pdf') {
          // For PDFs, we'll send directly to Claude with vision
          // Claude supports PDF analysis natively
          const base64 = buffer.toString('base64');

          // Use Claude's PDF support
          const pdfAnalysis = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'document',
                    source: {
                      type: 'base64',
                      media_type: 'application/pdf',
                      data: base64,
                    },
                  },
                  {
                    type: 'text',
                    text: 'Extract all text content from this PDF document. Return only the text content, no analysis.',
                  },
                ],
              },
            ],
          });

          text = pdfAnalysis.content[0].type === 'text' ? pdfAnalysis.content[0].text : '';
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // DOCX - use mammoth
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          // PPTX - use officeparser
          text = await officeParser.parseOfficeAsync(buffer);
        }

        if (text.trim()) {
          extractedTexts.push(`\n=== Content from ${file.name} ===\n${text}\n`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with other files
        extractedTexts.push(`\n=== Error processing ${file.name} ===\n`);
      }
    }

    if (extractedTexts.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from any uploaded documents' },
        { status: 400 }
      );
    }

    // Combine all extracted text
    const combinedText = extractedTexts.join('\n\n');

    // Use Claude to analyze and extract campaign data
    const systemPrompt = `You are a marketing campaign analyst. Your task is to analyze uploaded documents (product briefs, marketing decks, campaign plans, etc.) and extract structured campaign information.

From the provided documents, extract:
- Campaign Name/Title (if mentioned)
- Campaign Theme/Goal (the main objective or purpose)
- Description/Overview (a brief summary)
- Target Audience (who is this for)
- Suggested Tone (professional, casual, inspirational, or educational)
- Suggested Style (story-based, list-format, question-based, or how-to)
- Suggested Purpose (engagement, lead_generation, brand_awareness, or thought_leadership)

Return your response as valid JSON with this structure:
{
  "name": "Campaign name or null if not found",
  "theme": "Main campaign goal/objective",
  "description": "Brief overview of the campaign",
  "suggestedAudience": "Target audience (executives, entrepreneurs, professionals, or industry_specific)",
  "suggestedTone": "professional, casual, inspirational, or educational",
  "suggestedStyle": "story-based, list_format, question-based, or how-to",
  "suggestedPurpose": "engagement, lead_generation, brand_awareness, or thought_leadership"
}

If information is unclear or not found in the documents, use null for that field.
Return ONLY valid JSON, no markdown formatting or extra text.`;

    const userMessage = `Analyze these campaign documents and extract campaign information:\n\n${combinedText}`;

    const analysisResponse = await anthropic.messages.create({
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

    const analysisText = analysisResponse.content[0].type === 'text'
      ? analysisResponse.content[0].text
      : '';

    if (!analysisText) {
      return NextResponse.json(
        { error: 'Failed to analyze documents' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let extractedData: ExtractedData;
    try {
      const cleanJson = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      extractedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      return NextResponse.json(
        { error: 'Invalid AI response format', details: analysisText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      filesProcessed: fileNames,
    });
  } catch (error) {
    console.error('Document processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
