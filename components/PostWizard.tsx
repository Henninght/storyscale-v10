'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WizardStep = 1 | 2 | 3 | 4;

interface WizardData {
  // Step 1
  input: string;
  referenceUrls: string[];

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

export function PostWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

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

      const token = await user.getIdToken();

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

      // Navigate to editor
      window.location.href = `/app/drafts/${result.draftId}`;
    } catch (error) {
      console.error('Generation failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
                  step === currentStep
                    ? 'bg-primary text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step < currentStep ? <Check className="h-5 w-5" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`h-1 flex-1 transition-all ${
                    step < currentStep ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between text-sm font-medium">
          <span className={currentStep === 1 ? 'text-primary' : 'text-secondary/60'}>Input</span>
          <span className={currentStep === 2 ? 'text-primary' : 'text-secondary/60'}>Configuration</span>
          <span className={currentStep === 3 ? 'text-primary' : 'text-secondary/60'}>Preferences</span>
          <span className={currentStep === 4 ? 'text-primary' : 'text-secondary/60'}>Review</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-secondary/10 bg-white p-8">
        {currentStep === 1 && (
          <Step1
            input={data.input}
            referenceUrls={data.referenceUrls}
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

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {currentStep < 4 ? (
          <Button onClick={nextStep} disabled={!canProceed()} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleGenerate} disabled={isGenerating || !canProceed()}>
            {isGenerating ? 'Generating...' : 'Generate Post'}
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
  onUpdate: (data: Partial<WizardData>) => void;
}

function Step1({ input, referenceUrls, onUpdate }: Step1Props) {
  const charCount = input.length;
  const isValid = charCount >= 50 && charCount <= 2000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-secondary">What would you like to write about?</h2>
        <p className="text-secondary/70">
          Share your main idea, story, or topic. The more details you provide, the better the result.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-secondary">Your Input *</label>
        <textarea
          value={input}
          onChange={(e) => onUpdate({ input: e.target.value })}
          placeholder="Example: I recently helped a client increase their revenue by 40% through a simple automation. Here's what we did..."
          className="min-h-[200px] w-full rounded-lg border border-secondary/20 p-4 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className={`mt-1 text-sm ${isValid ? 'text-green-600' : 'text-secondary/60'}`}>
          {charCount} / 2000 characters (minimum 50)
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
          <label className="mb-2 block text-sm font-medium text-secondary">Tone *</label>
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
          <label className="mb-2 block text-sm font-medium text-secondary">Purpose *</label>
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
          <label className="mb-2 block text-sm font-medium text-secondary">Target Audience *</label>
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
          <label className="mb-2 block text-sm font-medium text-secondary">Post Style *</label>
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
          <label className="mb-2 block text-sm font-medium text-secondary">Post Length *</label>
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
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-secondary">
            <input
              type="checkbox"
              checked={includeCTA}
              onChange={(e) => onUpdate({ includeCTA: e.target.checked })}
              className="h-4 w-4 rounded border-secondary/20 text-primary focus:ring-primary"
            />
            Include Call-to-Action
          </label>
          <p className="ml-6 text-sm text-secondary/60">
            Add a prompt for engagement (e.g., "What do you think?")
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-secondary">Emoji Usage</label>
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
