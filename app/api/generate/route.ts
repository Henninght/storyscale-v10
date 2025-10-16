import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { fetchMultipleUrls } from '@/lib/urlFetcher';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic';

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

    // Fetch reference URL content if provided
    let referenceContent: Array<{ url: string; content: string; error?: string }> = [];
    if (wizardSettings.referenceUrls?.some((url: string) => url.trim())) {
      const validUrls = wizardSettings.referenceUrls.filter((url: string) => url.trim());
      referenceContent = await fetchMultipleUrls(validUrls);
    }

    // Build system prompt with user profile
    const systemPrompt = buildSystemPrompt(profile, wizardSettings);

    // Build user message with fetched reference content
    const userMessage = buildUserMessage(wizardSettings, referenceContent);

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

// Few-shot examples for style/tone combinations based on LinkedIn best practices
const styleExamples: Record<string, string> = {
  'story-based-professional': `Three months ago, a client's revenue was down 40%. Challenge: outdated automation. Action: We rebuilt their workflow using modern tools. Result: 40% revenue increase in 8 weeks. Key lesson: automation isn't set-and-forget—it needs regular optimization.`,

  'story-based-casual': `Coffee spilled on my keyboard during a client call. 😅 Instead of panicking, I laughed it off and said "let me grab my backup." The client appreciated the honesty. Lesson? Your humanity is your superpower. Don't hide behind perfection.`,

  'story-based-inspirational': `Two years ago, I was stuck in a job that drained me. Every morning felt heavy. One decision changed everything: I bet on myself. Today, I'm building something I'm proud of. If you're waiting for the "perfect moment" to make a change—this is your sign. Start small, but start today.`,

  'story-based-educational': `Last quarter, we analyzed 500+ customer support tickets. What we discovered: 73% of issues came from onboarding gaps. The fix? We rebuilt our first-week experience. Result: support tickets dropped 60% in 2 months. Takeaway: Your biggest problems often hide in plain sight.`,

  'list_format-professional': `Strategic framework for quarterly planning:

1. Review last quarter's KPIs
2. Identify 3 growth priorities
3. Allocate resources accordingly
4. Set measurable milestones
5. Schedule monthly check-ins

Simple, but effective.`,

  'list_format-educational': `5 lessons from analyzing 1000+ LinkedIn posts:

1. First line hooks = 3x more reads
2. Short paragraphs beat walls of text
3. Questions drive 2x comments
4. Stories outperform stats
5. CTAs increase engagement 40%

Save this for your next post.`,

  'list_format-casual': `My non-negotiable daily habits:

→ 30 min morning walk (clears my head)
→ Phone on airplane mode until 10am
→ One deep work block before lunch
→ Afternoon energy dip = admin tasks
→ Evening reflection: 3 wins from today

What's your #1 productivity hack?`,

  'list_format-inspirational': `Things I stopped apologizing for:

• Taking breaks when I need them
• Setting boundaries with my time
• Saying no to opportunities that drain me
• Prioritizing my mental health
• Not responding immediately to every message

Your energy is your most valuable asset. Protect it.`,

  'question-based-professional': `Question for executives: How do you balance innovation with operational stability?

In my experience, the 70-20-10 rule works well:
• 70% core operations
• 20% iterative improvements
• 10% bold experiments

What's your approach?`,

  'question-based-casual': `Quick question: What's the one tool you couldn't live without at work? 🤔

For me, it's Notion. Changed how I organize everything.

Drop yours in the comments! ⬇️`,

  'how-to-professional': `How to run effective 1-on-1s in 30 minutes:

1. First 10 min: Their agenda (what's on their mind)
2. Next 10 min: Your feedback (specific, actionable)
3. Last 10 min: Action items (document decisions)

Simple structure = better conversations.`,

  'how-to-casual': `Struggling with inbox zero? Here's what worked for me:

→ Unsubscribe ruthlessly (10 min investment, huge payoff)
→ Use folders (3 max, don't overthink it)
→ 2-minute rule: reply now or never
→ Check email 3x daily, not 30x

Try it for a week. You'll thank me. 😊`,
};

