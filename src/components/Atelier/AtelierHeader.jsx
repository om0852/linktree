'use client';

import React, { useEffect } from 'react';
import AtelierSidebar from './AtelierSidebar';
import { useWorkspaceSession, updateWorkspaceSession, clearWorkspaceSession } from '@/lib/workspaceStore';

const pill = 'flex h-[23px] items-center px-[10px] rounded-[50px] text-[10px] whitespace-nowrap';
const softPill = `${pill} bg-[#F8F8F9] text-[#333333] hover:bg-[#F0F0F0]`;
const primaryPill = `${pill} justify-center bg-[#16A34A] text-white hover:bg-[#15803D] disabled:opacity-60`;

/**
 * Page chrome: renders the fixed LeftBar and the 24px ActionHeader row
 * (Creatosaurus ActionHeader.jsx). Place it as the first child of the page card.
 */
export default function AtelierHeader({
  title,
  onBack,
  currentProfile,
  onSaveProfile,
  isSaving,
  isSaved,
  mobileOpen,
  onToggleMobile,
  authUser,
  onOpenAuth,
  onOpenAuthModal,
  onLogout,
  onProfileSwitched,
}) {
  const openAuth = onOpenAuth || onOpenAuthModal;
  const session = useWorkspaceSession();
  const signedInUsername = authUser?.username;
  const profileUsername = currentProfile?.username;
  const profileName = currentProfile?.name;

  // Remember who is signed in and which workspace is active, so the sidebar
  // on the next page shows them immediately instead of a placeholder.
  useEffect(() => {
    if (!signedInUsername) return;
    updateWorkspaceSession({
      authUser: { username: signedInUsername },
      activeUsername: profileUsername || signedInUsername,
      activeName: profileUsername ? profileName || '' : '',
    });
  }, [signedInUsername, profileUsername, profileName]);

  const handleLogout = () => {
    clearWorkspaceSession();
    if (onLogout) onLogout();
  };

  return (
    <>
      <AtelierSidebar
        mobileOpen={mobileOpen}
        onToggleMobile={onToggleMobile}
        authUser={authUser || session.authUser}
        currentUsername={(authUser && profileUsername) || session.activeUsername || signedInUsername}
        currentName={(authUser && profileUsername && profileName) || session.activeName}
        onProfileSwitched={onProfileSwitched}
      />

      <div className="flex h-[24px] shrink-0 items-center justify-between">
        <div className="flex min-w-0 items-center">
          {onToggleMobile && (
            <button type="button" onClick={onToggleMobile} aria-label="Open navigation" className="mr-[8px] lg:hidden">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3.33 5H16.67M3.33 10H16.67M3.33 15H16.67" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Back" className="mr-[5px]">
              <svg width="23" height="24" viewBox="0 0 23 24" fill="none">
                <rect y="0.5" width="23" height="23" rx="11.5" fill="#F8F8F9" />
                <path d="M14 8L10 12L14 16" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <h1 className="truncate text-[16px] font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-x-[10px] text-[10px]">
          {currentProfile?.username && (
            <a
              href={`/${currentProfile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open your public bio in a new tab"
              className={`${softPill} hidden sm:flex`}
            >
              <span className="max-w-[140px] truncate">/{currentProfile.username}</span>
              <svg className="ml-[5px]" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7 1.5H10.5V5M10.5 1.5L5.5 6.5M9 7.5V10C9 10.28 8.78 10.5 8.5 10.5H2C1.72 10.5 1.5 10.28 1.5 10V3.5C1.5 3.22 1.72 3 2 3H4.5" stroke="#333333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          {authUser ? (
            <span className={softPill} title={`Signed in as @${authUser.username}`}>
              <span className="max-w-[110px] truncate">@{authUser.username}</span>
              {onLogout && (
                <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="group ml-[6px]">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path className="group-hover:stroke-[#FF4359]" d="M4.5 10.5H2.5C2.22 10.5 2 10.28 2 10V2C2 1.72 2.22 1.5 2.5 1.5H4.5M8 8.5L10.5 6L8 3.5M10.5 6H4.5" stroke="#333333" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </span>
          ) : (
            openAuth && (
              <>
                <button id="tb-signin-btn" type="button" onClick={() => openAuth('login')} className={softPill}>
                  Sign In
                </button>
                <button id="tb-signup-btn" type="button" onClick={() => openAuth('register')} className={`${pill} bg-black text-white`}>
                  Sign Up
                </button>
              </>
            )
          )}

          {onSaveProfile && (
            <button type="button" onClick={onSaveProfile} disabled={isSaving} className={`${primaryPill} min-w-[58px]`}>
              {isSaving ? 'Saving...' : isSaved ? 'Published' : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
