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
    ? 'w-9 h-5'
    : 'w-11 h-6';
  const knobClasses = isSm
    ? `w-3.5 h-3.5 ${checked ? 'translate-x-4' : 'translate-x-0.5'} top-[3px]`
    : `w-4.5 h-4.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'} top-[3px]`;

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
          checked ? 'bg-[#52796F]' : 'bg-[#CAD8CE]'
        } peer-focus:ring-2 peer-focus:ring-[#52796F]/20`}
      >
        <div
          className={`${knobClasses} bg-white rounded-full shadow-xs transform transition-transform duration-200 absolute`}
        />
      </div>
    </label>
  );
}
