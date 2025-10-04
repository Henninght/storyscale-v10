'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Check, Save, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/InfoTooltip';

type WizardStep = 1 | 2 | 3 | 4;

interface WizardData {
  // Step 1
  input: string;
  referenceUrls: string[];
  customInstructions?: string;

  // Step 2
  tone: string;
  purpose: string;
  audience: string;
  style: string;

  // Step 3
  language: 'en' | 'no';
  length: 'short' | 'medium' | 'long';
  includeCTA: boolean;
  emojiUsage: 'none' | 'minimal' | 'moderate';

  // Campaign context (optional)
  campaignId?: string;
  campaignTheme?: string;
  campaignDescription?: string;
  postNumber?: number;
  previousContent?: string;
  aiStrategy?: {
    overallApproach: string;
    strategicOverview: string;
    narrativeArc: string;
    successMarkers: string[];
    postBlueprints: Array<{
      position: number;
      topic: string;
      goal: string;
      locked: boolean;
      userCustomized: boolean;
    }>;
  };
  postBlueprint?: {
    position: number;
    topic: string;
    goal: string;
    locked: boolean;
    userCustomized: boolean;
  };
}

const initialData: WizardData = {
  input: '',
  referenceUrls: ['', '', ''],
  tone: 'professional',
  purpose: 'engagement',
  audience: 'professionals',
  style: 'story-based',
  language: 'en',
  length: 'medium',
  includeCTA: true,
  emojiUsage: 'minimal',
};

// Component to handle campaign context loading with useSearchParams
function CampaignContextLoader({
  campaignLoaded,
  setCampaignLoaded,
  setData,
}: {
  campaignLoaded: boolean;
  setCampaignLoaded: (val: boolean) => void;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}) {
  const searchParams = useSearchParams();

  // Load campaign context from URL
  useEffect(() => {
    const loadCampaignContext = async () => {
      const campaignId = searchParams.get('campaign') || searchParams.get('campaignId');
      const postNumber = searchParams.get('postNumber');

      if (campaignId && !campaignLoaded) {
        try {
          const db = getFirestore();

          // Load campaign
          const campaignRef = doc(db, 'campaigns', campaignId);
          const campaignSnap = await getDoc(campaignRef);

          if (campaignSnap.exists()) {
            const campaignData = campaignSnap.data();

            // Load previous post if exists
            let previousContent = '';
            if (postNumber && parseInt(postNumber) > 1) {
              const draftsRef = collection(db, 'drafts');
              const q = query(
                draftsRef,
                where('campaignId', '==', campaignId),
                orderBy('createdAt', 'desc'),
                limit(1)
              );
              const draftsSnap = await getDocs(q);
              if (!draftsSnap.empty) {
                previousContent = draftsSnap.docs[0].data().content || '';
              }
            }

            // Get the specific post blueprint for this post number
            const postIndex = postNumber ? parseInt(postNumber) - 1 : 0;
            const postBlueprint = campaignData.aiStrategy?.postBlueprints?.[postIndex];

            // Update wizard data with campaign context
            setData(prev => ({
              ...prev,
              campaignId,
              campaignTheme: campaignData.theme,
              campaignDescription: campaignData.description,
              postNumber: postNumber ? parseInt(postNumber) : 1,
              previousContent,
              language: campaignData.language || 'en',
              style: campaignData.style || 'story-based',
              tone: campaignData.tone || prev.tone,
              purpose: campaignData.purpose || prev.purpose,
              audience: campaignData.audience || prev.audience,
              aiStrategy: campaignData.aiStrategy,
              postBlueprint,
            }));

            setCampaignLoaded(true);
          }
        } catch (error) {
          console.error('Error loading campaign context:', error);
        }
      }
    };

    loadCampaignContext();
  }, [searchParams, campaignLoaded, setCampaignLoaded, setData]);

  // Load saved draft on mount
  useEffect(() => {
    // Skip loading saved draft if we have campaign context
    if (searchParams.get('campaign') || searchParams.get('campaignId')) return;

    const savedDraft = localStorage.getItem('wizardDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setData(parsed.data);
      } catch (error) {
        console.error('Failed to load saved draft:', error);
      }
    }
  }, [searchParams, setData]);

  return null;
}

