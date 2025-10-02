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
  {
    id: 'educational-series',
    name: 'Educational Series',
    description: 'Teach your audience valuable skills or knowledge through a structured learning journey.',
    icon: '📚',
    defaultSettings: {
      frequency: '3x_week',
      style: 'how-to',
      targetPostCount: 12,
      tone: 'educational',
      purpose: 'engagement',
    },
  },
  {
    id: 'company-updates',
    name: 'Company Updates',
    description: 'Keep your network informed about company milestones, culture, and behind-the-scenes insights.',
    icon: '🏢',
    defaultSettings: {
      frequency: 'weekly',
      style: 'story-based',
      targetPostCount: 6,
      tone: 'casual',
      purpose: 'brand_awareness',
    },
  },
  {
    id: 'case-study-series',
    name: 'Case Study Series',
    description: 'Showcase successful client outcomes and demonstrate the value of your solutions with real examples.',
    icon: '📊',
    defaultSettings: {
      frequency: 'weekly',
      style: 'story-based',
      targetPostCount: 5,
      tone: 'professional',
      purpose: 'lead_generation',
    },
  },
  {
    id: 'industry-insights',
    name: 'Industry Insights',
    description: 'Share analysis and commentary on industry trends, news, and emerging developments.',
    icon: '🔍',
    defaultSettings: {
      frequency: '3x_week',
      style: 'list-format',
      targetPostCount: 10,
      tone: 'professional',
      purpose: 'thought_leadership',
    },
  },
];
