'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardData {
  input: string;
  referenceUrls: Array<{
    url: string;
    content?: string;
    status?: 'fetching' | 'success' | 'error';
    error?: string;
    preview?: string;
  }>;
  customInstructions: string;
  tone: string;
  style: string;
  length: 'short' | 'medium' | 'long';
  language: 'en' | 'no';
  purpose: string;
  audience: string;
  includeCTA: boolean;
  emojiUsage: 'none' | 'minimal' | 'moderate';
  campaignId?: string;
}

const initialData: WizardData = {
  input: '',
  referenceUrls: [],
  customInstructions: '',
  tone: 'professional',
  style: 'story-based',
  length: 'medium',
  language: 'en',
  purpose: 'engagement',
  audience: 'professionals',
  includeCTA: true,
  emojiUsage: 'minimal',
};

export function PostWizardV2() {
  const router = useRouter();
  const [data, setData] = useState<WizardData>(initialData);
  const [preview, setPreview] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user ID
  useEffect(() => {
    const loadUser = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);

        // Load user language preference
        const db = getFirestore();
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userLanguage = userData?.profile?.language;

          if (userLanguage) {
            setData(prev => ({ ...prev, language: userLanguage as 'en' | 'no' }));
          }
        }
      }
    };
    loadUser();
  }, []);

  // Debounced preview fetch
  const fetchPreview = useCallback(async (currentData: WizardData) => {
    if (currentData.input.length < 50) {
      setPreview('');
      setPreviewError('Please add at least 50 characters to see a preview.');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wizardSettings: {
            input: currentData.input,
            tone: currentData.tone,
            style: currentData.style,
            length: currentData.length,
            language: currentData.language,
            emojiUsage: currentData.emojiUsage,
            referenceUrls: currentData.referenceUrls
              .filter(r => r.status === 'success')
              .map(r => r.url),
            customInstructions: currentData.customInstructions,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate preview');
      }

      const result = await response.json();
      setPreview(result.preview);
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Debounced effect for preview updates
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPreview(data);
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data.input, data.tone, data.style, data.length, data.language, data.emojiUsage, data.customInstructions, fetchPreview]);

  const handleAddReferenceUrl = async () => {
    if (!newUrl.trim()) return;

    const urlEntry = {
      url: newUrl,
      status: 'fetching' as const,
    };

    setData(prev => ({
      ...prev,
      referenceUrls: [...prev.referenceUrls, urlEntry],
    }));
    setNewUrl('');

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) throw new Error('Not authenticated');

      const token = await user.getIdToken();

      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: newUrl }),
      });

      const result = await response.json();

      setData(prev => ({
        ...prev,
        referenceUrls: prev.referenceUrls.map(r =>
          r.url === newUrl
            ? {
                ...r,
                status: response.ok ? 'success' : 'error',
                content: result.content,
                preview: result.content?.slice(0, 100) + '...',
                error: response.ok ? undefined : result.error,
              }
            : r
        ),
      }));

      // Trigger preview refresh
      if (response.ok) {
        fetchPreview(data);
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        referenceUrls: prev.referenceUrls.map(r =>
          r.url === newUrl
            ? { ...r, status: 'error', error: 'Failed to fetch URL' }
            : r
        ),
      }));
    }
  };

  const handleRemoveUrl = (index: number) => {
    setData(prev => ({
      ...prev,
      referenceUrls: prev.referenceUrls.filter((_, i) => i !== index),
    }));
  };

  const handleGenerate = async () => {
    if (data.input.length < 50) {
      alert('Please add at least 50 characters to your input.');
      return;
    }

    setIsGenerating(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken(true);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wizardSettings: {
            ...data,
            referenceUrls: data.referenceUrls
              .filter(r => r.status === 'success')
              .map(r => r.url),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate post');
      }

      const result = await response.json();
      router.push(`/app/drafts/${result.draftId}`);
    } catch (error) {
      console.error('Generation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  const charCount = data.input.length;
  const isValid = charCount >= 50 && charCount <= 2000;
  const charPercentage = (charCount / 2000) * 100;

  const getCharColor = () => {
    if (charCount < 50) return 'bg-slate-400';
    if (charCount < 1000) return 'bg-green-500';
    if (charCount < 1800) return 'bg-amber-500';
    if (charCount <= 2000) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const estimatedReadingTime = (words: number) => {
    return Math.ceil(words / 200); // Average reading speed: 200 words/min
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Create New Post</h1>
        <p className="mt-1.5 text-slate-600">
          See your post preview update live as you configure settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[40%_60%]">
        {/* LEFT PANEL: Unified Form */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg">
          {/* Input Section */}
          <div className="space-y-3">
            <label className="block text-base font-semibold text-slate-800">
              📝 What do you want to write about?
            </label>
            <textarea
              value={data.input}
              onChange={(e) => setData(prev => ({ ...prev, input: e.target.value }))}
              placeholder="Example: I recently helped a client increase their revenue by 40% through a simple automation. Here's what we did..."
              className="min-h-[220px] w-full rounded-lg border-2 border-slate-200 bg-white p-4 text-base text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full transition-all duration-300 ${getCharColor()}`}
                    style={{ width: `${Math.min(charPercentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className={`text-sm font-semibold transition-colors ${isValid ? 'text-green-600' : charCount > 2000 ? 'text-red-600' : 'text-slate-500'}`}>
                {charCount} / 2000
              </div>
            </div>
            {charCount < 50 && (
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ Add at least {50 - charCount} more characters
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-200" />

          {/* Settings Grid */}
          <div className="space-y-4">
            {/* Row 1: Tone, Style, Length */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tone</label>
                <select
                  value={data.tone}
                  onChange={(e) => setData(prev => ({ ...prev, tone: e.target.value }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="educational">Educational</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Style</label>
                <select
                  value={data.style}
                  onChange={(e) => setData(prev => ({ ...prev, style: e.target.value }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="story-based">Story</option>
                  <option value="list_format">List</option>
                  <option value="question-based">Question</option>
                  <option value="how-to">How-To</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Length</label>
                <select
                  value={data.length}
                  onChange={(e) => setData(prev => ({ ...prev, length: e.target.value as 'short' | 'medium' | 'long' }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>

            {/* Row 2: Language, Audience */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Language</label>
                <select
                  value={data.language}
                  onChange={(e) => setData(prev => ({ ...prev, language: e.target.value as 'en' | 'no' }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="no">🇳🇴 Norwegian</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</label>
                <select
                  value={data.audience}
                  onChange={(e) => setData(prev => ({ ...prev, audience: e.target.value }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="executives">Executives</option>
                  <option value="entrepreneurs">Entrepreneurs</option>
                  <option value="professionals">Professionals</option>
                  <option value="industry_specific">Industry-Specific</option>
                </select>
              </div>
            </div>

            {/* Row 3: Purpose, Emojis, CTA */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</label>
                <select
                  value={data.purpose}
                  onChange={(e) => setData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="engagement">Engagement</option>
                  <option value="lead_generation">Lead Generation</option>
                  <option value="brand_awareness">Brand Awareness</option>
                  <option value="thought_leadership">Thought Leadership</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Emojis</label>
                <select
                  value={data.emojiUsage}
                  onChange={(e) => setData(prev => ({ ...prev, emojiUsage: e.target.value as 'none' | 'minimal' | 'moderate' }))}
                  className="w-full h-10 rounded-lg border-2 border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="none">None</option>
                  <option value="minimal">Minimal (1-2)</option>
                  <option value="moderate">Moderate (3-5)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Call-to-Action</label>
                <label className="flex h-10 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.includeCTA}
                    onChange={(e) => setData(prev => ({ ...prev, includeCTA: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span>Include</span>
                </label>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-200" />

          {/* Optional Features */}
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">🔗 Reference URL (optional)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddReferenceUrl();
                    }
                  }}
                />
                <Button
                  onClick={handleAddReferenceUrl}
                  disabled={!newUrl.trim() || data.referenceUrls.length >= 3}
                  size="sm"
                  className="h-9"
                >
                  Add
                </Button>
              </div>
              {data.referenceUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {data.referenceUrls.map((ref, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                    >
                      {ref.status === 'fetching' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                      {ref.status === 'success' && <Check className="h-3 w-3 text-green-500" />}
                      {ref.status === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-blue-600 hover:underline">
                        {ref.url}
                      </a>
                      <button onClick={() => handleRemoveUrl(index)} className="text-slate-400 hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">✏️ Custom Instructions (optional)</label>
              <textarea
                value={data.customInstructions}
                onChange={(e) => setData(prev => ({ ...prev, customInstructions: e.target.value }))}
                placeholder="Example: Focus on cost savings. Use a story-based opening."
                maxLength={500}
                className="min-h-[60px] w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="mt-1 text-right text-xs text-slate-500">
                {data.customInstructions.length} / 500
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-lg">
            {/* Content Area */}
            <div className="min-h-[500px] p-8">
              {previewLoading && (
                <div className="flex min-h-[450px] items-center justify-center">
                  <div className="text-center">
                    <div className="relative mx-auto mb-4 h-16 w-16">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600"></div>
                    </div>
                    <p className="text-base font-medium text-slate-700">Generating preview...</p>
                    <p className="mt-1 text-sm text-slate-500">This will just take a moment</p>
                  </div>
                </div>
              )}

              {previewError && !previewLoading && (
                <div className="flex min-h-[450px] items-center justify-center">
                  <div className="max-w-md rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                      <AlertCircle className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-base font-semibold text-amber-900">{previewError}</p>
                  </div>
                </div>
              )}

              {preview && !previewLoading && (
                <div className="space-y-6">
                  {/* Clean preview text */}
                  <div className="prose prose-slate prose-lg max-w-none">
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                      {preview}
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="flex items-center justify-center gap-6 border-t border-slate-200 pt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-xs font-bold text-blue-700">{getWordCount(preview)}</span>
                      </div>
                      <span className="font-medium text-slate-600">words</span>
                    </div>
                    <div className="h-4 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <span className="text-xs font-bold text-green-700">{estimatedReadingTime(getWordCount(preview))}</span>
                      </div>
                      <span className="font-medium text-slate-600">min read</span>
                    </div>
                  </div>
                </div>
              )}

              {!preview && !previewLoading && !previewError && (
                <div className="flex min-h-[450px] items-center justify-center">
                  <div className="max-w-sm text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                      <Sparkles className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700">Ready to create?</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Your AI-generated preview will appear here as you type
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => fetchPreview(data)}
                  disabled={previewLoading || data.input.length < 50}
                  className="flex-1 border-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !isValid}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create Draft (1⭐)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
