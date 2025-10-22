'use client';

import { useState } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DraftImage } from '@/types';
import { getAuth } from 'firebase/auth';

interface AIImageGeneratorDialogProps {
  draftId: string;
  onClose: () => void;
  onImageGenerated: (image: DraftImage) => void;
}

export function AIImageGeneratorDialog({ draftId, onClose, onImageGenerated }: AIImageGeneratorDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<DraftImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the image');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          draftId,
          prompt,
          size,
          quality,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const result = await response.json();
      setGeneratedImage(result.image);
    } catch (error) {
      console.error('Generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  const estimatedCost = quality === 'hd' ? (size === '1024x1024' ? 0.08 : 0.16) : (size === '1024x1024' ? 0.04 : 0.08);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-slate-800">Generate Image with AI</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A professional businessperson standing confidently in a modern office, natural lighting, high quality photography"
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              disabled={isGenerating || !!generatedImage}
            />
            <p className="text-xs text-slate-500 mt-1">
              Be specific and descriptive for best results
            </p>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSize('1024x1024')}
                disabled={isGenerating || !!generatedImage}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                  ${size === '1024x1024'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }
                  ${(isGenerating || !!generatedImage) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                Square
                <div className="text-xs text-slate-500 mt-1">1024×1024</div>
              </button>
              <button
                onClick={() => setSize('1792x1024')}
                disabled={isGenerating || !!generatedImage}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                  ${size === '1792x1024'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }
                  ${(isGenerating || !!generatedImage) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                Landscape
                <div className="text-xs text-slate-500 mt-1">1792×1024</div>
              </button>
              <button
                onClick={() => setSize('1024x1792')}
                disabled={isGenerating || !!generatedImage}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                  ${size === '1024x1792'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }
                  ${(isGenerating || !!generatedImage) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                Portrait
                <div className="text-xs text-slate-500 mt-1">1024×1792</div>
              </button>
            </div>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quality
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQuality('standard')}
                disabled={isGenerating || !!generatedImage}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                  ${quality === 'standard'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }
                  ${(isGenerating || !!generatedImage) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                Standard
                <div className="text-xs text-slate-500 mt-1">Faster, cost-effective</div>
              </button>
              <button
                onClick={() => setQuality('hd')}
                disabled={isGenerating || !!generatedImage}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                  ${quality === 'hd'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }
                  ${(isGenerating || !!generatedImage) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                HD
                <div className="text-xs text-slate-500 mt-1">Higher quality, 2× cost</div>
              </button>
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
            Estimated cost: <span className="font-semibold">${estimatedCost.toFixed(2)}</span> per image
          </div>

          {/* Generated Image Preview */}
          {generatedImage && (
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <img
                src={generatedImage.url}
                alt={generatedImage.alt || 'Generated image'}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={isGenerating}
          >
            Cancel
          </Button>

          {!generatedImage ? (
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                className="flex-1 gap-2"
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
              <Button
                onClick={handleUseImage}
                className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
              >
                Use This Image
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
