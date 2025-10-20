import { getMentorOpening, getMentorClosing } from './mentorPersonality';

interface CampaignDraft {
  status: 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';
  content: string;
  createdAt: Date;
}

interface Campaign {
  targetPostCount: number;
  postsGenerated: number;
  frequency: 'daily' | '3x_week' | 'weekly';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'archived';
}

/**
 * Analyze campaign pacing and content balance
 */
export function getCampaignMentorAdvice(
  campaign: Campaign,
  drafts: CampaignDraft[],
  temperature: number = 3
): string | null {
  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  // Check draft status balance
  const inProgress = drafts.filter(d => d.status === 'in_progress' || d.status === 'idea').length;
  const ready = drafts.filter(d => d.status === 'ready_to_post').length;
  const posted = drafts.filter(d => d.status === 'posted').length;

  // Too many drafts in progress
  if (inProgress > 3 && temperature >= 3) {
    return `${opening}: You have ${inProgress} posts in progress. Focus on finishing what you started before creating more. ${closing}`;
  }

  // Great momentum
  if (posted >= 3 && inProgress === 0 && ready === 0 && temperature >= 3) {
    return `${opening}: ${posted} posts published! You're crushing it. Time to create the next batch. ${closing}`;
  }

  // Check pacing against schedule
  const daysSinceStart = Math.floor((Date.now() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24));
  let expectedPosts = 0;

  switch (campaign.frequency) {
    case 'daily':
      expectedPosts = Math.min(daysSinceStart, campaign.targetPostCount);
      break;
    case '3x_week':
      expectedPosts = Math.min(Math.floor(daysSinceStart / 7) * 3 + Math.min((daysSinceStart % 7) * 0.43, 3), campaign.targetPostCount);
      break;
    case 'weekly':
      expectedPosts = Math.min(Math.floor(daysSinceStart / 7), campaign.targetPostCount);
      break;
  }

  // Behind schedule
  if (posted < expectedPosts - 2 && campaign.status === 'active' && temperature >= 4) {
    return `${opening} You're ${expectedPosts - posted} posts behind schedule. Time to catch up. ${closing}`;
  }

  // Ahead of schedule
  if (posted > expectedPosts + 2 && campaign.status === 'active' && temperature >= 3) {
    return `${opening}: You're ahead of schedule! ${posted - expectedPosts} posts ahead. Great work maintaining momentum. ${closing}`;
  }

  // Campaign nearly complete
  const completionPercent = (posted / campaign.targetPostCount) * 100;
  if (completionPercent >= 80 && completionPercent < 100 && temperature >= 3) {
    return `${opening}: You're ${Math.round(completionPercent)}% done! Just ${campaign.targetPostCount - posted} posts to go. Finish strong. ${closing}`;
  }

  // Too many ready posts not published
  if (ready >= 5 && temperature >= 4) {
    return `${opening} You have ${ready} posts ready to publish. What are you waiting for? Ship them. ${closing}`;
  }

  // Good balance
  if (inProgress <= 2 && ready >= 1 && ready <= 3 && temperature >= 2) {
    return `${opening} Nice balance: ${ready} ready, ${inProgress} in progress. Keep this rhythm going. ${closing}`;
  }

  return null;
}

/**
 * Get campaign completion advice
 */
export function getCampaignCompletionAdvice(
  campaign: Campaign,
  drafts: CampaignDraft[],
  temperature: number = 3
): string | null {
  const opening = getMentorOpening(temperature);
  const closing = getMentorClosing(temperature);

  const posted = drafts.filter(d => d.status === 'posted').length;
  const ready = drafts.filter(d => d.status === 'ready_to_post').length;
  const inProgress = drafts.filter(d => d.status === 'in_progress' || d.status === 'idea').length;

  // All generated, none posted
  if (drafts.length === campaign.targetPostCount && posted === 0 && temperature >= 4) {
    return `${opening} You generated all ${campaign.targetPostCount} posts but haven't published any. Time to go live. ${closing}`;
  }

  // All generated, some ready
  if (drafts.length === campaign.targetPostCount && ready > 0 && temperature >= 3) {
    return `${opening}: You have ${ready} posts ready to publish. Schedule them and wrap this campaign up. ${closing}`;
  }

  // All posted successfully
  if (posted === campaign.targetPostCount && temperature >= 2) {
    return `${opening}: All ${posted} posts published! Campaign complete. Take a moment to review what worked. ${closing}`;
  }

  return null;
}
