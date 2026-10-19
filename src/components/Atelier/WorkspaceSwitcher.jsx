'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  X,
  Loader2
} from 'lucide-react';

export default function WorkspaceSwitcher({ 
  currentUsername, 
  onProfileSwitched 
}) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch workspaces on mount
  const loadWorkspaces = async () => {
    try {
      const res = await fetch('/api/profile/workspaces');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.workspaces) {
          setWorkspaces(data.workspaces);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [currentUsername]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
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
        if (onProfileSwitched) {
          onProfileSwitched(data.profile);
        } else {
          window.location.reload();
        }
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
        body: JSON.stringify({
          username: clean,
          name: newName.trim() || clean,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create workspace profile');
      }

      setShowCreateModal(false);
      setNewUsername('');
      setNewName('');
      await loadWorkspaces();
      if (onProfileSwitched) {
        onProfileSwitched(data.profile);
      } else {
        window.location.reload();
      }
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white border border-[#CAD8CE] hover:bg-[#F5F3ED] transition-all text-xs sm:text-sm text-slate-800 shadow-xs group min-h-[38px] cursor-pointer"
        title="Switch Workspace Profile"
      >
        <div className="w-6 h-6 rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center shrink-0">
          <Building2 size={14} />
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold truncate max-w-[110px] sm:max-w-[140px]">
            @{activeWs.username || currentUsername}
          </span>
          {workspaces.length > 1 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
              {workspaces.length}
            </span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-[#CAD8CE] shadow-xl p-2 z-50 animate-fadeIn text-slate-800">
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspaces &amp; Brands
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              Agency Suite
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {workspaces.map((ws) => {
              const isCurrent = ws.username === currentUsername;
              return (
                <button
                  key={ws.id || ws.username}
                  onClick={() => handleSwitch(ws)}
                  disabled={switching}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                    isCurrent
                      ? 'bg-[#2D6A4F]/10 text-[#2D6A4F] font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                      {ws.avatar ? (
                        <img src={ws.avatar} alt={ws.name} className="w-full h-full object-cover" />
                      ) : (
                        (ws.name || ws.username).charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{ws.name || ws.username}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{ws.username}</p>
                    </div>
                  </div>

                  {isCurrent && <Check size={14} className="text-[#2D6A4F] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-100 mt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus size={14} className="text-[#2D6A4F]" />
              <span>Add Brand Bio Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* Create New Workspace Modal */}
      {showCreateModal && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#CAD8CE] shadow-2xl p-6 text-slate-800 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-slate-900">
                  New Brand Bio Workspace
                </h3>
                <p className="text-[11px] text-slate-500">
                  Manage multiple bio pages under one single login.
                </p>
              </div>
            </div>

            {createError && (
              <div className="p-2.5 mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Brand / Handle Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="e.g. acmestudio"
                    className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/30"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Public URL: {typeof window !== 'undefined' ? window.location.host : 'linktree.work.gd'}/@{newUsername || 'brand'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acme Studio Official"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]/30"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newUsername.trim()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Create Brand</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
