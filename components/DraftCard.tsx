'use client';

import { formatDistanceToNow } from 'date-fns';
import { Edit, Trash2, Copy, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { useState } from 'react';

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';
type ViewMode = 'grid' | 'list';

interface DraftCardProps {
  draft: any;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
  campaignName?: string;
}

const statusConfig: Record<DraftStatus, { label: string; color: string }> = {
  idea: { label: 'Idea', color: 'bg-slate-200 text-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  ready_to_post: { label: 'Ready to Post', color: 'bg-green-100 text-green-700' },
  posted: { label: 'Posted', color: 'bg-amber-100 text-amber-700' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500' },
};

const languageFlags: Record<'en' | 'no', string> = {
  en: '🇬🇧',
  no: '🇳🇴',
};

export function DraftCard({ draft, onDelete, viewMode = 'grid', campaignName }: DraftCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { id, content, status, language, createdAt, tags, campaignId } = draft;
  const preview = content.length > 100 ? `${content.slice(0, 100)}...` : content;
  const { label, color } = statusConfig[status as DraftStatus];
  const timeAgo = createdAt instanceof Date
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : createdAt?.toDate
    ? formatDistanceToNow(createdAt.toDate(), { addSuffix: true })
    : formatDistanceToNow(new Date(), { addSuffix: true });

  const handleEdit = () => {
    router.push(`/app/drafts/${id}`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'drafts', id));
      onDelete(id);
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="rounded-lg border border-secondary/10 bg-white p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>
                {label}
              </span>
              <span className="text-xl" title={language === 'en' ? 'English' : 'Norwegian'}>
                {languageFlags[language as 'en' | 'no']}
              </span>
              {campaignId && campaignName && (
                <span
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  title={`Campaign: ${campaignName}`}
                >
                  <Megaphone className="h-3 w-3" />
                  {campaignName}
                </span>
              )}
              {tags && tags.length > 0 && (
                <div className="flex gap-1">
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="mb-2 text-sm leading-relaxed text-secondary">{preview}</p>
            <span className="text-xs text-secondary/50">{timeAgo}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-secondary/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}>
            {label}
          </span>
          {campaignId && campaignName && (
            <span
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
              title={`Campaign: ${campaignName}`}
            >
              <Megaphone className="h-3 w-3" />
              {campaignName}
            </span>
          )}
        </div>
        <span className="text-2xl" title={language === 'en' ? 'English' : 'Norwegian'}>
          {languageFlags[language as 'en' | 'no']}
        </span>
      </div>

      <p className="mb-4 min-h-[60px] text-sm leading-relaxed text-secondary">{preview}</p>

      {tags && tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-secondary/50">{timeAgo}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
