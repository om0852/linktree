'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Palette, Check, RefreshCw, Layers } from '@/components/icons';
import { extractPaletteFromImage, generateSuggestedThemes } from '@/utils/paletteExtractor';

export default function PaletteSuggester({ avatarUrl, currentTheme, onSelectTheme }) {
  const [extractedColors, setExtractedColors] = useState([]);
  const [suggestedThemes, setSuggestedThemes] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [appliedThemeId, setAppliedThemeId] = useState(null);

  useEffect(() => {
    if (!avatarUrl) return;

    let isMounted = true;
    const runExtraction = async () => {
      setIsExtracting(true);
      try {
        const colors = await extractPaletteFromImage(avatarUrl);
        if (isMounted && colors.length > 0) {
          setExtractedColors(colors);
          setSuggestedThemes(generateSuggestedThemes(colors));
        }
      } catch (err) {
        console.error('Palette extraction error:', err);
      } finally {
        if (isMounted) setIsExtracting(false);
      }
    };

    runExtraction();
    return () => { isMounted = false; };
  }, [avatarUrl]);

  if (!avatarUrl || (!isExtracting && suggestedThemes.length === 0)) {
    return null;
  }

  return (
    <div className="p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[5px] bg-white border-[0.5px] border-line text-brand-500 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-[12px] font-semibold text-ink-700 flex items-center gap-1.5">
              AI Palette Extraction
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100/70 text-ink-700">
                Auto-Detected
              </span>
            </h4>
            <p className="text-[11px] text-ink-500">
              Extracted dominant colors from your avatar photo
            </p>
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5">
          {extractedColors.map((hex, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-white"
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>

      {/* Suggested Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
        {suggestedThemes.map((theme) => {
          const isSelected = appliedThemeId === theme.id || currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => {
                setAppliedThemeId(theme.id);
                if (onSelectTheme) onSelectTheme(theme.id, theme);
              }}
              className={`p-3 rounded-[10px] border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'border-brand-500 bg-white ring-2 ring-brand-500/20'
                  : 'border-line bg-white/70 hover:bg-white'
              }`}
            >
              <div
                className="w-full h-8 rounded-[5px] mb-2 shadow-inner border border-black/5"
                style={{ background: theme.previewGradients }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink-700">{theme.name}</span>
                {isSelected && <Check size={14} className="text-brand-500" />}
              </div>
              <p className="text-[10px] text-ink-500 mt-0.5 line-clamp-1">
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
