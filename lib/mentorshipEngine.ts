import { Draft, UserProfile, MentorshipSuggestion, MentorshipSlot } from '@/types';
import {
  getMentorVoice,
  getMentorOpening,
  getMentorClosing,
  getMentorGreeting,
  VOICE_PATTERNS,
} from './mentorPersonality';

interface MentorshipConfig {
  temperature: number; // 1-5
  customInstructions: string;
  userProfile: UserProfile;
  recentDrafts: Draft[];
  mentorName?: string;
}

interface DraftPattern {
  topics: string[];
  tones: string[];
  styles: string[];
  lengths: string[];
  avgLength: number;
  languageDistribution: { en: number; no: number };
}

/**
 * Create a natural mentor message with personality
 */
function createMentorMessage(
  core: string,
  temperature: number,
  mentorName: string = 'Alex'
): string {
  const voice = getMentorVoice(temperature);
  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // Build natural sentence structure
  if (temperature <= 2) {
    // Subtle: gentle observation
    return `${opening} — ${core.toLowerCase()} ${closing}`;
  } else if (temperature <= 4) {
    // Balanced: friendly suggestion
    return `${opening}: ${core} ${closing}`;
  } else {
    // Proactive: direct challenge
    return `${opening} ${core} ${closing}`;
  }
}

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
  const { temperature, customInstructions, userProfile, recentDrafts, mentorName = 'Alex' } = config;
  const patterns = analyzeDraftPatterns(recentDrafts);
  const suggestions: string[] = [];

  // If user has custom instructions, prioritize those
  if (customInstructions.trim()) {
    suggestions.push(...generateCustomInstructionSuggestions(customInstructions, temperature, mentorName));
  }

  // Generate pattern-based suggestions
  const patternSuggestions = generatePatternSuggestions(patterns, userProfile, temperature, mentorName);
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
  temperature: number,
  mentorName: string = 'Alex'
): string[] {
  const suggestions: string[] = [];
  const lowerInstructions = instructions.toLowerCase();

  // Character limit reminder
  if (lowerInstructions.includes('under') && lowerInstructions.includes('character')) {
    const match = instructions.match(/under (\d+) character/i);
    if (match) {
      const core = `you've set a ${match[1]}-character limit. Your last post was getting close to that`;
      suggestions.push(createMentorMessage(core, temperature, mentorName));
    }
  }

  // Topic suggestions
  if (lowerInstructions.includes('suggest') && lowerInstructions.includes('about')) {
    const topicMatch = instructions.match(/about (.+?)(?:\.|$)/i);
    if (topicMatch) {
      const topic = topicMatch[1].trim();
      const core = `what about writing on ${topic}? It's been on your list`;
      suggestions.push(createMentorMessage(core, temperature, mentorName));
    }
  }

  // Format variety
  if (lowerInstructions.includes('vary') && lowerInstructions.includes('format')) {
    const core = `time to mix up your post format. You wanted variety, right?`;
    suggestions.push(createMentorMessage(core, temperature, mentorName));
  }

  // Tone suggestions
  if (lowerInstructions.includes('inspirational')) {
    const core = `share something inspirational. Your audience needs that energy`;
    suggestions.push(createMentorMessage(core, temperature, mentorName));
  }

  if (lowerInstructions.includes('actionable')) {
    const core = `give your readers something they can actually do. Balance the theory with action`;
    suggestions.push(createMentorMessage(core, temperature, mentorName));
  }

  return suggestions;
}

/**
 * Generate pattern-based suggestions
 */
function generatePatternSuggestions(
  patterns: DraftPattern,
  userProfile: UserProfile,
  temperature: number,
  mentorName: string = 'Alex'
): string[] {
  const suggestions: string[] = [];

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
      const core = `you've written ${dominantCount} ${mostCommonTone} posts in a row. What if you tried a ${suggestedTone} tone next?`;
      suggestions.push(createMentorMessage(core, temperature, mentorName));
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
      const core = `I'm seeing a lot of ${mostCommonStyle?.replace(/-/g, ' ')} posts. Try a ${styleLabel} approach for your next one`;
      suggestions.push(createMentorMessage(core, temperature, mentorName));
    }
  }

  // Check identity balance (if user has diverse expertise)
  if (userProfile.expertise && userProfile.expertise.length >= 2) {
    const expertise = userProfile.expertise;
    if (expertise.length >= 2) {
      const core = `you have a ${expertise[1]} background too. Your audience would love to hear about that side of you`;
      suggestions.push(createMentorMessage(core, temperature, mentorName));
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
      const core = `all your recent posts are ${mostCommonLength}. Mix it up with a ${suggestedLength} one`;
      suggestions.push(createMentorMessage(core, temperature, mentorName));
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
