'use client';

import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { Star, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackCategory } from '@/types';

export default function FeedbackPage() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          category,
          description,
          email: email || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      // Show success state
      setIsSubmitted(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setRating(0);
        setCategory('bug');
        setDescription('');
        setEmail('');
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Feedback</h1>
          <p className="mt-1.5 text-slate-600">
            Help us improve Storyscale
          </p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-12 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Thank You!
          </h2>
          <p className="text-green-700">
            Your feedback has been submitted successfully. We appreciate you taking the time to help us improve!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Give Us Your Feedback</h1>
        <p className="mt-1.5 text-slate-600">
          Help us improve Storyscale by sharing your thoughts, reporting bugs, or suggesting features
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Section */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6">
          <label className="mb-3 block text-lg font-semibold text-slate-800">
            How would you rate your experience? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              {rating === 1 && 'Poor - We can do better'}
              {rating === 2 && 'Fair - Needs improvement'}
              {rating === 3 && 'Good - Meeting expectations'}
              {rating === 4 && 'Very good - Above expectations'}
              {rating === 5 && 'Excellent - Exceeding expectations!'}
            </p>
          )}
        </div>

        {/* Category Section */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6">
          <label className="mb-3 block text-lg font-semibold text-slate-800">
            What is this about?
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            className="w-full rounded-lg border border-secondary/20 px-4 py-3 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="bug">🐛 Bug Report</option>
            <option value="feature">💡 Feature Request</option>
            <option value="design">🎨 Design Feedback</option>
            <option value="other">💬 Other</option>
          </select>
        </div>

        {/* Description Section */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6">
          <label className="mb-3 block text-lg font-semibold text-slate-800">
            Tell us more <span className="text-sm font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your thoughts, report an issue, or suggest an improvement..."
            className="min-h-[150px] w-full rounded-lg border border-secondary/20 p-4 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-sm text-slate-500">
            {description.length} characters
          </p>
        </div>

        {/* Email Section */}
        <div className="rounded-2xl border border-secondary/10 bg-white p-6">
          <label className="mb-3 block text-lg font-semibold text-slate-800">
            Email for follow-up <span className="text-sm font-normal text-slate-500">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-secondary/20 px-4 py-3 text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-sm text-slate-500">
            We'll only contact you if we need clarification about your feedback
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full gap-2 py-6 text-lg"
        >
          {isSubmitting ? (
            <>
              <Send className="h-5 w-5 animate-pulse" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Submit Feedback
            </>
          )}
        </Button>

        {rating === 0 && (
          <p className="text-center text-sm text-red-500">
            Please select a rating before submitting
          </p>
        )}
      </form>
    </div>
  );
}
