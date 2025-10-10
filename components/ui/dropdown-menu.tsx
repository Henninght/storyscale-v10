'use client';

import * as React from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
}

export function DropdownMenu({ children, trigger }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'danger';
}

export function DropdownMenuItem({ children, onClick, className = '', variant = 'default' }: DropdownMenuItemProps) {
  const baseClasses = 'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer';
  const variantClasses = variant === 'danger'
    ? 'text-red-600 hover:bg-red-50'
    : 'text-slate-700 hover:bg-slate-50';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
