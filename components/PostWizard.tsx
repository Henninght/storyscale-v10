'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Check, Save, ChevronDown, ChevronUp, Info, Briefcase, Users, Target, Lightbulb, FileText, List, HelpCircle, BookOpen, Sparkles, MessageCircle, TrendingUp, Award, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/InfoTooltip';
import { WizardStepTransition } from '@/components/WizardStepTransition';

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
  userId,
}: {
  campaignLoaded: boolean;
  setCampaignLoaded: (val: boolean) => void;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
  userId: string | null;
}) {
  const searchParams = useSearchParams();

  // Load user profile language preference on mount
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!userId) return;

      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userLanguage = userData?.profile?.language;

          if (userLanguage) {
            setData(prev => ({
              ...prev,
              language: userLanguage as 'en' | 'no',
            }));
          }
        }
      } catch (error) {
        console.error('Error loading user language preference:', error);
      }
    };

    loadUserLanguage();
  }, [userId, setData]);

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
  const [userId, setUserId] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user ID on mount
  useEffect(() => {
    const loadUser = async () => {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setUserId(user.uid);
      }
    };
    loadUser();
  }, []);

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
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to generate post';
        throw new Error(errorMessage);
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
          userId={userId}
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
        <WizardStepTransition step={currentStep}>
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
        </WizardStepTransition>
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

interface OptionCardProps {
  icon: React.ElementType;
  label: string;
  description: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ icon: Icon, label, description, value, selected, onClick }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
        selected
          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
          : 'border-secondary/10 hover:border-primary/30 hover:bg-secondary/5 hover:scale-[1.02] hover:shadow-lg'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 transition-colors ${
          selected ? 'bg-primary/10' : 'bg-secondary/5 group-hover:bg-primary/10'
        }`}>
          <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-secondary group-hover:text-primary'}`} />
        </div>
        <div className="flex-1">
          <div className="mb-1 font-semibold text-secondary">{label}</div>
          <div className="text-sm text-secondary/60">{description}</div>
        </div>
        {selected && (
          <Check className="h-5 w-5 text-primary animate-in zoom-in duration-200" />
        )}
      </div>
    </button>
  );
}

