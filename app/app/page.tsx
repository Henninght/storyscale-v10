'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Megaphone, Grid3x3, List } from "lucide-react";
import { DraftCard } from "@/components/DraftCard";
import { getFirestore, collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';
type Language = 'en' | 'no';

interface Draft {
  id: string;
  content: string;
  status: DraftStatus;
  language: Language;
  createdAt: Date;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<DraftStatus | 'all'>('all');
  const [languageFilter, setLanguageFilter] = useState<Language | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postsThisMonth: 0,
    draftsInProgress: 0,
    readyToPost: 0,
  });

  // Fetch drafts
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
        const draftsRef = collection(db, 'drafts');
        const q = query(
          draftsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
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
          });
        });

        setDrafts(fetchedDrafts);

        // Calculate stats
        const inProgress = fetchedDrafts.filter(d => d.status === 'in_progress').length;
        const ready = fetchedDrafts.filter(d => d.status === 'ready_to_post').length;

        setStats({
          postsThisMonth: fetchedDrafts.length,
          draftsInProgress: inProgress,
          readyToPost: ready,
        });
      } catch (error) {
        console.error('Error fetching drafts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [user, authLoading]);

  const handleEdit = (id: string) => {
    window.location.href = `/app/drafts/${id}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'drafts', id));
      setDrafts(drafts.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    }
  };

  const handleCopy = (id: string) => {
    const draft = drafts.find(d => d.id === id);
    if (draft) {
      navigator.clipboard.writeText(draft.content);
      alert('Copied to clipboard!');
    }
  };

  // Filter and sort drafts
  const filteredDrafts = drafts
    .filter(draft => statusFilter === 'all' || draft.status === statusFilter)
    .filter(draft => languageFilter === 'all' || draft.language === languageFilter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.status.localeCompare(b.status);
      }
    });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary">Workspace</h1>
        <p className="mt-2 text-secondary/80">
          Welcome back! Here&apos;s an overview of your content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Posts This Month"
          value={`${stats.postsThisMonth} / 5`}
          icon={FileText}
          description="Free plan limit"
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
          title="Active Campaign"
          value="None"
          icon={Megaphone}
          description="No campaigns running"
        />
      </div>

      {/* Recent Drafts Section */}
      <div>
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-secondary">Recent Drafts</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'border-primary bg-primary text-white'
                    : 'border-secondary/20 text-secondary hover:bg-secondary/5'
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'border-primary bg-primary text-white'
                    : 'border-secondary/20 text-secondary hover:bg-secondary/5'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-secondary">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DraftStatus | 'all')}
                className="rounded-lg border border-secondary/20 px-3 py-1.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              <label className="text-sm font-medium text-secondary">Language:</label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as Language | 'all')}
                className="rounded-lg border border-secondary/20 px-3 py-1.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All</option>
                <option value="en">English</option>
                <option value="no">Norwegian</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-secondary">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
                className="rounded-lg border border-secondary/20 px-3 py-1.5 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="date">Date Created</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drafts Grid/List */}
        {loading ? (
          <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
            <p className="text-secondary/60">Loading drafts...</p>
          </div>
        ) : filteredDrafts.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-secondary/10 bg-white p-12 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-secondary">
              No drafts yet
            </h3>
            <p className="mb-6 text-secondary/80">
              Start creating your first LinkedIn post with AI
            </p>
            <a
              href="/app/create"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover"
            >
              <FileText className="h-5 w-5" />
              Create New Post
            </a>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-4'
            }
          >
            {filteredDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                id={draft.id}
                content={draft.content}
                status={draft.status}
                language={draft.language}
                createdAt={draft.createdAt}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-secondary/10 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-secondary/80">{title}</h3>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mb-1 text-3xl font-bold text-secondary">{value}</div>
      <p className="text-sm text-secondary/60">{description}</p>
    </div>
  );
}
