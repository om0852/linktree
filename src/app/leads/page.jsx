'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AtelierSidebar from '../../components/Atelier/AtelierSidebar';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { Button, Input, TabButton, IconButton } from '@/components/ui';
import { 
  Users, 
  Phone, 
  Mail, 
  Building2, 
  MessageSquare, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  Copy, 
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

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
      <AtelierSidebar 
        mobileOpen={mobileOpen} 
        onToggleMobile={() => setMobileOpen(!mobileOpen)} 
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
        <AtelierHeader
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

        {/* Main Workspace */}
        <main className="flex-1 mt-[74px] mx-[10px] mb-[10px] lg:ml-0 min-w-0 rounded-lg bg-white p-[15px] flex flex-col gap-[15px]">
        {/* Banner Alert Feedback */}
        {feedback && (
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-brand-100/40 border-brand-500 text-ink-700'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-400 text-rose-900'
              : 'bg-surface-2 border-line text-ink-500'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-500" />
              <span>{feedback.text}</span>
            </div>
            <button 
              onClick={() => setFeedback(null)}
              className="text-ink-500 hover:text-ink-700 font-mono text-[0.65rem]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Title & Metrics Suite */}
        <div className="bg-surface-2 border-[0.5px] border-line/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white border-[0.5px] border-line flex items-center justify-center text-brand-500 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[16px] font-sans font-semibold text-ink-700">
                  Lead Capture &amp; Contacts CRM
                </h1>
                {username && (
                  <span className="px-2 py-0.5 bg-brand-100/70 text-ink-700 font-mono text-xs font-semibold rounded">
                    @{username}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500 mt-0.5 leading-normal">
                Every visitor who submits the contact exchange dialog on your bio is automatically captured and synced.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              icon={RefreshCw}
              variant="bordered"
              onClick={() => setRefreshIndex((n) => n + 1)}
              title="Refresh Leads"
              className={loading ? 'animate-spin text-brand-500' : ''}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={handleExportCSV}
            >
              Export CSV (RFC 4180)
            </Button>
          </div>
        </div>

        {/* Auto-Sync Configuration Bar */}
        <div className="bg-surface-2 border-[0.5px] border-line rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border-[0.5px] border-line flex items-center justify-center text-brand-500 shrink-0">
              <Sparkles className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-ink-700">
                  Auto-Sync Contacts to Google Contacts &amp; Gmail
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  currentProfile.leadCapture?.syncToGoogleContacts !== false
                    ? 'bg-brand-100 text-brand-800 border border-brand-300'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {currentProfile.leadCapture?.syncToGoogleContacts !== false ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[11px] text-ink-500 mt-0.5">
                Automatically push visitor contact submissions into your connected Google Contacts address book.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentProfile.leadCapture?.syncToGoogleContacts !== false}
                onChange={(e) => handleToggleAutoSync(e.target.checked)}
                disabled={savingAutoSync}
                className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 accent-brand-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-ink-700">
                {savingAutoSync ? 'Saving...' : 'Enable Auto-Sync'}
              </span>
            </label>
            <Link
              href="/connectors"
              className="text-xs font-semibold text-brand-500 hover:text-ink-700 underline font-mono ml-2"
            >
              Connectors Hub ↗
            </Link>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Total Captured Leads</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-ink-700 tracking-tight">{stats.total}</span>
            <span className="font-mono text-xs text-brand-500">100% Verified Origin</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Phone Numbers</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-ink-700 tracking-tight">{stats.withPhone}</span>
            <span className="font-mono text-xs text-brand-500">WhatsApp / SMS Ready</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Verified Emails</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-ink-700 tracking-tight">{stats.withEmail}</span>
            <span className="font-mono text-xs text-brand-500">RFC 5322 Compliant</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border-[0.5px] border-line/80 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Google Contacts Sync</span>
            <span className="font-sans font-semibold text-xl sm:text-2xl text-brand-500 tracking-tight">{stats.syncedToGoogle}</span>
            <span className="font-mono text-xs text-ink-500">Gmail Auto-Dispatched</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 py-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <TabButton
              size="sm"
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              All Leads ({totalCount})
            </TabButton>
            <TabButton
              size="sm"
              active={statusFilter === 'synced'}
              onClick={() => setStatusFilter('synced')}
            >
              Synced ({syncedCount})
            </TabButton>
            <TabButton
              size="sm"
              active={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({pendingCount})
            </TabButton>
          </div>

          <div className="w-full sm:w-80">
            <Input
              type="text"
              leftIcon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, email, phone..."
            />
          </div>
        </div>

        {/* Leads Cards Container */}
        {loading && leads.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            <p className="text-xs font-mono text-ink-500">Loading contact submissions...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white border-[0.5px] border-line/80 rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 my-1">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border-[0.5px] border-line flex items-center justify-center text-brand-500 ">
              <Users className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-[14px] font-sans font-semibold text-ink-700">No Captured Leads Yet</h3>
              <p className="text-xs text-ink-500 leading-normal">
                When visitors open your public bio {username ? <>at <span className="font-mono text-brand-500">/{username}</span></> : ''} and submit their contact details, they will appear here instantly.
              </p>
            </div>
            {username && (
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-all "
              >
                <span>Test Contact Form on Live Bio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white border-[0.5px] border-line/80 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 my-1">
            <p className="text-sm font-semibold text-ink-700">No leads match your active filter</p>
            <p className="text-xs text-ink-500">
              {statusFilter !== 'all' ? `No ${statusFilter} leads found.` : 'No leads match your search query.'}
            </p>
            <button
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              className="mt-1 text-xs font-semibold text-brand-500 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredLeads.map((lead) => {
              const isSyncing = syncingId === lead._id;
              const isSynced = Boolean(lead.syncedToGoogleContacts || lead.syncStatus === 'synced');

              return (
                <div
                  key={lead._id}
                  className="p-3 bg-white border-[0.5px] border-line/80 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-brand-500 transition-all group "
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded bg-surface-2 border-[0.5px] border-line flex items-center justify-center text-brand-500 font-semibold text-sm shrink-0">
                      {(lead.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-ink-700">
                          {lead.fullName || 'Anonymous Contact'}
                        </span>
                        {lead.company && (
                          <span className="px-1.5 py-0.2 bg-surface-2 border-[0.5px] border-line text-ink-500 text-[0.62rem] font-medium rounded flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-brand-500" />
                            {lead.company}
                          </span>
                        )}
                        <span className="font-mono text-[0.62rem] text-ink-500/70">
                          {new Date(lead.createdAt).toLocaleDateString()} at{' '}
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Contact Badges: Phone, Email, Note */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-[0.6875rem] font-mono text-ink-700 bg-surface-2 px-2 py-0.5 rounded border-[0.5px] border-line/60">
                            <Mail className="w-3 h-3 text-brand-500" />
                            <span>{lead.email}</span>
                            <button
                              onClick={() => handleCopy(lead.email, `email_${lead._id}`)}
                              className="text-ink-500 hover:text-ink-700 ml-0.5"
                              title="Copy Email"
                            >
                              {copiedKey === `email_${lead._id}` ? (
                                <Check className="w-3 h-3 text-brand-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-[0.6875rem] font-mono text-ink-700 bg-surface-2 px-2 py-0.5 rounded border-[0.5px] border-line/60">
                            <Phone className="w-3 h-3 text-brand-500" />
                            <span>{lead.phone}</span>
                            {lead.isWhatsApp && (
                              <span className="inline-flex items-center px-1 py-0.2 text-[9px] font-semibold text-brand-800 bg-brand-100 rounded border border-brand-300" title="Available on WhatsApp">
                                WhatsApp
                              </span>
                            )}
                            <button
                              onClick={() => handleCopy(lead.phone, `phone_${lead._id}`)}
                              className="text-ink-500 hover:text-ink-700 ml-0.5"
                              title="Copy Phone"
                            >
                              {copiedKey === `phone_${lead._id}` ? (
                                <Check className="w-3 h-3 text-brand-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {lead.notes && (
                          <div className="flex items-center gap-1 text-[0.6875rem] text-ink-500 bg-brand-100/30 px-2 py-0.5 rounded italic truncate max-w-xs">
                            <MessageSquare className="w-2.5 h-2.5 text-brand-500 shrink-0" />
                            <span className="truncate">&ldquo;{lead.notes}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Sync Status */}
                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-line">
                    {isSynced ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-100/50 text-ink-700 text-[0.65rem] font-mono font-semibold rounded border border-brand-500/20">
                        <CheckCircle2 className="w-3 h-3 text-brand-500" />
                        <span>Google Synced</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSyncLead(lead)}
                        disabled={isSyncing}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border-[0.5px] border-line hover:border-brand-500 text-ink-700 text-xs font-semibold rounded transition-all cursor-pointer"
                        title="Sync Contact to Google Contacts & Gmail"
                      >
                        {isSyncing ? (
                          <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-brand-500" />
                        )}
                        <span>Sync to Google</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteLead(lead._id)}
                      className="p-1.5 text-ink-500 hover:text-rose-600 transition-colors"
                      title="Delete Lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
