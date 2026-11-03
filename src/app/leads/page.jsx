'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { Toolbar, PillTab, ToolbarPill, SearchPill, RoundIconButton, KpiCard, KpiGrid, SettingRow, Toggle, EmptyState, PrimaryPill, SkeletonRows, table } from '@/components/ui';
import { Users, Phone, Mail, Trash2, RefreshCw, Copy, Check, X } from '@/components/icons';
import { endSignedOutSession } from '@/lib/workspaceStore';

export default function LeadsPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, withPhone: 0, withEmail: 0, syncedToGoogle: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncingId, setSyncingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savingAutoSync, setSavingAutoSync] = useState(false);

  const username = currentProfile?.username || authUser?.username || '';

  const totalCount = leads.length;
  const syncedCount = leads.filter((l) => Boolean(l.syncedToGoogleContacts || l.syncStatus === 'synced')).length;
  const pendingCount = Math.max(0, totalCount - syncedCount);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const isSynced = Boolean(lead.syncedToGoogleContacts || lead.syncStatus === 'synced');
      if (statusFilter === 'synced' && !isSynced) return false;
      if (statusFilter === 'pending' && isSynced) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (lead.fullName || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        const company = (lead.company || '').toLowerCase();
        const note = (lead.note || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || company.includes(q) || note.includes(q);
      }

      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  // Load leads from MongoDB API
  useEffect(() => {
    let isCancelled = false;

    async function loadLeads() {
      try {
        setLoading(true);
        const url = `/api/leads?username=${encodeURIComponent(username)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!isCancelled && data.success && Array.isArray(data.leads)) {
          setLeads(data.leads);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        if (!isCancelled) console.error('Failed to fetch leads:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    if (username) {
      loadLeads();
    }

    return () => {
      isCancelled = true;
    };
  }, [username, refreshIndex]);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.authenticated || !data.user) {
          endSignedOutSession();
          return;
        }
        if (data.authenticated && data.user) {
          setAuthUser(data.user);
          if (data.profile) setCurrentProfile(data.profile);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    }
    loadSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setCurrentProfile(DEFAULT_EMPTY_PROFILE);
      setLeads([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleAutoSync = async (enabled) => {
    try {
      setSavingAutoSync(true);
      const updatedProfile = {
        ...currentProfile,
        leadCapture: {
          ...(currentProfile.leadCapture || {}),
          syncToGoogleContacts: enabled,
        },
      };
      setCurrentProfile(updatedProfile);

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: enabled
            ? 'Auto-Sync enabled: Future leads will automatically sync to your Google Contacts (requires connected account).'
            : 'Auto-Sync disabled: New leads will be securely stored in your TreeInBio CRM only.',
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.error || 'Failed to update auto-sync configuration.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error updating auto-sync setting.',
      });
    } finally {
      setSavingAutoSync(false);
    }
  };

  const handleSyncLead = async (lead) => {
    try {
      setSyncingId(lead._id);
      setFeedback(null);

      const res = await fetch('/api/leads/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead._id,
          username,
        }),
      });

      const data = await res.json();
      if (data.success && data.synced) {
        setFeedback({
          type: 'success',
          text: `Synced ${lead.fullName || 'contact'} to Google Contacts & Gmail!`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.message || 'Google account not connected yet. Please connect Google in the Connectors Hub.',
        });
      }
      setRefreshIndex((n) => n + 1);
    } catch {
      setFeedback({
        type: 'error',
        text: 'Sync error connecting to Google API.',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await fetch(`/api/leads?id=${leadId}&username=${username}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
        setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      }
    } catch (err) {
      console.error('Delete lead error:', err);
    }
  };

  const handleExportCSV = () => {
    window.open(`/api/leads/export?username=${encodeURIComponent(username)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-700">

      <div className="lg:pl-[280px] h-dvh overflow-hidden flex flex-col">

        {/* Main Workspace */}
        <main style={{ height: 'calc(100dvh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
        <AtelierHeader
          title="Leads"
          mobileOpen={mobileOpen}
          currentProfile={currentProfile}
          authUser={authUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onProfileSwitched={(newProfile) => {
            if (newProfile) {
              setCurrentProfile(newProfile);
            }
          }}
        />
        <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
        {feedback && (
          <div className={`flex items-center justify-between gap-[8px] rounded-[5px] border-[0.5px] px-[12px] py-[8px] text-[11px] ${
            feedback.type === 'error'
              ? 'border-[#FFC2CA] bg-[#FFEDEF] text-[#FF4359]'
              : 'border-[#DCDCDC] bg-[#F8F8F9] text-[#333333]'
          }`}>
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss" className="text-[#808080] hover:text-black">
              <X size={14} />
            </button>
          </div>
        )}

        <Toolbar
          left={
            <>
              <PillTab active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All ({totalCount})</PillTab>
              <PillTab active={statusFilter === 'synced'} onClick={() => setStatusFilter('synced')}>Synced ({syncedCount})</PillTab>
              <PillTab active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}>Pending ({pendingCount})</PillTab>
            </>
          }
          right={
            <>
              <SearchPill value={searchQuery} onChange={setSearchQuery} placeholder="Search leads" />
              <RoundIconButton
                icon={RefreshCw}
                title="Refresh"
                onClick={() => setRefreshIndex((n) => n + 1)}
                iconClassName={loading ? 'animate-spin' : ''}
              />
              <ToolbarPill onClick={handleExportCSV} className="w-[55px]">Export</ToolbarPill>
            </>
          }
        />

        <KpiGrid>
          <KpiCard icon={Users} value={stats.total} label="Leads" />
          <KpiCard icon={Phone} value={stats.withPhone} label="With Phone" />
          <KpiCard icon={Mail} value={stats.withEmail} label="With Email" />
          <KpiCard icon={RefreshCw} value={stats.syncedToGoogle} label="Synced to Google" />
        </KpiGrid>

        <div className="rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[15px]">
          <SettingRow
            title="Sync to Google Contacts"
            description="New leads are added to your connected Google Contacts automatically."
          >
            <Link href="/connectors" className="text-[12px] text-[#16A34A] hover:underline">Manage</Link>
            <Toggle
              checked={currentProfile.leadCapture?.syncToGoogleContacts !== false}
              onChange={handleToggleAutoSync}
              disabled={savingAutoSync}
              label="Sync to Google Contacts"
            />
          </SettingRow>
        </div>

        {loading && leads.length === 0 ? (
          <div className={table.wrapper}><SkeletonRows rows={6} /></div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            action={username && (
              <PrimaryPill as="a" href={`/${username}`} target="_blank" rel="noreferrer">Open Bio</PrimaryPill>
            )}
          >
            Contacts submitted from your bio page appear here.
          </EmptyState>
        ) : filteredLeads.length === 0 ? (
          <p className="mt-[15px] text-center text-[12px]">
            No results found. Please adjust your search or filter.{' '}
            <button type="button" onClick={() => { setStatusFilter('all'); setSearchQuery(''); }} className="text-[#16A34A] hover:underline">
              Reset
            </button>
          </p>
        ) : (
          <div className={table.wrapper}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Name</th>
                  <th className={table.th}>Email</th>
                  <th className={table.th}>Phone</th>
                  <th className={table.th}>Note</th>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Google</th>
                  <th className={`${table.th} w-[50px]`} />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const isSyncing = syncingId === lead._id;
                  const isSynced = Boolean(lead.syncedToGoogleContacts || lead.syncStatus === 'synced');
                  const created = new Date(lead.createdAt);
                  return (
                    <tr key={lead._id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-[10px]">
                          <span className="flex size-[25px] shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[11px] uppercase text-[#333333]">
                            {(lead.fullName || 'U').charAt(0)}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[180px] truncate" title={lead.fullName}>{lead.fullName || 'Anonymous'}</span>
                            {lead.company && <span className="block max-w-[180px] truncate text-[10px] text-[#808080]">{lead.company}</span>}
                          </span>
                        </div>
                      </td>
                      <td className={table.td}>
                        {lead.email ? (
                          <span className="group flex items-center gap-[4px]">
                            <span className="max-w-[200px] truncate" title={lead.email}>{lead.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(lead.email, `email_${lead._id}`)}
                              title="Copy email"
                              aria-label="Copy email"
                              className="text-[#808080] opacity-0 hover:text-[#333333] group-hover:opacity-100"
                            >
                              {copiedKey === `email_${lead._id}` ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                            </button>
                          </span>
                        ) : <span className="text-[#AAAAAA]">—</span>}
                      </td>
                      <td className={table.td}>
                        {lead.phone ? (
                          <span className="group flex items-center gap-[4px] whitespace-nowrap">
                            <span>{lead.phone}</span>
                            {lead.isWhatsApp && (
                              <span className="rounded-[3px] bg-[#EEEEEE] px-[4px] py-[1px] text-[9px] font-medium text-[#888888]">WhatsApp</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopy(lead.phone, `phone_${lead._id}`)}
                              title="Copy phone"
                              aria-label="Copy phone"
                              className="text-[#808080] opacity-0 hover:text-[#333333] group-hover:opacity-100"
                            >
                              {copiedKey === `phone_${lead._id}` ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                            </button>
                          </span>
                        ) : <span className="text-[#AAAAAA]">—</span>}
                      </td>
                      <td className={table.td}>
                        {lead.notes ? <span className="block max-w-[220px] truncate" title={lead.notes}>{lead.notes}</span> : <span className="text-[#AAAAAA]">—</span>}
                      </td>
                      <td className={`${table.td} whitespace-nowrap`}>
                        <span className="block">{created.toLocaleDateString()}</span>
                        <span className="block text-[10px] text-[#808080]">{created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className={`${table.td} whitespace-nowrap`}>
                        {isSynced ? (
                          <span>Synced</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSyncLead(lead)}
                            disabled={isSyncing}
                            className="text-[12px] text-[#16A34A] hover:underline disabled:opacity-50"
                          >
                            {isSyncing ? 'Syncing...' : 'Sync'}
                          </button>
                        )}
                      </td>
                      <td className={table.td}>
                        <RoundIconButton icon={Trash2} tone="danger" title="Delete lead" onClick={() => handleDeleteLead(lead._id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </main>
    </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setAuthUser(user);
            setShowAuthModal(false);
          }}
        />
      )}
    </div>
  );
}
