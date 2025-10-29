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

  let score = 5; // Start with neutral score
  const feedback: string[] = [];
  const suggestions: string[] = [];

  // Detect intent
  const detectedIntent = detectIntent(lowerInput);

  // Check for specificity
  const hasNumbers = /\d+/.test(input);
  const hasSpecificTerms = /\b(users?|testers?|people|founders?|professionals?|developers?|designers?)\b/i.test(input);
  const hasProductName = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/.test(input); // CamelCase words
  const isSpecific = hasNumbers || hasProductName || hasSpecificTerms;

  if (hasNumbers) {
    score += 1;
  } else {
    feedback.push('Add specific numbers (e.g., "5-10 users", "2x per week")');
    suggestions.push('Quantify your needs: How many testers? How often should they post?');
  }

  if (hasProductName) {
    score += 1;
  } else if (detectedIntent === 'announcement') {
    feedback.push('No product/project name detected');
    suggestions.push('Name your product explicitly for clarity');
  }

  // Check for call-to-action
  const ctaKeywords = /(comment|dm|message|reach out|contact|apply|join|interested|let me know|connect)/i;
  const hasCallToAction = ctaKeywords.test(lowerInput);

  if (hasCallToAction) {
    score += 2;
  } else if (detectedIntent === 'announcement' || currentSettings?.purpose === 'network_building') {
    score -= 1;
    feedback.push('Missing clear call-to-action');
    suggestions.push('Add how people can engage: "DM me", "Comment below", "Apply here"');
  }

  // Check for unique details/value prop
  const valuePropositions = /(helps?|creates?|enables?|solves?|makes|builds?|improves?|faster|better|easier)/i;
  const hasUniqueDetails = valuePropositions.test(lowerInput);

  if (hasUniqueDetails) {
    score += 2;
  } else if (detectedIntent === 'announcement') {
    score -= 1;
    feedback.push('No value proposition or unique details');
    suggestions.push('What makes your product different? What problem does it solve?');
  }

  // Check word count appropriateness
  if (wordCount < 10) {
    score -= 2;
    feedback.push('Input is very brief - may produce generic output');
    suggestions.push('Add 1-2 more sentences with context or specifics');
  } else if (wordCount > 100) {
    feedback.push('Input is quite long - consider being more concise');
  } else {
    score += 1; // Good length
  }

  // Detect mismatch between intent and settings
  const recommendedSettings = detectSettingsMismatch(detectedIntent, currentSettings);

  if (recommendedSettings && Object.keys(recommendedSettings).length > 0) {
    score -= 1;
    feedback.push('Settings may not match your input type');
  }

  // Ensure score is within 0-10 range
  score = Math.max(0, Math.min(10, Math.round(score)));

  return {
    score,
    feedback,
    suggestions,
    detectedIntent,
    isSpecific,
    wordCount,
    hasCallToAction,
    hasNumbers,
    hasUniqueDetails,
    recommendedSettings: Object.keys(recommendedSettings).length > 0 ? recommendedSettings : undefined,
  };
}

/**
 * Detect user's intent from input text
 */
function detectIntent(lowerInput: string): DetectedIntent {
  // Announcement patterns
  if (/(looking for|seeking|need|want|search for|recruiting|hiring|accepting)\s+(test\s)?users?|beta\s?testers?/i.test(lowerInput)) {
    return 'announcement';
  }
  if (/(launch|built|created|released|shipping|announcing|introducing)/i.test(lowerInput)) {
    return 'announcement';
  }

  // Story patterns
  if (/(months? ago|years? ago|yesterday|last (week|month|year)|when i|i remember|story|journey)/i.test(lowerInput)) {
    return 'story';
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
    if (currentSettings.style === 'story') {
      recommendations.style = 'list_format';
      recommendations.purpose = 'network_building';
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
 * Get style-specific input examples
 */
export function getExamplesForSettings(settings: {
  style?: string;
  purpose?: string;
  tone?: string;
}): { bad: string; good: string; explanation: string }[] {
  const { style, purpose } = settings;

  // Announcement examples
  if (purpose === 'network_building' || style === 'announcement') {
    return [
      {
        bad: 'Looking for test users',
        good: 'Looking for 5-10 active LinkedIn users who post 2x/week to test StoryScale beta. Free lifetime access + priority support.',
        explanation: 'Specific numbers, clear criteria, explicit benefits'
      },
      {
        bad: 'I built an app',
        good: 'Built StoryScale - creates LinkedIn content 10x faster with AI. Seeking testers who struggle with consistent posting.',
        explanation: 'Product name, value proposition, target audience'
      }
    ];
  }

  // Story examples
  if (style === 'story') {
    return [
      {
        bad: 'I learned something interesting',
        good: 'Three months ago, I spent 4 hours writing one LinkedIn post. Yesterday, I created 5 posts in 30 minutes using StoryScale.',
        explanation: 'Specific timeframes, concrete details, clear transformation'
      },
      {
        bad: 'Had a good experience with a client',
        good: 'Client came to me with 40% revenue drop. We rebuilt their workflow. Two months later: 65% revenue increase.',
        explanation: 'Specific numbers, clear problem-solution-result'
      }
    ];
  }

  // Question-based examples
  if (style === 'question_based') {
    return [
      {
        bad: 'What do you think?',
        good: 'You\'re building a SaaS product: Do you prioritize features users request OR features that drive retention? Why?',
        explanation: 'Specific context, clear choice, invites reasoning'
      }
    ];
  }

  // List format examples
  if (style === 'list_format') {
    return [
      {
        bad: 'Here are some tips',
        good: '3 mistakes I made launching my first product: pricing too low, launching without email list, ignoring user feedback for 3 months.',
        explanation: 'Specific number, concrete examples, relatable mistakes'
      }
    ];
  }

  // Generic examples
  return [
    {
      bad: 'Share your thoughts on this',
      good: 'Spent 6 months testing LinkedIn algorithms. Found that posts with 15+ word comments get 3x more reach than simple reactions. Try this: Ask specific questions that require detailed answers.',
      explanation: 'Specific data, actionable insight, clear recommendation'
    }
  ];
}
