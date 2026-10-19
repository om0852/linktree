'use client';

import React from 'react';

export default function TabButton({
  children,
  active = false,
  icon: Icon,
  badge,
  onClick,
  size = 'md',
  className = '',
  ...props
}) {
  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 min-h-[32px] text-xs gap-1.5 rounded-lg'
    : 'px-4 py-2 min-h-[38px] text-xs sm:text-sm gap-2 rounded-lg';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold font-sans transition-all cursor-pointer select-none shrink-0 ${sizeClasses} ${
        active
          ? 'bg-[#52796F] text-white shadow-xs'
          : 'text-[#5C6B64] hover:text-[#28352F] hover:bg-white/70'
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{children}</span>
      {badge && (
        <span className={`text-[0.6875rem] font-bold px-1.5 py-0.5 rounded ${
          active ? 'bg-white/20 text-white' : 'bg-[#CAD8CE]/70 text-[#28352F]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
