export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultSettings: {
    frequency: 'daily' | '3x_week' | 'weekly';
    style: string;
    targetPostCount: number;
    tone: string;
    purpose: string;
  };
}

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Build anticipation and excitement for a new product or feature release with a strategic announcement series.',
    icon: '🚀',
    defaultSettings: {
      frequency: '3x_week',
      style: 'story-based',
      targetPostCount: 8,
      tone: 'inspirational',
      purpose: 'brand_awareness',
    },
  },
  {
    id: 'thought-leadership',
    name: 'Thought Leadership Series',
    description: 'Establish yourself as an industry expert by sharing insights, trends, and forward-thinking perspectives.',
    icon: '💡',
    defaultSettings: {
      frequency: 'weekly',
      style: 'question-based',
      targetPostCount: 10,
      tone: 'professional',
      purpose: 'thought_leadership',
    },
  },
];
