'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

import { SIDEBAR_NAV_ITEMS } from '@/constants/navigation';

export default function AtelierSidebar({ mobileOpen, onToggleMobile }) {
  const pathname = usePathname();

  const isItemActive = (item) => {
    if (item.matchExact) {
      return pathname === '/';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onToggleMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Single floating navigation card (design system §4.1) */}
      <aside
        className={`fixed left-[10px] top-[10px] z-50 flex h-[calc(100vh-20px)] w-[260px] flex-col rounded-lg bg-white py-[15px] transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+20px)] lg:translate-x-0'
        }`}
      >
        {/* Brand row */}
        <div className="mx-[13px] flex h-[24px] items-center justify-between">
          <Link href="/" className="flex items-center gap-[8px]">
            <span className="grid size-[20px] place-items-center rounded-sm bg-brand-500 text-[11px] font-semibold text-white">
              T
            </span>
            <span className="text-[16px] font-semibold text-ink-900">TreeInBio</span>
          </Link>
          {onToggleMobile && (
            <button
              onClick={onToggleMobile}
              aria-label="Close navigation"
              className="grid size-[30px] place-items-center rounded-full text-ink-500 hover:bg-surface-2 hover:text-ink-600 lg:hidden"
            >
              <X className="size-[16px]" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="thin-scroll mr-[3px] mt-[15px] flex-1 overflow-y-auto pl-[13px] pr-[4px]">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.sub}
                onClick={() => onToggleMobile && onToggleMobile(false)}
                className={`nav-item mb-[10px] ${active ? 'nav-item-active font-medium' : ''}`}
              >
                <Icon
                  className={`size-[20px] shrink-0 ${active ? 'text-brand-500' : 'text-ink-900'}`}
                  strokeWidth={1.5}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mx-[13px] mt-auto border-t-[0.5px] border-line px-[7px] pt-[10px]">
          <p className="text-[12px] text-ink-700">TreeInBio Studio</p>
          <p className="text-[10px] text-ink-500">v1.0</p>
        </div>
      </aside>
    </>
  );
}
