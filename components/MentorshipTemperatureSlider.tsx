'use client';

import { useState } from 'react';

interface MentorshipTemperatureSliderProps {
  value: number; // 1-5
  onChange: (value: number) => void;
}

const TEMPERATURE_LEVELS = [
  {
    value: 1,
    label: 'Subtle',
    description: 'Occasional gentle nudges',
    frequency: 'Max 1 suggestion per session',
    tone: 'Perhaps consider...',
    example: '"You might consider writing about your communication background alongside your technical posts."',
    color: 'from-blue-400 to-blue-600',
  },
  {
    value: 2,
    label: 'Gentle',
    description: 'Friendly observations',
    frequency: 'Max 1 suggestion per session',
    tone: 'You might try...',
    example: '"You\'ve been focusing on tech lately. What about exploring leadership topics?"',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    value: 3,
    label: 'Balanced',
    description: 'Conversational guidance',
    frequency: 'Up to 2 suggestions per session',
    tone: 'Here\'s a thought...',
    example: '"Here\'s a thought — you\'ve written 3 technical posts. Consider one about team collaboration?"',
    color: 'from-cyan-500 to-teal-600',
  },
  {
    value: 4,
    label: 'Active',
    description: 'Direct coaching',
    frequency: '2 suggestions per session',
    tone: 'Try writing about...',
    example: '"Try writing about your experience leading remote teams. Your audience would find it valuable."',
    color: 'from-orange-400 to-amber-600',
  },
  {
    value: 5,
    label: 'Proactive',
    description: 'Strategic mentorship',
    frequency: 'Always 2 suggestions',
    tone: 'Write about...',
    example: '"Write about the intersection of AI and communication. Challenge yourself with a vulnerable story."',
    color: 'from-orange-500 to-red-600',
  },
];

export function MentorshipTemperatureSlider({ value, onChange }: MentorshipTemperatureSliderProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const displayValue = hoveredValue ?? value;
  const currentLevel = TEMPERATURE_LEVELS.find(level => level.value === displayValue);

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div className="relative">
        {/* Labels */}
        <div className="mb-3 flex justify-between text-sm font-medium text-slate-600">
          <span>Subtle</span>
          <span className="text-slate-800">Mentor Personality</span>
          <span>Proactive</span>
        </div>

        {/* Track with gradient */}
        <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-200 via-cyan-200 to-orange-200">
          {/* Filled portion */}
          <div
            className={`absolute h-2 rounded-full bg-gradient-to-r ${currentLevel?.color} transition-all duration-300`}
            style={{ width: `${((displayValue - 1) / 4) * 100}%` }}
          />
        </div>

        {/* Slider input */}
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const hovered = Math.min(Math.max(Math.ceil(percentage * 5), 1), 5);
            setHoveredValue(hovered);
          }}
          onMouseLeave={() => setHoveredValue(null)}
          className="absolute top-0 h-2 w-full cursor-pointer opacity-0"
        />

        {/* Markers */}
        <div className="relative mt-3 flex justify-between">
          {TEMPERATURE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              onMouseEnter={() => setHoveredValue(level.value)}
              onMouseLeave={() => setHoveredValue(null)}
              className={`group relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                value === level.value
                  ? 'border-orange-600 bg-orange-600 text-white shadow-lg scale-110'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-orange-400 hover:scale-105'
              }`}
            >
              <span className="text-sm font-bold">{level.value}</span>
              <div className="absolute -bottom-6 whitespace-nowrap text-xs font-medium text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                {level.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Description Card */}
      {currentLevel && (
        <div className={`rounded-lg border border-slate-200 bg-gradient-to-br ${currentLevel.color} bg-opacity-5 p-5 transition-all duration-300`}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-800">
                Level {currentLevel.value}: {currentLevel.label}
              </h4>
              <p className="text-sm text-slate-600">{currentLevel.description}</p>
            </div>
            {value === currentLevel.value && (
              <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Current
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium text-slate-700">Frequency:</span>
              <span className="text-slate-600">{currentLevel.frequency}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-slate-700">Tone:</span>
              <span className="text-slate-600">{currentLevel.tone}</span>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Example at this level:
            </div>
            <p className="text-sm italic text-slate-700">{currentLevel.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}
