'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Bolt, 
  Check, 
  Loader2, 
  ExternalLink, 
  Menu, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus 
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Button from '../ui/Button';

export default function AtelierHeader({
  currentProfile,
  onSaveProfile,
  isSaving,
  isSaved,
  onToggleMobile,
  authUser,
  onOpenAuth,
  onLogout,
  onProfileSwitched,
}) {
  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 sm:h-16 bg-[#FFFEFA]/95 backdrop-blur-xl z-40 border-b border-[#E0DCD3]/80 shadow-xs transition-all">
      <div className="h-14 sm:h-16 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobile && (
            <button 
              onClick={onToggleMobile}
              className="lg:hidden p-1.5 rounded text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED]"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#52796F] flex items-center justify-center text-[#FFFEFA] shadow-xs">
              <Sparkles className="w-4 h-4 fill-[#FFFEFA]" />
            </div>
            <span className="font-sans font-bold text-base tracking-tight text-[#28352F]">
              TreeInBio
            </span>
            <span className="px-2 py-0.5 bg-[#CAD8CE]/70 text-[#28352F] text-[0.65rem] tracking-widest font-bold border border-[#52796F]/20 rounded font-mono">
              STUDIO
            </span>
          </div>
        </div>

        {/* Right: Auth Controls + Save Button + Bio Link & Avatar */}
        <div className="flex items-center gap-2">
          {/* Workspace & Multi-Profile Switcher */}
          {authUser && (
            <WorkspaceSwitcher 
              currentUsername={currentProfile?.username || authUser?.username} 
              onProfileSwitched={onProfileSwitched} 
            />
          )}

          {/* User Account / Auth Actions */}
          {authUser ? (
            <div className="flex items-center gap-2 bg-[#F5F3ED] border border-[#CAD8CE] px-3 py-1.5 rounded-lg min-h-[38px]">
              <User className="w-4 h-4 text-[#52796F]" />
              <span className="text-xs sm:text-sm font-semibold text-[#28352F] max-w-[120px] truncate">
                @{authUser.username}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 text-[#5C6B64] hover:text-rose-600 transition-colors ml-0.5 rounded hover:bg-black/5"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {onOpenAuth && (
                <>
                  <Button
                    id="tb-signin-btn"
                    variant="outline"
                    size="sm"
                    leftIcon={LogIn}
                    onClick={() => onOpenAuth('login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    id="tb-signup-btn"
                    variant="dark"
                    size="sm"
                    leftIcon={UserPlus}
                    onClick={() => onOpenAuth('register')}
                    className="hidden sm:inline-flex"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Save & Publish to MongoDB Button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={isSaving ? undefined : isSaved ? Check : Bolt}
            loading={isSaving}
            onClick={onSaveProfile}
            className={isSaved ? '!bg-[#3D5C54]' : ''}
            title="Save & Publish Profile to MongoDB Atlas"
          >
            {isSaving ? 'Saving...' : isSaved ? 'Published!' : 'Save & Publish'}
          </Button>

          {/* Quick Live Public Bio URL Shortcut */}
          {currentProfile?.username && (
            <a
              href={`/${currentProfile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-[#52796F] hover:text-[#28352F] bg-[#F5F3ED] border border-[#CAD8CE] rounded-lg transition-all min-h-[38px]"
              title="Open Public Bio in New Tab"
            >
              <span>/{currentProfile.username}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Creator Avatar with Ring */}
          <div className="flex items-center pl-1">
            <div className="relative p-0.5 rounded-full ring-1 ring-[#52796F]/40 shadow-sm">
              <img
                alt={currentProfile?.title || currentProfile?.name || 'Creator'}
                src={
                  currentProfile?.avatar && typeof currentProfile.avatar === 'string' && currentProfile.avatar.trim() !== ''
                    ? currentProfile.avatar.trim()
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile?.name || 'Creator')}&background=52796F&color=FFFEFA&bold=true&size=128`
                }
                className="w-7 h-7 rounded-full object-cover block bg-[#F5F3ED]"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile?.name || 'Creator')}&background=52796F&color=FFFEFA&bold=true&size=128`;
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
