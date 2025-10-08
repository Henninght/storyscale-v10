'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Megaphone, Grid3x3, List, Plus } from "lucide-react";
import { DraftCard } from "@/components/DraftCard";
import { ActiveCampaignWidget } from "@/components/ActiveCampaignWidget";
import { getFirestore, collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import type { Campaign } from '@/types';
import { PageTransition } from '@/components/PageTransition';

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';
type Language = 'en' | 'no';

interface Draft {
  id: string;
  content: string;
  status: DraftStatus;
  language: Language;
  createdAt: Date;
  campaignId?: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<DraftStatus | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<Language | 'all'>('all');
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'campaign' | 'single'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>({ tier: 'free' });
  const [stats, setStats] = useState({
    postsThisMonth: 0,
    draftsInProgress: 0,
    readyToPost: 0,
    activeCampaigns: 0,
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignMap, setCampaignMap] = useState<Map<string, string>>(new Map());
  const [isCampaignCollapsed, setIsCampaignCollapsed] = useState(true);

  // Fetch drafts and subscription
  useEffect(() => {
    const fetchDrafts = async () => {
      // Wait for auth to initialize
      if (authLoading) {
        return;
      }

      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const db = getFirestore();

        // Fetch user subscription and stats (always get fresh data)
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Always update subscription state with fresh data from Firestore
          const currentSubscription = userData.subscription || { tier: 'free' };
          setSubscription(currentSubscription);

          // Update stats with actual postsUsedThisMonth from user doc
          const postsUsed = userData.postsUsedThisMonth || 0;
          setStats(prev => ({ ...prev, postsThisMonth: postsUsed }));
        } else {
          // If no user doc exists yet, ensure we have default subscription
          setSubscription({ tier: 'free' });
        }

        // Fetch drafts
        const draftsRef = collection(db, 'drafts');
        // Note: Removed orderBy to avoid requiring composite index
        // Sorting is done in-memory instead
        const q = query(
          draftsRef,
          where('userId', '==', user.uid)
        );

        const querySnapshot = await getDocs(q);
        const fetchedDrafts: Draft[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedDrafts.push({
            id: doc.id,
            content: data.content,
            status: data.status,
            language: data.language,
            createdAt: data.createdAt?.toDate() || new Date(),
            campaignId: data.campaignId,
          });
        });

        // Sort by createdAt descending in-memory
        fetchedDrafts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        setDrafts(fetchedDrafts);

        // Fetch all campaigns (not just active)
        const campaignsRef = collection(db, 'campaigns');
        const campaignsQuery = query(
          campaignsRef,
          where('userId', '==', user.uid)
        );
        const campaignsSnapshot = await getDocs(campaignsQuery);
        const campaignsData = campaignsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as (Campaign & { id: string })[];

        // Create campaign map (id -> name)
        const newCampaignMap = new Map<string, string>();
        campaignsData.forEach(campaign => {
          newCampaignMap.set(campaign.id, campaign.name);
        });
        setCampaignMap(newCampaignMap);

        // Set active campaigns for stats
        const activeCampaigns = campaignsData.filter(c => c.status === 'active');
        setCampaigns(activeCampaigns);

        // Calculate stats
        const inProgress = fetchedDrafts.filter(d => d.status === 'in_progress').length;
        const ready = fetchedDrafts.filter(d => d.status === 'ready_to_post').length;

        setStats(prev => ({
          ...prev,
          draftsInProgress: inProgress,
          readyToPost: ready,
          activeCampaigns: campaignsData.length,
        }));
      } catch (error) {
        console.error('Error fetching drafts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [user, authLoading]);

  // Refresh data when navigating to this page
  useEffect(() => {
    if (pathname === '/app' && user && !loading) {
      // Refetch subscription data when landing on dashboard
      const refreshSubscription = async () => {
        try {
          const db = getFirestore();
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentSubscription = userData.subscription || { tier: 'free' };
            setSubscription(currentSubscription);

            const postsUsed = userData.postsUsedThisMonth || 0;
            setStats(prev => ({ ...prev, postsThisMonth: postsUsed }));
          }
        } catch (error) {
          console.error('Error refreshing subscription:', error);
        }
      };

      refreshSubscription();
    }
  }, [pathname, user, loading]);

  const handleDelete = async (id: string) => {
    // Refresh drafts after delete
    const db = getFirestore();
    const draftsRef = collection(db, 'drafts');
    const q = query(draftsRef, where('userId', '==', user?.uid));
    const snapshot = await getDocs(q);

    const draftsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content || '',
        status: data.status || 'idea',
        language: data.language || 'en',
        createdAt: data.createdAt?.toDate() || new Date(),
        tags: data.tags || [],
      };
    });

    setDrafts(draftsData);
  };

  const handlePauseCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to pause this campaign?')) return;

    try {
      const db = getFirestore();
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        status: 'archived',
        updatedAt: new Date(),
      });

      // Refresh campaigns
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      setStats(prev => ({ ...prev, activeCampaigns: prev.activeCampaigns - 1 }));
    } catch (error) {
      console.error('Error pausing campaign:', error);
      alert('Failed to pause campaign');
    }
  };

  // Filter and sort drafts
  const filteredDrafts = drafts
    .filter(draft => statusFilter === 'all' || draft.status === statusFilter)
    .filter(draft => languageFilter === 'all' || draft.language === languageFilter)
    .filter(draft => {
      if (campaignFilter === 'all') return true;
      if (campaignFilter === 'campaign') return draft.campaignId !== undefined;
      if (campaignFilter === 'single') return draft.campaignId === undefined;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.status.localeCompare(b.status);
      }
    });

  return (
    <PageTransition>
      <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Workspace</h1>
        <p className="mt-1 text-slate-600">
          Welcome back! Here&apos;s an overview of your content.
        </p>
      </div>

      {/* Active Campaign Widget or Stats Cards */}
      {campaigns.length > 0 ? (
        <div className="flex gap-3">
          {/* Active Campaign Widget */}
          <div className="flex-1">
            <ActiveCampaignWidget
              campaign={campaigns[0]}
              onPause={() => handlePauseCampaign(campaigns[0].id)}
              isCollapsed={isCampaignCollapsed}
              onToggleCollapse={() => setIsCampaignCollapsed(!isCampaignCollapsed)}
            />
          </div>

          {/* Create Single Post Button */}
          <button
            onClick={() => router.push('/app/create')}
            className="rounded-2xl border-2 border-orange-200 bg-white px-6 py-4 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50/30 flex items-center gap-3 whitespace-nowrap"
          >
            <div className="rounded-lg bg-orange-100 p-2">
              <Plus className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Create Single Post</span>
          </button>
        </div>
      ) : (
        /* Stats Cards - Show when no active campaign */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Posts This Month"
            value={`${stats.postsThisMonth} / ${subscription.tier === 'trial' || subscription.tier === 'pro' ? '50' : subscription.tier === 'enterprise' ? '∞' : '5'}`}
            icon={FileText}
            description={subscription.tier === 'trial' ? 'Trial plan limit' : subscription.tier === 'pro' ? 'Pro plan limit' : subscription.tier === 'enterprise' ? 'Unlimited' : 'Free plan limit'}
          />
          <StatCard
            title="Drafts in Progress"
            value={stats.draftsInProgress.toString()}
            icon={Clock}
            description="Unfinished posts"
          />
          <StatCard
            title="Ready to Post"
            value={stats.readyToPost.toString()}
            icon={CheckCircle2}
            description="Completed drafts"
          />
          <StatCard
            title="Active Campaigns"
            value={stats.activeCampaigns.toString()}
            icon={Megaphone}
            description={stats.activeCampaigns === 1 ? "Campaign running" : "Campaigns running"}
          />
        </div>
      )}

      {/* Recent Drafts Section */}
      <div>
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-800">Recent Drafts</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'border-orange-700 bg-orange-700 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'border-orange-700 bg-orange-700 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Type:</label>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value as 'all' | 'campaign' | 'single')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All Posts</option>
                <option value="campaign">Campaign Posts</option>
                <option value="single">Single Posts</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DraftStatus | 'all')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All</option>
                <option value="idea">Idea</option>
                <option value="in_progress">In Progress</option>
                <option value="ready_to_post">Ready to Post</option>
                <option value="posted">Posted</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Language:</label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as Language | 'all')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">All</option>
                <option value="en">English</option>
                <option value="no">Norwegian</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="date">Date Created</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drafts Grid/List */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">Loading drafts...</p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-orange-100 p-4">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-800">
              No drafts yet
            </h3>
            <p className="mb-6 text-slate-600">
              Start creating your first LinkedIn post with AI
            </p>
            <a
              href="/app/create"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-700 px-6 py-3 font-semibold text-white transition-all hover:bg-orange-800 hover:scale-[1.02]"
            >
              <FileText className="h-5 w-5" />
              Create New Post
            </a>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-3'
            }
          >
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onDelete={handleDelete}
                viewMode={viewMode}
                campaignName={draft.campaignId ? campaignMap.get(draft.campaignId) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  // Color-coded icon backgrounds based on title
  const getIconColor = () => {
    if (title.includes('Posts')) return { bg: 'bg-orange-100', text: 'text-orange-600' };
    if (title.includes('Drafts')) return { bg: 'bg-blue-100', text: 'text-blue-600' };
    if (title.includes('Ready')) return { bg: 'bg-green-100', text: 'text-green-600' };
    if (title.includes('Campaigns')) return { bg: 'bg-purple-100', text: 'text-purple-600' };
    return { bg: 'bg-slate-100', text: 'text-slate-600' };
  };

  const iconColor = getIconColor();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover-lift">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <div className={`rounded-lg ${iconColor.bg} p-2`}>
          <Icon className={`h-5 w-5 ${iconColor.text}`} />
        </div>
      </div>
      <div className="mb-1 text-3xl font-bold text-slate-800">{value}</div>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}
