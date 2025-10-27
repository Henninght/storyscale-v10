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
// Expanded library: 40 examples covering all major style×tone combinations, purposes, and industries
const styleExamples: Record<string, string> = {
  // ===== STORY-BASED EXAMPLES =====

  'story-based-professional': `Three months ago, a client's revenue was down 40%. Challenge: outdated automation. Action: We rebuilt their workflow using modern tools. Result: 40% revenue increase in 8 weeks. Key lesson: automation isn't set-and-forget—it needs regular optimization.`,

  'story-based-casual': `Coffee spilled on my keyboard during a client call. 😅 Instead of panicking, I laughed it off and said "let me grab my backup." The client appreciated the honesty. Lesson? Your humanity is your superpower. Don't hide behind perfection.`,

  'story-based-inspirational': `Two years ago, I was stuck in a job that drained me. Every morning felt heavy. One decision changed everything: I bet on myself. Today, I'm building something I'm proud of. If you're waiting for the "perfect moment" to make a change—this is your sign. Start small, but start today.`,

  'story-based-educational': `Last quarter, we analyzed 500+ customer support tickets. What we discovered: 73% of issues came from onboarding gaps. The fix? We rebuilt our first-week experience. Result: support tickets dropped 60% in 2 months. Takeaway: Your biggest problems often hide in plain sight.`,

  // Story-based variations - different industries and purposes

  'story-based-professional-lead-gen': `A founder DM'd me last month: "We're spending $15k/month on ads with minimal returns." I asked one question: "Are you tracking intent signals before targeting?" We implemented intent-based targeting. Their cost per qualified lead dropped 67% in 3 weeks. If your ad spend isn't working, you might be targeting too broad. Let's talk about precision targeting.`,

  'story-based-professional-tech': `Deployed a feature on Friday. Woke up Saturday to 47 error alerts. The issue? A race condition in our caching layer we'd never seen in staging. Spent the weekend debugging, found the root cause, pushed a fix by Sunday evening. Lesson: staging environments can't replicate every production scenario. Always build in circuit breakers and graceful degradation.`,

  'story-based-casual-short': `Client asked for "quick changes" at 4:45 PM Friday.
I said no.
They respected it.
Setting boundaries isn't rude—it's professional. 🎯`,

  'story-based-inspirational-long': `Five years ago, I was working 70-hour weeks at a consulting firm. Great money, zero fulfillment. I remember sitting in my car before a client meeting, feeling completely empty. I had the title, the salary, the "success"—but I was miserable.

The turning point came when my daughter asked, "Daddy, why are you always tired?" That question broke me. I realized I was optimizing for everyone's expectations except my own.

I quit two months later. Built my own practice. The first year was terrifying—income dropped 60%. But something shifted. I started sleeping better. Laughing more. Being present.

Today, I work 35 hours a week and make more than I did before. Not because I'm smarter or work harder, but because I'm aligned with what actually matters to me.

If you're in a season where success feels hollow, listen to that feeling. It's not weakness—it's wisdom trying to redirect you.`,

  'story-based-educational-data': `I tracked 6 months of my LinkedIn activity to find patterns. Here's what actually drove engagement:

Posts with personal stories: 4.2x more comments than pure advice
Questions in the first line: 2.8x more replies
Posts under 150 words: 35% higher read rate
Lists with 3-5 items: 2.1x more saves

The surprise? Vulnerability beats credentials. Every time I shared a mistake or struggle, engagement doubled compared to "expertise" posts.

Test this yourself. Share one honest challenge this week and watch what happens.`,

  // ===== LIST FORMAT EXAMPLES =====

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

  // List format variations

  'list_format-professional-short': `3 rules for better client meetings:

1. Agenda 24h in advance
2. Decisions documented in real-time
3. Action items assigned before call ends

Meetings aren't productive by default. You make them productive.`,

  'list_format-professional-consulting': `The Client Success Framework I use with every engagement:

1. Clarify success metrics before starting
2. Weekly progress reports (2 min read max)
3. Flag blockers within 24 hours
4. Monthly strategy recalibration
5. Transparent timeline expectations

My retention rate is 94% because clients always know where they stand.`,

  'list_format-casual-short': `Tools that saved me 10+ hours this week:

→ Loom (stop typing long explanations)
→ Calendly (end the email tennis)
→ TextExpander (stop rewriting the same emails)

What's yours? 👇`,

  'list_format-inspirational-growth': `Signs you're growing (even when it doesn't feel like it):

• You're comfortable saying "I don't know"
• Bad days don't derail your whole week
• You're less interested in being right
• You can sit with discomfort without fixing it
• You celebrate others without comparing

Growth isn't always loud. Sometimes it's just quiet self-awareness.`,

  'list_format-educational-tech': `4 debugging principles that saved me countless hours:

1. Reproduce the bug consistently first
2. Change one variable at a time
3. Check logs before assumptions
4. If stuck for 30 min, ask for help

Number 4 is the hardest. And the most important.`,

  'list_format-educational-long': `8 pricing mistakes I see consultants make (and how to fix them):

1. Hourly billing → Switch to value-based or project fees
2. No price increases for 2+ years → Annual 10-15% raise for existing clients
3. Scope creep = free work → Define deliverables upfront
4. Discounting to close deals → Show ROI instead
5. One-size-fits-all packages → Create tiers (good, better, best)
6. Not charging for strategy calls → Discovery calls are consulting
7. Underpricing because of imposter syndrome → Charge what experts in your field charge
8. No payment terms → 50% upfront, 50% on delivery

Your pricing communicates your value. Price like the expert you are.`,

  // ===== QUESTION-BASED EXAMPLES =====

  'question-based-professional': `Question for executives: How do you balance innovation with operational stability?

In my experience, the 70-20-10 rule works well:
• 70% core operations
• 20% iterative improvements
• 10% bold experiments

What's your approach?`,

  'question-based-casual': `Quick question: What's the one tool you couldn't live without at work? 🤔

For me, it's Notion. Changed how I organize everything.

Drop yours in the comments! ⬇️`,

  'question-based-inspirational': `What would you do if you knew you couldn't fail?

I asked myself this 3 years ago. My answer terrified me: "Start my own thing." So I started treating fear as a compass, not a stop sign.

Still scary. But I'm doing it anyway.

What's your answer? 👇`,

  'question-based-educational': `How do you decide what to work on when everything feels urgent?

Here's my framework:
• Impact × Effort = Priority Score
• High impact + Low effort = Do now
• High impact + High effort = Schedule deep work
• Low impact = Delegate or delete

What system do you use to prioritize?`,

  'question-based-professional-lead-gen': `For B2B founders: What's the biggest bottleneck in your sales process right now?

Is it:
A) Getting qualified leads
B) Converting demos to closes
C) Deal velocity (long sales cycles)
D) Something else

Genuinely curious. Drop a comment—I'll share what's working for similar companies.`,

  'question-based-casual-engagement': `Honest question: Do you actually enjoy networking events, or do you just go because you "should"? 😅

I've been to 50+ events this year. Enjoyed maybe 5. The rest felt forced.

Turns out, I get better connections from thoughtful DMs than awkward small talk. Anyone else feel this way?`,

  // ===== HOW-TO EXAMPLES =====

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

  'how-to-inspirational': `How to stop overthinking and just start:

Step 1: Set a timer for 10 minutes
Step 2: Do literally anything related to the project
Step 3: Stop when timer goes off

That's it. No pressure for perfection. Just 10 minutes.

What you'll discover: starting is the hardest part. Once you begin, momentum takes over. The goal isn't to finish—it's to start.

Try it right now. I'll wait. ⏱️`,

  'how-to-educational': `How to give feedback that actually improves performance:

1. Be specific: Not "good job" but "Your analysis of Q3 data identified the exact issue we missed"
2. Be timely: Within 24 hours while it's fresh
3. Balance ratio: 3 positives for every 1 constructive
4. Make it actionable: Include exact next steps
5. Follow up: Check progress in 1 week

Vague feedback is wasted feedback. Specificity shows you're paying attention.`,

  'how-to-professional-tech': `How to debug production issues without panic:

1. Confirm the scope: How many users affected?
2. Check recent deployments: What changed in last 24h?
3. Review logs: Start with errors, work backward
4. Isolate the component: Database? API? Frontend?
5. Implement quick fix: Rollback or hotfix
6. Document: Write post-mortem within 48h

Pro tip: Keep a runbook. Future you will thank you.`,

  'how-to-casual-short': `How to actually focus for 2+ hours straight:

1. Phone in another room (not just silent)
2. Block time on calendar so no one books you
3. One browser tab. One task.
4. Headphones, even if you don't play music

Sounds simple. Most people never try it. 🎧`,

  'how-to-educational-consulting': `How to scope a consulting project so it's profitable:

Step 1: Define deliverables (exactly what client gets)
Step 2: Estimate your hours, add 30% buffer
Step 3: Calculate cost (your rate × buffered hours)
Step 4: Triple your cost = your price
Step 5: Package it with clear milestones

Why triple? Because you're not selling hours. You're selling expertise, results, and risk mitigation. Price accordingly.`,

  'how-to-inspirational-career': `How to know if it's time to leave your job:

Ask yourself these 3 questions:

1. Am I learning anything new this quarter?
2. Do I respect the people I work with?
3. Can I see myself here in 2 years?

If you answered "no" to 2+ questions, start updating your resume. Life's too short to stay stuck out of comfort.

Trust your gut. It's usually right.`,

  // ===== BRAND AWARENESS EXAMPLES =====

  'brand-awareness-story-professional': `We launched our product 6 months ago with zero marketing budget. Today we have 2,000 active users.

How? We obsessed over one thing: solving a real problem better than anyone else.

No fancy ads. No growth hacks. Just relentless focus on product quality and user feedback. Every feature request got reviewed within 48 hours. Every bug report got a personal response.

Our best marketing turned out to be our support tickets. Happy users told their teams. Teams told their networks.

If you're building something, remember: word of mouth scales, but only if the product deserves the words.`,

  'brand-awareness-list-professional': `What we've built in 6 months:

→ Product that saves teams 15 hours/week
→ Customer support with <2h response time
→ Community of 2,000+ active users
→ 94% customer satisfaction score
→ Zero ad spend (all organic growth)

We're just getting started. If you're tired of tools that overpromise and underdeliver, let's talk. 🚀`,

  // ===== THOUGHT LEADERSHIP EXAMPLES =====

  'thought-leadership-story-professional': `Everyone talks about "data-driven decisions" but here's what most miss:

Data tells you what happened. It rarely tells you why.

I've seen companies obsess over metrics while ignoring the qualitative signals—customer complaints, support tickets, sales call feedback. The messy, unstructured data that's harder to analyze but infinitely more valuable.

Best decision I made last year? Required every exec to sit in on 5 customer calls per month. No agenda. Just listen.

We found 3 major product gaps that metrics never flagged. Fixed them in Q3. Churn dropped 23%.

Data informs. Listening guides. You need both.`,

  'thought-leadership-list-professional': `3 myths about scaling that cost me $200k to learn:

1. "Hire fast to grow fast" → Hire slow, fire fast. Bad hires cost more than slow growth.

2. "Automate everything ASAP" → Automate only after you've done it manually 50+ times. Premature automation breaks.

3. "Focus on features, not marketing" → Great product + zero distribution = zero revenue. Build and tell simultaneously.

Scaling isn't about speed. It's about timing.`,

  // ===== NETWORK BUILDING EXAMPLES =====

  'network-building-warm-friendly': `I'm expanding my network in the sustainable tech space and would love to connect with folks working on climate solutions. 🌍

A bit about me: I've spent the last 3 years in cleantech consulting, helping startups scale their impact. Recently launched my own thing focused on carbon accounting software.

What brings me here: I'm genuinely curious to learn from people building in this space—what challenges you're facing, what's working, what keeps you up at night.

If you're working on climate tech, renewable energy, circular economy, or related fields—I'd love to connect and hear your story. Drop a comment or send me a message!

Who else should I be talking to in this space?`,

  'story-based-warm-friendly-network': `Just moved to Austin and realized I know exactly 3 people here. 😅

One of them told me the best way to build community is to just be open about what you're interested in. So here goes:

I'm a product designer who loves hiking, makes terrible coffee puns, and is trying to learn Spanish (muy mal, pero estoy intentando). I work in fintech but geek out about design systems and accessibility.

If you're in Austin and want to:
→ Grab coffee and talk about design
→ Hit a trail on the weekend
→ Just connect with a fellow transplant

Let me know! Would love to build my community here. 👋`,

  'question-based-warm-friendly-network': `Question for the product managers in my network: How did you break into PM without a traditional tech background?

I'm asking because I'm mentoring someone making the transition from teaching to product management, and I'd love to share real stories and advice from people who've done it.

If you made a career switch into PM, I'd love to hear:
• What made you take the leap?
• What skills from your previous role actually helped?
• What advice would you give someone starting now?

Drop a comment or DM—would genuinely love to learn from your experience and share it forward. 💬`,

  // ===== PERSONAL SHARING EXAMPLES =====

  'personal-sharing-casual': `Spent my Saturday teaching my 8-year-old to code. We built a simple game where a cat chases a mouse.

She insisted the mouse needed a "boost power-up." Then she wanted the cat to have a "tired mode." Then she wanted a score system. Then levels. Then...

I laughed because this is exactly how scope creep happens at work. 😅

But honestly? Watching her think through logic, debug errors, and celebrate when it finally worked—that's what I wish I felt every day at my job.

Maybe she's teaching me as much as I'm teaching her.

Anyone else have moments like this where your kids or hobbies show you something about your work life?`,

  'story-based-casual-personal': `Ran my first 10K this weekend. Finished dead last in my age group.

And I'm genuinely proud of it. 🎉

Two years ago, I couldn't run for 2 minutes without stopping. I was burnt out, out of shape, and honestly kind of lost. Started with just walking. Then walk-jog intervals. Then actual running.

Yesterday I ran 10 kilometers without stopping. Last place or not, I did something I never thought I could do.

Sharing because: your milestones don't need to be someone else's starting line. Progress is personal.

What's something you're proud of that might not sound impressive to others but means the world to you?`,

  'list_format-warm-friendly-personal': `Things I've learned from 6 months of home gardening (that somehow apply to life):

→ Some things grow fast, some take forever. Both are fine.
→ You can do everything "right" and still fail. That's okay.
→ Comparing your garden to Instagram gardens will make you miserable.
→ Small daily attention beats occasional big efforts.
→ Sometimes the "weeds" are more interesting than what you planted.

I started gardening to disconnect from screens. Ended up learning more about patience and letting go than from any productivity book.

What hobby taught you unexpected life lessons?`,

  'personal-sharing-warm-friendly-celebration': `Today marks 2 years since I left my corporate job to freelance.

Honestly? It's been messier than I expected:
→ Income still isn't stable
→ I work more hours than before (but they're my hours)
→ I've failed at launching 3 different ideas
→ I've learned more about myself than in 10 years at a desk

But I'm happier. And that counts for something.

Sharing this because everyone posts the wins. I want to normalize the messy middle—where you're figuring it out, making mistakes, and still moving forward.

If you're in a transition phase right now, you're not alone. Keep going. 💪`,
};

