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
    ? 'py-2 text-xs min-h-[38px] pl-3 pr-9 rounded-lg'
    : 'py-2.5 text-xs sm:text-sm min-h-[42px] pl-3.5 pr-10 rounded-xl';

  return (
    <div className="relative w-full flex items-center">
      <select
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-white border font-sans appearance-none cursor-pointer transition-all shadow-xs focus:outline-none focus:ring-2 disabled:bg-[#F5F3ED] disabled:text-[#5C6B64] disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 text-rose-700'
            : 'border-[#CAD8CE] focus:border-[#52796F] focus:ring-[#52796F]/15 text-[#28352F]'
        } ${sizeClasses} ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C6B64]">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
});

export default Select;
