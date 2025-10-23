'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, MoreVertical, Copy, Edit3, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';
import { getFirestore, doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import type { Draft, DraftStatus } from '@/types';

interface DraftRowProps {
  draft: Draft & { id: string };
  campaignName?: string;
  onDelete: (id: string) => void;
}

export function DraftRow({ draft, campaignName, onDelete }: DraftRowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (status: DraftStatus) => {
    const badges = {
      idea: { text: 'Idea', color: 'bg-slate-100 text-slate-700' },
      in_progress: { text: 'In Progress', color: 'bg-blue-100 text-blue-700' },
      ready_to_post: { text: 'Ready', color: 'bg-green-100 text-green-700' },
      posted: { text: 'Posted', color: 'bg-purple-100 text-purple-700' },
      archived: { text: 'Archived', color: 'bg-gray-100 text-gray-700' },
    };
    return badges[status] || badges.idea;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this draft?')) return;

    setIsDeleting(true);
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'drafts', draft.id));
      onDelete(draft.id);
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const db = getFirestore();
      await addDoc(collection(db, 'drafts'), {
        ...draft,
        id: undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'idea' as DraftStatus,
      });
      window.location.reload();
    } catch (error) {
      console.error('Error duplicating draft:', error);
      alert('Failed to duplicate draft');
    }
  };

  const handleGenerateTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Generate Title feature coming soon!');
  };

  const badge = getStatusBadge(draft.status);
  const createdAt = draft.createdAt instanceof Timestamp ? draft.createdAt.toDate() : new Date(draft.createdAt);

  // Extract first line as title
  const firstLine = draft.content.split('\n')[0].substring(0, 80);
  const title = firstLine || 'Untitled draft';

  return (
    <div
      onClick={() => router.push(`/app/drafts/${draft.id}`)}
      className="group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-orange-300 hover:shadow-md cursor-pointer"
    >
      {/* Draft Icon */}
      <div className="flex-shrink-0 rounded-lg bg-slate-100 p-2 group-hover:bg-orange-100 transition-colors">
        <FileText className="h-4 w-4 text-slate-600 group-hover:text-orange-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-800 truncate">{title}</h3>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
          {campaignName && (
            <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {campaignName}
            </span>
          )}
          {draft.images && draft.images.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              <ImageIcon className="h-3 w-3" />
              {draft.images.length}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{formatTime(createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Delete Button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          aria-label="Delete draft"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    router.push(`/app/drafts/${draft.id}`);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    handleDuplicate(e);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    handleGenerateTitle(e);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Title
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
