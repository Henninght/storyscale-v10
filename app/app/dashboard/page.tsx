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
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Track your content metrics and performance at a glance.
        </p>
      </div>

      {/* Metrics Overview */}
      <MetricsOverview />

      {/* Additional Info Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-slate-800 mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/app/create"
            className="rounded-lg border-2 border-slate-200 p-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/30"
          >
            <h3 className="font-medium text-slate-800 mb-1">Create New Post</h3>
            <p className="text-sm text-slate-600">Start writing a new LinkedIn post</p>
          </a>
          <a
            href="/app/campaigns"
            className="rounded-lg border-2 border-slate-200 p-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/30"
          >
            <h3 className="font-medium text-slate-800 mb-1">Manage Campaigns</h3>
            <p className="text-sm text-slate-600">View and manage your content campaigns</p>
          </a>
          <a
            href="/app/calendar"
            className="rounded-lg border-2 border-slate-200 p-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/30"
          >
            <h3 className="font-medium text-slate-800 mb-1">Calendar View</h3>
            <p className="text-sm text-slate-600">See your scheduled posts</p>
          </a>
        </div>
      </div>
    </div>
  );
}
