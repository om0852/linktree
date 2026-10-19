'use client';

import React from 'react';

const BADGE_VARIANTS = {
  sage: 'bg-[#52796F]/15 text-[#3D5C54] border border-[#52796F]/30',
  mint: 'bg-[#CAD8CE]/70 text-[#28352F] border border-[#52796F]/20',
  neutral: 'bg-[#F5F3ED] text-[#5C6B64] border border-[#CAD8CE]',
  emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border border-rose-200',
  mono: 'bg-[#F5F3ED] text-[#28352F] font-mono border border-[#CAD8CE]',
  dark: 'bg-[#28352F] text-white border border-[#1C2723]',
};

const BADGE_SIZES = {
  xs: 'px-2 py-0.5 text-[0.6875rem] gap-1 rounded',
  sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-md font-semibold',
  md: 'px-3 py-1.5 text-xs sm:text-sm gap-2 rounded-lg font-semibold',
};

export default function Badge({
  children,
  variant = 'mint',
  size = 'sm',
  icon: Icon,
  className = '',
  ...props
}) {
  const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.mint;
  const sizeClass = BADGE_SIZES[size] || BADGE_SIZES.sm;

  return (
    <span
      className={`inline-flex items-center font-sans select-none shrink-0 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
