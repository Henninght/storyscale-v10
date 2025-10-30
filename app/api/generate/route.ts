import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { fetchMultipleUrls } from '@/lib/urlFetcher';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic';
import {
  generateEmbedding,
  findSimilarPosts,
  shouldRegenerateContent,
  extractTopics,
  type SimilarPost,
} from '@/lib/embeddings';
import { buildPrompt, buildUserMessage } from '@/lib/promptBuilder';
import { getContentHash } from '@/lib/contentHash';

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
    const { wizardSettings, previewContent, previewHash } = body;

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

    // Fetch user's recent posts for duplication detection
    console.log('Fetching recent posts for duplication detection...');
    const recentPostsSnapshot = await adminDb
      .collection('drafts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentPosts = recentPostsSnapshot.docs.map(doc => ({
      id: doc.id,
      content: doc.data().content || '',
      embedding: doc.data().embedding || null,
    }));

    console.log(`Found ${recentPosts.length} recent posts for comparison`);

    // Fetch reference URL content if provided
    let referenceContent: Array<{ url: string; content: string; error?: string }> = [];
    if (wizardSettings.referenceUrls?.some((url: string) => url.trim())) {
      const validUrls = wizardSettings.referenceUrls.filter((url: string) => url.trim());
      referenceContent = await fetchMultipleUrls(validUrls);
    }

    // Build system prompt and user message (needed for both generation and regeneration)
    const systemPrompt = buildPrompt(profile, wizardSettings, recentPosts);
    const userMessage = buildUserMessage(wizardSettings, referenceContent);

    // Check if we can reuse preview content
    let generatedContent = '';
    let usedPreviewContent = false;

    if (previewContent && previewHash) {
      // Calculate current hash to validate preview is still valid
      const currentHash = getContentHash({
        input: wizardSettings.input,
        settings: {
          tone: wizardSettings.tone,
          style: wizardSettings.style,
          length: wizardSettings.length,
          language: wizardSettings.language,
          purpose: wizardSettings.purpose,
          audience: wizardSettings.audience,
          emojiUsage: wizardSettings.emojiUsage,
          includeCTA: wizardSettings.includeCTA,
          customInstructions: wizardSettings.customInstructions,
        },
        referenceContent,
      });

      if (currentHash === previewHash) {
        console.log('✅ Preview hash matches - reusing preview content (saving API call)');
        generatedContent = previewContent;
        usedPreviewContent = true;
      } else {
        console.log('⚠️ Preview hash mismatch - regenerating content');
        console.log('Expected:', previewHash.substring(0, 16));
        console.log('Got:', currentHash.substring(0, 16));
      }
    }

    // Only call Anthropic API if we're not reusing preview
    if (!usedPreviewContent) {

      // Call Claude API
      console.log('About to call Anthropic API...');
      let message;
      try {
        message = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        });
        console.log('Anthropic API call successful');
      } catch (anthropicError) {
        console.error('Anthropic API error:', anthropicError);
        throw new Error(`Anthropic API failed: ${anthropicError instanceof Error ? anthropicError.message : String(anthropicError)}`);
      }

      // Extract generated content
      generatedContent =
        message.content[0].type === 'text' ? message.content[0].text : '';
    }

    if (!generatedContent) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    // Duplication detection: Generate embedding and check for similar posts
    console.log('Generating embedding for duplication detection...');
    let embedding: number[] = [];
    let similarPosts: SimilarPost[] = [];
    let topics: string[] = [];
    let wasRegenerated = false;
    let finalGeneratedContent = generatedContent;

    try {
      const embeddingResult = await generateEmbedding(finalGeneratedContent);
      embedding = embeddingResult.embedding;

      // Extract topics/keywords from content
      topics = extractTopics(finalGeneratedContent);

      // Find similar posts
      similarPosts = findSimilarPosts(embedding, recentPosts, 3);

      console.log(`Found ${similarPosts.length} similar posts. Highest similarity: ${similarPosts[0]?.score || 0}%`);

      // If content is too similar (>85%), regenerate with stronger anti-duplication instruction
      if (shouldRegenerateContent(similarPosts)) {
        console.log('⚠️ High similarity detected (>85%). Auto-regenerating with anti-duplication instructions...');
        wasRegenerated = true;

        // Build enhanced prompt with explicit duplication warning
        const enhancedSystemPrompt = buildPrompt(profile, wizardSettings, recentPosts, true);

        // Regenerate content
        const regeneratedMessage = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: enhancedSystemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage + '\n\n⚠️ CRITICAL: Your previous attempt was too similar to existing posts. Create completely NEW content with different angles, examples, and insights.',
            },
          ],
        });

        const regeneratedContent = regeneratedMessage.content[0].type === 'text' ? regeneratedMessage.content[0].text : '';

        if (regeneratedContent) {
          // Update final content
          finalGeneratedContent = regeneratedContent;

          // Generate new embedding for regenerated content
          const newEmbeddingResult = await generateEmbedding(finalGeneratedContent);
          embedding = newEmbeddingResult.embedding;
          topics = extractTopics(finalGeneratedContent);
          similarPosts = findSimilarPosts(embedding, recentPosts, 3);

          console.log('✅ Content regenerated successfully. New similarity: ' + (similarPosts[0]?.score || 0) + '%');
        }
      }
    } catch (embeddingError) {
      console.error('Embedding generation error:', embeddingError);
      // Continue without duplication detection if embedding fails
      console.log('⚠️ Continuing without duplication detection due to error');
    }

    // Create draft in Firestore
    const draftRef = adminDb.collection('drafts').doc();
    const now = new Date();

    await draftRef.set({
      userId,
      content: finalGeneratedContent,
      status: 'in_progress',
      language: wizardSettings.language,
      tags: [],
      scheduledDate: null,
      wizardSettings,
      campaignId: wizardSettings.campaignId || null,
      embedding: embedding.length > 0 ? embedding : null,
      topics: topics.length > 0 ? topics : [],
      similarPosts: similarPosts.map(p => ({ id: p.id, score: p.score, preview: p.preview })),
      similarityChecked: true,
      wasRegenerated,
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
      content: finalGeneratedContent,
      reusedPreview: usedPreviewContent,
      duplicationCheck: {
        checked: true,
        similarPosts: similarPosts.map(p => ({ id: p.id, score: p.score, preview: p.preview })),
        wasRegenerated,
        highestSimilarity: similarPosts[0]?.score || 0,
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
