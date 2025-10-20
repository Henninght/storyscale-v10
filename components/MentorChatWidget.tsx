'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, MessageCircle, Send } from 'lucide-react';
import { MentorAvatar } from './MentorAvatar';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

interface MentorChatWidgetProps {
  userId: string;
  draftContent: string;
  draftId: string;
  userPatterns?: {
    avgLength: number;
    preferredTone?: string;
    preferredStyle?: string;
  };
  temperature?: number;
  mentorName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'mentor' | 'user';
  message: string;
  timestamp: Date;
}

export function MentorChatWidget({
  userId,
  draftContent,
  draftId,
  userPatterns,
  temperature = 3,
  mentorName = 'Alex',
}: MentorChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [hasNewSuggestion, setHasNewSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastContentLengthRef = useRef(0);
  const lastSuggestionTimeRef = useRef(Date.now());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Real-time content analysis and suggestions
  useEffect(() => {
    // Only analyze if content changed significantly (more than 50 chars)
    const contentDiff = Math.abs(draftContent.length - lastContentLengthRef.current);
    const timeSinceLastSuggestion = Date.now() - lastSuggestionTimeRef.current;

    if (contentDiff > 50 && timeSinceLastSuggestion > 30000) { // 30 seconds between suggestions
      const suggestion = analyzeContent(draftContent, userPatterns);

      if (suggestion) {
        addMentorMessage(suggestion);
        lastContentLengthRef.current = draftContent.length;
        lastSuggestionTimeRef.current = Date.now();

        // Show notification if minimized
        if (isMinimized) {
          setHasNewSuggestion(true);
        }
      }
    }
  }, [draftContent, userPatterns, isMinimized]);

  const analyzeContent = (
    content: string,
    patterns?: { avgLength: number; preferredTone?: string; preferredStyle?: string }
  ): string | null => {
    const charCount = content.length;
    const lineBreaks = (content.match(/\n/g) || []).length;
    const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(content);
    const hasHashtags = content.includes('#');
    const hasBulletPoints = /^[-•*]/m.test(content);
    const hasQuestion = content.includes('?');

    // Length analysis
    if (patterns?.avgLength) {
      const deviation = charCount - patterns.avgLength;

      if (deviation > 500 && charCount > 1500) {
        if (temperature <= 2) {
          return "I notice this is getting quite long — your sweet spot is usually around " + patterns.avgLength + " characters. Just a thought.";
        } else if (temperature <= 4) {
          return "Quick heads up: this is running longer than your usual " + patterns.avgLength + " chars. Want to trim it down?";
        } else {
          return "This is getting lengthy. You typically hit " + patterns.avgLength + " characters. Time to edit?";
        }
      }

      if (charCount > 800 && charCount < 1000 && deviation > 0) {
        if (temperature <= 2) {
          return "You're at a good length. Most of your posts land around here.";
        } else if (temperature <= 4) {
          return "Perfect length! Right in your sweet spot.";
        } else {
          return "Nailed the length. Keep this energy.";
        }
      }
    }

    // Structure suggestions
    if (charCount > 400 && lineBreaks < 3) {
      if (temperature <= 2) {
        return "I notice the text is quite dense — breaking it into paragraphs might help readability. Worth considering?";
      } else if (temperature <= 4) {
        return "This could use some breathing room. Try breaking it into 2-3 paragraphs?";
      } else {
        return "Break this up. Dense paragraphs kill engagement.";
      }
    }

    // Technical content check
    const technicalWords = ['API', 'algorithm', 'framework', 'implementation', 'architecture', 'deployment'];
    const hasTechnicalContent = technicalWords.some(word => content.toLowerCase().includes(word.toLowerCase()));

    if (hasTechnicalContent && charCount > 500 && !hasQuestion && lineBreaks > 2) {
      if (temperature <= 2) {
        return "You're diving deep into technical details. Perhaps a story or example would make it more relatable?";
      } else if (temperature <= 4) {
        return "Love the technical depth! What about adding a real-world example to bring it home?";
      } else {
        return "Great technical content. Add a story. Make them feel it.";
      }
    }

    // Engagement hooks
    if (charCount > 300 && !hasQuestion && lineBreaks > 2) {
      const opening = content.split('\n')[0];
      if (opening.length > 100 && !opening.includes('?')) {
        if (temperature <= 2) {
          return "The opening might be stronger with a question — it tends to draw readers in. What do you think?";
        } else if (temperature <= 4) {
          return "Strong start! What if you opened with a question to hook them in?";
        } else {
          return "Hook them from line one. Start with a question.";
        }
      }
    }

    // CTA check
    if (charCount > 800 && content.includes('\n\n') && !content.toLowerCase().includes('comment') && !content.toLowerCase().includes('share')) {
      if (temperature <= 2) {
        return "I notice there's no call-to-action. Inviting comments often boosts engagement. Just an observation.";
      } else if (temperature <= 4) {
        return "You might want to add a CTA. 'What's your take?' or 'Share your experience' works well.";
      } else {
        return "Where's your CTA? Tell them what to do next.";
      }
    }

    return null;
  };

  const addMentorMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'mentor',
      message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    // Log interaction
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'mentor_interactions'), {
        userId,
        draftId,
        type: 'chat_message',
        message: userInput,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging chat interaction:', error);
    }

    // Simulate mentor response (in production, this would call an API)
    setTimeout(() => {
      const mentorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'mentor',
        message: "Thanks for asking! I'm here to help. Keep writing and I'll chime in with suggestions.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, mentorResponse]);
    }, 1000);
  };

  const handleExpand = () => {
    setIsMinimized(false);
    setIsExpanded(true);
    setHasNewSuggestion(false);
  };

  const handleMinimize = () => {
    setIsExpanded(false);
    setIsMinimized(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsMinimized(true);
    setMessages([]);
  };

  return (
    <>
      {/* Floating Avatar Button (when minimized) */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <button
              onClick={handleExpand}
              className="relative group"
              aria-label="Open mentor chat"
            >
              <MentorAvatar
                mentorName={mentorName}
                size="lg"
                temperature={temperature}
                className="cursor-pointer hover:scale-110 transition-transform shadow-xl"
              />

              {/* New suggestion indicator */}
              {hasNewSuggestion && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-orange-500 ring-2 ring-white"></span>
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap">
                  Chat with {mentorName}
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Chat Widget */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-2xl border-2 border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="flex items-center gap-3">
                <MentorAvatar
                  mentorName={mentorName}
                  size="sm"
                  temperature={temperature}
                />
                <div>
                  <h3 className="font-semibold text-slate-800">{mentorName}</h3>
                  <p className="text-xs text-slate-500">Your writing mentor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMinimize}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500 mb-1">I'm here to help!</p>
                  <p className="text-xs text-slate-400 px-8">
                    I'll share suggestions as you write, or feel free to ask me anything.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim()}
                  className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
