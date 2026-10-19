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
    ? 'text-[0.6875rem]' 
    : size === 'md' 
    ? 'text-sm' 
    : 'text-xs';

  return (
    <div className={`flex items-center justify-between mb-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className={`font-semibold text-[#28352F] uppercase tracking-wider font-sans select-none flex items-center ${sizeClasses}`}
        {...props}
      >
        <span>{children}</span>
        {required && (
          <span className="text-rose-500 font-bold ml-1 text-xs" title="Required field">*</span>
        )}
      </label>

      {sub && (
        <span className="text-[0.6875rem] font-mono text-[#5C6B64]">
          {sub}
        </span>
      )}
    </div>
  );
}
