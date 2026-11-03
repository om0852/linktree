'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    id,
    value,
    onChange,
    children,
    disabled = false,
    className = '',
    size = 'md',
    error,
    ...props
  },
  ref
) {
  const sizeClasses = size === 'sm'
    ? 'h-[30px] text-[12px] pl-[10px] pr-[30px] rounded-sm'
    : 'h-[34px] text-[12px] pl-[10px] pr-[30px] rounded-sm';

  return (
    <div className="relative w-full flex items-center">
      <select
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-surface-1 border-[0.5px] font-sans font-light appearance-none cursor-pointer transition-colors outline-none focus:ring-1 disabled:bg-surface-2 disabled:text-ink-400 disabled:cursor-not-allowed ${
          error
            ? 'border-danger focus:border-danger focus:ring-danger/30 text-danger'
            : 'border-line focus:border-brand-500 focus:ring-brand-500/30 text-ink-700'
        } ${sizeClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-[10px] top-1/2 -translate-y-1/2 pointer-events-none text-ink-500">
        <ChevronDown className="size-[16px]" strokeWidth={1.5} />
      </div>
    </div>
  );
});

export default Select;
