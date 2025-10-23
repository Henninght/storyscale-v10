'use client';

import { useState } from 'react';
import { Image as ImageIcon, Palette, BarChart3, Camera, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageStyle, LibraryImage } from '@/types';
import { getAuth } from 'firebase/auth';

const STYLE_OPTIONS = [
  { id: 'artistic' as ImageStyle, name: 'Artistic', icon: Palette, description: 'Paintings, abstract art' },
  { id: 'infographic' as ImageStyle, name: 'Infographic', icon: BarChart3, description: 'Charts, diagrams' },
  { id: 'photo' as ImageStyle, name: 'Photo', icon: Camera, description: 'Realistic, professional' },
  { id: 'illustration' as ImageStyle, name: 'Illustration', icon: Pencil, description: 'Drawings, sketches' },
];

const SUB_STYLE_OPTIONS = {
  artistic: ['Modern', 'Classical', 'Abstract', 'Vibrant'],
  infographic: ['Data Chart', 'Process Flow', 'Comparison', 'Timeline'],
  photo: ['Portrait', 'Landscape', 'Product', 'Office'],
  illustration: ['Line Art', 'Cartoon', 'Technical', 'Hand-drawn'],
};

interface StyleBasedGeneratorProps {
  onImageGenerated: (image: LibraryImage) => void;
}

export function StyleBasedGenerator({ onImageGenerated }: StyleBasedGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle | null>(null);
  const [selectedSubStyle, setSelectedSubStyle] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedStyle || !selectedSubStyle) {
      setError('Please select both a style and sub-style');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/images/studio/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          style: selectedStyle,
          subStyle: selectedSubStyle,
          additionalDetails,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const result = await response.json();
      onImageGenerated(result.image);

      // Reset form
      setSelectedStyle(null);
      setSelectedSubStyle(null);
      setAdditionalDetails('');
    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset sub-style when style changes
  const handleStyleChange = (style: ImageStyle) => {
    setSelectedStyle(style);
    setSelectedSubStyle(null);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <ImageIcon className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">Image Generator</h2>
      </div>

      {/* Style Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          {STYLE_OPTIONS.map((style) => {
            const Icon = style.icon;
            const isSelected = selectedStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => handleStyleChange(style.id)}
                disabled={isGenerating}
                className={`
                  p-4 rounded-lg border transition-all text-left
                  ${isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 bg-white'
                  }
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className={`font-medium text-sm mb-1 ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                  {style.name}
                </div>
                <div className="text-xs text-slate-500">
                  {style.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Style Selector */}
      {selectedStyle && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SUB_STYLE_OPTIONS[selectedStyle].map((subStyle) => {
              const isSelected = selectedSubStyle === subStyle;
              return (
                <button
                  key={subStyle}
                  onClick={() => setSelectedSubStyle(subStyle)}
                  disabled={isGenerating}
                  className={`
                    px-3 py-2 rounded-lg border transition-all text-sm font-medium
                    ${isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                    }
                    ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {subStyle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Details */}
      {selectedSubStyle && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Additional Details <span className="text-slate-500 font-normal text-xs">(Optional)</span>
          </label>
          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            placeholder="Describe specific elements, setting, or requirements..."
            rows={3}
            disabled={isGenerating}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none text-sm"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={!selectedStyle || !selectedSubStyle || isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 py-5 text-sm font-medium"
      >
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </Button>

      {/* Cost Info */}
      {selectedStyle && selectedSubStyle && !isGenerating && (
        <div className="text-xs text-slate-500 text-center pt-2">
          Standard quality: $0.04 per image
        </div>
      )}
    </div>
  );
}