// Helper function to get relevant example for style/tone combination
function getExampleForStyle(style: string, tone: string): string {
  // Try exact match first (e.g., "story-based-professional")
  const exactKey = `${style}-${tone}`;
  if (styleExamples[exactKey]) {
    return styleExamples[exactKey];
  }

  // Try style with "professional" as fallback
  const fallbackKey = `${style}-professional`;
  if (styleExamples[fallbackKey]) {
    return styleExamples[fallbackKey];
  }

  // Return empty string if no match (AI will generate without example)
  return '';
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

  // Get relevant example for the selected style/tone combination
  const relevantExample = getExampleForStyle(wizardSettings.style, wizardSettings.tone);

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

${relevantExample ? `**EXAMPLE POST (${styleDescriptions[wizardSettings.style]} + ${toneDescriptions[wizardSettings.tone]}):**

${relevantExample}

⚠️ This is a reference example showing the structure and flow. Use it as inspiration, but write about the user's specific topic and context. Do NOT copy it directly.

` : ''}**ANTI-HALLUCINATION RULES (CRITICAL):**
⚠️ NEVER invent, estimate, or make up statistics, numbers, percentages, dates, or facts
⚠️ If reference content is provided, use ONLY the specific data contained within it
⚠️ If you don't have verified data for a claim, rephrase to avoid requiring specific numbers
⚠️ Better to be general and accurate than specific and wrong
⚠️ When in doubt, focus on qualitative insights rather than quantitative claims

Generate ONLY the post content. Do not include any meta-commentary, explanations, or labels.`;
}

function buildUserMessage(
  wizardSettings: any,
  referenceContent: Array<{ url: string; content: string; error?: string }> = []
): string {
  let message = `Create a LinkedIn post based on this input:\n\n${wizardSettings.input}`;

  // Add fetched reference content
  if (referenceContent.length > 0) {
    message += `\n\n**REFERENCE CONTENT (Use ONLY factual information from these sources):**\n`;

    referenceContent.forEach((ref, index) => {
      if (ref.error) {
        message += `\n[Reference ${index + 1}] ${ref.url}\nError: ${ref.error} - Content unavailable\n`;
      } else {
        message += `\n[Reference ${index + 1}] ${ref.url}\nContent:\n${ref.content}\n`;
      }
    });

    message += `\n**CRITICAL:** Only use statistics, numbers, and facts that appear in the reference content above. NEVER make up or estimate numbers. If specific data is not in the references, do not include it in the post.`;
  }

  // Add custom instructions if provided
  if (wizardSettings.customInstructions?.trim()) {
    message += `\n\n**CUSTOM INSTRUCTIONS FROM USER:**\n${wizardSettings.customInstructions.trim()}\n`;
    message += `\nFollow these custom instructions while maintaining all anti-hallucination rules and staying true to the reference content.`;
  }

  // Add comprehensive campaign context
  if (wizardSettings.campaignId) {
    const totalPosts = wizardSettings.aiStrategy?.postBlueprints?.length || '?';
    const currentPostNum = wizardSettings.postNumber || 1;
    const campaignPhase = currentPostNum <= totalPosts / 3 ? 'early' : currentPostNum <= (totalPosts * 2) / 3 ? 'mid' : 'late';

    message += `\n\n**CAMPAIGN CONTEXT:**`;
    message += `\n- Campaign: "${wizardSettings.campaignTheme}"`;
    if (wizardSettings.campaignDescription) {
      message += `\n- Description: ${wizardSettings.campaignDescription}`;
    }
    message += `\n- This is post ${currentPostNum} of ${totalPosts} in the series (${campaignPhase} phase)`;

    // Add strategic post blueprint if available
    if (wizardSettings.postBlueprint) {
      message += `\n\n**POST STRATEGY (follow this plan):**`;
      message += `\n- Suggested Topic: ${wizardSettings.postBlueprint.topic}`;
      message += `\n- Post Goal: ${wizardSettings.postBlueprint.goal}`;
      message += `\n\nIMPORTANT: Use the user's input as the primary direction, but ensure the post aligns with the strategic topic and goal above.`;
    }

    // Add narrative arc context for strategic progression
    if (wizardSettings.aiStrategy?.narrativeArc) {
      message += `\n\n**NARRATIVE PROGRESSION:**`;
      message += `\n${wizardSettings.aiStrategy.narrativeArc}`;
      message += `\n\nEnsure this post fits naturally into this progression.`;
    }

    // Add tone progression instructions based on campaign phase
    message += `\n\n**TONE PROGRESSION GUIDANCE:**`;
    if (campaignPhase === 'early') {
      message += `\n- Early phase: Focus on building awareness and introducing core concepts`;
      message += `\n- Keep it accessible and engaging to hook the audience`;
      message += `\n- Establish credibility and set the stage for deeper insights`;
    } else if (campaignPhase === 'mid') {
      message += `\n- Mid phase: Deepen the conversation with more detailed insights`;
      message += `\n- Build on established themes from earlier posts`;
      message += `\n- Increase specificity and actionable takeaways`;
      message += `\n- Reference themes (not specific posts) from the campaign so far`;
    } else {
      message += `\n- Late phase: Bring the campaign to a strong conclusion`;
      message += `\n- Synthesize key themes from the entire series`;
      message += `\n- Provide clear next steps or actionable insights`;
      message += `\n- Consider subtle callbacks to campaign opening (if natural)`;
      message += `\n- Leave the audience with lasting value`;
    }

    // Add previous post for thematic continuity with smart call-back logic
    if (wizardSettings.previousContent) {
      message += `\n\n**PREVIOUS POST (for thematic continuity):**`;
      message += `\n${wizardSettings.previousContent.slice(0, 600)}...`;

      if (campaignPhase === 'early') {
        message += `\n\nIMPORTANT: Build on the themes from the previous post. Maintain continuity in voice and perspective, but DON'T directly reference it. Create a natural progression.`;
      } else if (campaignPhase === 'mid') {
        message += `\n\nIMPORTANT: Build on previous insights while deepening the conversation. You may briefly reference themes from earlier posts if it strengthens your point, but keep it natural—no forced callbacks. Example: "As we explored earlier..." or "Building on the foundation we've established..."`;
      } else {
        message += `\n\nIMPORTANT: This is the campaign's conclusion. Synthesize key themes from the series. You may reference earlier insights if it creates a satisfying narrative arc, but keep it subtle and purposeful. Focus on delivering lasting value.`;
      }
    }
  }

  return message;
}
