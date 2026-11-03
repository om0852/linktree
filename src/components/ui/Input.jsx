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
    ? 'h-[30px] text-[12px]'
    : size === 'lg'
    ? 'h-[40px] text-[14px]'
    : 'h-[34px] text-[12px]';

  const paddingLeft = ActiveLeftIcon ? 'pl-[30px] pr-[10px]' : rightElement ? 'pl-[10px] pr-[30px]' : 'px-[10px]';

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full flex items-center">
        {ActiveLeftIcon && (
          <div className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none text-ink-500 flex items-center justify-center">
            <ActiveLeftIcon className="size-[16px]" strokeWidth={1.5} />
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
          className={`w-full bg-surface-1 border-[0.5px] rounded-sm text-ink-700 font-sans font-light placeholder:text-ink-500 transition-colors outline-none focus:ring-1 disabled:bg-surface-2 disabled:text-ink-400 disabled:cursor-not-allowed ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/30'
              : 'border-line focus:border-brand-500 focus:ring-brand-500/30'
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
        <span className="text-[10px] text-danger mt-[4px]">
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