// Enhanced helper function to get most relevant example for style/tone/purpose/length combination
function getExampleForStyle(
  style: string,
  tone: string,
  purpose?: string,
  length?: string,
  expertise?: string[]
): string {
  // Build search keys in order of specificity
  const searchKeys = [];

  // 1. Try exact style-tone match first
  searchKeys.push(`${style}-${tone}`);

  // 2. Try style-tone-purpose combination for specific use cases
  if (purpose) {
    searchKeys.push(`${style}-${tone}-${purpose.replace('_', '-')}`);
    searchKeys.push(`${purpose.replace('_', '-')}-${style}-${tone}`);
  }

  // 3. Try style-tone-length for short/long variations
  if (length && (length === 'short' || length === 'long')) {
    searchKeys.push(`${style}-${tone}-${length}`);
  }

  // 4. Try industry-specific examples if user has tech/consulting expertise
  if (expertise && expertise.length > 0) {
    const industryKeywords = ['tech', 'consulting', 'coaching', 'engineering'];
    const matchedIndustry = industryKeywords.find(industry =>
      expertise.some(exp => exp.toLowerCase().includes(industry))
    );
    if (matchedIndustry) {
      searchKeys.push(`${style}-${tone}-${matchedIndustry}`);
      searchKeys.push(`list_format-${tone}-${matchedIndustry}`);
    }
  }

  // 5. Try purpose-specific examples for network building, personal sharing, thought leadership, and brand awareness
  if (purpose === 'network_building') {
    searchKeys.push('network-building-warm-friendly');
    searchKeys.push('story-based-warm-friendly-network');
    searchKeys.push('question-based-warm-friendly-network');
  }
  if (purpose === 'personal_sharing') {
    searchKeys.push('personal-sharing-casual');
    searchKeys.push('story-based-casual-personal');
    searchKeys.push('list_format-warm-friendly-personal');
    searchKeys.push('personal-sharing-warm-friendly-celebration');
  }
  if (purpose === 'thought_leadership') {
    searchKeys.push('thought-leadership-story-professional');
    searchKeys.push('thought-leadership-list-professional');
  }
  if (purpose === 'brand_awareness') {
    searchKeys.push('brand-awareness-story-professional');
    searchKeys.push('brand-awareness-list-professional');
  }

  // 6. Try fallback to professional tone
  searchKeys.push(`${style}-professional`);

  // Search for first matching key
  for (const key of searchKeys) {
    if (styleExamples[key]) {
      return styleExamples[key];
    }
  }

  // 7. Last resort: return any example from the same style
  const styleMatch = Object.keys(styleExamples).find(key => key.startsWith(style + '-'));
  if (styleMatch) {
    return styleExamples[styleMatch];
  }

  // No match found - AI will generate without example
  return '';
}

