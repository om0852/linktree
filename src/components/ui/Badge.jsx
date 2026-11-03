'use client';

import React from 'react';

const BADGE_VARIANTS = {
  sage: 'bg-brand-100 text-brand-800',
  mint: 'bg-brand-50 text-brand-800',
  neutral: 'bg-surface-2 text-ink-700',
  emerald: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning-ink',
  rose: 'bg-danger-soft text-danger',
  mono: 'bg-[#EEEEEE] text-[#888888] font-mono',
  dark: 'bg-black text-white',
};

const BADGE_SIZES = {
  xs: 'px-[4px] py-[1px] text-[9px] gap-[2px] rounded-xs font-medium',
  sm: 'px-[6px] py-[2px] text-[10px] gap-[4px] rounded-[4px] font-medium',
  md: 'h-[23px] px-[10px] text-[10px] gap-[4px] rounded-pill font-medium',
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
      {Icon && <Icon className="size-[12px] shrink-0" strokeWidth={1.5} />}
      <span>{children}</span>
    </span>
  );
}
