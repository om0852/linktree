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
    ? 'px-[10px] h-[26px] text-[11px] gap-[6px] rounded-pill'
    : 'px-[12px] h-[34px] text-[12px] gap-[6px] rounded-pill';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center font-sans border-[0.5px] transition-colors duration-150 cursor-pointer select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 ${sizeClasses} ${
        active
          ? 'bg-brand-50 border-brand-500 text-brand-800 font-medium'
          : 'bg-white border-line text-ink-700 hover:bg-surface-2'
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="size-[14px] shrink-0" strokeWidth={1.5} />}
      <span className="truncate">{children}</span>
      {badge && (
        <span className={`min-w-[18px] h-[18px] px-[5px] rounded-full grid place-items-center text-[9px] font-medium ${
          active ? 'bg-brand-500 text-white' : 'bg-surface-2 text-ink-700'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
