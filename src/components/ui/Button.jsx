'use client';

import React from 'react';
import { Loader2 } from '@/components/icons';

const VARIANT_MAP = {
  primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white border-[0.5px] border-transparent',
  forest: 'bg-brand-700 hover:bg-brand-800 text-white border-[0.5px] border-transparent',
  secondary: 'bg-surface-2 hover:bg-[#EEEEEE] text-ink-700 border-[0.5px] border-ink-300',
  outline: 'bg-white hover:bg-surface-2 text-ink-700 border-[0.5px] border-line',
  ghost: 'bg-transparent hover:bg-brand-50 text-ink-500 hover:text-brand-600',
  dark: 'bg-black hover:bg-[#222222] text-white border-[0.5px] border-transparent',
  danger: 'bg-danger hover:bg-danger-hover text-white border-[0.5px] border-transparent',
  'danger-ghost': 'bg-transparent hover:bg-danger-soft text-danger',
};

const SIZE_MAP = {
  xs: 'px-[10px] h-[28px] text-[12px] gap-[6px] rounded-xs font-medium',
  sm: 'px-[15px] h-[34px] text-[12px] gap-[8px] rounded-sm font-medium',
  md: 'px-[15px] h-[34px] text-[12px] gap-[8px] rounded-sm font-medium',
  lg: 'px-[20px] h-[40px] text-[14px] gap-[10px] rounded-sm font-medium',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variantClasses = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;

  const ActiveIcon = Icon || LeftIcon;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans transition-colors duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-[14px] animate-spin shrink-0" />
      ) : ActiveIcon ? (
        <ActiveIcon className="size-[16px] shrink-0" strokeWidth={1.5} />
      ) : null}

      {children && <span className="truncate">{children}</span>}

      {!loading && RightIcon && (
        <RightIcon className="size-[16px] shrink-0" strokeWidth={1.5} />
      )}
    </button>
  );
}
