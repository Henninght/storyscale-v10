'use client';

import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { MentorshipSuggestion as MentorshipSuggestionType } from '@/types';

interface MentorshipSuggestionProps {
  suggestion: MentorshipSuggestionType;
  onDismiss: () => void;
}

export function MentorshipSuggestion({ suggestion, onDismiss }: MentorshipSuggestionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Temperature-based styling (1=subtle, 5=proactive)
  const getStyles = () => {
    const temp = suggestion.temperature;

    if (temp <= 2) {
      // Subtle: light blue, minimal emphasis
      return {
        bg: 'bg-blue-50/50',
        border: 'border-blue-100',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-800',
        dismissHover: 'hover:bg-blue-100',
      };
    } else if (temp <= 4) {
      // Moderate: warm amber, gentle emphasis
      return {
        bg: 'bg-amber-50/50',
        border: 'border-amber-100',
        icon: 'bg-amber-100 text-amber-600',
        text: 'text-amber-800',
        dismissHover: 'hover:bg-amber-100',
      };
    } else {
      // Proactive: orange, stronger emphasis
      return {
        bg: 'bg-orange-50/50',
        border: 'border-orange-200',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-800',
        dismissHover: 'hover:bg-orange-100',
      };
    }
  };

  const handleDismiss = async () => {
    setIsLoading(true);
    try {
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

  const styles = getStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`mb-4 rounded-2xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`rounded-lg ${styles.icon} p-2 flex-shrink-0`}>
              <Lightbulb className="h-4 w-4" />
            </div>

            {/* Message */}
            <div className="flex-1">
              <p className={`text-sm ${styles.text} leading-relaxed`}>
                {suggestion.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className={`rounded-lg p-1.5 transition-colors ${styles.dismissHover} ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Dismiss suggestion"
            >
              <X className={`h-4 w-4 ${styles.text}`} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
