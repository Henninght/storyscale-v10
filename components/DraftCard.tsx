'use client';

import { formatDistanceToNow } from 'date-fns';
import { Edit, Trash2, Copy, Megaphone, Clock, FileText, MoreVertical, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useState, useRef, useEffect } from 'react';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';
type ViewMode = 'grid' | 'list';

interface DraftCardProps {
  draft: any;
  onDelete: (id: string) => void;
  viewMode?: ViewMode;
  campaignName?: string;
}

const statusConfig: Record<DraftStatus, {
  label: string;
  color: string;
  borderColor: string;
  icon: string;
  badgeColor: string;
}> = {
  idea: {
    label: 'Idea',
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-l-purple-500',
    icon: '💡',
    badgeColor: 'bg-purple-100 text-purple-700'
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-l-blue-500',
    icon: '📝',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  ready_to_post: {
    label: 'Ready to Post',
    color: 'bg-orange-100 text-orange-700',
    borderColor: 'border-l-orange-500',
    icon: '⏰',
    badgeColor: 'bg-orange-100 text-orange-700'
  },
  posted: {
    label: 'Posted',
    color: 'bg-green-100 text-green-700',
    borderColor: 'border-l-green-500',
    icon: '✓',
    badgeColor: 'bg-green-100 text-green-700'
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-600',
    borderColor: 'border-l-gray-400',
    icon: '📦',
    badgeColor: 'bg-gray-100 text-gray-600'
  },
};

const languageFlags: Record<'en' | 'no', string> = {
  en: '🇬🇧',
  no: '🇳🇴',
};

export function DraftCard({ draft, onDelete, viewMode = 'grid', campaignName }: DraftCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { id, content, status, language, createdAt, tags, campaignId } = draft;

  // Use stored title or extract from first line
  const storedTitle = draft.title;
  const lines = content.split('\n').filter((line: string) => line.trim());
  const extractedTitle = lines[0] || content.slice(0, 60);
  const title = storedTitle || extractedTitle;

  const contentWithoutTitle = lines.slice(1).join('\n') || content;
  const preview = contentWithoutTitle.length > 150
    ? `${contentWithoutTitle.slice(0, 150)}...`
    : contentWithoutTitle;

  const { label, color, borderColor, icon, badgeColor } = statusConfig[status as DraftStatus];
  const timeAgo = createdAt instanceof Date
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : createdAt?.toDate
    ? formatDistanceToNow(createdAt.toDate(), { addSuffix: true })
    : formatDistanceToNow(new Date(), { addSuffix: true });

  const charCount = content.length;
  const maxChars = 3000; // LinkedIn limit
  const charPercentage = (charCount / maxChars) * 100;

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

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

  const handleTitleEdit = () => {
    setEditedTitle(title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'drafts', id), {
        title: editedTitle.trim(),
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating title:', error);
      alert('Failed to update title');
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
    }
  };

  const getCharCountColor = () => {
    if (charPercentage >= 95) return 'text-red-600 font-semibold';
    if (charPercentage >= 85) return 'text-orange-600 font-medium';
    return 'text-slate-500';
  };

  const getCharCountMessage = () => {
    const remaining = maxChars - charCount;
    if (charPercentage >= 100) return `${Math.abs(remaining)} over limit`;
    if (charPercentage >= 85) return `${remaining} remaining`;
    return `${charCount}/${maxChars}`;
  };

  const handleGenerateTitle = async () => {
    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Failed to generate title');

      const { title: generatedTitle } = await response.json();

      const db = getFirestore();
      await updateDoc(doc(db, 'drafts', id), {
        title: generatedTitle,
      });
    } catch (error) {
      console.error('Error generating title:', error);
      alert('Failed to generate title. Please try again.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`group rounded-lg border-l-4 border-y border-r border-slate-200 bg-white p-2 transition-all duration-200 hover:shadow-md ${borderColor}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {/* Status & Meta */}
              <div className="flex items-center gap-1.5">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badgeColor}`}>
                  <span className="text-xs">{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
                <span className="text-sm" title={language === 'en' ? 'English' : 'Norwegian'}>
                  {languageFlags[language as 'en' | 'no']}
                </span>
              </div>

              {/* Title */}
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full rounded border border-blue-300 px-2 py-0.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter title..."
                  />
                ) : (
                  <h3 className="truncate text-sm font-semibold text-slate-900" title={title}>
                    {title}
                  </h3>
                )}
              </div>

              {/* Campaign & Tags */}
              <div className="hidden md:flex items-center gap-1.5">
                {campaignId && campaignName && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                    title={`Campaign: ${campaignName}`}
                  >
                    <Megaphone className="h-2.5 w-2.5" />
                    <span className="max-w-[80px] truncate">{campaignName}</span>
                  </span>
                )}
                {tags && tags.length > 0 && (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                    {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="hidden lg:flex items-center gap-2 text-[11px]">
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{timeAgo.replace(' ago', '')}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className={`flex items-center gap-1 ${getCharCountColor()}`}>
                  <FileText className="h-3 w-3" />
                  <span>{getCharCountMessage()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-slate-700"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-xl border-l-4 border-y border-r border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${borderColor}`}
    >
      {/* Header: Status Badge + Platform + Language + Menu */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${badgeColor}`}>
            <span className="text-xs">{icon}</span>
            <span className="uppercase tracking-wide">{label}</span>
          </span>
          {campaignId && campaignName && (
            <span
              className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
              title={`Campaign: ${campaignName}`}
            >
              <Megaphone className="h-2.5 w-2.5" />
              <span className="max-w-[70px] truncate">{campaignName}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base" title={language === 'en' ? 'English' : 'Norwegian'}>
            {languageFlags[language as 'en' | 'no']}
          </span>
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownMenuItem onClick={handleGenerateTitle}>
                <Sparkles className="h-4 w-4" />
                {isGeneratingTitle ? 'Generating...' : 'Generate AI Title'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTitleEdit}>
                <Pencil className="h-4 w-4" />
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4" />
                Edit Post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} variant="danger">
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Title Section */}
      {isEditingTitle ? (
        <input
          ref={titleInputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          className="mb-1.5 w-full rounded border border-blue-300 px-2 py-1 text-sm font-semibold leading-tight text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter title..."
        />
      ) : (
        <div className="group/title mb-1.5 flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-tight text-slate-900">
            {title}
          </h3>
          <button
            onClick={handleTitleEdit}
            className="opacity-0 transition-opacity group-hover/title:opacity-100"
            title="Edit title"
          >
            <Pencil className="h-3 w-3 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
      )}

      {/* Content Preview */}
      <div className="relative mb-2.5">
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-600">
          {preview || 'No content yet...'}
        </p>
        {preview && preview.endsWith('...') && (
          <div className="pointer-events-none absolute bottom-0 right-0 h-6 w-16 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>

      {/* Tags (if any) */}
      {tags && tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-700"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="mb-2 border-t border-slate-100" />

      {/* Metadata Bar */}
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className={`flex items-center gap-1 ${getCharCountColor()}`}>
          <FileText className="h-3 w-3" />
          <span>{getCharCountMessage()}</span>
        </div>
        {charPercentage >= 85 && (
          <div className="ml-auto">
            <div className="h-1 w-12 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all ${
                  charPercentage >= 95 ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(charPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (Hover) */}
      <div className="flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="flex-1 h-7 gap-1 text-[11px] hover:bg-blue-50 hover:text-blue-600"
        >
          <Edit className="h-3 w-3" />
          <span>Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 w-7 p-0 hover:bg-slate-100 hover:text-slate-700"
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
