import { Timestamp } from "firebase/firestore";

// Account Type
export type AccountType = "private" | "company" | "";

// Mentorship Settings Types
export interface MentorshipSettings {
  enabled: boolean;
  temperature: number; // 1-5 scale (1=subtle, 5=proactive)
  customInstructions: string;
  mentorName?: string; // Customizable mentor name (default: "Alex")
  mentorStyle?: 'thoughtful' | 'balanced' | 'direct'; // Mentor personality
  snoozedUntil?: Timestamp;
}

// User Profile Types
export interface UserProfile {
  accountType: AccountType;
  background: string;
  expertise: string[];
  targetAudience: string;
  goals: string;
  writingStyle: string;
  brandVoice: string;
  companyName?: string; // For company accounts only
  companyIndustry?: string; // For company accounts only
  mentorshipSettings?: MentorshipSettings; // Mentorship mode configuration
}

// Subscription Types
export type SubscriptionTier = "free" | "trial" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete";

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Timestamp;
  trialEndDate?: Timestamp;
}

// User Document
export interface User {
  email: string;
  displayName: string;
  photoURL?: string;
  profile: UserProfile;
  subscription: Subscription;
  postsUsedThisMonth: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Draft Types
export type DraftStatus = "idea" | "in_progress" | "ready_to_post" | "posted" | "archived";
export type Language = "en" | "no";
export type PostLength = "short" | "medium" | "long";
export type EmojiUsage = "none" | "minimal" | "moderate";

export interface WizardSettings {
  input: string;
  referenceUrls: string[];
  tone: string;
  purpose: string;
  audience: string;
  style: string;
  length: PostLength;
  includeCTA: boolean;
  emojiUsage: EmojiUsage;
}

// Draft Image
export interface DraftImage {
  id: string;
  url: string;              // Public Firebase Storage URL
  storagePath: string;      // Firebase Storage path for deletion
  alt?: string;             // Alt text for accessibility
  generatedByAI?: boolean;  // Was this AI-generated?
  prompt?: string;          // DALL-E prompt if AI-generated
  createdAt: Timestamp;
}

export interface Draft {
  userId: string;
  content: string;
  status: DraftStatus;
  language: Language;
  tags: string[];
  scheduledDate?: Timestamp;
  wizardSettings: WizardSettings;
  campaignId?: string;
  images?: DraftImage[];      // Attached images
  linkedInPostId?: string;    // LinkedIn post ID when posted
  postedAt?: Timestamp;       // When posted to LinkedIn
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Draft Version
export interface DraftVersion {
  content: string;
  createdAt: Timestamp;
}

// Campaign Types
export type CampaignStatus = "active" | "completed" | "archived";
export type PostingFrequency = "daily" | "3x_week" | "weekly";

export interface Campaign {
  userId: string;
  name: string;
  theme: string;
  description: string;
  language: Language;
  startDate: Timestamp;
  endDate: Timestamp;
  frequency: PostingFrequency;
  targetPostCount: number;
  style: string;
  templateId?: string;
  status: CampaignStatus;
  postsGenerated: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Campaign Template
export interface CampaignTemplate {
  name: string;
  description: string;
  defaultSettings: {
    frequency: PostingFrequency;
    style: string;
    tone: string;
    targetPostCount: number;
  };
  createdAt: Timestamp;
}

// Wizard Configuration Options
export const TONE_OPTIONS = [
  "Professional",
  "Casual",
  "Inspirational",
  "Educational",
] as const;

export const PURPOSE_OPTIONS = [
  "Engagement",
  "Lead Generation",
  "Brand Awareness",
  "Thought Leadership",
] as const;

export const AUDIENCE_OPTIONS = [
  "Executives",
  "Entrepreneurs",
  "Professionals",
  "Industry Specialists",
] as const;

export const STYLE_OPTIONS = [
  "Story-Based",
  "List Format",
  "Question-Based",
  "How-To",
] as const;

export type Tone = typeof TONE_OPTIONS[number];
export type Purpose = typeof PURPOSE_OPTIONS[number];
export type Audience = typeof AUDIENCE_OPTIONS[number];
export type Style = typeof STYLE_OPTIONS[number];

// Post Feedback Types
export type FeedbackRating = "thumbs_up" | "thumbs_down" | null;

export interface PostFeedback {
  draftId: string;
  userId: string;
  rating: FeedbackRating;
  regenerated: number; // Number of times regenerated
  editPercentage: number; // Percentage of content edited from original
  timeToReady: number; // Time in seconds from creation to "ready_to_post" status
  wizardSettings: WizardSettings;
  originalLength: number;
  finalLength: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// App Feedback Types (general user feedback)
export type FeedbackCategory = "bug" | "feature" | "design" | "other";

export interface AppFeedback {
  userId: string;
  rating: number; // 1-5 stars
  category: FeedbackCategory;
  description: string;
  email: string | null;
  userAgent: string;
  page: string; // Page where feedback was submitted
  createdAt: Timestamp;
}

// Mentorship Suggestion Types
export type MentorshipSuggestionType = "identity" | "variety" | "tone" | "engagement" | "custom";
export type MentorshipSlot = "after_welcome" | "after_drafts" | "in_editor" | "in_wizard" | "post_publish";
export type MentorshipInteractionType = "view" | "dismiss" | "try_it" | "tell_more" | "snooze";

export interface MentorshipSuggestion {
  id: string;
  userId: string;
  type: MentorshipSuggestionType;
  message: string;
  slot: MentorshipSlot;
  dismissedAt?: Timestamp;
  createdAt: Timestamp;
  expiresAt: Timestamp; // 24h TTL
  temperature: number; // Snapshot of user's temperature when generated
  context: {
    draftCount: number;
    patterns: string[];
  };
}
