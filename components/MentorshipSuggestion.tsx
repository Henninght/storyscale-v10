'use client';

import { useState } from 'react';
import { X, ArrowRight, MessageCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, updateDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import type { MentorshipSuggestion as MentorshipSuggestionType, MentorshipInteractionType } from '@/types';
import { MentorAvatar } from './MentorAvatar';

interface MentorshipSuggestionProps {
  suggestion: MentorshipSuggestionType;
  onDismiss: () => void;
  mentorName?: string;
  onTryIt?: () => void;
}

export function MentorshipSuggestion({
  suggestion,
  onDismiss,
  mentorName = 'Alex',
  onTryIt
}: MentorshipSuggestionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Temperature-based styling (1=subtle, 5=proactive)
  const getStyles = () => {
    const temp = suggestion.temperature;

    if (temp <= 2) {
      // Subtle: gentle blue, whisper-like
      return {
        container: 'bg-gradient-to-r from-blue-50 to-cyan-50/50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        button: 'text-blue-700 hover:bg-blue-100',
        tryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    } else if (temp <= 4) {
      // Balanced: warm cyan/teal
      return {
        container: 'bg-gradient-to-r from-cyan-50 to-teal-50/50',
        border: 'border-cyan-200',
        text: 'text-cyan-900',
        button: 'text-cyan-700 hover:bg-cyan-100',
        tryButton: 'bg-cyan-600 hover:bg-cyan-700 text-white',
      };
    } else {
      // Proactive: vibrant orange
      return {
        container: 'bg-gradient-to-r from-orange-50 to-amber-50/50',
        border: 'border-orange-200',
        text: 'text-orange-900',
        button: 'text-orange-700 hover:bg-orange-100',
        tryButton: 'bg-orange-600 hover:bg-orange-700 text-white',
      };
    }
  };

  const logInteraction = async (type: MentorshipInteractionType) => {
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'mentor_interactions'), {
        suggestionId: suggestion.id,
        userId: suggestion.userId,
        type,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  const handleDismiss = async () => {
    setIsLoading(true);
    try {
      await logInteraction('dismiss');

      // Update Firestore
      const db = getFirestore();
      const suggestionRef = doc(db, 'mentorship_suggestions', suggestion.id);
      await updateDoc(suggestionRef, {
        dismissedAt: Timestamp.now(),
      });

      // Animate out
      setIsVisible(false);
      setTimeout(() => {
        onDismiss();
      }, 300);
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      setIsLoading(false);
    }
  };

  const handleTryIt = async () => {
    await logInteraction('try_it');
    if (onTryIt) {
      onTryIt();
    }
  };

  const handleSnooze = async () => {
    setIsLoading(true);
    try {
      await logInteraction('snooze');

      const db = getFirestore();
      const suggestionRef = doc(db, 'mentorship_suggestions', suggestion.id);
      const snoozeUntil = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await updateDoc(suggestionRef, {
        dismissedAt: snoozeUntil,
      });

      setIsVisible(false);
      setTimeout(() => {
        onDismiss();
      }, 300);
    } catch (error) {
      console.error('Error snoozing suggestion:', error);
      setIsLoading(false);
    }
  };

  const handleShowMore = async () => {
    setShowDetails(!showDetails);
    if (!showDetails) {
      await logInteraction('tell_more');
    }
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`relative mb-4 rounded-2xl border-2 ${styles.border} ${styles.container} shadow-sm overflow-hidden`}
        >
          {/* Main Content */}
          <div className="flex items-start gap-4 p-5">
            {/* Mentor Avatar */}
            <div className="flex-shrink-0 mt-1">
              <MentorAvatar
                mentorName={mentorName}
                size="md"
                temperature={suggestion.temperature}
              />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              {/* Mentor Name + Message */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800">{mentorName}</span>
                  <span className="text-xs text-slate-500">just now</span>
                </div>
                <p className={`text-sm leading-relaxed ${styles.text}`}>
                  {suggestion.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {onTryIt && (
                  <button
                    onClick={handleTryIt}
                    className={`inline-flex items-center gap-1.5 rounded-lg ${styles.tryButton} px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 hover:shadow-md`}
                  >
                    Try this <ArrowRight className="h-3 w-3" />
                  </button>
                )}

                <button
                  onClick={handleShowMore}
                  className={`inline-flex items-center gap-1.5 rounded-lg border ${styles.border} px-3 py-1.5 text-xs font-medium transition-colors ${styles.button}`}
                >
                  <MessageCircle className="h-3 w-3" />
                  {showDetails ? 'Show less' : 'Tell me more'}
                </button>

                <button
                  onClick={handleSnooze}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-1.5 rounded-lg border ${styles.border} px-3 py-1.5 text-xs font-medium transition-colors ${styles.button} ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  Remind later
                </button>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className={`flex-shrink-0 rounded-lg p-1.5 transition-colors ${styles.button} ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-200 px-5 pb-5"
              >
                <div className="pt-4 text-sm text-slate-700 space-y-2">
                  <p className="font-medium">Why this suggestion?</p>
                  <p className="text-slate-600">
                    {suggestion.context.patterns.length > 0
                      ? `I've noticed patterns in your recent posts: ${suggestion.context.patterns.join(', ')}. This suggestion helps you expand your content variety.`
                      : 'Based on your writing goals and recent activity, this would be a great direction to explore.'}
                  </p>
                  {suggestion.context.draftCount > 0 && (
                    <p className="text-xs text-slate-500">
                      Analysis based on your last {suggestion.context.draftCount} drafts
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
