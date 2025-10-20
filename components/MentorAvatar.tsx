'use client';

/**
 * MentorAvatar Component
 * Displays a personalized mentor avatar instead of generic icons
 */

interface MentorAvatarProps {
  mentorName?: string;
  size?: 'sm' | 'md' | 'lg';
  temperature?: number;
  className?: string;
}

export function MentorAvatar({
  mentorName = 'Alex',
  size = 'md',
  temperature = 3,
  className = '',
}: MentorAvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  // Temperature-based styling
  const getTemperatureStyle = () => {
    if (temperature <= 2) {
      // Subtle: cool blue tones
      return {
        bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
        ring: 'ring-blue-200',
        glow: 'shadow-blue-200/50',
      };
    } else if (temperature <= 4) {
      // Balanced: warm cyan/teal
      return {
        bg: 'bg-gradient-to-br from-cyan-400 to-teal-500',
        ring: 'ring-cyan-200',
        glow: 'shadow-cyan-200/50',
      };
    } else {
      // Proactive: energetic orange
      return {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        ring: 'ring-orange-200',
        glow: 'shadow-orange-200/50',
      };
    }
  };

  const style = getTemperatureStyle();
  const initials = mentorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${style.bg}
        ${style.ring}
        ${style.glow}
        relative flex items-center justify-center
        rounded-full font-bold text-white
        ring-4 shadow-lg
        transition-all duration-300
        ${className}
      `}
      title={mentorName}
    >
      {/* Initials */}
      <span className="relative z-10">{initials}</span>

      {/* Subtle pulse animation for proactive mentor */}
      {temperature >= 4 && (
        <span className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-20"></span>
      )}
    </div>
  );
}

/**
 * Mentor Avatar with online indicator
 */
interface MentorAvatarWithStatusProps extends MentorAvatarProps {
  isActive?: boolean;
}

export function MentorAvatarWithStatus({
  isActive = true,
  ...props
}: MentorAvatarWithStatusProps) {
  return (
    <div className="relative inline-block">
      <MentorAvatar {...props} />
      {isActive && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
        </span>
      )}
    </div>
  );
}
