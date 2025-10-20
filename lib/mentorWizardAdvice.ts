import { getMentorVoice, getMentorOpening, getMentorClosing } from './mentorPersonality';

interface WizardData {
  input?: string;
  tone?: string;
  purpose?: string;
  audience?: string;
  style?: string;
  length?: 'short' | 'medium' | 'long';
  includeCTA?: boolean;
  emojiUsage?: 'none' | 'minimal' | 'moderate';
  language?: 'en' | 'no';
}

interface UserPatterns {
  preferredTone?: string;
  preferredStyle?: string;
  avgLength?: number;
}

/**
 * Generate contextual advice for Step 1 (Input)
 */
export function getStep1Advice(
  data: WizardData,
  temperature: number = 3,
  userPatterns?: UserPatterns
): string | null {
  const { input } = data;

  if (!input || input.length < 100) {
    return null; // Don't show advice until they've written something
  }

  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // Check if input is very technical
  const technicalWords = ['API', 'algorithm', 'framework', 'implementation', 'architecture', 'deployment', 'infrastructure'];
  const hasTechnicalContent = technicalWords.some(word => input.toLowerCase().includes(word.toLowerCase()));

  if (hasTechnicalContent && temperature >= 3) {
    return `${opening}: Technical topics work great, but remember your audience. Can you add a real-world example or analogy? ${closing}`;
  }

  // Check if input is a story
  const hasStoryElements = input.includes('I ') && (input.includes('recently') || input.includes('once') || input.includes('ago'));

  if (hasStoryElements && temperature >= 3) {
    return `${opening}: Love the story angle! Make sure to tie it back to a lesson or takeaway your audience can use. ${closing}`;
  }

  // Check if input is very short
  if (input.length < 200 && temperature >= 4) {
    return `${opening} This is a good start, but a bit light. Add more context or details to make it richer. ${closing}`;
  }

  return null;
}

/**
 * Generate contextual advice for Step 2 (Configuration)
 */
export function getStep2Advice(
  data: WizardData,
  temperature: number = 3,
  userPatterns?: UserPatterns
): string | null {
  const { tone, purpose, audience, style } = data;

  if (!tone || !purpose || !audience || !style) {
    return null;
  }

  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // Professional tone + casual style = potential mismatch
  if (tone === 'professional' && style === 'question-based') {
    if (temperature >= 3) {
      return `${opening}: Professional + question-based can work, but make sure your questions are strategic, not casual. ${closing}`;
    }
  }

  // Lead generation without CTA
  if (purpose === 'lead_generation' && !data.includeCTA) {
    if (temperature >= 4) {
      return `${opening} You chose lead generation but no CTA. That's a missed opportunity. Add one in step 3. ${closing}`;
    }
  }

  // Pattern-based suggestions
  if (userPatterns?.preferredTone && tone !== userPatterns.preferredTone) {
    if (temperature >= 3) {
      return `${opening}: You usually write in a ${userPatterns.preferredTone} tone. Trying ${tone} is great for variety! ${closing}`;
    }
  }

  // Executives + casual tone
  if (audience === 'executives' && tone === 'casual') {
    if (temperature >= 4) {
      return `${opening} Executives + casual tone is risky. Make sure you're still authoritative, not too conversational. ${closing}`;
    }
  }

  // Thought leadership + short posts
  if (purpose === 'thought_leadership' && data.length === 'short') {
    if (temperature >= 3) {
      return `${opening}: Thought leadership works better with medium/long posts. Short posts might not have enough depth. ${closing}`;
    }
  }

  return null;
}

/**
 * Generate contextual advice for Step 3 (Preferences)
 */
export function getStep3Advice(
  data: WizardData,
  temperature: number = 3,
  userPatterns?: UserPatterns
): string | null {
  const { length, includeCTA, emojiUsage, tone, purpose } = data;

  if (!length) {
    return null;
  }

  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // Long posts without breaking it up
  if (length === 'long' && emojiUsage === 'none') {
    if (temperature >= 3) {
      return `${opening}: Long posts with zero emojis can feel dense. Consider minimal emojis to break it up visually. ${closing}`;
    }
  }

  // Short posts with CTA
  if (length === 'short' && !includeCTA) {
    if (temperature >= 4) {
      return `${opening} Short posts are punchy, but you're missing a CTA. Add one to drive engagement. ${closing}`;
    }
  }

  // Professional tone + lots of emojis
  if (tone === 'professional' && emojiUsage === 'moderate') {
    if (temperature >= 3) {
      return `${opening}: Professional tone + moderate emojis can work, but be careful not to undercut your credibility. ${closing}`;
    }
  }

  // Engagement purpose without CTA
  if (purpose === 'engagement' && !includeCTA) {
    if (temperature >= 4) {
      return `${opening} You want engagement but no CTA? That's backwards. Add a CTA to spark conversations. ${closing}`;
    }
  }

  // Pattern-based length advice
  if (userPatterns?.avgLength) {
    const avgChars = userPatterns.avgLength;
    const lengthMap = { short: 400, medium: 900, long: 1400 };
    const selectedChars = lengthMap[length];

    const deviation = Math.abs(selectedChars - avgChars);
    if (deviation > 500 && temperature >= 3) {
      return `${opening}: You typically write around ${avgChars} characters, but ${length} posts are around ${selectedChars}. Variety is good! ${closing}`;
    }
  }

  return null;
}

/**
 * Generate strategic advice for Step 4 (Review)
 */
export function getStep4Advice(
  data: WizardData,
  temperature: number = 3
): string | null {
  const { tone, purpose, style, length, includeCTA, emojiUsage } = data;

  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // Overall strategy check: Inspirational + no CTA
  if (tone === 'inspirational' && !includeCTA) {
    if (temperature >= 4) {
      return `${opening} Inspirational posts without a CTA are like ending a movie without resolution. Add one. ${closing}`;
    }
  }

  // Story-based + long + no emojis
  if (style === 'story-based' && length === 'long' && emojiUsage === 'none') {
    if (temperature >= 3) {
      return `${opening}: Long stories without visual breaks can lose readers. Consider adding minimal emojis or line breaks. ${closing}`;
    }
  }

  // Educational + list format + short
  if (tone === 'educational' && style === 'list_format' && length === 'short') {
    if (temperature >= 3) {
      return `${opening}: Educational lists work best with medium length. Short might not give you room to teach effectively. ${closing}`;
    }
  }

  // Lead generation + no CTA
  if (purpose === 'lead_generation' && !includeCTA) {
    if (temperature >= 5) {
      return `${opening} Lead generation without a CTA? You're leaving money on the table. Go back and add one. ${closing}`;
    }
  }

  // Good strategic combination
  if (tone === 'professional' && purpose === 'thought_leadership' && length === 'medium' && includeCTA) {
    if (temperature >= 3) {
      return `${opening}: Solid strategy. Professional + thought leadership + CTA is a winning combo. ${closing}`;
    }
  }

  return null;
}
