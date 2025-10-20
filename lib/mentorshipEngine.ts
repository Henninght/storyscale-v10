import { Draft, UserProfile, MentorshipSuggestion, MentorshipSlot } from '@/types';

interface MentorshipConfig {
  temperature: number; // 1-5
  customInstructions: string;
  userProfile: UserProfile;
  recentDrafts: Draft[];
}

interface DraftPattern {
  topics: string[];
  tones: string[];
  styles: string[];
  lengths: string[];
  avgLength: number;
  languageDistribution: { en: number; no: number };
}

// Temperature-based tone modifiers
const TONE_MODIFIERS: Record<number, string[]> = {
  1: ["You might consider", "Perhaps", "When ready"],
  2: ["Consider", "What about", "You could try"],
  3: ["Here's a thought", "What if", "Consider"],
  4: ["Try", "Your next post could be", "Time to explore"],
  5: ["Write about", "Focus on", "Challenge yourself with"],
};

/**
 * Analyze draft patterns to identify content trends
 */
export function analyzeDraftPatterns(drafts: Draft[]): DraftPattern {
  if (drafts.length === 0) {
    return {
      topics: [],
      tones: [],
      styles: [],
      lengths: [],
      avgLength: 0,
      languageDistribution: { en: 0, no: 0 },
    };
  }

  const topics: string[] = [];
  const tones: string[] = [];
  const styles: string[] = [];
  const lengths: string[] = [];
  let totalLength = 0;
  const langCounts = { en: 0, no: 0 };

  drafts.forEach((draft) => {
    // Extract tone from wizard settings
    if (draft.wizardSettings?.tone) {
      tones.push(draft.wizardSettings.tone);
    }

    // Extract style from wizard settings
    if (draft.wizardSettings?.style) {
      styles.push(draft.wizardSettings.style);
    }

    // Track length
    if (draft.wizardSettings?.length) {
      lengths.push(draft.wizardSettings.length);
    }

    totalLength += draft.content.length;

    // Track language
    if (draft.language) {
      langCounts[draft.language]++;
    }
  });

  return {
    topics,
    tones,
    styles,
    lengths,
    avgLength: Math.round(totalLength / drafts.length),
    languageDistribution: langCounts,
  };
}

/**
 * Get frequency of a value in an array
 */
function getFrequency<T>(arr: T[]): Map<T, number> {
  const freq = new Map<T, number>();
  arr.forEach((item) => {
    freq.set(item, (freq.get(item) || 0) + 1);
  });
  return freq;
}

/**
 * Get the most common value in an array
 */
function getMostCommon<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const freq = getFrequency(arr);
  let maxCount = 0;
  let mostCommon: T | null = null;
  freq.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  });
  return mostCommon;
}

/**
 * Generate mentorship suggestions based on patterns and config
 */
