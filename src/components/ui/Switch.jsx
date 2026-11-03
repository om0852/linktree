'use client';

import React from 'react';

export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  id,
  className = '',
  size = 'md',
  ...props
}) {
  const isSm = size === 'sm';
  const trackClasses = isSm
    ? 'w-[32px] h-[18px]'
    : 'w-[40px] h-[22px]';
  const knobClasses = isSm
    ? `size-[14px] ${checked ? 'translate-x-[16px]' : 'translate-x-[2px]'} top-[2px]`
    : `size-[18px] ${checked ? 'translate-x-[20px]' : 'translate-x-[2px]'} top-[2px]`;

  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center cursor-pointer select-none shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      <div
        className={`${trackClasses} rounded-full transition-colors duration-200 relative ${
          checked ? 'bg-brand-500' : 'bg-line'
        } peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2`}
      >
        <div
          className={`${knobClasses} bg-white rounded-full shadow-sm transform transition-transform duration-200 absolute`}
        />
      </div>
    </label>
  );
}
