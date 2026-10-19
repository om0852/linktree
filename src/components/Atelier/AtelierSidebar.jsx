'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  UserCheck, 
  Calendar, 
  BarChart3, 
  Share2, 
  Zap, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  Sliders,
  Menu,
  X
} from 'lucide-react';

import { SIDEBAR_NAV_ITEMS } from '@/constants/navigation';

export default function AtelierSidebar({ mobileOpen, onToggleMobile, onOpenConfig }) {
  const pathname = usePathname();

  const isItemActive = (item) => {
    if (item.matchExact) {
      return pathname === '/';
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onToggleMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Atelier Left Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-[#F5F3ED] border-r border-[#E0DCD3]/70 z-50 flex flex-col justify-between py-3 shadow-sm transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Top Node Header & Navigation */}
        <div className="flex flex-col gap-2">
          {/* Header Title & Version */}
          <div className="px-4 py-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[#52796F] shadow-[0_0_8px_rgba(82,121,111,0.5)]"></div>
              <span className="text-base text-[#28352F] font-bold tracking-tight">
                TreeInBio
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#52796F] bg-[#52796F]/10 px-2 py-0.5 rounded-md font-semibold">Studio</span>
              {onToggleMobile && (
                <button 
                  onClick={onToggleMobile}
                  className="lg:hidden p-1.5 text-[#5C6B64] hover:text-[#28352F] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 px-3 mt-2">
            {SIDEBAR_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onToggleMobile && onToggleMobile(false)}
                  className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-lg min-h-[44px] transition-all text-left ${
                    active
                      ? 'bg-white text-[#28352F] shadow-[inset_3px_0_0_0_#52796F] border border-[#CAD8CE]/70 font-semibold'
                      : 'text-[#5C6B64] hover:text-[#28352F] hover:bg-white/70 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? 'text-[#52796F]' : 'text-[#5C6B64] group-hover:text-[#52796F]'
                  }`} />
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className={`text-sm tracking-tight truncate ${
                      active ? 'font-semibold text-[#28352F]' : 'font-medium'
                    }`}>
                      {item.label}
                    </span>
                    <span className="font-mono text-xs text-[#5C6B64]/80 truncate mt-0.5">
                      {item.sub}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Clean Footer */}
        <div className="px-4 py-3 border-t border-[#CAD8CE]/50 flex items-center justify-between text-[#5C6B64]">
          <span className="font-mono text-xs font-medium">TreeInBio Atelier</span>
          <span className="font-mono text-xs">v1.0</span>
        </div>
      </aside>
    </>
  );
}
