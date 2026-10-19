'use client';

import React from 'react';

const ICON_SIZE_MAP = {
  sm: 'p-1.5 min-w-[32px] min-h-[32px] rounded-md',
  md: 'p-2 min-w-[38px] min-h-[38px] rounded-lg',
  lg: 'p-2.5 min-w-[44px] min-h-[44px] rounded-xl',
};

const ICON_VARIANT_MAP = {
  default: 'text-[#5C6B64] hover:text-[#28352F] hover:bg-black/5',
  bordered: 'bg-white border border-[#CAD8CE] text-[#5C6B64] hover:text-[#28352F] hover:border-[#52796F] shadow-xs',
  sage: 'bg-[#52796F]/10 text-[#52796F] hover:bg-[#52796F]/20',
  danger: 'text-[#5C6B64] hover:text-rose-600 hover:bg-rose-50',
};

export default function IconButton({
  icon: Icon,
  children,
  onClick,
  title,
  size = 'md',
  variant = 'default',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const ActiveIcon = Icon;
  const sizeClass = ICON_SIZE_MAP[size] || ICON_SIZE_MAP.md;
  const variantClass = ICON_VARIANT_MAP[variant] || ICON_VARIANT_MAP.default;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {ActiveIcon ? <ActiveIcon className="w-4 h-4 shrink-0" /> : children}
    </button>
  );
}
