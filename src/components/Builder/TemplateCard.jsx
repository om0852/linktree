'use client';

import React, { useEffect } from 'react';
import { getThemeAppearance } from '@/lib/theme-contrast';
import { THEME_PRESETS, CURATED_THEMES, AVATAR_SHAPES, parseTailwindGradient, getFontStack, loadGoogleFont, linkHighlightClass } from '@/constants/app';

const findTheme = (id) => [...THEME_PRESETS, ...CURATED_THEMES].find((theme) => theme.id === id);

const RADIUS = { sharp: '0px', slight: '6px', rounded: '10px', full: '9999px' };

/** A template drawn as a small profile page in its own theme, fonts and shapes. */
export default function TemplateCard({ template, onApply }) {
  const theme = findTheme(template.themeId);
  const look = getThemeAppearance(theme);
  const avatarStyle = AVATAR_SHAPES.find((shape) => shape.id === template.avatarShape)?.style
    || { borderRadius: template.avatarShape === 'circle' ? '9999px' : template.avatarShape === 'arch' ? '9999px 9999px 8px 8px' : '30%' };

  useEffect(() => {
    loadGoogleFont(template.font);
    loadGoogleFont(template.titleFont);
  }, [template.font, template.titleFont]);

  const background = look.wallpaper.type === 'gradient'
    ? { background: parseTailwindGradient(look.wallpaper.gradient) }
    : { backgroundColor: look.wallpaper.value };

  return (
    <button
      type="button"
      onClick={() => onApply(template)}
      className="group flex flex-col gap-[8px] rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[6px] text-left transition-colors hover:border-[#808080]"
    >
      <div className="flex h-[176px] w-full flex-col items-center gap-[6px] overflow-hidden rounded-[6px] px-[12px] pt-[16px]" style={{ ...background, fontFamily: getFontStack(template.font) }}>
        <span className="h-[34px] w-[34px] shrink-0" style={{ ...avatarStyle, background: `linear-gradient(135deg, ${look.button}, ${look.title})` }} />
        <span className="max-w-full truncate text-[14px] leading-tight" style={{ color: look.title, fontFamily: getFontStack(template.titleFont) }}>
          {template.name}
        </span>
        <span className="line-clamp-1 max-w-full text-[8px]" style={{ color: look.body }}>{template.bio}</span>
        <div className="mt-[2px] flex w-full flex-col gap-[5px]">
          {template.links.slice(0, 3).map((item) => (
            <span
              key={item.title}
              className={`flex h-[20px] w-full items-center justify-center truncate px-[6px] text-[8px] font-medium ${linkHighlightClass(item)}`}
              style={{ backgroundColor: look.button, color: look.buttonText, borderRadius: RADIUS[template.buttonRoundness] || '9999px', '--link-fx-color': look.button }}
            >
              {item.title}
            </span>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-[6px] px-[2px] pb-[2px]">
        <div className="min-w-0">
          <span className="block truncate text-[12px] font-medium text-black">{template.name}</span>
          <span className="block truncate text-[10px] text-[#808080]">{template.audience}</span>
        </div>
        <span className="shrink-0 rounded-[50px] border-[0.5px] border-[#DCDCDC] px-[8px] py-[2px] text-[10px] text-[#333333] group-hover:border-black">Use</span>
      </div>
    </button>
  );
}
