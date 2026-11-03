'use client';

import React from 'react';
import { getThemeAppearance } from '@/lib/theme-contrast';
import { parseTailwindGradient } from '@/constants/app';

/**
 * A theme option drawn with the colours it actually applies: page background,
 * card, title and body text, and a button, so what you pick is what you get.
 */
export default function ThemeCard({ theme, selected, onSelect, subtitle }) {
  const look = getThemeAppearance(theme);
  const background = look.wallpaper.type === 'gradient'
    ? { background: parseTailwindGradient(look.wallpaper.gradient) }
    : { backgroundColor: look.wallpaper.value };

  return (
    <button
      type="button"
      onClick={() => onSelect(theme)}
      aria-pressed={selected}
      className={`group flex flex-col gap-[8px] rounded-[10px] border-[0.5px] p-[6px] text-left transition-colors ${
        selected ? 'border-black bg-[#F8F8F9BF]' : 'border-[#DCDCDC] bg-white hover:border-[#808080]'
      }`}
    >
      <div className="flex h-[92px] w-full flex-col items-center justify-center gap-[5px] rounded-[6px] px-[10px]" style={background}>
        <span className="text-[13px] font-semibold leading-none" style={{ color: look.title }}>Aa</span>
        <span className="h-[3px] w-[38px] rounded-full opacity-80" style={{ backgroundColor: look.body }} />
        <span
          className="mt-[3px] flex h-[16px] w-full max-w-[96px] items-center justify-center rounded-full text-[8px] font-semibold"
          style={{ backgroundColor: look.button, color: look.buttonText }}
        >
          Link
        </span>
        <span
          className="flex h-[16px] w-full max-w-[96px] items-center justify-center rounded-full text-[8px]"
          style={{ backgroundColor: look.card || 'rgba(255,255,255,0.6)', color: look.body }}
        >
          Card
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-[5px] px-[2px] pb-[2px]">
        <div className="min-w-0">
          <span className="block truncate text-[12px] font-medium text-black">{theme.name}</span>
          <span className="block truncate text-[10px] text-[#808080]">{subtitle || theme.tag}</span>
        </div>
        {selected && <span className="shrink-0 text-[10px] font-semibold text-brand-600">Active</span>}
      </div>
    </button>
  );
}
