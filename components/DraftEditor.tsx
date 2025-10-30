'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, updateDoc, collection, addDoc, serverTimestamp, setDoc, getDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Copy, Check, RefreshCw, Sparkles, Save, ArrowLeft, ThumbsUp, ThumbsDown, Linkedin, Image as ImageIcon, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VersionHistory } from '@/components/VersionHistory';
import { FeedbackRating, MentorshipSettings, DraftImage } from '@/types';
import { MentorChatWidget } from '@/components/MentorChatWidget';
import { analyzeDraftPatterns } from '@/lib/mentorshipEngine';
import { ImageManager } from '@/components/ImageManager';
import { SimilarPostsWarning } from '@/components/SimilarPostsWarning';
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
      } catch (error: any) {
        // Silently handle permission-denied errors (no feedback exists yet)
        if (error?.code !== 'permission-denied') {
          console.error('Error loading feedback:', error);
        }
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
    <div className="space-y-4">
      {/* Compact Header - One Line */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {draft.campaignId ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/app/campaigns/${draft.campaignId}`)}
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push('/app')}
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold text-slate-800">Edit Draft</h1>
        </div>
        <span className="text-sm text-slate-600">{charCount} characters</span>
      </div>

      {/* Hero Editor Card */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Integrated Toolbar */}
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center gap-3">
          {/* Edit/Preview Toggle */}
          <div className="flex gap-0.5 bg-white border border-slate-300 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'edit'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preview
            </button>
          </div>

          <div className="h-6 w-px bg-slate-300"></div>

          {/* Action Buttons */}
          <Button
            onClick={handleEnhance}
            disabled={isEnhancing || !content.trim()}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-700"
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
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-700"
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

          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-700"
          >
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

          {/* Right side - Images */}
          <div className="ml-auto flex items-center gap-2">
            {images.length > 0 && (
              <span className="text-xs text-slate-600 bg-slate-200 px-2 py-1 rounded-full">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </span>
            )}
            <Button
              onClick={() => setShowImageManager(!showImageManager)}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-700"
            >
              <ImageIcon className="h-4 w-4" />
              Images
              {showImageManager ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Compact Image Preview (if images exist) */}
        {images.length > 0 && showImageManager && (
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-300 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => setShowImageManager(true)}
                  title={image.alt || 'Click to manage images'}
                >
                  <img
                    src={image.url}
                    alt={image.alt || 'Thumbnail'}
                    className="w-full h-full object-cover"
                  />
                  {image.generatedByAI && (
                    <div className="absolute top-0 right-0 bg-blue-600 rounded-bl-md p-0.5">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Large Editor Area */}
        {viewMode === 'edit' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] p-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset resize-none"
            placeholder="Write your LinkedIn post here..."
          />
        ) : (
          <div className="w-full min-h-[500px] p-6 bg-white">
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
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
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600">{children}</blockquote>,
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-sm text-slate-800">{children}</code>,
                }}
              >
                {content || '*No content yet*'}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex justify-end gap-2">
          <Button
            onClick={() => handleSave()}
            disabled={isSaving}
            variant="outline"
            className="gap-2"
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
                Posted!
              </>
            ) : (
              <>
                <Linkedin className="h-4 w-4" />
                Post to LinkedIn
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Similar Posts Warning (if any) */}
      {draft.similarPosts && draft.similarPosts.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-blue-900">
                Content is similar to previous posts
                {draft.similarPosts[0]?.score && ` (${Math.round(draft.similarPosts[0].score)}% match)`}
              </span>
              {draft.similarPosts.length > 0 && (
                <button
                  onClick={() => router.push(`/app/drafts/${draft.similarPosts[0].id}`)}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  View similar post →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Metadata Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DraftStatus)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="idea">Idea</option>
              <option value="in_progress">In Progress</option>
              <option value="ready_to_post">Ready to Post</option>
              <option value="posted">Posted</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Scheduled Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Tags
            </label>
            <div className="flex gap-1.5">
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
                placeholder="Add tag..."
                className="flex-1 text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button onClick={handleAddTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-1 text-xs text-slate-700"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image Manager (Collapsible) */}
      {showImageManager && images.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">Manage Images</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageManager(false)}
              className="gap-1 text-slate-500 hover:text-slate-700"
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

      {/* Minimal Feedback Section */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-slate-800">Rate this content</h3>
            <p className="text-xs text-slate-500 mt-0.5">Help us improve AI generation</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleFeedback('thumbs_up')}
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${
                feedbackRating === 'thumbs_up'
                  ? 'text-green-600 bg-green-50'
                  : 'text-slate-600'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              Good
            </Button>
            <Button
              onClick={() => handleFeedback('thumbs_down')}
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${
                feedbackRating === 'thumbs_down'
                  ? 'text-red-600 bg-red-50'
                  : 'text-slate-600'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              Needs Work
            </Button>
          </div>
        </div>
        {regenerationCount > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            Regenerated {regenerationCount} {regenerationCount === 1 ? 'time' : 'times'}
          </div>
        )}
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
