'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { MentorAvatar } from './MentorAvatar';
import { useState } from 'react';

interface MentorWizardSuggestionProps {
  message: string;
  temperature?: number;
  mentorName?: string;
  type?: 'strategic' | 'pattern' | 'best-practice';
}

export function MentorWizardSuggestion({
  message,
  temperature = 3,
  mentorName = 'Alex',
  type = 'strategic',
}: MentorWizardSuggestionProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const getStyles = () => {
    if (temperature <= 2) {
      return {
        container: 'bg-gradient-to-r from-blue-50 to-cyan-50/50 border-blue-200',
        text: 'text-blue-900',
        icon: 'text-blue-600',
      };
    } else if (temperature <= 4) {
      return {
        container: 'bg-gradient-to-r from-cyan-50 to-teal-50/50 border-cyan-200',
        text: 'text-cyan-900',
        icon: 'text-cyan-600',
      };
    } else {
      return {
        container: 'bg-gradient-to-r from-orange-50 to-amber-50/50 border-orange-200',
        text: 'text-orange-900',
        icon: 'text-orange-600',
      };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'strategic':
        return <Lightbulb className={`h-4 w-4 ${styles.icon}`} />;
      case 'pattern':
        return <Lightbulb className={`h-4 w-4 ${styles.icon}`} />;
      case 'best-practice':
        return <Lightbulb className={`h-4 w-4 ${styles.icon}`} />;
      default:
        return <Lightbulb className={`h-4 w-4 ${styles.icon}`} />;
    }
  };

  const styles = getStyles();

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`relative rounded-xl border-2 ${styles.container} p-4 shadow-sm`}
      >
        <div className="flex items-start gap-3">
          {/* Mentor Avatar */}
          <div className="flex-shrink-0">
            <MentorAvatar
              mentorName={mentorName}
              size="sm"
              temperature={temperature}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getIcon()}
              <span className="text-xs font-semibold text-slate-700">{mentorName}'s advice</span>
            </div>
            <p className={`text-sm leading-relaxed ${styles.text}`}>
              {message}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-200/50 transition-colors"
            aria-label="Dismiss suggestion"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
