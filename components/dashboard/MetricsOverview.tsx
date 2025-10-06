'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Megaphone, TrendingUp, Archive } from "lucide-react";
import { MetricsCard } from './MetricsCard';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import type { SubscriptionTier } from '@/types';

interface MetricsData {
  postsUsedThisMonth: number;
  postsRemaining: number;
  postsLimit: number | string;
  draftsInProgress: number;
  readyToPost: number;
  totalDrafts: number;
  activeCampaigns: number;
  archivedDrafts: number;
}

export function MetricsOverview() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricsData>({
    postsUsedThisMonth: 0,
    postsRemaining: 0,
    postsLimit: 5,
    draftsInProgress: 0,
    readyToPost: 0,
    totalDrafts: 0,
    activeCampaigns: 0,
    archivedDrafts: 0,
  });
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    const fetchMetrics = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();

        // Fetch user data for subscription and post usage
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        let postsUsed = 0;
        let tier: SubscriptionTier = 'free';

        if (userDoc.exists()) {
          const userData = userDoc.data();
          tier = userData.subscription?.tier || 'free';
          postsUsed = userData.postsUsedThisMonth || 0;
          setSubscriptionTier(tier);
        }

        // Calculate posts limit based on tier
        let postsLimit: number | string = 5; // free tier default
        if (tier === 'trial' || tier === 'pro') {
          postsLimit = 50;
        } else if (tier === 'enterprise') {
          postsLimit = '∞';
        }

        const postsRemaining = typeof postsLimit === 'number' ? postsLimit - postsUsed : Infinity;

        // Fetch drafts
        const draftsRef = collection(db, 'drafts');
        const draftsQuery = query(draftsRef, where('userId', '==', user.uid));
        const draftsSnapshot = await getDocs(draftsQuery);

        let inProgress = 0;
        let ready = 0;
        let archived = 0;

        draftsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'in_progress') inProgress++;
          if (data.status === 'ready_to_post') ready++;
          if (data.status === 'archived') archived++;
        });

        // Fetch campaigns
        const campaignsRef = collection(db, 'campaigns');
        const campaignsQuery = query(campaignsRef, where('userId', '==', user.uid));
        const campaignsSnapshot = await getDocs(campaignsQuery);

        const activeCampaigns = campaignsSnapshot.docs.filter(
          doc => doc.data().status === 'active'
        ).length;

        setMetrics({
          postsUsedThisMonth: postsUsed,
          postsRemaining: typeof postsRemaining === 'number' ? postsRemaining : 0,
          postsLimit,
          draftsInProgress: inProgress,
          readyToPost: ready,
          totalDrafts: draftsSnapshot.size,
          activeCampaigns,
          archivedDrafts: archived,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
        <p className="text-secondary/60">Loading metrics...</p>
      </div>
    );
  }

  const getTierDescription = () => {
    switch (subscriptionTier) {
      case 'trial':
        return 'Trial plan limit';
      case 'pro':
        return 'Pro plan limit';
      case 'enterprise':
        return 'Unlimited';
      default:
        return 'Free plan limit';
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Posts Remaining"
        value={metrics.postsLimit === '∞' ? '∞' : metrics.postsRemaining.toString()}
        icon={TrendingUp}
        description={`${metrics.postsUsedThisMonth} of ${metrics.postsLimit} used this month`}
      />
      <MetricsCard
        title="Drafts in Progress"
        value={metrics.draftsInProgress.toString()}
        icon={Clock}
        description="Currently being worked on"
      />
      <MetricsCard
        title="Ready to Post"
        value={metrics.readyToPost.toString()}
        icon={CheckCircle2}
        description="Completed and ready"
      />
      <MetricsCard
        title="Active Campaigns"
        value={metrics.activeCampaigns.toString()}
        icon={Megaphone}
        description={metrics.activeCampaigns === 1 ? "Campaign running" : "Campaigns running"}
      />
      <MetricsCard
        title="Total Drafts"
        value={metrics.totalDrafts.toString()}
        icon={FileText}
        description="All posts in workspace"
      />
      <MetricsCard
        title="Archived Drafts"
        value={metrics.archivedDrafts.toString()}
        icon={Archive}
        description="Archived content"
      />
      <MetricsCard
        title="Posts This Month"
        value={`${metrics.postsUsedThisMonth} / ${metrics.postsLimit}`}
        icon={FileText}
        description={getTierDescription()}
      />
    </div>
  );
}
