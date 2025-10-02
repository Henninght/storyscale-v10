'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';

interface ValidationResult {
  scores: {
    clarity: number;
    specificity: number;
    actionability: number;
  };
  overall: number;
  feedback: string;
  suggestions: string[];
  status: 'excellent' | 'good' | 'needs_improvement';
}

interface Props {
  text: string;
  language: 'en' | 'no';
  fieldType: 'theme' | 'description';
}

export function CampaignInputValidator({ text, language, fieldType }: Props) {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset when text changes significantly
    if (text.length < 10) {
      setResult(null);
      setError(null);
      return;
    }

    // Debounce validation
    const timer = setTimeout(() => {
      validateInput();
    }, 500);

    return () => clearTimeout(timer);
  }, [text, language]);

  const validateInput = async () => {
    if (text.length < 10) return;

    setValidating(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError('Not authenticated');
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/campaigns/validate-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          language,
          fieldType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError('Validation failed');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate');
    } finally {
      setValidating(false);
    }
  };

  if (text.length < 10) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-700 bg-green-100';
      case 'good':
        return 'text-amber-700 bg-amber-100';
      case 'needs_improvement':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-secondary/60 bg-secondary/10';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'excellent':
        return '🟢';
      case 'good':
        return '🟡';
      case 'needs_improvement':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'no') {
      switch (status) {
        case 'excellent':
          return 'Utmerket';
        case 'good':
          return 'God';
        case 'needs_improvement':
          return 'Kan forbedres';
        default:
          return '';
      }
    } else {
      switch (status) {
        case 'excellent':
          return 'Excellent';
        case 'good':
          return 'Good';
        case 'needs_improvement':
          return 'Needs Improvement';
        default:
          return '';
      }
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-secondary">
            {language === 'no' ? 'AI Kvalitetsvurdering' : 'AI Quality Check'}
          </span>
        </div>

        {validating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs text-secondary/60">
              {language === 'no' ? 'Analyserer...' : 'Analyzing...'}
            </span>
          </div>
        ) : result ? (
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(result.status)}`}>
            <span>{getStatusEmoji(result.status)}</span>
            <span>{getStatusText(result.status)}</span>
            <span className="ml-1">({result.overall}/10)</span>
          </div>
        ) : error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : null}
      </div>

      {result && !validating && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-secondary">{result.feedback}</p>

          {result.suggestions.length > 0 && (
            <div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <span>
                  {language === 'no' ? 'Forbedringsforslag' : 'Suggestions'}
                  {' '}({result.suggestions.length})
                </span>
                {showSuggestions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showSuggestions && (
                <ul className="mt-2 space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-secondary/80">
                      <span className="text-primary">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
