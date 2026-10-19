'use client';

import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    icon: Icon,
    leftIcon: LeftIcon,
    rightElement,
    error,
    disabled = false,
    className = '',
    size = 'md',
    ...props
  },
  ref
) {
  const ActiveLeftIcon = Icon || LeftIcon;

  const sizeClasses = size === 'sm'
    ? 'py-2 min-h-[38px] text-xs'
    : size === 'lg'
    ? 'py-3 min-h-[46px] text-base'
    : 'py-2.5 min-h-[42px] text-xs sm:text-sm';

  const paddingLeft = ActiveLeftIcon ? 'pl-10 pr-3.5' : rightElement ? 'pl-3.5 pr-10' : 'px-3.5';

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full flex items-center">
        {ActiveLeftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C6B64] flex items-center justify-center">
            <ActiveLeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-white border rounded-lg text-[#28352F] font-sans placeholder-[#5C6B64]/60 transition-all shadow-xs focus:outline-none focus:ring-2 disabled:bg-[#F5F3ED] disabled:text-[#5C6B64] disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
              : 'border-[#CAD8CE] focus:border-[#52796F] focus:ring-[#52796F]/15'
          } ${sizeClasses} ${paddingLeft} ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-rose-600 mt-1 font-medium">
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
