'use client';

import React from 'react';
import {
  Bolt,
  Check,
  ExternalLink,
  Menu,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Button from '../ui/Button';

const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Creator')}&background=16A34A&color=FFFFFF&bold=true&size=128`;

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
  const avatarSrc =
    currentProfile?.avatar && typeof currentProfile.avatar === 'string' && currentProfile.avatar.trim() !== ''
      ? currentProfile.avatar.trim()
      : fallbackAvatar(currentProfile?.name);

  return (
    <header className="fixed left-[10px] right-[10px] top-[10px] z-40 h-[54px] rounded-lg bg-white lg:left-[280px]">
      <div className="flex h-full w-full items-center justify-between gap-[10px] px-[15px]">
        {/* Left: mobile menu toggle + brand (the sidebar carries the brand on desktop) */}
        <div className="flex min-w-0 items-center gap-[10px]">
          {onToggleMobile && (
            <button
              onClick={onToggleMobile}
              aria-label="Open navigation"
              className="grid size-[30px] place-items-center rounded-full text-ink-500 hover:bg-surface-2 hover:text-ink-700 lg:hidden"
            >
              <Menu className="size-[18px]" strokeWidth={1.5} />
            </button>
          )}
          <span className="hidden text-[16px] font-semibold text-ink-900 sm:inline lg:hidden">TreeInBio</span>
          {currentProfile?.username && (
            <a
              href={`/${currentProfile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-[23px] items-center gap-[6px] rounded-pill border-[0.5px] border-transparent bg-surface-2 px-[10px] text-[10px] text-ink-700 hover:border-ink-300 sm:inline-flex"
              title="Open public bio in a new tab"
            >
              <span className="max-w-[160px] truncate">/{currentProfile.username}</span>
              <ExternalLink className="size-[12px]" strokeWidth={1.5} />
            </a>
          )}
        </div>

        {/* Right: workspace, account, publish */}
        <div className="flex items-center gap-[10px]">
          {authUser && (
            <WorkspaceSwitcher
              currentUsername={currentProfile?.username || authUser?.username}
              onProfileSwitched={onProfileSwitched}
            />
          )}

          {authUser ? (
            <div className="flex h-[34px] items-center gap-[8px] rounded-pill border-[0.5px] border-line bg-white pl-[4px] pr-[6px]">
              <img
                alt={currentProfile?.title || currentProfile?.name || 'Creator'}
                src={avatarSrc}
                className="size-[24px] rounded-full bg-surface-3 object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackAvatar(currentProfile?.name);
                }}
              />
              <span className="hidden max-w-[120px] truncate text-[12px] text-ink-800 sm:inline">
                @{authUser.username}
              </span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  aria-label="Sign out"
                  title="Sign out"
                  className="grid size-[24px] place-items-center rounded-full text-ink-500 transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <LogOut className="size-[14px]" strokeWidth={1.5} />
                </button>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <div className="flex items-center gap-[10px]">
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
              </div>
            )
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={isSaving ? undefined : isSaved ? Check : Bolt}
            loading={isSaving}
            onClick={onSaveProfile}
            className={isSaved ? '!bg-brand-700' : ''}
            title="Save and publish profile"
          >
            {isSaving ? 'Saving...' : isSaved ? 'Published!' : 'Save & Publish'}
          </Button>
        </div>
      </div>
    </header>
  );
}
