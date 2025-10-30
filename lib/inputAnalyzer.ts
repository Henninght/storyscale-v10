/**
 * Input Quality Analyzer
 * Analyzes user input and provides feedback for better content generation
 */

export type DetectedIntent =
  | 'announcement'
  | 'story'
  | 'insight'
  | 'question'
  | 'how-to'
  | 'list'
  | 'unknown';

export interface InputAnalysis {
  score: number; // 0-10
  feedback: string[];
  suggestions: string[];
  detectedIntent: DetectedIntent;
  isSpecific: boolean;
  wordCount: number;
  hasCallToAction: boolean;
  hasNumbers: boolean;
  hasUniqueDetails: boolean;
  recommendedSettings?: {
    style?: string;
    purpose?: string;
    length?: string;
  };
}

/**
 * Analyze user input and provide quality score + feedback
 */
export function analyzeInput(
  input: string,
  currentSettings?: {
    style?: string;
    purpose?: string;
    tone?: string;
    length?: string;
  }
): InputAnalysis {
  const words = input.trim().split(/\s+/);
  const wordCount = words.length;
  const lowerInput = input.toLowerCase();

  let score = 6; // Start with decent baseline
  const feedback: string[] = [];
  const suggestions: string[] = [];

  // Detect intent
  const detectedIntent = detectIntent(lowerInput);

  // Check for specificity
  const hasNumbers = /\d+/.test(input);
  const hasSpecificTerms = /\b(users?|testers?|people|founders?|professionals?|developers?|designers?)\b/i.test(input);
  const hasProductName = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/.test(input); // CamelCase words
  const isSpecific = hasNumbers || hasProductName || hasSpecificTerms;

  // Check for metrics (not just any numbers)
  const hasMetrics = /\d+\s*(x|%|times|percent|hours?|minutes?|days?|weeks?|months?|users?|people|clients?|customers?)|\b(doubled?|tripled?|quadrupled?)\b/i.test(input);

  // Celebrate what's good first!
  if (hasMetrics) {
    score += 1;
    feedback.push('✓ Great! Specific metrics included');
  } else if (hasNumbers) {
    feedback.push('✓ Numbers included');
    // Only +0.5 for basic numbers (rounded later)
  }

  // Require BOTH product name AND specific terms for full bonus
  if (hasProductName && hasSpecificTerms) {
    score += 1;
    feedback.push('✓ Clear product name and target audience');
  } else if (hasProductName) {
    feedback.push('✓ Product name mentioned');
    suggestions.push('Consider specifying your target audience');
  } else if (hasSpecificTerms) {
    feedback.push('✓ Target audience mentioned');
    suggestions.push('Add your product/project name for clarity');
  } else {
    suggestions.push('Add product name and target audience');
  }

  // Check for call-to-action
  const ctaKeywords = /(comment|dm|message|reach out|contact|apply|join|interested|let me know|connect)/i;
  const hasCallToAction = ctaKeywords.test(lowerInput);

  if (hasCallToAction) {
    score += 0.5; // Reduced from 1 to make scoring stricter
    feedback.push('✓ Clear call-to-action included');
  } else if (detectedIntent === 'announcement' || currentSettings?.purpose === 'network_building') {
    suggestions.push('Try adding: "Interested? DM me" or "Comment below"');
  }

  // Check for unique details/value prop - be stricter
  const strongValueProps = /(saves?|cuts?|reduces?|increases?|doubles?|improves?|eliminates?|automates?|simplifies?)\s+(time|cost|effort|revenue|efficiency|productivity)/i;
  const basicValueProps = /(helps?|creates?|enables?|solves?|makes|builds?|faster|better|easier)/i;
  const hasStrongValue = strongValueProps.test(lowerInput);
  const hasBasicValue = basicValueProps.test(lowerInput);

  if (hasStrongValue) {
    score += 1;
    feedback.push('✓ Strong value proposition with impact');
  } else if (hasBasicValue) {
    feedback.push('✓ Value proposition mentioned');
    suggestions.push('Try quantifying the benefit (e.g., "saves 4 hours" vs "saves time")');
  } else if (detectedIntent === 'announcement') {
    suggestions.push('What problem does it solve? What benefit do users get?');
  }

  // Check word count appropriateness - be encouraging
  if (wordCount < 8) {
    suggestions.push('Add one more sentence with a bit more detail');
  } else if (wordCount > 120) {
    suggestions.push('Consider keeping it a bit shorter for better engagement');
  } else {
    score += 0.5; // Reduced from 1 to make scoring stricter
    feedback.push('✓ Good input length');
  }

  // Detect mismatch between intent and settings - helpful, not critical
  const recommendedSettings = detectSettingsMismatch(detectedIntent, currentSettings);

  if (recommendedSettings && Object.keys(recommendedSettings).length > 0) {
    // Don't penalize, just inform
    suggestions.push('Your settings might work better if adjusted (see below)');
  }

  // Ensure score is within 0-10 range
  score = Math.max(5, Math.min(9, Math.round(score))); // Cap at 9/10 - reserve 10 for exceptional

  return {
    score,
    feedback,
    suggestions,
    detectedIntent,
    isSpecific,
    wordCount,
    hasCallToAction,
    hasNumbers,
    hasUniqueDetails: hasStrongValue || hasBasicValue,
    recommendedSettings: Object.keys(recommendedSettings).length > 0 ? recommendedSettings : undefined,
  };
}

/**
 * Detect user's intent from input text
 */
