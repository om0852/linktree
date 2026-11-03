'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SIDEBAR_NAV_ITEMS } from '@/constants/navigation';
import WorkspaceSwitcher from './WorkspaceSwitcher';

/** Global navigation card (Creatosaurus LeftBar.jsx). */
export default function AtelierSidebar({ mobileOpen, onToggleMobile, authUser, currentUsername, currentName, onProfileSwitched }) {
  const pathname = usePathname();

  const isItemActive = (item) => (item.matchExact ? pathname === '/' : pathname.startsWith(item.href));
  const close = () => mobileOpen && onToggleMobile && onToggleMobile();

  return (
    <>
      {mobileOpen && <div onClick={onToggleMobile} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden" />}

      <aside
        style={{ height: 'calc(100dvh - 20px)' }}
        className={`fixed left-[10px] top-[10px] z-50 w-[260px] min-w-[260px] rounded-[10px] bg-white py-[15px] transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%_+_20px)] lg:translate-x-0'}`}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between">
          <Link href="/" onClick={close} className="ml-[9px] flex h-[24px] items-center">
            <svg className="h-[20px] w-auto" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5V17.5M10 7L6 3.5M10 7L14 3.5M10 12L5 8M10 12L15 8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ml-[7px] text-[16px] font-semibold">TreeInBio</span>
          </Link>
          {onToggleMobile && (
            <button type="button" onClick={onToggleMobile} aria-label="Close navigation" className="group mr-[13px] lg:hidden">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path className="group-hover:stroke-[#404040]" d="M8 3L4 7L8 11M12 3L8 7L12 11" stroke="#CACACC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {authUser && <WorkspaceSwitcher currentUsername={currentUsername} currentName={currentName} onProfileSwitched={onProfileSwitched} />}

        {/* Nav */}
        <nav
          className="customScrollBar mr-[3px] mt-[15px] overflow-y-auto pl-[13px] pr-[4px] text-[14px]"
          style={{ height: authUser ? 'calc(100dvh - 162px)' : 'calc(100dvh - 118px)' }}
        >
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`mb-[10px] flex h-[34px] min-h-[34px] w-full items-center rounded-[5px] border-[0.5px] px-[7px] hover:bg-[#F8F8F9] ${active ? 'border-[#dcdcdc] bg-[#F8F8F9]' : 'border-transparent'}`}
              >
                <Icon className="min-w-[20px]" size={20} strokeWidth={1.5} color="black" />
                <span className="ml-[10px] truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
