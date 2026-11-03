'use client';

import React, { useState } from 'react';
import { Check } from '@/components/icons';
import { Modal, PillTab, SearchPill, InfoTip } from '@/components/ui';
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
    <Modal
      open
      onClose={onClose}
      title="Title Font"
      headerExtra={<InfoTip content="Font used for your profile title and header." />}
      width="lg"
      bodyClassName="flex flex-col"
    >
      <div className="sticky top-0 z-[1] flex flex-col gap-[10px] border-b-[0.5px] border-[#DCDCDC] bg-white pb-[15px]">
        <SearchPill value={searchQuery} onChange={setSearchQuery} placeholder="Search fonts" className="w-full" />
        <div className="flex items-center gap-[10px] overflow-x-auto scrollbar-none">
          {['all', 'display', 'serif', 'sans-serif', 'handwriting', 'monospace'].map((cat) => (
            <PillTab key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} className="capitalize">
              {cat}
            </PillTab>
          ))}
          {selectedFont && (
            <button
              type="button"
              onClick={() => onSelectFont('')}
              className="ml-auto whitespace-nowrap rounded-[50px] border-[1px] border-[#FF4359] px-[10px] py-[4px] text-[10px] text-[#FF4359] hover:bg-[#FF4359] hover:text-white"
            >
              Reset Font
            </button>
          )}
        </div>
      </div>

      <div className="mt-[15px] flex flex-col gap-[20px]">
        {suggestedFiltered.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            <span className="text-[12px] font-medium text-black">Suggested ({suggestedFiltered.length})</span>
              <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                {suggestedFiltered.map((font) => {
                  const isSelected = selectedFont === font.name;
                  return (
                    <button
                      type="button"
                      key={font.name}
                      onClick={() => {
                        onSelectFont(font.name);
                        onClose();
                      }}
                      className={`rounded-[5px] border-[0.5px] bg-[#FAFAFA] p-[10px] text-left hover:bg-[#F8F8F9] ${
                        isSelected ? 'border-[#000]' : 'border-[#dcdcdc] hover:border-[#C4C4C4]'
                      }`}
                    >
                      <div className="mb-[6px] flex items-center justify-between gap-[6px]">
                        <span className="truncate text-[12px] font-medium text-black">{font.name}</span>
                        <div className="flex shrink-0 items-center gap-[6px]">
                          <span className="rounded-[4px] bg-[#F0F0F0] px-[6px] py-[2px] text-[10px] text-[#333333]">
                            {font.category}
                          </span>
                          {isSelected && <Check size={14} strokeWidth={2} color="#16A34A" aria-label="Selected" />}
                        </div>
                      </div>
                      <p className="text-[16px] truncate text-[#333333]" style={{ fontFamily: font.name }}>
                        {font.sample}
                      </p>
                    </button>
                  );
                })}
              </div>
          </div>
        )}

        {otherFiltered.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            <span className="text-[12px] font-medium text-black">Essentials ({otherFiltered.length})</span>
              <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                {otherFiltered.map((font) => {
                  const isSelected = selectedFont === font.name;
                  return (
                    <button
                      type="button"
                      key={font.name}
                      onClick={() => {
                        onSelectFont(font.name);
                        onClose();
                      }}
                      className={`rounded-[5px] border-[0.5px] bg-[#FAFAFA] p-[10px] text-left hover:bg-[#F8F8F9] ${
                        isSelected ? 'border-[#000]' : 'border-[#dcdcdc] hover:border-[#C4C4C4]'
                      }`}
                    >
                      <div className="mb-[6px] flex items-center justify-between gap-[6px]">
                        <span className="truncate text-[12px] font-medium text-black">{font.name}</span>
                        <div className="flex shrink-0 items-center gap-[6px]">
                          <span className="rounded-[4px] bg-[#F0F0F0] px-[6px] py-[2px] text-[10px] text-[#333333]">
                            {font.category}
                          </span>
                          {isSelected && <Check size={14} strokeWidth={2} color="#16A34A" aria-label="Selected" />}
                        </div>
                      </div>
                      <p className="text-[14px] truncate text-[#333333]" style={{ fontFamily: font.name }}>
                        {font.sample}
                      </p>
                    </button>
                  );
                })}
              </div>
          </div>
        )}

        {suggestedFiltered.length === 0 && otherFiltered.length === 0 && (
          <p className="py-[40px] text-center text-[12px] text-[#808080]">
            No fonts match &quot;{searchQuery}&quot; in category &quot;{activeCategory}&quot;.
          </p>
        )}
      </div>
    </Modal>
  );
}
