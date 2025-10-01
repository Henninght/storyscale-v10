'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Copy, Check, RefreshCw, Sparkles, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftEditorProps {
  draft: any;
}

type DraftStatus = 'idea' | 'in_progress' | 'ready_to_post' | 'posted' | 'archived';

export function DraftEditor({ draft }: DraftEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(draft.content);
  const [status, setStatus] = useState<DraftStatus>(draft.status);
  const [tags, setTags] = useState<string[]>(draft.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const charCount = content.length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const db = getFirestore();
      const draftRef = doc(db, 'drafts', draft.id);

      await updateDoc(draftRef, {
        content,
        status,
        tags,
        updatedAt: new Date(),
      });

      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draftId: draft.id,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance content');
      }

      const result = await response.json();
      setContent(result.content);
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to enhance content');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wizardSettings: draft.wizardSettings,
          draftId: draft.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate content');
      }

      const result = await response.json();
      setContent(result.content);
    } catch (error) {
      console.error('Regeneration failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to regenerate content');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/app')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </Button>

        <Button
          onClick={handleEnhance}
          disabled={isEnhancing || !content.trim()}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          {isEnhancing ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Enhance
            </>
          )}
        </Button>

        <Button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          variant="outline"
          className="gap-2"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </>
          )}
        </Button>

        <Button onClick={handleCopy} variant="outline" className="gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto gap-2"
        >
          {isSaving ? (
            <>
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Draft
            </>
          )}
        </Button>
      </div>

      {/* Main Editor */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-secondary">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] w-full rounded-lg border border-secondary/20 p-4 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Your LinkedIn post content..."
          />
          <div className="mt-2 text-sm text-secondary/60">
            {charCount} characters
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4 border-t border-secondary/10 pt-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DraftStatus)}
              className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
            >
              <option value="idea">Idea</option>
              <option value="in_progress">In Progress</option>
              <option value="ready_to_post">Ready to Post</option>
              <option value="posted">Posted</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary-hover"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
