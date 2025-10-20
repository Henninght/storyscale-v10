'use client';

import { useRouter } from 'next/navigation';
import { Megaphone, Plus, Calendar, TrendingUp } from 'lucide-react';
import type { Campaign } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface CampaignStripProps {
  campaigns: (Campaign & { id: string })[];
  maxVisible?: number;
}

export function CampaignStrip({ campaigns, maxVisible = 3 }: CampaignStripProps) {
  const router = useRouter();

  const calculateProgress = (campaign: Campaign & { id: string }) => {
    const { postsGenerated, targetPostCount } = campaign;
    return Math.min(100, Math.round((postsGenerated / targetPostCount) * 100));
  };

  const formatDueDate = (endDate: Timestamp) => {
    const end = endDate.toDate();
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    if (diffDays <= 7) return `${diffDays} days left`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks left`;
    return `${Math.ceil(diffDays / 30)} months left`;
  };

  const visibleCampaigns = campaigns.slice(0, maxVisible);
  const overflowCount = campaigns.length - maxVisible;

  return (
    <div className="relative">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {visibleCampaigns.map((campaign) => {
          const progress = calculateProgress(campaign);
          const dueDate = formatDueDate(campaign.endDate);

          return (
            <button
              key={campaign.id}
              onClick={() => router.push(`/app/campaigns/${campaign.id}`)}
              className="group relative flex min-w-[280px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Megaphone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-800 line-clamp-1">
                      {campaign.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {campaign.postsGenerated} / {campaign.targetPostCount} posts
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-purple-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{dueDate}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Overflow Indicator */}
        {overflowCount > 0 && (
          <button
            onClick={() => router.push('/app/campaigns')}
            className="flex min-w-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-100"
          >
            <div className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold">
              +{overflowCount}
            </div>
            <span className="text-xs">more</span>
          </button>
        )}

        {/* New Campaign Tile */}
        <button
          onClick={() => router.push('/app/campaigns?new=true')}
          className="flex min-w-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/30 p-4 transition-all hover:border-orange-400 hover:bg-orange-50"
        >
          <div className="rounded-full bg-orange-100 p-3">
            <Plus className="h-5 w-5 text-orange-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-orange-700">New Campaign</p>
            <p className="text-xs text-orange-600">Plan a content series</p>
          </div>
        </button>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
