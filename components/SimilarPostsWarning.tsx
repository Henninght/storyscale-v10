'use client';

import { AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SimilarPost {
  id: string;
  score: number;
  preview: string;
}

interface SimilarPostsWarningProps {
  similarPosts: SimilarPost[];
  wasRegenerated: boolean;
  onViewPost?: (postId: string) => void;
}

export function SimilarPostsWarning({ similarPosts, wasRegenerated, onViewPost }: SimilarPostsWarningProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no similar posts
  if (!similarPosts || similarPosts.length === 0) {
    return null;
  }

  const highestSimilarity = Math.max(...similarPosts.map(p => p.score));
  const isHighSimilarity = highestSimilarity > 85;
  const isModerateSimilarity = highestSimilarity > 70 && highestSimilarity <= 85;

  // Don't show if similarity is too low
  if (highestSimilarity <= 70) {
    return null;
  }

  const getBackgroundColor = () => {
    if (isHighSimilarity && wasRegenerated) {
      return 'bg-yellow-50 border-yellow-200';
    }
    if (isHighSimilarity) {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-blue-50 border-blue-200';
  };

  const getIconColor = () => {
    if (isHighSimilarity && wasRegenerated) {
      return 'text-yellow-600';
    }
    if (isHighSimilarity) {
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  const getIcon = () => {
    if (isHighSimilarity) {
      return <AlertCircle className={`h-5 w-5 ${getIconColor()}`} />;
    }
    return <Info className={`h-5 w-5 ${getIconColor()}`} />;
  };

  const getTitle = () => {
    if (isHighSimilarity && wasRegenerated) {
      return '✅ Innhold regenerert automatisk';
    }
    if (isHighSimilarity) {
      return '⚠️ Høy likhet oppdaget';
    }
    return 'ℹ️ Innholdet ligner tidligere innlegg';
  };

  const getMessage = () => {
    if (isHighSimilarity && wasRegenerated) {
      return `Det originale innlegget hadde ${highestSimilarity}% likhet med tidligere innlegg. Systemet har automatisk generert nytt innhold med lavere likhet.`;
    }
    if (isHighSimilarity) {
      return `Dette innlegget har ${highestSimilarity}% likhet med tidligere innlegg. Vurder å endre vinklingen eller eksemplene for mer variert innhold.`;
    }
    return `Dette innlegget har ${highestSimilarity}% likhet med tidligere innlegg. Det er fortsatt unikt nok, men du kan vurdere å variere innholdet.`;
  };

  return (
    <div className={`rounded-xl border ${getBackgroundColor()} p-4 mb-4`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${getIconColor()}`}>
              {getTitle()}
            </h4>
            {wasRegenerated && (
              <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Auto-regenerert</span>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-700 mb-3">
            {getMessage()}
          </p>

          {similarPosts.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5"
              >
                {isExpanded ? 'Skjul' : 'Vis'} lignende innlegg ({similarPosts.length})
                {isExpanded ? (
                  <span className="text-xs">▼</span>
                ) : (
                  <span className="text-xs">▶</span>
                )}
              </button>

              {isExpanded && (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                  {similarPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">
                          Innlegg {index + 1}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          post.score > 85
                            ? 'bg-red-100 text-red-700'
                            : post.score > 70
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {post.score}% likhet
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {post.preview}
                      </p>
                      {onViewPost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPost(post.id)}
                          className="mt-2 text-xs h-7"
                        >
                          Vis hele innlegget
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
