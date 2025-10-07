'use client';

import { MetricsOverview } from '@/components/dashboard/MetricsOverview';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-secondary/60">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary">Dashboard</h1>
        <p className="mt-2 text-secondary/80">
          Track your content metrics and performance at a glance.
        </p>
      </div>

      {/* Metrics Overview */}
      <MetricsOverview />

      {/* Additional Info Section */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        <h2 className="text-xl font-semibold text-secondary mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/app/create"
            className="rounded-lg border border-secondary/20 p-4 transition-all hover:border-primary hover:bg-primary/5"
          >
            <h3 className="font-medium text-secondary mb-1">Create New Post</h3>
            <p className="text-sm text-secondary/60">Start writing a new LinkedIn post</p>
          </a>
          <a
            href="/app/campaigns"
            className="rounded-lg border border-secondary/20 p-4 transition-all hover:border-primary hover:bg-primary/5"
          >
            <h3 className="font-medium text-secondary mb-1">Manage Campaigns</h3>
            <p className="text-sm text-secondary/60">View and manage your content campaigns</p>
          </a>
          <a
            href="/app/calendar"
            className="rounded-lg border border-secondary/20 p-4 transition-all hover:border-primary hover:bg-primary/5"
          >
            <h3 className="font-medium text-secondary mb-1">Calendar View</h3>
            <p className="text-sm text-secondary/60">See your scheduled posts</p>
          </a>
        </div>
      </div>
    </div>
  );
}