export function generateSuggestions(config: MentorshipConfig): string[] {
  const { temperature, customInstructions, userProfile, recentDrafts } = config;
  const patterns = analyzeDraftPatterns(recentDrafts);
  const suggestions: string[] = [];

  // If user has custom instructions, prioritize those
  if (customInstructions.trim()) {
    suggestions.push(...generateCustomInstructionSuggestions(customInstructions, temperature));
  }

  // Generate pattern-based suggestions
  const patternSuggestions = generatePatternSuggestions(patterns, userProfile, temperature);
  suggestions.push(...patternSuggestions);

  // Limit based on temperature
  const maxSuggestions = temperature <= 2 ? 1 : 2;
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Generate suggestions based on custom instructions
 */
function generateCustomInstructionSuggestions(
  instructions: string,
  temperature: number
): string[] {
  const suggestions: string[] = [];
  const toneModifier = TONE_MODIFIERS[temperature][0];

  // Parse common patterns in custom instructions
  const lowerInstructions = instructions.toLowerCase();

  // Character limit reminder
  if (lowerInstructions.includes('under') && lowerInstructions.includes('character')) {
    const match = instructions.match(/under (\d+) character/i);
    if (match) {
      suggestions.push(
        `${toneModifier} keeping your next post under ${match[1]} characters as per your preference.`
      );
    }
  }

  // Topic suggestions
  if (lowerInstructions.includes('suggest') && lowerInstructions.includes('about')) {
    const topicMatch = instructions.match(/about (.+?)(?:\.|$)/i);
    if (topicMatch) {
      suggestions.push(
        `${toneModifier} writing about ${topicMatch[1].trim()} — it aligns with your content goals.`
      );
    }
  }

  // Format variety
  if (lowerInstructions.includes('vary') && lowerInstructions.includes('format')) {
    suggestions.push(
      `${toneModifier} trying a different post format to add variety to your feed.`
    );
  }

  // Tone suggestions
  if (lowerInstructions.includes('inspirational')) {
    suggestions.push(
      `${toneModifier} an inspirational story — your audience would appreciate the motivational shift.`
    );
  }

  if (lowerInstructions.includes('actionable')) {
    suggestions.push(
      `${toneModifier} including actionable tips in your next post to balance thought leadership.`
    );
  }

  return suggestions;
}

/**
 * Generate pattern-based suggestions
 */
function generatePatternSuggestions(
  patterns: DraftPattern,
  userProfile: UserProfile,
  temperature: number
): string[] {
  const suggestions: string[] = [];
  const toneModifier = TONE_MODIFIERS[temperature][0];

  // Check tone variety
  if (patterns.tones.length >= 3) {
    const mostCommonTone = getMostCommon(patterns.tones);
    const toneFreq = getFrequency(patterns.tones);
    const dominantCount = toneFreq.get(mostCommonTone!) || 0;

    if (dominantCount >= 3 && patterns.tones.length >= 5) {
      const alternateTones = ['professional', 'casual', 'inspirational', 'educational'].filter(
        (t) => t !== mostCommonTone
      );
      const suggestedTone = alternateTones[0];
      suggestions.push(
        `${toneModifier} writing in a ${suggestedTone} tone — you've had ${dominantCount} ${mostCommonTone} posts recently.`
      );
    }
  }

  // Check style variety
  if (patterns.styles.length >= 3) {
    const mostCommonStyle = getMostCommon(patterns.styles);
    const styleFreq = getFrequency(patterns.styles);
    const dominantCount = styleFreq.get(mostCommonStyle!) || 0;

    if (dominantCount >= 3 && patterns.styles.length >= 5) {
      const alternateStyles = ['story-based', 'list-format', 'question-based', 'how-to'].filter(
        (s) => s !== mostCommonStyle
      );
      const suggestedStyle = alternateStyles[0];
      const styleLabel = suggestedStyle.replace(/-/g, ' ');
      suggestions.push(
        `${toneModifier} a ${styleLabel} post — you've written ${dominantCount} ${mostCommonStyle?.replace(
          /-/g,
          ' '
        )} posts lately.`
      );
    }
  }

  // Check identity balance (if user has diverse expertise)
  if (userProfile.expertise && userProfile.expertise.length >= 2) {
    const expertise = userProfile.expertise;
    if (expertise.length >= 2) {
      suggestions.push(
        `${toneModifier} exploring your ${expertise[1]} background — you've been focusing heavily on ${expertise[0]} recently.`
      );
    }
  }

  // Length variety
  if (patterns.lengths.length >= 3) {
    const mostCommonLength = getMostCommon(patterns.lengths);
    const lengthFreq = getFrequency(patterns.lengths);
    const dominantCount = lengthFreq.get(mostCommonLength!) || 0;

    if (dominantCount >= 3 && patterns.lengths.length >= 5) {
      const alternateLengths = ['short', 'medium', 'long'].filter((l) => l !== mostCommonLength);
      const suggestedLength = alternateLengths[0];
      suggestions.push(
        `${toneModifier} a ${suggestedLength} post for variety — you've been consistent with ${mostCommonLength} recently.`
      );
    }
  }

  return suggestions;
}

/**
 * Get tone modifier based on temperature
 */
export function getToneModifier(temperature: number, index: number = 0): string {
  const modifiers = TONE_MODIFIERS[temperature] || TONE_MODIFIERS[3];
  return modifiers[index % modifiers.length];
}

/**
 * Create a mentorship suggestion object
 */
export function createSuggestion(
  userId: string,
  message: string,
  type: MentorshipSuggestion['type'],
  slot: MentorshipSlot,
  temperature: number,
  context: { draftCount: number; patterns: string[] }
): Omit<MentorshipSuggestion, 'id' | 'createdAt' | 'expiresAt'> {
  return {
    userId,
    message,
    type,
    slot,
    temperature,
    context,
    dismissedAt: undefined,
  };
}
