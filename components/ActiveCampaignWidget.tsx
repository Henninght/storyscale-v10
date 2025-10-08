'use client';

import { useRouter } from 'next/navigation';
import { Megaphone, Calendar, Lightbulb, Play, Eye, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';

interface ActiveCampaignWidgetProps {
  campaign: {
    id: string;
    name: string;
    description: string;
    targetPostCount: number;
    postsGenerated: number;
    frequency: 'daily' | '3x_week' | 'weekly';
    startDate: any;
    aiStrategy?: {
      postBlueprints?: Array<{
        position: number;
        topic: string;
        goal: string;
      }>;
    };
  };
  onPause?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ActiveCampaignWidget({ campaign, onPause, isCollapsed = false, onToggleCollapse }: ActiveCampaignWidgetProps) {
  const router = useRouter();

  const progress = (campaign.postsGenerated / campaign.targetPostCount) * 100;
  const nextPostNumber = campaign.postsGenerated + 1;
  const isComplete = campaign.postsGenerated >= campaign.targetPostCount;

  // Calculate next post due date based on frequency
  const getNextPostDate = () => {
    const startDate = campaign.startDate?.toDate ? campaign.startDate.toDate() : new Date();
    const daysToAdd = campaign.frequency === 'daily' ? campaign.postsGenerated :
                      campaign.frequency === '3x_week' ? Math.floor(campaign.postsGenerated * 2.33) :
                      campaign.postsGenerated * 7;
    return addDays(startDate, daysToAdd);
  };

  const nextDueDate = getNextPostDate();

  // Get AI-suggested topic for next post
  const nextPostTopic = campaign.aiStrategy?.postBlueprints?.find(
    bp => bp.position === nextPostNumber
  )?.topic || `Post ${nextPostNumber} of ${campaign.targetPostCount}`;

  const handleGeneratePost = () => {
    router.push(`/app/create?campaign=${campaign.id}`);
  };

  const handleViewCampaign = () => {
    router.push(`/app/campaigns/${campaign.id}`);
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm hover:border-blue-200 transition-all cursor-pointer"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Active Campaign</h3>
              <p className="text-sm text-slate-600">{campaign.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {campaign.postsGenerated} / {campaign.targetPostCount}
            </span>
            <ChevronDown className="h-5 w-5 text-slate-600" />
          </div>
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm hover-lift-sm">
      {/* Header */}
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-700">Active Campaign</h3>
            <p className="text-sm text-slate-600">{campaign.name}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {!isComplete && (
            <Button
              onClick={onPause}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            size="sm"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2.5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="text-slate-600">
            {campaign.postsGenerated} / {campaign.targetPostCount} posts
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-orange-700 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {isComplete ? (
        /* Campaign Complete State */
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="font-medium text-green-700">🎉 Campaign Complete!</p>
          <p className="mt-1 text-sm text-green-600">
            You&apos;ve generated all {campaign.targetPostCount} posts
          </p>
          <Button
            onClick={handleViewCampaign}
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
          >
            <Eye className="h-4 w-4" />
            View Campaign
          </Button>
        </div>
      ) : (
        <>
          {/* Next Post Info */}
          <div className="mb-2.5 space-y-2">
            {/* Next Post Due Date */}
            <div className="flex items-start gap-3 rounded-lg bg-blue-50/50 p-3">
              <div className="rounded bg-blue-100 p-1">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Next Post Due</p>
                <p className="text-xs text-slate-600">
                  {format(nextDueDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* AI-Suggested Topic */}
            <div className="flex items-start gap-3 rounded-lg bg-blue-50/50 p-3">
              <div className="rounded bg-amber-100 p-1">
                <Lightbulb className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Suggested Topic</p>
                <p className="text-xs text-slate-700">{nextPostTopic}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePost}
              className="flex-1 gap-2"
            >
              <Play className="h-4 w-4" />
              Generate Post {nextPostNumber}
            </Button>
            <Button
              onClick={handleViewCampaign}
              variant="secondary"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