function detectIntent(lowerInput: string): DetectedIntent {
  // Story patterns - check FIRST to avoid false positives
  // Stories with time markers like "months ago", "yesterday" should be detected as story, not announcement
  if (/(months? ago|years? ago|yesterday|last (week|month|year)|when i|i remember|story|journey)/i.test(lowerInput)) {
    return 'story';
  }

  // Announcement patterns
  if (/(looking for|seeking|need|want|search for|recruiting|hiring|accepting)\s+(test\s)?users?|beta\s?testers?/i.test(lowerInput)) {
    return 'announcement';
  }
  if (/(launch|built|created|released|shipping|announcing|introducing)/i.test(lowerInput)) {
    return 'announcement';
  }

  // How-to patterns
  if (/(how to|steps? to|guide to|tutorial|here's how|ways? to)/i.test(lowerInput)) {
    return 'how-to';
  }

  // Question patterns
  if (/\?$/.test(lowerInput.trim()) || /^(what|who|where|when|why|how|which|do you|have you|are you|can you)/i.test(lowerInput)) {
    return 'question';
  }

  // List patterns
  if (/(\d+\s+(ways?|things?|tips?|reasons?|mistakes?|lessons?))|(\n-|\n\*|\n\d+\.)/i.test(lowerInput)) {
    return 'list';
  }

  // Insight/observation patterns
  if (/(realized|learned|noticed|observed|discovered|found that|insight|lesson)/i.test(lowerInput)) {
    return 'insight';
  }

  return 'unknown';
}

/**
 * Detect if current settings match the input intent
 */
function detectSettingsMismatch(
  detectedIntent: DetectedIntent,
  currentSettings?: {
    style?: string;
    purpose?: string;
    tone?: string;
    length?: string;
  }
): Partial<InputAnalysis['recommendedSettings']> {
  if (!currentSettings) return {};

  const recommendations: any = {};

  // Announcement intent with Story style = mismatch
  if (detectedIntent === 'announcement') {
    if (currentSettings.style === 'story' || currentSettings.style === 'story-based') {
      recommendations.style = 'direct';
      recommendations.purpose = 'direct_communication';
      recommendations.length = 'very_short';
    }
    if (currentSettings.length === 'long' || currentSettings.length === 'medium') {
      recommendations.length = 'short';
    }
  }

  // Story intent with very short length = mismatch
  if (detectedIntent === 'story' && currentSettings.length === 'very_short') {
    recommendations.length = 'short';
  }

  // Question intent without appropriate style
  if (detectedIntent === 'question' && currentSettings.style !== 'question_based') {
    recommendations.style = 'question_based';
  }

  // How-to intent without appropriate style
  if (detectedIntent === 'how-to' && currentSettings.style !== 'list_format') {
    recommendations.style = 'list_format';
  }

  return recommendations;
}

/**
 * Get input quality level label
 */
export function getQualityLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 9) {
    return { label: 'Excellent', color: 'green', emoji: '🌟' };
  } else if (score >= 7) {
    return { label: 'Good', color: 'blue', emoji: '✅' };
  } else if (score >= 5) {
    return { label: 'Fair', color: 'yellow', emoji: '⚠️' };
  } else if (score >= 3) {
    return { label: 'Needs Work', color: 'orange', emoji: '⚠️' };
  } else {
    return { label: 'Poor', color: 'red', emoji: '❌' };
  }
}

/**
 * Get style-specific input examples - realistic, achievable improvements
 */
export function getExamplesForSettings(settings: {
  style?: string;
  purpose?: string;
  tone?: string;
}): { bad: string; good: string; explanation: string }[] {
  const { style, purpose } = settings;

  // Announcement / Direct style examples - small, achievable improvements
  if (purpose === 'network_building' || purpose === 'direct_communication' || style === 'announcement' || style === 'direct') {
    return [
      {
        bad: 'Looking for test users',
        good: 'Looking for test users for StoryScale. DM me if interested.',
        explanation: 'Just add product name + how to respond'
      },
      {
        bad: 'I built an app',
        good: 'Built StoryScale - helps create LinkedIn content faster.',
        explanation: 'Add one sentence about what it does'
      }
    ];
  }

  // Story examples - realistic improvements
  if (style === 'story') {
    return [
      {
        bad: 'I learned something interesting',
        good: 'Last month I spent 4 hours writing one post. Yesterday I created 5 posts in 30 minutes.',
        explanation: 'Add timeframe and specific outcome'
      },
      {
        bad: 'Had a good client experience',
        good: 'Client had a revenue drop. We rebuilt their workflow. Two months later they saw a 60% increase.',
        explanation: 'Add one number to show impact'
      }
    ];
  }

  // Question-based examples
  if (style === 'question_based') {
    return [
      {
        bad: 'What do you think?',
        good: 'When building SaaS: user-requested features or retention features? What would you prioritize?',
        explanation: 'Add context + specific options'
      }
    ];
  }

  // List format examples
  if (style === 'list_format') {
    return [
      {
        bad: 'Here are some tips',
        good: '3 mistakes I made launching my product: pricing too low, no email list, ignored feedback.',
        explanation: 'Add a number + specific examples'
      }
    ];
  }

  // Generic examples
  return [
    {
      bad: 'Share your thoughts',
      good: 'Tested LinkedIn for 6 months. Posts with longer comments get 3x more reach. Ask specific questions.',
      explanation: 'Add timeframe + one insight'
    }
  ];
}