function buildSystemPrompt(profile: any, wizardSettings: any): string {
  // Enhanced, actionable tone descriptions with specific voice characteristics
  const toneDescriptions: Record<string, string> = {
    professional: `Professional and authoritative tone:
• Sentence structure: Mix of declarative statements and strategic insights. Balanced complexity.
• Word choice: Industry terminology used naturally, not forced. Precise verbs over adjectives.
• Avoid: Corporate buzzwords ("synergy," "leverage," "disrupt"), clichés, hype language
• Use: Specific data points, frameworks, concrete examples, measured confidence
• Emotional register: Calm assurance, measured expertise, credible without being cold
• Example phrases: "In my experience...", "The data shows...", "Here's what works...", "The approach we took..."
• Transitions: "Building on that...", "The key insight...", "What this means..."
• Closing style: Actionable takeaway, strategic question, or clear next step`,

    casual: `Conversational and approachable tone:
• Sentence structure: Varied—short punchy lines mixed with longer flowing ones. Fragments OK.
• Word choice: Everyday language. Write like you talk. Contractions encouraged (I'm, you're, it's).
• Avoid: Formal jargon, overly complex sentences, sounding "try-hard casual"
• Use: Personal pronouns (I, you, we), relatable examples, humor when natural, colloquialisms
• Emotional register: Friendly, warm, authentic—like chatting with a colleague over coffee
• Example phrases: "Here's the thing...", "You know what?", "Real talk:", "Honestly...", "Quick story..."
• Transitions: "So...", "Anyway...", "But here's the kicker...", "Plot twist..."
• Closing style: Direct question to audience, casual CTA, or relatable wrap-up`,

    warm_friendly: `Warm and friendly tone for genuine connection-building:
• Sentence structure: Welcoming, inclusive language. Questions that show genuine interest. Open invitations.
• Word choice: "We", "us", "together" language. Positive, accessible words. No intimidating jargon.
• Avoid: Sales-y pitches, transactional language, "networking for gain" vibes, excessive formality
• Use: Genuine curiosity phrases, inclusive invitations, appreciation for others, authentic compliments
• Emotional register: Like meeting someone at a coffee shop—no agenda, just genuine interest in connecting
• Example phrases: "I'd love to hear about...", "Anyone else interested in...?", "Let's connect if...", "I'm curious to learn..."
• Transitions: "Speaking of which...", "On that note...", "I'm also...", "Would love to know..."
• Closing style: Open invitation, genuine question about their experience, "let's connect" without pressure`,

    inspirational: `Motivating and uplifting tone:
• Sentence structure: Rhythmic, sometimes repetitive for emphasis. Build momentum. Short impactful lines.
• Word choice: Powerful verbs, positive framing, future-oriented language, possibility-focused
• Avoid: Toxic positivity, dismissing real struggles, empty platitudes, "hustle culture" pressure
• Use: Vulnerability about challenges, growth mindset language, "you're not alone" messaging
• Emotional register: Hopeful but honest. Acknowledge the hard parts while focusing on possibility.
• Example phrases: "You're capable of...", "What if...", "Imagine...", "This is your reminder...", "Start small but start..."
• Transitions: "And here's what I've learned...", "But here's the truth...", "What changed everything..."
• Closing style: Call to courage, permission to begin, affirmation of reader's potential`,

    educational: `Informative and clear tone:
• Sentence structure: Clear subject-verb-object. Logical flow. Complex ideas broken into digestible chunks.
• Word choice: Precise terminology explained simply. Active voice. Clear cause-and-effect language.
• Avoid: Talking down, overcomplicating, assuming too much knowledge, being dry/boring
• Use: Specific examples, step-by-step breakdowns, "here's why this matters" context, analogies
• Emotional register: Patient teacher. Enthusiastic about the topic but not overwhelming.
• Example phrases: "Here's how it works...", "The key thing to understand...", "Let me break this down...", "Why does this matter?"
• Transitions: "Now that we've covered...", "Building on that...", "Here's the important part...", "This connects to..."
• Closing style: Actionable next step, practice exercise, or "try this yourself" invitation`,
  };

  // Enhanced purpose descriptions with specific engagement tactics
  const purposeDescriptions: Record<string, string> = {
    engagement: `Purpose: Encourage discussion and meaningful interaction
• Primary goal: Spark conversation, invite multiple perspectives, create community dialogue
• Content approach: Ask genuine questions, share relatable experiences, present interesting dilemmas
• CTA patterns: "What's your experience with this?", "Drop your thoughts below", "How do you handle this?"
• Success indicator: High comment count with substantive replies, ongoing thread discussions
• Avoid: Baiting controversy just for engagement, asking obvious questions, "engagement farming"
• Tone guidance: Inclusive—make readers feel their perspective is valued and interesting`,

    network_building: `Purpose: Build genuine connections and expand your professional/personal network
• Primary goal: Meet new people, strengthen relationships, create opportunities for collaboration
• Content approach: Introduce yourself authentically, express interest in others' work, share what you're looking for
• CTA patterns: "Let's connect if...", "I'd love to hear about your journey", "Who else is working on...?", "Anyone in [city/industry]?"
• Success indicator: New connection requests, DMs from like-minded people, conversations that feel natural not transactional
• Avoid: Generic "please connect" requests, collecting contacts without genuine interest, being too transactional
• Tone guidance: Warm and open—show genuine curiosity about others, share what makes you interesting/relatable`,

    personal_sharing: `Purpose: Share life updates, hobbies, celebrations, and non-work moments
• Primary goal: Be human, show personality beyond your professional identity, build authentic relationships
• Content approach: Life milestones, weekend adventures, hobbies, family moments, personal growth, things you're learning
• CTA patterns: "Anyone else into this?", "Share your experience!", "What's your story with...?", "Who can relate?"
• Success indicator: Comments from people sharing their own experiences, feeling more connected with your network
• Avoid: Oversharing inappropriately, making everything a "humble-brag," disconnecting from LinkedIn's professional context entirely
• Tone guidance: Authentic and relatable—show your human side, connect on shared experiences outside of work`,

    lead_generation: `Purpose: Attract potential clients and demonstrate specific expertise
• Primary goal: Position yourself as the go-to expert, create "I need help with this" moments
• Content approach: Showcase problem-solving process, share results with context, demonstrate unique methodology
• CTA patterns: "DM me if this resonates", "Let's talk about your situation", "I help companies solve this exact problem"
• Success indicator: Quality DMs/inquiries from target clients, not just vanity engagement
• Avoid: Being salesy, overpromising results, making it all about you instead of client transformation
• Tone guidance: Helpful expert—you're here to solve problems, not just promote yourself`,

    brand_awareness: `Purpose: Build visibility, memorability, and positive brand associations
• Primary goal: Make people remember who you are and what you stand for
• Content approach: Consistent themes, recognizable voice, showcase values and personality, behind-the-scenes
• CTA patterns: Soft or implicit—focus on value delivery over direct asks. "Follow for more insights like this"
• Success indicator: Profile visits, follower growth, people associating you with specific topics
• Avoid: Generic company updates, pure self-promotion without value, inconsistent voice
• Tone guidance: Authentic and distinctive—what makes YOUR voice unique? Double down on that.`,

    thought_leadership: `Purpose: Demonstrate deep expertise and share unique, valuable insights
• Primary goal: Position as an authoritative voice with original perspectives worth following
• Content approach: Contrarian takes (when justified), synthesis of trends, lessons from experience, data-driven insights
• CTA patterns: Minimal or none—the insight IS the value. "What's your take on this trend?"
• Success indicator: Saves, shares, cited by others, invited to speak/write about topics
• Avoid: Stating obvious things, parroting popular opinions, all theory no practice
• Tone guidance: Confident expert—you've done the work, learned the lessons, and have genuine insights to share`,
  };

  // Enhanced style descriptions with structural templates
  const styleDescriptions: Record<string, string> = {
    'story-based': `Story-based structure with clear narrative arc:
• Opening: Set the scene in 1-2 sentences—specific time, place, or situation. Hook with tension or curiosity.
• Challenge/Conflict: What went wrong, what was difficult, what needed solving. Make it relatable.
• Action/Journey: What happened next. Turning point, decision made, or process followed. Show, don't just tell.
• Result/Resolution: Concrete outcome. What changed? What was learned?
• Takeaway: Universal lesson readers can apply. Bridge from "my story" to "your application."
• Keep it: Specific (real details), human (emotions/thoughts), concise (trim unnecessary details)
• Avoid: Starting with "Let me tell you a story," over-explaining, losing the lesson in rambling narrative`,

    list_format: `List format—scannable, structured, high-impact:
• Opening: 1-2 sentence setup explaining what the list covers and why it matters
• List structure: 3-7 items ideal. Use consistent formatting (all numbers, all bullets, or all arrows)
• Item format: Bold headline + explanation OR standalone insight with context
• Transitions between items: Optional but effective for longer lists ("But here's the big one:", "Most important:")
• Closing: Brief synthesis, action item, or question to engage
• Keep it: Parallel structure (all items similar format), specific (avoid generic advice), scannable (white space between items)
• Avoid: Walls of text in bullet form, inconsistent item lengths, obvious/generic list items`,

    'question-based': `Question-based—hooks with curiosity, invites perspective:
• Opening question: Make it specific, relatable, and thought-provoking. Not yes/no unless intentionally simple.
• Context/Setup: 2-4 sentences explaining why you're asking—your experience, observation, or dilemma
• Your perspective: Share your answer/approach (unless you're genuinely seeking input). Vulnerable or contrarian works well.
• Invitation: Make it clear you want to hear from others. "What's your approach?", "Anyone else experience this?"
• Keep it: Genuine (real curiosity, not rhetorical), focused (one clear question), open-ended when possible
• Avoid: Loaded questions, obvious answers, using questions as clickbait then not delivering substance`,

    'how-to': `How-to structure—actionable, step-by-step guidance:
• Opening: State the outcome clearly: "How to [achieve specific result]" or "Want to [solve specific problem]? Here's how:"
• Steps: 3-7 steps ideal. Number them. Each step = one clear action.
• Step format: Action verb headline + 1-2 sentence explanation of how/why. Optionally add examples.
• Pro tips: Optional but valuable—add insider knowledge, common mistakes to avoid, time-saving shortcuts
• Closing: Encourage action: "Try this and let me know how it goes", "Start with step 1 this week"
• Keep it: Actionable (real steps people can take), tested (share what worked for you), specific (avoid vague advice)
• Avoid: Overly complicated processes, too many steps (breaks overwhelm readers), theory without practical application`,
  };

  // Enhanced length descriptions with structural guidance
  const lengthDescriptions: Record<string, string> = {
    short: `50-150 words (Short, punchy format):
• Structure: Hook (1 line) + Core insight (2-4 lines) + Closing thought/question (1 line)
• Ideal for: Single insights, quick tips, provocative statements, simple questions
• Every word must earn its place—ruthlessly edit for impact
• White space is your friend—use line breaks liberally`,

    medium: `150-300 words (Standard LinkedIn length):
• Structure: Hook (1-2 lines) + Body (3-5 short paragraphs) + Closing (1-2 lines)
• Ideal for: Stories with lessons, lists with context, frameworks, how-to guides
• Balance depth with scannability—use line breaks between thoughts
• Sweet spot for most content—enough depth without overwhelming`,

    long: `300-500 words (Deep-dive format):
• Structure: Strong hook + Multi-part body with clear sections + Memorable closing
• Ideal for: Complex stories, detailed how-tos, contrarian takes needing support, comprehensive frameworks
• CRITICAL: Must be exceptional content to justify length. Every paragraph must deliver value.
• Use formatting heavily: bullets, numbers, bold text, line breaks every 2-3 lines max
• Requires stronger hook than shorter posts—reader is committing more time`,
  };

  const emojiGuidelines: Record<string, string> = {
    none: 'Do not use any emojis.',
    minimal: 'Use 1-2 relevant emojis sparingly.',
    moderate: 'Use 3-5 emojis to enhance readability and engagement.',
  };

  const accountType = profile.accountType || 'private';
  const isCompany = accountType === 'company';

  // Get relevant example for the selected style/tone/purpose/length combination
  const relevantExample = getExampleForStyle(
    wizardSettings.style,
    wizardSettings.tone,
    wizardSettings.purpose,
    wizardSettings.length,
    profile.expertise || []
  );

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

${relevantExample ? `**REFERENCE EXAMPLE (${wizardSettings.style} style, ${wizardSettings.tone} tone):**

${relevantExample}

⚠️ This example demonstrates the structure, flow, and tone you should emulate. Use it as a guide for writing style, but write about the user's specific topic and context. Do NOT copy content directly—adapt the patterns to the user's input.

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