function Step2({ tone, purpose, audience, style, onUpdate }: Step2Props) {
  const toneOptions = [
    { value: 'professional', label: 'Professional', icon: Briefcase, description: 'Establishes credibility for corporate audiences' },
    { value: 'casual', label: 'Casual', icon: MessageCircle, description: 'Conversational language for authentic connections' },
    { value: 'inspirational', label: 'Inspirational', icon: Sparkles, description: 'Motivating content focused on growth' },
    { value: 'educational', label: 'Educational', icon: BookOpen, description: 'Clear teaching-focused content' },
  ];

  const purposeOptions = [
    { value: 'engagement', label: 'Engagement', icon: MessageCircle, description: 'Sparks conversations and comments' },
    { value: 'lead_generation', label: 'Lead Generation', icon: Target, description: 'Drives action toward services' },
    { value: 'brand_awareness', label: 'Brand Awareness', icon: TrendingUp, description: 'Increases visibility and recognition' },
    { value: 'thought_leadership', label: 'Thought Leadership', icon: Award, description: 'Establishes industry authority' },
  ];

  const audienceOptions = [
    { value: 'executives', label: 'Executives', icon: Briefcase, description: 'Strategic, high-level insights' },
    { value: 'entrepreneurs', label: 'Entrepreneurs', icon: Lightbulb, description: 'Growth strategies and practical advice' },
    { value: 'professionals', label: 'Professionals', icon: Users, description: 'Tactical tips and career development' },
    { value: 'industry_specific', label: 'Industry-Specific', icon: Target, description: 'Niche terminology and specialized challenges' },
  ];

  const styleOptions = [
    { value: 'story-based', label: 'Story-Based', icon: BookOpen, description: 'Narrative structure for engagement' },
    { value: 'list_format', label: 'List Format', icon: List, description: 'Scannable bullet points and tips' },
    { value: 'question-based', label: 'Question-Based', icon: HelpCircle, description: 'Drives curiosity and discussion' },
    { value: 'how-to', label: 'How-To', icon: FileText, description: 'Actionable instructions and processes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">Configure Your Post</h2>
        <p className="text-secondary/70">Choose the tone, purpose, and style for your content.</p>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm font-medium text-secondary">Tone *</label>
          <InfoTooltip content="Choose how formal or casual your post should sound." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {toneOptions.map((option) => (
            <OptionCard
              key={option.value}
              {...option}
              selected={tone === option.value}
              onClick={() => onUpdate({ tone: option.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm font-medium text-secondary">Purpose *</label>
          <InfoTooltip content="Define your post's goal and what you want to achieve." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {purposeOptions.map((option) => (
            <OptionCard
              key={option.value}
              {...option}
              selected={purpose === option.value}
              onClick={() => onUpdate({ purpose: option.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm font-medium text-secondary">Target Audience *</label>
          <InfoTooltip content="Select who you're writing for to tailor the message." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {audienceOptions.map((option) => (
            <OptionCard
              key={option.value}
              {...option}
              selected={audience === option.value}
              onClick={() => onUpdate({ audience: option.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm font-medium text-secondary">Post Style *</label>
          <InfoTooltip content="Choose your post structure and format." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {styleOptions.map((option) => (
            <OptionCard
              key={option.value}
              {...option}
              selected={style === option.value}
              onClick={() => onUpdate({ style: option.value })}
            />
          ))}
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
  const lengthOptions = [
    { value: 'short', label: 'Short', desc: '50-150 words', words: 100, width: '33%' },
    { value: 'medium', label: 'Medium', desc: '150-300 words', words: 225, width: '66%' },
    { value: 'long', label: 'Long', desc: '300-500 words', words: 400, width: '100%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">Set Your Preferences</h2>
        <p className="text-secondary/70">Customize the language, length, and formatting.</p>
      </div>

      <div className="space-y-6">
        {/* Language Selector with Flags */}
        <div>
          <label className="mb-3 block text-sm font-medium text-secondary">Language *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({ language: 'en' })}
              className={`group flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                language === 'en'
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-secondary/10 hover:border-primary/30 hover:bg-secondary/5 hover:scale-[1.02] hover:shadow-lg'
              }`}
            >
              <span className="text-3xl">🇬🇧</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-secondary">English</div>
                <div className="text-xs text-secondary/60">International audience</div>
              </div>
              {language === 'en' && (
                <Check className="h-5 w-5 text-primary animate-in zoom-in duration-200" />
              )}
            </button>
            <button
              onClick={() => onUpdate({ language: 'no' })}
              className={`group flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                language === 'no'
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-secondary/10 hover:border-primary/30 hover:bg-secondary/5 hover:scale-[1.02] hover:shadow-lg'
              }`}
            >
              <span className="text-3xl">🇳🇴</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-secondary">Norwegian</div>
                <div className="text-xs text-secondary/60">Norsk publikum</div>
              </div>
              {language === 'no' && (
                <Check className="h-5 w-5 text-primary animate-in zoom-in duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Post Length with Visual Indicators */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Post Length *</label>
            <InfoTooltip content="Choose the ideal length based on your content depth and audience preference." />
          </div>
          <div className="space-y-3">
            {lengthOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate({ length: option.value as 'short' | 'medium' | 'long' })}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  length === option.value
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-secondary/10 hover:border-primary/30 hover:bg-secondary/5 hover:scale-[1.01] hover:shadow-lg'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-semibold text-secondary">{option.label}</div>
                  {length === option.value && (
                    <Check className="h-5 w-5 text-primary animate-in zoom-in duration-200" />
                  )}
                </div>
                <div className="mb-2 text-sm text-secondary/60">{option.desc}</div>
                {/* Visual word count indicator */}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/10">
                    <div
                      className={`h-full rounded-full transition-all ${
                        length === option.value ? 'bg-primary' : 'bg-secondary/30'
                      }`}
                      style={{ width: option.width }}
                    />
                  </div>
                  <span className="text-xs font-medium text-secondary/60">~{option.words}w</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA Toggle with Preview */}
        <div className="rounded-xl border-2 border-secondary/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-secondary">
              <input
                type="checkbox"
                checked={includeCTA}
                onChange={(e) => onUpdate({ includeCTA: e.target.checked })}
                className="h-5 w-5 rounded border-secondary/20 text-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              Include Call-to-Action
            </label>
            <InfoTooltip content="CTAs encourage engagement and can boost interaction by 30-50%." />
          </div>
          {includeCTA && (
            <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="mb-1 text-xs font-medium text-primary">Preview Example:</div>
              <div className="text-sm italic text-secondary/70">
                "What's your experience with this? Share in the comments below! 👇"
              </div>
            </div>
          )}
        </div>

        {/* Emoji Usage */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm font-medium text-secondary">Emoji Usage</label>
            <InfoTooltip content="Control how many emojis appear in your post for personality vs professionalism balance." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'none', label: 'None', emoji: '📝', desc: 'Pure text' },
              { value: 'minimal', label: 'Minimal', emoji: '✨', desc: '1-2 emojis' },
              { value: 'moderate', label: 'Moderate', emoji: '🎨', desc: '3-5 emojis' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdate({ emojiUsage: option.value as 'none' | 'minimal' | 'moderate' })}
                className={`rounded-xl border-2 p-3 text-center transition-all duration-200 ${
                  emojiUsage === option.value
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-secondary/10 hover:border-primary/30 hover:bg-secondary/5 hover:scale-[1.05] hover:shadow-lg'
                }`}
              >
                <div className="mb-1 text-2xl">{option.emoji}</div>
                <div className="text-sm font-semibold text-secondary">{option.label}</div>
                <div className="text-xs text-secondary/60">{option.desc}</div>
              </button>
            ))}
          </div>
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
  const [expandedSection, setExpandedSection] = useState<string | null>('input');

  const handleDeleteDraft = () => {
    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      localStorage.removeItem('wizardDraft');
      router.push('/app');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate credit usage (simplified - would fetch from user data in production)
  const creditsUsed = 0; // This would come from actual user data
  const creditsLimit = 50; // This would come from subscription tier
  const creditPercentage = ((creditsUsed + 1) / creditsLimit) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">Review Your Selections</h2>
        <p className="text-secondary/70">
          Check everything looks good before generating your post.
        </p>
      </div>

      {/* Collapsible Summary Sections */}
      <div className="space-y-3">
        {/* Input Section */}
        <div className="overflow-hidden rounded-xl border-2 border-secondary/10 transition-all">
          <button
            onClick={() => toggleSection('input')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-secondary">Your Input</h3>
                <p className="text-sm text-secondary/60">{data.input.length} characters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary hover:underline">Edit Step 1</span>
              {expandedSection === 'input' ? (
                <ChevronUp className="h-5 w-5 text-secondary/60" />
              ) : (
                <ChevronDown className="h-5 w-5 text-secondary/60" />
              )}
            </div>
          </button>
          {expandedSection === 'input' && (
            <div className="border-t border-secondary/10 bg-secondary/5 p-4 animate-in slide-in-from-top-2 duration-300">
              <p className="text-sm leading-relaxed text-secondary">
                {data.input.slice(0, 300)}{data.input.length > 300 ? '...' : ''}
              </p>
              {data.referenceUrls.some(url => url) && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-secondary/60">Reference URLs:</p>
                  <ul className="space-y-1">
                    {data.referenceUrls.filter(url => url).map((url, i) => (
                      <li key={i} className="text-xs text-primary truncate">{url}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Section */}
        <div className="overflow-hidden rounded-xl border-2 border-secondary/10 transition-all">
          <button
            onClick={() => toggleSection('config')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-secondary">Configuration</h3>
                <p className="text-sm text-secondary/60">Tone, purpose, audience & style</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary hover:underline">Edit Step 2</span>
              {expandedSection === 'config' ? (
                <ChevronUp className="h-5 w-5 text-secondary/60" />
              ) : (
                <ChevronDown className="h-5 w-5 text-secondary/60" />
              )}
            </div>
          </button>
          {expandedSection === 'config' && (
            <div className="border-t border-secondary/10 bg-secondary/5 p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Tone</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{data.tone}</div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Purpose</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{data.purpose.replace('_', ' ')}</div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Audience</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{data.audience.replace('_', ' ')}</div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Style</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{data.style.replace('-', ' ')}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className="overflow-hidden rounded-xl border-2 border-secondary/10 transition-all">
          <button
            onClick={() => toggleSection('prefs')}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-secondary/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold text-secondary">Preferences</h3>
                <p className="text-sm text-secondary/60">Language, length & formatting</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary hover:underline">Edit Step 3</span>
              {expandedSection === 'prefs' ? (
                <ChevronUp className="h-5 w-5 text-secondary/60" />
              ) : (
                <ChevronDown className="h-5 w-5 text-secondary/60" />
              )}
            </div>
          </button>
          {expandedSection === 'prefs' && (
            <div className="border-t border-secondary/10 bg-secondary/5 p-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Language</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{data.language === 'en' ? '🇬🇧' : '🇳🇴'}</span>
                    <span className="text-sm font-semibold text-secondary">{data.language === 'en' ? 'English' : 'Norwegian'}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Length</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{data.length}</div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Call-to-Action</div>
                  <div className="text-sm font-semibold text-secondary">{data.includeCTA ? '✓ Included' : '✗ Not included'}</div>
                </div>
                <div className="rounded-lg bg-white p-3 border border-secondary/10">
                  <div className="text-xs font-medium text-secondary/60 mb-1">Emoji Usage</div>
                  <div className="text-sm font-semibold text-secondary capitalize">{data.emojiUsage}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit Usage Visualization */}
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-secondary">Credit Usage</h3>
          </div>
          <div className="text-sm font-medium text-secondary">
            <span className="text-blue-600">{creditsUsed + 1}</span> / {creditsLimit}
          </div>
        </div>
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-secondary/70">
          This generation will use <strong>1 post credit</strong>. {creditsLimit - creditsUsed - 1} credits remaining after generation.
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
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white p-5 animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            <div>
              <div className="font-semibold text-secondary">Generating your post...</div>
              <div className="text-sm text-secondary/60">This may take a few moments</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
