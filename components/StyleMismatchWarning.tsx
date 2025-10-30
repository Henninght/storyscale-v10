'use client';

import { Info } from 'lucide-react';
import { analyzeInput } from '@/lib/inputAnalyzer';

interface StyleMismatchWarningProps {
  input: string;
  settings: {
    style?: string;
    purpose?: string;
    tone?: string;
    length?: string;
  };
  onApplyRecommendations?: (recommendations: any) => void;
}

export function StyleMismatchWarning({ input, settings, onApplyRecommendations }: StyleMismatchWarningProps) {
  if (input.length < 20) {
    return null;
  }

  const analysis = analyzeInput(input, settings);

  // Only show if there are actual recommendations
  if (!analysis.recommendedSettings) {
    return null;
  }

  const recommendations = analysis.recommendedSettings;

  // Map setting keys to readable labels
  const settingLabels: Record<string, string> = {
    style: 'Style',
    purpose: 'Purpose',
    length: 'Length',
  };

  const settingValues: Record<string, Record<string, string>> = {
    style: {
      direct: 'Direct',
      list_format: 'List',
      story: 'Story',
      'story-based': 'Story',
      question_based: 'Question',
      'question-based': 'Question',
      'how-to': 'How-To',
    },
    purpose: {
      network_building: 'Network Building',
      direct_communication: 'Direct Communication',
      engagement: 'Engagement',
      personal_sharing: 'Personal Sharing',
      lead_generation: 'Lead Generation',
      brand_awareness: 'Brand Awareness',
      thought_leadership: 'Thought Leadership',
    },
    length: {
      very_short: 'Very Short',
      short: 'Short',
      medium: 'Medium',
      long: 'Long',
    },
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium text-blue-900">
            Your input suggests different settings
          </p>
          <div className="space-y-1">
            {Object.entries(recommendations).map(([key, value]) => (
              <div key={key} className="text-xs text-blue-800">
                <span className="font-medium">{settingLabels[key]}:</span>{' '}
                <span className="font-semibold">
                  {settingValues[key]?.[value as string] || value}
                </span>
              </div>
            ))}
          </div>
          {onApplyRecommendations && (
            <button
              onClick={() => onApplyRecommendations(recommendations)}
              className="text-xs font-medium text-blue-700 hover:text-blue-800 underline"
            >
              Apply recommendations
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