export function PostWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [campaignLoaded, setCampaignLoaded] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [data, currentStep]);

  const saveDraft = () => {
    setIsSaving(true);
    try {
      const draftData = {
        data,
        step: currentStep,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('wizardDraft', JSON.stringify(draftData));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.input.trim().length >= 50 && data.input.trim().length <= 2000;
      case 2:
        return data.tone && data.purpose && data.audience && data.style;
      case 3:
        return data.language && data.length;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleGenerate = async () => {
    if (!canProceed()) return;

    setIsGenerating(true);
    try {
      // Get Firebase Auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Force token refresh with forceRefresh=true to ensure it's valid
      const token = await user.getIdToken(true);

      // Call generate API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wizardSettings: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate post');
      }

      const result = await response.json();

      // Clear saved draft on successful generation
      localStorage.removeItem('wizardDraft');

      // Navigate to editor using Next.js router (client-side navigation)
      router.push(`/app/drafts/${result.draftId}`);
    } catch (error) {
      console.error('Generation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Campaign context loader with Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <CampaignContextLoader
          campaignLoaded={campaignLoaded}
          setCampaignLoaded={setCampaignLoaded}
          setData={setData}
        />
      </Suspense>

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="mb-4 flex items-center justify-end gap-2 text-sm text-slate-500">
          {isSaving ? (
            <>
              <Save className="h-4 w-4 animate-pulse" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span>
                Saved {new Date().getTime() - lastSaved.getTime() < 60000
                  ? 'just now'
                  : `${Math.floor((new Date().getTime() - lastSaved.getTime()) / 60000)} min ago`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all duration-300 ${
                  step === currentStep
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 ring-4 ring-primary/20'
                    : step < currentStep
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step < currentStep ? <Check className="h-5 w-5 animate-in zoom-in duration-300" /> : step}
              </div>
              {step < 4 && (
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 mx-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      step < currentStep ? 'bg-green-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm font-medium">
          <span className={`transition-colors duration-200 ${currentStep === 1 ? 'text-primary font-semibold' : 'text-secondary/60'}`}>Input</span>
          <span className={`transition-colors duration-200 ${currentStep === 2 ? 'text-primary font-semibold' : 'text-secondary/60'}`}>Configuration</span>
          <span className={`transition-colors duration-200 ${currentStep === 3 ? 'text-primary font-semibold' : 'text-secondary/60'}`}>Preferences</span>
          <span className={`transition-colors duration-200 ${currentStep === 4 ? 'text-primary font-semibold' : 'text-secondary/60'}`}>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8 shadow-sm">
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {currentStep === 1 && (
            <Step1
              input={data.input}
              referenceUrls={data.referenceUrls}
              customInstructions={data.customInstructions}
              onUpdate={updateData}
            />
          )}
          {currentStep === 2 && (
            <Step2
              tone={data.tone}
              purpose={data.purpose}
              audience={data.audience}
              style={data.style}
              onUpdate={updateData}
            />
          )}
          {currentStep === 3 && (
            <Step3
              language={data.language}
              length={data.length}
              includeCTA={data.includeCTA}
              emojiUsage={data.emojiUsage}
              onUpdate={updateData}
            />
          )}
          {currentStep === 4 && (
            <Step4 data={data} onGenerate={handleGenerate} isGenerating={isGenerating} />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2 transition-all hover:gap-3 hover:shadow-md"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
        {currentStep < 4 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="gap-2 transition-all hover:gap-3 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
          >
            Next
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !canProceed()}
            className="transition-all hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </span>
            ) : (
              'Generate Post'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Input
interface Step1Props {
  input: string;
  referenceUrls: string[];
  customInstructions?: string;
  onUpdate: (data: Partial<WizardData>) => void;
}

function Step1({ input, referenceUrls, customInstructions, onUpdate }: Step1Props) {
  const charCount = input.length;
  const isValid = charCount >= 50 && charCount <= 2000;
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        const db = getFirestore();
        const campaignsRef = collection(db, 'campaigns');
        const q = query(campaignsRef, where('userId', '==', user.uid), where('status', '==', 'active'));
        const snapshot = await getDocs(q);

        const campaignsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    loadCampaigns();
  }, []);

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    if (campaignId) {
      onUpdate({ campaignId });
    } else {
      onUpdate({ campaignId: undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">What would you like to write about?</h2>
        <p className="text-secondary/70">
          Share your main idea, story, or topic. The more details you provide, the better the result.
        </p>
      </div>

      {/* Campaign Selector */}
      {!loadingCampaigns && campaigns.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary">Link to Campaign (Optional)</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => handleCampaignSelect(e.target.value)}
            className="w-full rounded-lg border border-secondary/20 px-4 py-3 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Standalone post (no campaign)</option>
            {campaigns.map((campaign: any) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.postsGenerated}/{campaign.targetPostCount} posts)
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-secondary/60">
            Select a campaign to generate this post as part of a series
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-secondary">Your Input *</label>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => onUpdate({ input: e.target.value })}
            placeholder="Example: I recently helped a client increase their revenue by 40% through a simple automation. Here's what we did..."
            className="min-h-[200px] w-full rounded-lg border border-secondary/20 p-4 text-secondary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-lg"
          />
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    charCount < 50
                      ? 'bg-slate-400'
                      : charCount < 1000
                      ? 'bg-green-500'
                      : charCount < 1800
                      ? 'bg-amber-500'
                      : charCount <= 2000
                      ? 'bg-red-500'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min((charCount / 2000) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className={`text-sm font-medium transition-colors ${isValid ? 'text-green-600' : charCount > 2000 ? 'text-red-600' : 'text-secondary/60'}`}>
              {charCount} / 2000
            </div>
          </div>
          {charCount < 50 && (
            <p className="mt-1 text-xs text-amber-600">Add at least {50 - charCount} more characters</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-secondary">Reference URLs (optional)</label>
        <p className="mb-3 text-sm text-secondary/60">Add up to 3 URLs for additional context</p>
        <div className="space-y-2">
          {referenceUrls.map((url, index) => (
            <input
              key={index}
              type="url"
              value={url}
              onChange={(e) => {
                const newUrls = [...referenceUrls];
                newUrls[index] = e.target.value;
                onUpdate({ referenceUrls: newUrls });
              }}
              placeholder={`URL ${index + 1}`}
              className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          ))}
        </div>
      </div>

      {/* Advanced Settings - Collapsible */}
      <div className="rounded-lg border border-secondary/10 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-100/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-secondary">Advanced: Custom Instructions</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-secondary/70">Optional</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-secondary/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-secondary/60" />
          )}
        </button>

        {showAdvanced && (
          <div className="border-t border-secondary/10 px-4 pb-4 pt-3">
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              <div className="text-xs text-blue-900">
                <p className="mb-1 font-medium">Guide the AI with specific instructions:</p>
                <ul className="ml-4 list-disc space-y-0.5 text-blue-800">
                  <li>Be specific about which data or elements to include</li>
                  <li>When comparing, explicitly mention all items to compare</li>
                  <li>Specify desired structure, format, or narrative angle</li>
                  <li>More detailed instructions lead to better results</li>
                </ul>
              </div>
            </div>

            <textarea
              value={customInstructions || ''}
              onChange={(e) => onUpdate({ customInstructions: e.target.value })}
              placeholder="Example: Include pricing for both products. Focus on the sustainability metrics from reference 2. Use a question-based opening."
              maxLength={500}
              className="min-h-[100px] w-full rounded-lg border border-secondary/20 p-3 text-sm text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-1 text-right text-xs text-secondary/60">
              {(customInstructions || '').length} / 500 characters
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 2: Configuration
interface Step2Props {
  tone: string;
  purpose: string;
  audience: string;
  style: string;
  onUpdate: (data: Partial<WizardData>) => void;
}

function Step2({ tone, purpose, audience, style, onUpdate }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">Configure Your Post</h2>
        <p className="text-secondary/70">Choose the tone, purpose, and style for your content.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Tone *</label>
            <InfoTooltip content="Choose how formal or casual your post should sound. Professional establishes credibility for corporate audiences, while Casual builds authentic connections through conversational language." />
          </div>
          <select
            value={tone}
            onChange={(e) => onUpdate({ tone: e.target.value })}
            className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="inspirational">Inspirational</option>
            <option value="educational">Educational</option>
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Purpose *</label>
            <InfoTooltip content="Define your post's goal. Engagement sparks conversations, Lead Generation drives action toward your services, Brand Awareness increases visibility, and Thought Leadership establishes you as an industry authority." />
          </div>
          <select
            value={purpose}
            onChange={(e) => onUpdate({ purpose: e.target.value })}
            className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="engagement">Engagement</option>
            <option value="lead_generation">Lead Generation</option>
            <option value="brand_awareness">Brand Awareness</option>
            <option value="thought_leadership">Thought Leadership</option>
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Target Audience *</label>
            <InfoTooltip content="Select who you're writing for. Executives prefer strategic, high-level insights. Entrepreneurs want growth strategies and practical advice. Professionals seek tactical tips and career development. Industry-Specific uses niche terminology." />
          </div>
          <select
            value={audience}
            onChange={(e) => onUpdate({ audience: e.target.value })}
            className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="executives">Executives</option>
            <option value="entrepreneurs">Entrepreneurs</option>
            <option value="professionals">Professionals</option>
            <option value="industry_specific">Industry-Specific</option>
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Post Style *</label>
            <InfoTooltip content="Choose your post structure. Story-Based uses narrative for engagement, List Format offers scannable tips, Question-Based drives curiosity, and How-To provides actionable instructions." />
          </div>
          <select
            value={style}
            onChange={(e) => onUpdate({ style: e.target.value })}
            className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="story-based">Story-Based</option>
            <option value="list_format">List Format</option>
            <option value="question-based">Question-Based</option>
            <option value="how-to">How-To</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 3: Preferences
interface Step3Props {
  language: 'en' | 'no';
  length: 'short' | 'medium' | 'long';
  includeCTA: boolean;
  emojiUsage: 'none' | 'minimal' | 'moderate';
  onUpdate: (data: Partial<WizardData>) => void;
}

function Step3({ language, length, includeCTA, emojiUsage, onUpdate }: Step3Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">Set Your Preferences</h2>
        <p className="text-secondary/70">Customize the language, length, and formatting.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary">Language *</label>
          <div className="flex gap-4">
            <button
              onClick={() => onUpdate({ language: 'en' })}
              className={`flex-1 rounded-lg border px-6 py-3 font-medium transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary text-white'
                  : 'border-secondary/20 text-secondary hover:bg-secondary/5'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onUpdate({ language: 'no' })}
              className={`flex-1 rounded-lg border px-6 py-3 font-medium transition-all ${
                language === 'no'
                  ? 'border-primary bg-primary text-white'
                  : 'border-secondary/20 text-secondary hover:bg-secondary/5'
              }`}
            >
              Norwegian
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Post Length *</label>
            <InfoTooltip content="Short posts (50-150 words) are punchy and quick to consume. Medium (150-300 words) is optimal for LinkedIn's algorithm. Long (300-500 words) demonstrates expertise in depth." />
          </div>
          <div className="space-y-2">
            {[
              { value: 'short', label: 'Short', desc: '50-150 words' },
              { value: 'medium', label: 'Medium', desc: '150-300 words' },
              { value: 'long', label: 'Long', desc: '300-500 words' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate({ length: option.value as 'short' | 'medium' | 'long' })}
                className={`w-full rounded-lg border px-6 py-3 text-left transition-all ${
                  length === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-secondary/20 hover:bg-secondary/5'
                }`}
              >
                <div className="font-medium text-secondary">{option.label}</div>
                <div className="text-sm text-secondary/60">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-secondary">
              <input
                type="checkbox"
                checked={includeCTA}
                onChange={(e) => onUpdate({ includeCTA: e.target.checked })}
                className="h-4 w-4 rounded border-secondary/20 text-primary focus:ring-primary"
              />
              Include Call-to-Action
            </label>
            <InfoTooltip content="Adding a CTA encourages readers to engage with your post through comments, shares, or specific actions. This can increase interaction by 30-50%." />
          </div>
          <p className="ml-6 text-sm text-secondary/60">
            Add a prompt for engagement (e.g., "What do you think?")
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Emoji Usage</label>
            <InfoTooltip content="None keeps posts purely professional. Minimal (1-2) adds strategic visual breaks. Moderate (3-5) improves scannability and adds personality to your content." />
          </div>
          <select
            value={emojiUsage}
            onChange={(e) => onUpdate({ emojiUsage: e.target.value as 'none' | 'minimal' | 'moderate' })}
            className="w-full rounded-lg border border-secondary/20 px-4 py-2 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="none">None</option>
            <option value="minimal">Minimal (1-2 emojis)</option>
            <option value="moderate">Moderate (3-5 emojis)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Step 4: Review
interface Step4Props {
  data: WizardData;
  onGenerate: () => void;
  isGenerating: boolean;
}

function Step4({ data, isGenerating }: Step4Props) {
  const router = useRouter();

  const handleDeleteDraft = () => {
    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      localStorage.removeItem('wizardDraft');
      router.push('/app');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">Review Your Selections</h2>
        <p className="text-secondary/70">
          Check everything looks good before generating your post.
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-slate-50 p-6">
        <div>
          <h3 className="mb-1 text-sm font-medium text-secondary/60">Your Input</h3>
          <p className="text-secondary">{data.input.slice(0, 200)}...</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-medium text-secondary/60">Configuration</h3>
            <ul className="space-y-1 text-sm text-secondary">
              <li>Tone: {data.tone}</li>
              <li>Purpose: {data.purpose.replace('_', ' ')}</li>
              <li>Audience: {data.audience.replace('_', ' ')}</li>
              <li>Style: {data.style.replace('-', ' ')}</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-secondary/60">Preferences</h3>
            <ul className="space-y-1 text-sm text-secondary">
              <li>Language: {data.language === 'en' ? 'English' : 'Norwegian'}</li>
              <li>Length: {data.length}</li>
              <li>Call-to-Action: {data.includeCTA ? 'Yes' : 'No'}</li>
              <li>Emojis: {data.emojiUsage}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          ℹ️ This will use <strong>1 post credit</strong> from your monthly limit.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleDeleteDraft}
          disabled={isGenerating}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          Delete Draft
        </Button>
      </div>

      {isGenerating && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm font-medium text-secondary">
              Generating your post... This may take a few moments.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
