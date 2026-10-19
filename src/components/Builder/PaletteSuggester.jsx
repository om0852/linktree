'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Palette, Check, RefreshCw, Layers } from 'lucide-react';
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
    <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#CAD8CE] text-[#52796F] flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#28352F] flex items-center gap-1.5">
              AI Palette Extraction
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#CAD8CE]/70 text-[#28352F]">
                Auto-Detected
              </span>
            </h4>
            <p className="text-[11px] text-[#5C6B64]">
              Extracted dominant colors from your avatar photo
            </p>
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5">
          {extractedColors.map((hex, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-white shadow-xs"
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
              className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'border-[#52796F] bg-white shadow-xs ring-2 ring-[#52796F]/20'
                  : 'border-[#CAD8CE] bg-white/70 hover:bg-white'
              }`}
            >
              <div
                className="w-full h-8 rounded-lg mb-2 shadow-inner border border-black/5"
                style={{ background: theme.previewGradients }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#28352F]">{theme.name}</span>
                {isSelected && <Check size={14} className="text-[#52796F]" />}
              </div>
              <p className="text-[10px] text-[#5C6B64] mt-0.5 line-clamp-1">
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
