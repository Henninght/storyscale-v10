import { Timestamp } from "firebase/firestore";

// Account Type
export type AccountType = "private" | "company" | "";

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
}

// Subscription Types
export type SubscriptionTier = "free" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete";

export interface Subscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Timestamp;
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

export interface Draft {
  userId: string;
  content: string;
  status: DraftStatus;
  language: Language;
  tags: string[];
  scheduledDate?: Timestamp;
  wizardSettings: WizardSettings;
  campaignId?: string;
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
