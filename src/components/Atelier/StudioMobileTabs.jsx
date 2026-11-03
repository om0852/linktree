'use client';

import React from 'react';
import { Eye, Link, LayoutGrid, Palette } from '@/components/icons';

const TABS = [
  { id: 'links', label: 'Links', icon: Link },
  { id: 'style', label: 'Design', icon: Palette },
  { id: 'widgets', label: 'Widgets', icon: LayoutGrid },
  { id: 'preview', label: 'Preview', icon: Eye },
];

/**
 * Studio tab bar on phones (below 768px): the editing sections plus a
 * full-screen preview, within thumb reach. Tablets and computers use the
 * tabs at the top and see the preview beside the editor.
 */
export default function StudioMobileTabs({ activeTab, showPreview, onSelect }) {
  const current = showPreview ? 'preview' : activeTab;
  return (
    <nav
      aria-label="Studio sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t-[0.5px] border-[#DCDCDC] bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid h-[58px] max-w-[480px] grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(id)}
              className={`flex flex-col items-center justify-center gap-[3px] text-[11px] font-medium ${active ? 'text-black' : 'text-[#808080]'}`}
            >
              <span className={`flex h-[28px] w-[52px] items-center justify-center rounded-[50px] ${active ? 'bg-[#E8F7EE]' : ''}`}>
                <Icon size={19} strokeWidth={active ? 2 : 1.6} color={active ? '#15803D' : '#808080'} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
