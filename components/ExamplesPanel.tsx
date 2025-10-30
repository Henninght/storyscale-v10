'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { getExamplesForSettings } from '@/lib/inputAnalyzer';

interface ExamplesPanelProps {
  settings: {
    style?: string;
    purpose?: string;
    tone?: string;
  };
}

export function ExamplesPanel({ settings }: ExamplesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const examples = getExamplesForSettings(settings);

  // Show first example only to keep it clean
  const example = examples[0];

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-slate-100"
      >
        <span className="text-xs font-semibold text-slate-700">
          Input Examples
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {/* Content - Collapsible */}
      {isOpen && (
        <div className="border-t border-slate-200 p-3 space-y-2">
          {/* Before */}
          <div className="rounded-md bg-white border border-slate-200 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Before
            </div>
            <div className="text-xs text-slate-600 line-through opacity-60">
              {example.bad}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>

          {/* After */}
          <div className="rounded-md bg-white border border-green-200 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-green-600 mb-1">
              Better
            </div>
            <div className="text-xs text-slate-700 font-medium">
              {example.good}
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-slate-600 pt-1">
            <span className="font-medium">Tip:</span> {example.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
