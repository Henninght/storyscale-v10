'use client';

import { Check, AlertCircle } from 'lucide-react';
import { analyzeInput, getQualityLabel } from '@/lib/inputAnalyzer';

interface InputGuidanceProps {
  input: string;
  settings: {
    style?: string;
    purpose?: string;
    tone?: string;
    length?: string;
  };
}

export function InputGuidance({ input, settings }: InputGuidanceProps) {
  // Don't show until user has typed something meaningful
  if (input.length < 20) {
    return null;
  }

  const analysis = analyzeInput(input, settings);
  const quality = getQualityLabel(analysis.score);

  // Color mapping - professional, subtle
  const scoreColors = {
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    yellow: 'bg-amber-50 border-amber-200 text-amber-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };

  const badgeColors = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`rounded-lg border-2 p-3 ${scoreColors[quality.color as keyof typeof scoreColors]}`}>
      <div className="flex items-start gap-3">
        {/* Score Badge */}
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-semibold text-sm ${badgeColors[quality.color as keyof typeof badgeColors]}`}>
          {analysis.score}
        </div>

        <div className="flex-1 space-y-1.5">
          {/* Positive feedback first */}
          {analysis.feedback.length > 0 && (
            <div className="space-y-0.5">
              {analysis.feedback.map((item, index) => (
                <div key={index} className="flex items-start gap-1.5 text-xs">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="space-y-0.5">
              {analysis.suggestions.map((item, index) => (
                <div key={index} className="flex items-start gap-1.5 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-70" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
