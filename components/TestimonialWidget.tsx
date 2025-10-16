'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  rating: number;
  quote: string;
  avatar?: string;
}

// Export testimonials array for easy management
// Add real testimonials here when available
const testimonials: Testimonial[] = [];

export function TestimonialWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Don't render if no testimonials
  if (testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-lg">
        {/* Quote Icon */}
        <Quote className="h-12 w-12 text-orange-500/20 mb-6" />

        {/* Star Rating */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < currentTestimonial.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Quote Text */}
        <blockquote className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed mb-8">
          "{currentTestimonial.quote}"
        </blockquote>

        {/* Author Info */}
        <div className="flex items-center gap-4">
          {currentTestimonial.avatar ? (
            <img
              src={currentTestimonial.avatar}
              alt={currentTestimonial.name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">
                {getInitials(currentTestimonial.name)}
              </span>
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900 text-lg">
              {currentTestimonial.name}
            </div>
            <div className="text-slate-600">
              {currentTestimonial.role}
              {currentTestimonial.company && (
                <span className="text-slate-400"> • {currentTestimonial.company}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="mt-8 flex items-center justify-center gap-6">
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          className="rounded-full bg-white border border-slate-200 p-3 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm hover:shadow"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dot Indicators */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-orange-500'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          className="rounded-full bg-white border border-slate-200 p-3 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm hover:shadow"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Testimonial Counter */}
      <div className="mt-4 text-center text-sm text-slate-500">
        {currentIndex + 1} / {testimonials.length}
      </div>
    </div>
  );
}
