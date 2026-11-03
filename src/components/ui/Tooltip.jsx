'use client';

import React, { useState } from 'react';

const POSITION = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-[8px]',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-[8px]',
  left: 'right-full top-1/2 -translate-y-1/2 mr-[8px]',
  right: 'left-full top-1/2 -translate-y-1/2 ml-[8px]',
};

const ARROW = {
  top: '-bottom-[4px] left-1/2 -translate-x-1/2 border-r-[0.5px] border-b-[0.5px]',
  bottom: '-top-[4px] left-1/2 -translate-x-1/2 border-t-[0.5px] border-l-[0.5px]',
  left: '-right-[4px] top-1/2 -translate-y-1/2 border-t-[0.5px] border-r-[0.5px]',
  right: '-left-[4px] top-1/2 -translate-y-1/2 border-b-[0.5px] border-l-[0.5px]',
};

/**
 * Dark hover bubble used for metric explanations (KPI cards, deltas, info
 * icons). Icon buttons and truncated names use the native `title` instead.
 */
export default function Tooltip({ children, content, position = 'top', width, className = '' }) {
  const [visible, setVisible] = useState(false);
  if (!content) return children;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {visible && (
        <div role="tooltip" className={`absolute z-50 ${POSITION[position]}`}>
          <div
            style={width ? { width } : undefined}
            className="relative w-max max-w-[220px] whitespace-normal rounded-[6px] border-[0.5px] border-[#dcdcdc] bg-[#111] px-[10px] py-[8px] text-[11px] font-normal leading-[1.6] tracking-[0.01em] text-[#f5f5f5] shadow-[0_4px_12px_rgba(0,0,0,0.08)] animate-fade-in"
          >
            {content}
            <span className={`absolute h-[8px] w-[8px] rotate-45 border-[#dcdcdc] bg-[#111] ${ARROW[position]}`} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
