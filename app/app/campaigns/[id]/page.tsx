'use client';

import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle2, Clock, FileText, Settings, Archive, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Campaign {
  id: string;
  userId: string;
  name: string;
  theme: string;
  description: string;
  language: 'en' | 'no';
  startDate: Date;
  endDate: Date;
  frequency: 'daily' | '3x_week' | 'weekly';
  targetPostCount: number;
  style: string;
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational';
  purpose?: 'engagement' | 'lead_generation' | 'brand_awareness' | 'thought_leadership';
  audience?: 'executives' | 'entrepreneurs' | 'professionals' | 'industry_specific';
  templateId: string | null;
  status: 'active' | 'completed' | 'archived';
  postsGenerated: number;
  createdAt: Date;
  aiStrategy?: {
    overallApproach: string;
    strategicOverview: string;
    narrativeArc: string;
    successMarkers: string[];
    postBlueprints: Array<{
      position: number;
      topic: string;
      goal: string;
      locked: boolean;
      userCustomized: boolean;
    }>;
  };
}

interface Draft {
  id: string;
  content: string;
  status: 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';
  scheduledDate: Date | null;
  createdAt: Date;
}

const statusColors = {
  idea: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  ready_to_post: 'bg-green-500',
  posted: 'bg-amber-500',
  archived: 'bg-gray-400',
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.push('/login');
        return;
      }

      const db = getFirestore();

      // Fetch campaign
      const campaignRef = doc(db, 'campaigns', campaignId);
      const campaignSnap = await getDoc(campaignRef);

      if (!campaignSnap.exists()) {
        router.push('/app/campaigns');
        return;
      }

      const campaignData = campaignSnap.data();
      setCampaign({
        id: campaignSnap.id,
        ...campaignData,
        startDate: campaignData.startDate?.toDate(),
        endDate: campaignData.endDate?.toDate(),
        createdAt: campaignData.createdAt?.toDate(),
      } as Campaign);

      // Fetch campaign drafts
      const draftsRef = collection(db, 'drafts');
      const q = query(draftsRef, where('campaignId', '==', campaignId), where('userId', '==', user.uid));
      const draftsSnap = await getDocs(q);

      const draftsData = draftsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content || '',
          status: data.status || 'idea',
          scheduledDate: data.scheduledDate?.toDate() || null,
          createdAt: data.createdAt?.toDate(),
        } as Draft;
      }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      setDrafts(draftsData);
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNextPost = async () => {
    if (!campaign) return;

    // Check if previous post is ready or posted
    const lastDraft = drafts[drafts.length - 1];
    if (lastDraft && lastDraft.status !== 'ready_to_post' && lastDraft.status !== 'posted') {
      alert('Please mark the previous post as "Ready to Post" or "Posted" before generating the next one.');
      return;
    }

    setGenerating(true);

    try {
      // Navigate to create wizard with campaign context
      router.push(`/app/create?campaignId=${campaignId}&postNumber=${drafts.length + 1}`);
    } catch (error) {
      console.error('Error generating next post:', error);
      alert('Failed to generate next post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteCampaign = async () => {
    if (!campaign) return;

    if (!confirm('Are you sure you want to complete this campaign? You can still view and edit the posts.')) {
      return;
    }

    try {
      const db = getFirestore();
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'completed',
        updatedAt: Timestamp.now(),
      });

      setCampaign({ ...campaign, status: 'completed' });
    } catch (error) {
      console.error('Error completing campaign:', error);
      alert('Failed to complete campaign. Please try again.');
    }
  };

  const handleArchiveCampaign = async () => {
    if (!campaign) return;

    if (!confirm('Are you sure you want to archive this campaign?')) {
      return;
    }

    try {
      const db = getFirestore();
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'archived',
        updatedAt: Timestamp.now(),
      });

      router.push('/app/campaigns');
    } catch (error) {
      console.error('Error archiving campaign:', error);
      alert('Failed to archive campaign. Please try again.');
    }
  };

  const calculateScheduledDate = (postIndex: number): Date | null => {
    if (!campaign) return null;

    const startDate = new Date(campaign.startDate);
    let daysToAdd = 0;

    switch (campaign.frequency) {
      case 'daily':
        daysToAdd = postIndex;
        break;
      case '3x_week':
        // Mon, Wed, Fri pattern
        daysToAdd = Math.floor(postIndex / 3) * 7 + (postIndex % 3) * 2;
        break;
      case 'weekly':
        daysToAdd = postIndex * 7;
        break;
    }

    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(startDate.getDate() + daysToAdd);
    return scheduledDate;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-secondary/60">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const progress = (campaign.postsGenerated / campaign.targetPostCount) * 100;
  const canGenerateNext = campaign.status === 'active' && campaign.postsGenerated < campaign.targetPostCount;
  const lastDraft = drafts[drafts.length - 1];
  const isLastDraftReady = !lastDraft || lastDraft.status === 'ready_to_post' || lastDraft.status === 'posted';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button
            onClick={() => router.push('/app/campaigns')}
            variant="ghost"
            size="sm"
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
          <h1 className="text-3xl font-bold text-secondary">{campaign.name}</h1>
          <p className="mt-2 text-secondary/80">{campaign.theme}</p>
          {campaign.description && (
            <p className="mt-2 text-sm text-secondary/60">{campaign.description}</p>
          )}
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-medium ${
          campaign.status === 'active' ? 'bg-green-100 text-green-700' :
          campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {campaign.status}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-secondary/10 bg-white p-4">
          <div className="text-sm text-secondary/60">Total Posts</div>
          <div className="mt-1 text-2xl font-bold text-secondary">{drafts.length}</div>
          <div className="mt-1 text-xs text-secondary/40">of {campaign.targetPostCount}</div>
        </div>
        <div className="rounded-xl border border-secondary/10 bg-white p-4">
          <div className="text-sm text-secondary/60">Drafts</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {drafts.filter(d => d.status === 'in_progress' || d.status === 'idea').length}
          </div>
          <div className="mt-1 text-xs text-secondary/40">in progress</div>
        </div>
        <div className="rounded-xl border border-secondary/10 bg-white p-4">
          <div className="text-sm text-secondary/60">Ready</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {drafts.filter(d => d.status === 'ready_to_post').length}
          </div>
          <div className="mt-1 text-xs text-secondary/40">to post</div>
        </div>
        <div className="rounded-xl border border-secondary/10 bg-white p-4">
          <div className="text-sm text-secondary/60">Posted</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {drafts.filter(d => d.status === 'posted').length}
          </div>
          <div className="mt-1 text-xs text-secondary/40">live</div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary">Campaign Progress</h3>
          <span className="text-2xl font-bold text-primary">
            {campaign.postsGenerated} / {campaign.targetPostCount}
          </span>
        </div>
        <div className="mb-4 h-3 w-full rounded-full bg-secondary/10">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Campaign Meta */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-secondary/60" />
            <div>
              <div className="text-secondary/60">Start</div>
              <div className="font-medium text-secondary">
                {campaign.startDate.toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-secondary/60" />
            <div>
              <div className="text-secondary/60">End</div>
              <div className="font-medium text-secondary">
                {campaign.endDate.toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-secondary/60" />
            <div>
              <div className="text-secondary/60">Frequency</div>
              <div className="font-medium text-secondary">
                {campaign.frequency.replace('_', '/').replace('x', '×')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-secondary/60" />
            <div>
              <div className="text-secondary/60">Style</div>
              <div className="font-medium capitalize text-secondary">
                {campaign.style.replace('-', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Campaign Metadata */}
        {(campaign.tone || campaign.purpose || campaign.audience) && (
          <div className="mt-4 border-t border-secondary/10 pt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {campaign.tone && (
                <div className="text-sm">
                  <div className="mb-1 text-secondary/60">Tone</div>
                  <div className="font-medium capitalize text-secondary">
                    {campaign.tone}
                  </div>
                </div>
              )}
              {campaign.purpose && (
                <div className="text-sm">
                  <div className="mb-1 text-secondary/60">Purpose</div>
                  <div className="font-medium capitalize text-secondary">
                    {campaign.purpose.replace('_', ' ')}
                  </div>
                </div>
              )}
              {campaign.audience && (
                <div className="text-sm">
                  <div className="mb-1 text-secondary/60">Audience</div>
                  <div className="font-medium capitalize text-secondary">
                    {campaign.audience.replace('_', ' ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {campaign.status === 'active' && (
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateNextPost}
            disabled={generating || !canGenerateNext || !isLastDraftReady}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {generating ? 'Generating...' : `Generate Post ${drafts.length + 1}`}
          </Button>
          {campaign.postsGenerated >= campaign.targetPostCount && (
            <Button
              onClick={handleCompleteCampaign}
              variant="outline"
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete Campaign
            </Button>
          )}
          <Button
            onClick={handleArchiveCampaign}
            variant="outline"
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      )}

      {/* AI Strategy Section */}
      {campaign.aiStrategy && (
        <div className="rounded-2xl border border-secondary/10 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-secondary">AI Campaign Strategy</h3>

          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-secondary/70">Strategic Overview</div>
            <p className="text-secondary">{campaign.aiStrategy.strategicOverview}</p>
          </div>

          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-secondary/70">Narrative Arc</div>
            <p className="text-secondary">{campaign.aiStrategy.narrativeArc}</p>
          </div>

          {campaign.aiStrategy.successMarkers && campaign.aiStrategy.successMarkers.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-secondary/70">Success Markers</div>
              <ul className="space-y-1">
                {campaign.aiStrategy.successMarkers.map((marker, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-secondary">
                    <span className="text-primary">•</span>
                    <span>{marker}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary">Campaign Timeline</h3>
          {drafts.length === 0 && campaign.postsGenerated > 0 && (
            <Button
              onClick={async () => {
                if (!confirm('Link recent posts to this campaign? This will add the most recent posts to this campaign timeline.')) return;
                try {
                  const db = getFirestore();
                  const draftsRef = collection(db, 'drafts');
                  const q = query(
                    draftsRef,
                    where('userId', '==', getAuth().currentUser?.uid),
                    orderBy('createdAt', 'desc')
                  );
                  const snapshot = await getDocs(q);

                  let linked = 0;
                  for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    if (!data.campaignId && linked < campaign.postsGenerated) {
                      await updateDoc(doc(db, 'drafts', docSnap.id), {
                        campaignId: campaignId,
                      });
                      linked++;
                    }
                  }

                  alert(`Linked ${linked} post(s) to this campaign`);
                  fetchCampaignData(); // Refresh
                } catch (error) {
                  console.error('Error linking posts:', error);
                  alert('Failed to link posts');
                }
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Link Existing Posts
            </Button>
          )}
        </div>

        {drafts.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-secondary/20" />
            <p className="text-secondary/60">No posts generated yet</p>
            {canGenerateNext && (
              <Button
                onClick={handleGenerateNextPost}
                className="mt-4 gap-2"
                disabled={generating}
              >
                <Plus className="h-4 w-4" />
                Generate First Post
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: campaign.targetPostCount }).map((_, index) => {
              const draft = drafts[index];
              const scheduledDate = calculateScheduledDate(index);
              const isGenerated = !!draft;
              const postNumber = index + 1;

              const blueprint = campaign.aiStrategy?.postBlueprints?.[index];

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 transition-all ${
                    isGenerated
                      ? 'border-secondary/20 bg-white shadow-sm hover:border-primary hover:shadow-md cursor-pointer'
                      : 'border-dashed border-secondary/20 bg-slate-50/50'
                  }`}
                  onClick={isGenerated ? () => router.push(`/app/drafts/${draft.id}`) : undefined}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="font-semibold text-secondary">
                          Post {postNumber}
                        </span>
                        {scheduledDate && (
                          <div className="flex items-center gap-1 text-sm text-secondary/60">
                            <Calendar className="h-3 w-3" />
                            <span>{scheduledDate.toLocaleDateString()}</span>
                          </div>
                        )}
                        {isGenerated && draft.status && (
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${statusColors[draft.status]}`} />
                            <span className="text-sm capitalize text-secondary/60">
                              {draft.status.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* AI-Suggested Topic & Goal */}
                      {blueprint && !isGenerated && (
                        <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            <div className="text-xs font-semibold uppercase tracking-wide text-primary">AI Suggested Topic</div>
                          </div>
                          <div className="mb-2 text-sm font-semibold text-secondary">{blueprint.topic}</div>
                          <div className="text-xs text-secondary/70">
                            <span className="font-medium">Goal:</span> {blueprint.goal}
                          </div>
                        </div>
                      )}

                      {isGenerated ? (
                        <>
                          {blueprint && (
                            <div className="mb-2 rounded bg-primary/5 px-2 py-1">
                              <div className="text-xs font-medium text-primary">📋 {blueprint.topic}</div>
                            </div>
                          )}
                          <div className="mt-2 rounded-lg bg-slate-50 p-3">
                            <p className="text-sm text-secondary line-clamp-4 whitespace-pre-wrap">
                              {draft.content.slice(0, 400)}
                              {draft.content.length > 400 ? '...' : ''}
                            </p>
                          </div>
                        </>
                      ) : (
                        !blueprint && <p className="text-sm text-secondary/40">Not generated yet</p>
                      )}
                    </div>

                    {isGenerated && (
                      <Button
                        onClick={() => router.push(`/app/drafts/${draft.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Text */}
      {!isLastDraftReady && campaign.status === 'active' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Tip:</strong> Mark the previous post as "Ready to Post" or "Posted" before generating the next one to maintain campaign continuity.
          </p>
        </div>
      )}
    </div>
  );
}
