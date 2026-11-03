'use client';

import React from 'react';

const ICON_SIZE_MAP = {
  sm: 'size-[28px] rounded-full',
  md: 'size-[30px] rounded-full',
  lg: 'size-[34px] rounded-full',
};

const ICON_VARIANT_MAP = {
  default: 'text-ink-500 hover:text-ink-700 hover:bg-surface-2',
  bordered: 'bg-white border-[0.5px] border-line text-ink-500 hover:text-ink-700 hover:bg-surface-2',
  sage: 'bg-surface-2 text-ink-500 hover:bg-brand-500/10 hover:text-brand-500',
  danger: 'text-ink-500 hover:text-danger hover:bg-danger/10',
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
      aria-label={props['aria-label'] || title}
      className={`inline-flex items-center justify-center transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {ActiveIcon ? <ActiveIcon className="size-[16px] shrink-0" strokeWidth={1.5} /> : children}
    </button>
  );
}
