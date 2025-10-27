'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, updateDoc, collection, addDoc, serverTimestamp, setDoc, getDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Copy, Check, RefreshCw, Sparkles, Save, ArrowLeft, ThumbsUp, ThumbsDown, Linkedin, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VersionHistory } from '@/components/VersionHistory';
import { FeedbackRating, MentorshipSettings, DraftImage } from '@/types';
import { MentorChatWidget } from '@/components/MentorChatWidget';
import { analyzeDraftPatterns } from '@/lib/mentorshipEngine';
import { ImageManager } from '@/components/ImageManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [scheduledDate, setScheduledDate] = useState<string>(
    draft.scheduledDate ? new Date(draft.scheduledDate.seconds * 1000).toISOString().split('T')[0] : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPostingToLinkedIn, setIsPostingToLinkedIn] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [linkedInPostSuccess, setLinkedInPostSuccess] = useState(false);

  // Feedback tracking state
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [originalContent] = useState(draft.content);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  // Mentorship state
  const [mentorshipSettings, setMentorshipSettings] = useState<MentorshipSettings | null>(null);
  const [userPatterns, setUserPatterns] = useState<{ avgLength: number; preferredTone?: string; preferredStyle?: string } | undefined>(undefined);

  // Image management state
  const [images, setImages] = useState<DraftImage[]>(draft.images || []);
  const [showImageManager, setShowImageManager] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const charCount = content.length;

  // Load existing feedback on mount
  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const db = getFirestore();
        const feedbackRef = doc(db, 'post_feedback', draft.id);
        const feedbackDoc = await getDoc(feedbackRef);

        if (feedbackDoc.exists()) {
          const feedbackData = feedbackDoc.data();
          setFeedbackRating(feedbackData.rating);
          setRegenerationCount(feedbackData.regenerated || 0);
          setFeedbackId(feedbackDoc.id);
        }
      } catch (error) {
        console.error('Error loading feedback:', error);
      }
    };

    loadFeedback();
  }, [draft.id]);

  // Check LinkedIn connection status
  useEffect(() => {
    const checkLinkedInConnection = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();
        const linkedInRef = doc(db, 'users', user.uid, 'integrations', 'linkedin');
        const linkedInDoc = await getDoc(linkedInRef);

        setLinkedInConnected(linkedInDoc.exists());
      } catch (error) {
        console.error('Error checking LinkedIn connection:', error);
      }
    };

    checkLinkedInConnection();
  }, []);

  // Load mentorship settings and user patterns
  useEffect(() => {
    const loadMentorshipData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();

        // Load user's mentorship settings
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const settings = userData.profile?.mentorshipSettings as MentorshipSettings | undefined;

          // Only set if mentorship is enabled
          if (settings?.enabled) {
            setMentorshipSettings(settings);
          }
        }

        // Analyze recent drafts to understand user patterns
        const draftsRef = collection(db, 'drafts');
        const recentDraftsQuery = query(
          draftsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const draftsSnapshot = await getDocs(recentDraftsQuery);
        const recentDrafts = draftsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));

        const patterns = analyzeDraftPatterns(recentDrafts as any);

        if (patterns.avgLength > 0) {
          setUserPatterns({
            avgLength: patterns.avgLength,
            preferredTone: patterns.tones.length > 0 ? patterns.tones[0] : undefined,
            preferredStyle: patterns.styles.length > 0 ? patterns.styles[0] : undefined,
          });
        }
      } catch (error) {
        console.error('Error loading mentorship data:', error);
      }
    };

    loadMentorshipData();
  }, [draft.id]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (redirectTo?: 'workspace' | 'campaign') => {
    setIsSaving(true);
    setJustSaved(false);
    try {
      const db = getFirestore();
      const draftRef = doc(db, 'drafts', draft.id);

      // Save current content as a version
      const versionsRef = collection(db, 'drafts', draft.id, 'versions');
      await addDoc(versionsRef, {
        content,
        createdAt: serverTimestamp(),
      });

      // Update the draft
      await updateDoc(draftRef, {
        content,
        status,
        tags,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        updatedAt: new Date(),
      });

      if (redirectTo === 'workspace') {
        router.push('/app');
      } else if (redirectTo === 'campaign' && draft.campaignId) {
        router.push(`/app/campaigns/${draft.campaignId}`);
      } else {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
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
          currentContent: content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enhance content');
      }

      const result = await response.json();

      // Save enhanced content as a version
      const db = getFirestore();
      const versionsRef = collection(db, 'drafts', draft.id, 'versions');
      await addDoc(versionsRef, {
        content: result.enhancedContent,
        createdAt: serverTimestamp(),
      });

      setContent(result.enhancedContent);
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

      // Save regenerated content as a version
      const db = getFirestore();
      const versionsRef = collection(db, 'drafts', draft.id, 'versions');
      await addDoc(versionsRef, {
        content: result.content,
        createdAt: serverTimestamp(),
      });

      setContent(result.content);

      // Track regeneration
      setRegenerationCount(prev => prev + 1);
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

  const handleFeedback = async (rating: 'thumbs_up' | 'thumbs_down') => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate edit percentage (Levenshtein distance or simple character comparison)
      const editPercentage = calculateEditPercentage(originalContent, content);

      // Calculate time to ready (if status is ready_to_post)
      const timeToReady = calculateTimeToReady();

      const db = getFirestore();
      const feedbackRef = doc(db, 'post_feedback', draft.id);

      const feedbackData = {
        draftId: draft.id,
        userId: user.uid,
        rating,
        regenerated: regenerationCount,
        editPercentage,
        timeToReady,
        wizardSettings: draft.wizardSettings,
        originalLength: originalContent.length,
        finalLength: content.length,
        updatedAt: serverTimestamp(),
      };

      if (feedbackId) {
        // Update existing feedback
        await updateDoc(feedbackRef, feedbackData);
      } else {
        // Create new feedback
        await setDoc(feedbackRef, {
          ...feedbackData,
          createdAt: serverTimestamp(),
        });
        setFeedbackId(draft.id);
      }

      setFeedbackRating(rating);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const calculateEditPercentage = (original: string, current: string): number => {
    if (original === current) return 0;
    if (original.length === 0) return 100;

    // Simple character-level diff
    let differences = 0;
    const maxLength = Math.max(original.length, current.length);

    for (let i = 0; i < maxLength; i++) {
      if (original[i] !== current[i]) {
        differences++;
      }
    }

    return Math.round((differences / maxLength) * 100);
  };

  const calculateTimeToReady = (): number => {
    // Calculate time from draft creation to now (in seconds)
    if (draft.createdAt && draft.createdAt.seconds) {
      const createdAt = draft.createdAt.seconds * 1000;
      const now = Date.now();
      return Math.round((now - createdAt) / 1000);
    }
    return 0;
  };

  const handlePostToLinkedIn = async () => {
    if (!linkedInConnected) {
      alert('Please connect your LinkedIn account in Settings first.');
      router.push('/app/settings');
      return;
    }

    if (!content.trim()) {
      alert('Please add some content before posting to LinkedIn.');
      return;
    }

    setIsPostingToLinkedIn(true);
    setLinkedInPostSuccess(false);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          content: content,
          images: images,  // Include images in the post request
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post to LinkedIn');
      }

      const result = await response.json();

      // Update draft status to 'posted'
      const db = getFirestore();
      const draftRef = doc(db, 'drafts', draft.id);
      await updateDoc(draftRef, {
        status: 'posted',
        postedAt: new Date(),
        linkedInPostId: result.postId,
      });

      setStatus('posted');
      setLinkedInPostSuccess(true);

      alert('Successfully posted to LinkedIn!');

      // Clear success message after 5 seconds
      setTimeout(() => setLinkedInPostSuccess(false), 5000);
    } catch (error) {
      console.error('LinkedIn posting error:', error);
      alert(error instanceof Error ? error.message : 'Failed to post to LinkedIn');
    } finally {
      setIsPostingToLinkedIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Navigation Buttons */}
        {draft.campaignId ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/app/campaigns/${draft.campaignId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaign
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => router.push('/app')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workspace
          </Button>
        )}

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
          onClick={() => handleSave()}
          disabled={isSaving}
          variant="outline"
          className="ml-auto gap-2"
        >
          {isSaving ? (
            <>
              <Save className="h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : justSaved ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Draft
            </>
          )}
        </Button>

        {/* Save and Navigate Button */}
        {draft.campaignId ? (
          <Button
            onClick={() => handleSave('campaign')}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Back to Campaign
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => handleSave('workspace')}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save & Go to Workspace
              </>
            )}
          </Button>
        )}

        {/* Post to LinkedIn Button */}
        <Button
          onClick={handlePostToLinkedIn}
          disabled={isPostingToLinkedIn || !content.trim()}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isPostingToLinkedIn ? (
            <>
              <Linkedin className="h-4 w-4 animate-pulse" />
              Posting...
            </>
          ) : linkedInPostSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Posted to LinkedIn!
            </>
          ) : (
            <>
              <Linkedin className="h-4 w-4" />
              {linkedInConnected ? 'Post to LinkedIn' : 'Connect LinkedIn First'}
            </>
          )}
        </Button>

        {/* Image Attachment Indicator */}
        <Button
          onClick={() => setShowImageManager(!showImageManager)}
          variant={images.length > 0 ? 'default' : 'outline'}
          className={`gap-2 ${images.length > 0 ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
        >
          <ImageIcon className="h-4 w-4" />
          Images
          {images.length > 0 && (
            <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
              {images.length}
            </span>
          )}
          {showImageManager ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Feedback Widget */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">How's the AI-generated content?</h3>
            <p className="text-sm text-slate-600 mt-1">Your feedback helps us improve</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleFeedback('thumbs_up')}
              variant={feedbackRating === 'thumbs_up' ? 'default' : 'outline'}
              className={`gap-2 transition-all ${
                feedbackRating === 'thumbs_up'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'hover:bg-green-50 hover:border-green-300'
              }`}
            >
              <ThumbsUp className={`h-5 w-5 ${feedbackRating === 'thumbs_up' ? 'fill-current' : ''}`} />
              Good
            </Button>
            <Button
              onClick={() => handleFeedback('thumbs_down')}
              variant={feedbackRating === 'thumbs_down' ? 'default' : 'outline'}
              className={`gap-2 transition-all ${
                feedbackRating === 'thumbs_down'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'hover:bg-red-50 hover:border-red-300'
              }`}
            >
              <ThumbsDown className={`h-5 w-5 ${feedbackRating === 'thumbs_down' ? 'fill-current' : ''}`} />
              Needs Work
            </Button>
          </div>
        </div>
        {regenerationCount > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            Regenerated {regenerationCount} {regenerationCount === 1 ? 'time' : 'times'}
          </div>
        )}
      </div>

      {/* Main Editor */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-6">
        {/* Compact Image Preview Bar */}
        {images.length > 0 && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-900">
                <ImageIcon className="h-4 w-4" />
                <span>{images.length} {images.length === 1 ? 'Image' : 'Images'} Attached</span>
              </div>
              <div className="flex-1 flex gap-2 overflow-x-auto">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 border-purple-300 hover:border-purple-500 transition-all cursor-pointer"
                    onClick={() => setShowImageManager(true)}
                    title={image.alt || 'Click to manage images'}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || 'Thumbnail'}
                      className="w-full h-full object-cover"
                    />
                    {image.generatedByAI && (
                      <div className="absolute top-0 right-0 bg-purple-600 rounded-bl-md p-0.5">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageManager(!showImageManager)}
                className="text-purple-700 hover:text-purple-900 hover:bg-purple-100"
              >
                {showImageManager ? 'Hide' : 'Manage'}
              </Button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="block text-sm font-medium text-secondary">
              Content
            </label>
            <div className="flex gap-2 rounded-lg border border-secondary/20 p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-primary text-white'
                    : 'text-secondary/60 hover:text-secondary'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-primary text-white'
                    : 'text-secondary/60 hover:text-secondary'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {viewMode === 'edit' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] w-full rounded-lg border border-secondary/20 p-4 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              placeholder="Your LinkedIn post content..."
            />
          ) : (
            <div className="min-h-[400px] w-full rounded-lg border border-secondary/20 bg-white p-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="prose prose-slate max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-4 text-slate-700 leading-relaxed whitespace-pre-wrap">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-700">{children}</li>,
                  h1: ({ children }) => <h1 className="mb-3 text-2xl font-bold text-slate-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-3 text-xl font-bold text-slate-900">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 text-lg font-semibold text-slate-900">{children}</h3>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-slate-600">{children}</blockquote>,
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-800">{children}</code>,
                }}
              >
                {content || '*No content yet*'}
              </ReactMarkdown>
            </div>
          )}

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
              Scheduled Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
            />
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

          {/* Image Management - Collapsible */}
          {showImageManager && (
            <div className="border-t border-secondary/10 pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-secondary">
                  Manage Images
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImageManager(false)}
                  className="gap-2 text-slate-500 hover:text-slate-700"
                >
                  <ChevronUp className="h-4 w-4" />
                  Hide
                </Button>
              </div>
              <ImageManager
                draftId={draft.id}
                images={images}
                onImagesChange={setImages}
              />
            </div>
          )}

          {/* Show Image Manager button when collapsed and no images */}
          {!showImageManager && images.length === 0 && (
            <div className="border-t border-secondary/10 pt-6">
              <Button
                variant="outline"
                onClick={() => setShowImageManager(true)}
                className="w-full gap-2 border-dashed"
              >
                <ImageIcon className="h-4 w-4" />
                Add Images to Post
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Version History */}
      <VersionHistory
        draftId={draft.id}
        onLoadVersion={(versionContent) => setContent(versionContent)}
        currentContent={content}
      />

      {/* Mentor Chat Widget (floating) - DISABLED */}
      {/* {mentorshipSettings?.enabled && (
        <MentorChatWidget
          userId={draft.userId}
          draftContent={content}
          draftId={draft.id}
          userPatterns={userPatterns}
          temperature={mentorshipSettings.temperature || 3}
          mentorName={mentorshipSettings.mentorName || 'Alex'}
        />
      )} */}
    </div>
  );
}
