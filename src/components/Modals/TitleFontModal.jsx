'use client';

import React, { useState } from 'react';
import { X, Search, Check, Sparkles, Type } from 'lucide-react';
import { GOOGLE_FONTS_LIST } from '@/constants/app';

export default function TitleFontModal({
  isOpen,
  onClose,
  selectedFont,
  onSelectFont,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  if (!isOpen) return null;

  const filterFonts = (fonts) => {
    return fonts.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || f.category.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  };

  const suggestedFiltered = filterFonts(GOOGLE_FONTS_LIST.suggested);
  const otherFiltered = filterFonts(GOOGLE_FONTS_LIST.other);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00000A73] backdrop-blur-[5px] animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white border-[0.5px] border-line rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink-800">Title Typography</h3>
              <p className="text-xs text-ink-500">
                Choose an expressive font for your profile title & header
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-500 hover:text-ink-800 rounded-lg hover:bg-surface-2 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b-[0.5px] border-line bg-white/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by font name or style (e.g. Playfair, Display, Handwriting)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-[0.5px] border-line rounded-xl pl-10 pr-4 py-2.5 text-xs text-ink-800 placeholder-ink-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {['all', 'display', 'serif', 'sans-serif', 'handwriting', 'monospace'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg capitalize whitespace-nowrap transition ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white font-medium shadow'
                    : 'bg-surface-2/60 text-ink-500 hover:text-ink-800'
                }`}
              >
                {cat}
              </button>
            ))}
            {selectedFont && (
              <button
                onClick={() => onSelectFont('')}
                className="ml-auto text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded hover:bg-rose-950/30 transition whitespace-nowrap"
              >
                Reset to Default Font
              </button>
            )}
          </div>
        </div>

        {/* Font List Canvas */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Suggested Fonts */}
          {suggestedFiltered.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">
                  Suggested Expressive Fonts ({suggestedFiltered.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedFiltered.map((font) => {
                  const isSelected = selectedFont === font.name;
                  return (
                    <button
                      key={font.name}
                      onClick={() => {
                        onSelectFont(font.name);
                        onClose();
                      }}
                      className={`text-left p-3.5 rounded-xl border transition group relative ${
                        isSelected
                          ? 'bg-emerald-950/30 border-brand-500 ring-1 ring-brand-500'
                          : 'bg-white/60 border-line hover:border-ink-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-ink-700 group-hover:text-ink-800">
                          {font.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-2 text-ink-500">
                            {font.category}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-black">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p
                        className="text-base text-ink-600 truncate tracking-wide"
                        style={{ fontFamily: font.name }}
                      >
                        {font.sample}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Other Typographic Fonts */}
          {otherFiltered.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-sky-400" />
                <h4 className="text-[12px] font-semibold text-ink-600 uppercase tracking-wider">
                  Modern & Classic Essentials ({otherFiltered.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherFiltered.map((font) => {
                  const isSelected = selectedFont === font.name;
                  return (
                    <button
                      key={font.name}
                      onClick={() => {
                        onSelectFont(font.name);
                        onClose();
                      }}
                      className={`text-left p-3.5 rounded-xl border transition group relative ${
                        isSelected
                          ? 'bg-emerald-950/30 border-brand-500 ring-1 ring-brand-500'
                          : 'bg-white/60 border-line hover:border-ink-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-ink-700 group-hover:text-ink-800">
                          {font.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-2 text-ink-500">
                            {font.category}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-black">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p
                        className="text-sm text-ink-600 truncate"
                        style={{ fontFamily: font.name }}
                      >
                        {font.sample}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {suggestedFiltered.length === 0 && otherFiltered.length === 0 && (
            <div className="text-center py-12 text-ink-500 text-sm">
              No fonts match &quot;{searchQuery}&quot; in category &quot;{activeCategory}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
