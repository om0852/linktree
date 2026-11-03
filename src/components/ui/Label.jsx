'use client';

import React from 'react';

export default function Label({
  children,
  htmlFor,
  required = false,
  sub,
  className = '',
  size = 'sm',
  ...props
}) {
  const sizeClasses = size === 'xs'
    ? 'text-[11px]'
    : size === 'md'
    ? 'text-[14px]'
    : 'text-[12px]';

  return (
    <div className={`flex items-center justify-between mb-[5px] ${className}`}>
      <label
        htmlFor={htmlFor}
        className={`font-medium text-ink-800 font-sans select-none flex items-center ${sizeClasses}`}
        {...props}
      >
        <span>{children}</span>
        {required && (
          <span className="text-danger ml-[2px]" title="Required field">*</span>
        )}
      </label>

      {sub && (
        <span className="text-[10px] text-ink-500">
          {sub}
        </span>
      )}
    </div>
  );
}
