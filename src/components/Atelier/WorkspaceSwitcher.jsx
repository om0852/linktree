'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from '@/components/icons';

const initial = (ws) => (ws?.name || ws?.username || '?').charAt(0).toUpperCase();

function ChevronIcon({ open }) {
  return (
    <svg className="size-[24px] shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d={open ? 'M7.42847 14.2852L11.9999 9.71373L16.5713 14.2852' : 'M16.5713 9.71484L11.9999 14.2863L7.42847 9.71484'}
        stroke="#333333"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** LeftBar workspace switcher (Creatosaurus LeftBar.jsx workspace dropdown). */
export default function WorkspaceSwitcher({ currentUsername, onProfileSwitched }) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [query, setQuery] = useState('');
  const [switching, setSwitching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  const fetchWorkspaces = useCallback(async () => {
    const res = await fetch('/api/profile/workspaces');
    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.workspaces ? data.workspaces : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchWorkspaces()
      .then((list) => { if (!cancelled && list) setWorkspaces(list); })
      .catch((err) => { if (!cancelled) console.error('Failed to load workspaces:', err); });
    return () => { cancelled = true; };
  }, [currentUsername, fetchWorkspaces]);

  const loadWorkspaces = async () => {
    const list = await fetchWorkspaces().catch(() => null);
    if (list) setWorkspaces(list);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (ws) => {
    if (ws.username === currentUsername) {
      setIsOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await fetch('/api/profile/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: ws.id, username: ws.username }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsOpen(false);
        if (onProfileSwitched) onProfileSwitched(data.profile);
        else window.location.reload();
      }
    } catch (err) {
      console.error('Switch error:', err);
    } finally {
      setSwitching(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreateError('');
    const clean = newUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean || clean.length < 2) {
      setCreateError('Username must be at least 2 characters long.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/profile/create-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, name: newName.trim() || clean }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create workspace profile');
      setShowCreateModal(false);
      setNewUsername('');
      setNewName('');
      await loadWorkspaces();
      if (onProfileSwitched) onProfileSwitched(data.profile);
      else window.location.reload();
    } catch (err) {
      setCreateError(err.message || 'Error creating profile');
    } finally {
      setCreating(false);
    }
  };

  const activeWs = workspaces.find((w) => w.username === currentUsername) || {
    username: currentUsername,
    name: currentUsername,
  };
  const filtered = workspaces.filter((ws) =>
    `${ws.name || ''} ${ws.username || ''}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="relative mx-[13px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative mt-[10px] flex h-[34px] w-full cursor-pointer items-center justify-between rounded-[5px] border-[0.5px] border-solid bg-[#FAFAFA] px-[7px] ${isOpen ? 'border-[#404040]' : 'border-[#DCDCDCCC]'}`}
      >
        <span className="flex min-w-0 flex-1 items-center text-[14px]">
          <span className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[#808080] text-[12px] uppercase text-white">
            {initial(activeWs)}
          </span>
          <span className="ml-[10px] h-[20px] min-w-0 truncate text-left" title={activeWs.name || activeWs.username}>
            {activeWs.name || activeWs.username}
          </span>
        </span>
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute left-[-1px] right-[-1px] top-[50px] z-30 min-w-[230px] overflow-hidden rounded-[5px] border-[0.5px] border-[#404040] bg-white pt-[10px]">
          <div className="relative mx-[10px] flex items-center">
            <Search className="absolute left-[8px] text-[#808080]" size={16} strokeWidth={0.85} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search workspace"
              className="h-[34px] w-full rounded-[5px] border-[0.5px] border-[#DCDCDC] bg-[#F8F8F9] px-[30px] text-[14px] font-light outline-none placeholder:text-[#808080]"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-[8px] text-[#808080] hover:text-[#404040]">
                <X size={16} strokeWidth={0.85} />
              </button>
            )}
          </div>

          <div className="customScrollBar mr-[2px] max-h-[158px] overflow-y-scroll pb-[10px] pl-[10px] pr-[2px]">
            {filtered.map((ws) => {
              const active = ws.username === currentUsername;
              return (
                <button
                  type="button"
                  key={ws.id || ws.username}
                  onClick={() => handleSwitch(ws)}
                  disabled={switching}
                  className={`mt-[10px] flex w-full min-w-0 cursor-pointer items-center justify-between rounded-[5px] px-[8px] py-[6px] text-left ${active ? 'bg-[#E8F7EE80]' : 'hover:bg-[#F8F8F9]'}`}
                >
                  <span className="flex min-w-0 items-center">
                    <span className="mr-[7px] flex size-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#808080] text-[12px] text-white">
                      {initial(ws)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px]" title={ws.name || ws.username}>{ws.name || ws.username}</span>
                      <span className="block text-[10px] text-[#808080]">@{ws.username}</span>
                    </span>
                  </span>
                  {active && (
                    <span className="ml-[10px] flex size-[14px] min-w-[14px] shrink-0 items-center justify-center rounded-[2px] bg-[#16A34A]">
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="mt-[10px] px-[8px] text-[12px] text-[#808080]">No workspaces found.</p>}
          </div>

          <div className="p-[10px]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="flex h-[34px] w-full items-center justify-center rounded-[5px] bg-black"
            >
              <svg className="mr-[6px] size-[18px]" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="9" fill="white" />
                <path d="M9 5.5V12.5M5.5 9H12.5" stroke="black" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              <span className="text-[14px] text-white">Create New Workspace</span>
            </button>
          </div>
        </div>
      )}

      {showCreateModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#00000A73] backdrop-blur-[5px]"
          onPointerDown={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <form
            onSubmit={handleCreateWorkspace}
            className="flex w-[400px] max-w-[92vw] flex-col rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[15px]"
          >
            <div className="flex items-center justify-between pb-[10px]">
              <h3 className="text-[14px] font-medium">Create New Workspace</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} aria-label="Close" className="text-[#808080] hover:text-black">
                <X size={18} />
              </button>
            </div>
            <div className="h-[0.5px] w-full bg-[#DCDCDC]" />

            <div className="mt-[15px] flex flex-col gap-[15px] text-[12px] text-[#333333]">
              {createError && <p className="text-[11px] text-[#FF4359]">{createError}</p>}
              <label className="flex flex-col gap-[5px]">
                <span className="text-[14px] font-medium">Username</span>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="e.g. acmestudio"
                  className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none"
                />
              </label>
              <label className="flex flex-col gap-[5px]">
                <span className="text-[14px] font-medium">Display Name</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Studio"
                  className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none"
                />
              </label>
            </div>

            <div className="mt-[15px] flex justify-between gap-[15px]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-[50%] rounded-[5px] border-[0.5px] border-[#C4C4C4] bg-[#F8F8F9] py-[8px] text-[12px] font-medium text-[#333333] hover:border-[#404040] hover:text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newUsername.trim()}
                className="w-[50%] rounded-[5px] bg-[#16A34A] py-[8px] text-[12px] font-medium text-white hover:bg-[#15803D] disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
