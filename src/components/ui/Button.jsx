'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

const VARIANT_MAP = {
  primary: 'bg-[#52796F] hover:bg-[#3D5C54] text-white shadow-xs border border-transparent',
  forest: 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-xs border border-transparent',
  secondary: 'bg-[#F5F3ED] hover:bg-white text-[#28352F] border border-[#CAD8CE] shadow-xs',
  outline: 'bg-white hover:bg-[#F5F3ED] text-[#28352F] border border-[#CAD8CE] shadow-xs',
  ghost: 'bg-transparent hover:bg-[#CAD8CE]/30 text-[#5C6B64] hover:text-[#28352F]',
  dark: 'bg-[#28352F] hover:bg-[#1C2723] text-white shadow-xs border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-transparent',
  'danger-ghost': 'bg-transparent hover:bg-rose-50 text-rose-600',
};

const SIZE_MAP = {
  xs: 'px-2.5 py-1 min-h-[30px] text-xs gap-1.5 rounded-md font-medium',
  sm: 'px-3.5 py-1.5 min-h-[34px] text-xs gap-2 rounded-lg font-semibold',
  md: 'px-4 py-2.5 min-h-[40px] text-xs sm:text-sm gap-2 rounded-lg font-semibold',
  lg: 'px-5 py-3 min-h-[46px] text-sm sm:text-base gap-2.5 rounded-xl font-semibold',
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
      className={`inline-flex items-center justify-center font-sans transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : ActiveIcon ? (
        <ActiveIcon className="w-4 h-4 shrink-0" />
      ) : null}

      {children && <span className="truncate">{children}</span>}

      {!loading && RightIcon && (
        <RightIcon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
