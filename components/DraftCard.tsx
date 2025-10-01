'use client';

import { formatDistanceToNow } from 'date-fns';
import { Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';

interface DraftCardProps {
  id: string;
  content: string;
  status: DraftStatus;
  language: 'en' | 'no';
  createdAt: Date;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
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

export function DraftCard({
  id,
  content,
  status,
  language,
  createdAt,
  onEdit,
  onDelete,
  onCopy,
}: DraftCardProps) {
  const preview = content.length > 100 ? `${content.slice(0, 100)}...` : content;
  const { label, color } = statusConfig[status];
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
        <span className="text-2xl" title={language === 'en' ? 'English' : 'Norwegian'}>
          {languageFlags[language]}
        </span>
      </div>

      <p className="text-slate-700 text-sm leading-relaxed mb-4 min-h-[60px]">{preview}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{timeAgo}</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(id)}
            className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(id)}
            className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
