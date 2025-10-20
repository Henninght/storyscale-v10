/**
 * Mentor Personality System
 * Defines the voice, style, and personality patterns for the writing mentor
 */

export interface MentorPersonality {
  name: string;
  style: 'thoughtful' | 'balanced' | 'direct';
  greetings: string[];
  signOffs: string[];
  encouragements: string[];
  challenges: string[];
}

/**
 * Greeting patterns by time of day
 */
export function getMentorGreeting(mentorName: string, temperature: number): string {
  const hour = new Date().getHours();
  const firstName = mentorName.split(' ')[0];

  let timeGreeting = '';
  if (hour < 12) timeGreeting = 'Morning';
  else if (hour < 17) timeGreeting = 'Afternoon';
  else timeGreeting = 'Evening';

  const greetings = {
    subtle: [
      `${timeGreeting}`,
      `Quick thought`,
      `I noticed something`,
    ],
    balanced: [
      `Hey there`,
      `${timeGreeting}!`,
      `I've been thinking`,
    ],
    proactive: [
      `Let's talk`,
      `Listen up`,
      `Challenge time`,
    ],
  };

  const style = temperature <= 2 ? 'subtle' : temperature <= 4 ? 'balanced' : 'proactive';
  const options = greetings[style];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get voice patterns based on temperature
 */
export const VOICE_PATTERNS = {
  // Level 1-2: Thoughtful observer - gentle, whisper-like insights
  thoughtful: {
    openings: [
      "I've noticed",
      "Something interesting",
      "Quick observation",
      "Just thinking",
      "I wonder if",
    ],
    transitions: [
      "and",
      "which makes me think",
      "so",
      "but",
    ],
    closings: [
      "Just a thought.",
      "Worth considering?",
      "What do you think?",
      "Food for thought.",
    ],
    encouragements: [
      "You're doing great",
      "I like where this is going",
      "This is working well",
      "Nice progress",
    ],
  },

  // Level 3: Balanced coach - friendly, encouraging
  balanced: {
    openings: [
      "Here's something I noticed",
      "Quick thought",
      "I've been watching your posts",
      "Can I share something?",
      "Let me show you something",
    ],
    transitions: [
      "and here's why",
      "but",
      "so here's an idea",
      "which means",
    ],
    closings: [
      "What do you say?",
      "Worth a try?",
      "Sound good?",
      "Let's do this!",
    ],
    encouragements: [
      "You're on a roll!",
      "Love seeing this",
      "This is really strong",
      "You're getting better at this",
    ],
  },

  // Level 4-5: Direct mentor - challenging, pushing growth
  direct: {
    openings: [
      "Let's talk about",
      "I want to challenge you",
      "Here's what I'm seeing",
      "Real talk",
      "Time for a push",
    ],
    transitions: [
      "but here's the thing",
      "so",
      "which means",
      "and that's why",
    ],
    closings: [
      "Go for it.",
      "You've got this.",
      "Make it happen.",
      "Challenge accepted?",
    ],
    encouragements: [
      "This is your best work yet",
      "Now we're talking",
      "That's what I'm talking about",
      "You're leveling up",
    ],
  },
};

/**
 * Get mentor's voice style based on temperature
 */
export function getMentorVoice(temperature: number): keyof typeof VOICE_PATTERNS {
  if (temperature <= 2) return 'thoughtful';
  if (temperature <= 4) return 'balanced';
  return 'direct';
}

/**
 * Generate a natural opening for mentor message
 */
export function getMentorOpening(temperature: number): string {
  const voice = getMentorVoice(temperature);
  const openings = VOICE_PATTERNS[voice].openings;
  return openings[Math.floor(Math.random() * openings.length)];
}

/**
 * Generate a natural closing for mentor message
 */
export function getMentorClosing(temperature: number): string {
  const voice = getMentorVoice(temperature);
  const closings = VOICE_PATTERNS[voice].closings;
  return closings[Math.floor(Math.random() * closings.length)];
}

/**
 * Generate encouragement message
 */
export function getMentorEncouragement(temperature: number): string {
  const voice = getMentorVoice(temperature);
  const encouragements = VOICE_PATTERNS[voice].encouragements;
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

/**
 * Create mentor personas for different styles
 */
export const MENTOR_PERSONAS: Record<string, MentorPersonality> = {
  alex: {
    name: 'Alex',
    style: 'balanced',
    greetings: ['Hey', 'Hi there', "What's up", 'Morning', 'Afternoon'],
    signOffs: ['Keep writing!', 'You got this', 'Go create!', 'Have fun with it'],
    encouragements: [
      "You're doing great",
      'Love this direction',
      'This is really strong',
      "You're on fire today",
    ],
    challenges: [
      'Try pushing yourself here',
      'What if you went deeper?',
      "Don't play it safe",
      'Your audience can handle more',
    ],
  },
  sage: {
    name: 'Sage',
    style: 'thoughtful',
    greetings: ['I notice', 'Interesting', 'Hmm', 'Observe'],
    signOffs: ['Ponder this', 'Worth considering', 'Think on it', 'Reflect'],
    encouragements: [
      'Wise choice',
      'Thoughtful approach',
      'I see the wisdom here',
      'Well considered',
    ],
    challenges: [
      'Dig deeper',
      'What lies beneath?',
      'Question your assumptions',
      'Seek the truth',
    ],
  },
  coach: {
    name: 'Coach',
    style: 'direct',
    greetings: ["Let's go", "Listen up", "Pay attention", "Here's the deal"],
    signOffs: ['Make it happen', 'Get after it', 'Go!', 'Show me what you got'],
    encouragements: [
      "That's what I'm talking about!",
      'Now we're cooking',
      'Excellent work',
      'You're leveling up',
    ],
    challenges: [
      'Push harder',
      "Don't settle",
      'You can do better',
      'Give me your best',
    ],
  },
};

/**
 * Get default mentor persona (can be customized by user later)
 */
export function getDefaultMentorPersona(): MentorPersonality {
  return MENTOR_PERSONAS.alex;
}

/**
 * Get mentor persona by name
 */
export function getMentorPersona(name: string): MentorPersonality {
  return MENTOR_PERSONAS[name.toLowerCase()] || getDefaultMentorPersona();
}

/**
 * Humanize a suggestion message with personality
 */
export function humanizeSuggestion(
  rawMessage: string,
  temperature: number,
  mentorName: string = 'Alex'
): string {
  const voice = getMentorVoice(temperature);
  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // If message already has personality, return as-is
  if (rawMessage.includes('!') || rawMessage.includes('?')) {
    return rawMessage;
  }

  // Add opening and closing for natural flow
  return `${opening} — ${rawMessage.toLowerCase()} ${closing}`;
}
