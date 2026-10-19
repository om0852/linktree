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

  const username = authUser?.username || currentProfile?.username || '';

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
    <div className="min-h-screen bg-[#FFFEFA] text-[#28352F]">
      <AtelierSidebar 
        mobileOpen={mobileOpen} 
        onToggleMobile={() => setMobileOpen(!mobileOpen)} 
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AtelierHeader
          currentProfile={currentProfile}
          authUser={authUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Main Workspace */}
        <main className="flex-1 pt-16 sm:pt-20 px-5 sm:px-8 lg:px-10 pb-12 w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
        {/* Banner Alert Feedback */}
        {feedback && (
          <div className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium shadow-xs ${
            feedback.type === 'success'
              ? 'bg-[#CAD8CE]/40 border-[#52796F] text-[#28352F]'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-400 text-rose-900'
              : 'bg-[#F5F3ED] border-[#CAD8CE] text-[#5C6B64]'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#52796F]" />
              <span>{feedback.text}</span>
            </div>
            <button 
              onClick={() => setFeedback(null)}
              className="text-[#5C6B64] hover:text-[#28352F] font-mono text-[0.65rem]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Title & Metrics Suite */}
        <div className="bg-[#F5F3ED] border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-sans font-bold text-lg sm:text-xl text-[#28352F] tracking-tight">
                  Lead Capture &amp; Contacts CRM
                </h1>
                {username && (
                  <span className="px-2 py-0.5 bg-[#CAD8CE]/70 text-[#28352F] font-mono text-xs font-semibold rounded">
                    @{username}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C6B64] mt-0.5 leading-normal">
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
              className={loading ? 'animate-spin text-[#52796F]' : ''}
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
        <div className="bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#28352F]">
                  Auto-Sync Contacts to Google Contacts &amp; Gmail
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                  currentProfile.leadCapture?.syncToGoogleContacts !== false
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {currentProfile.leadCapture?.syncToGoogleContacts !== false ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[11px] text-[#5C6B64] mt-0.5">
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
                className="w-4 h-4 rounded text-[#52796F] focus:ring-[#52796F] accent-[#52796F] cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#28352F]">
                {savingAutoSync ? 'Saving...' : 'Enable Auto-Sync'}
              </span>
            </label>
            <Link
              href="/connectors"
              className="text-xs font-semibold text-[#52796F] hover:text-[#28352F] underline font-mono ml-2"
            >
              Connectors Hub ↗
            </Link>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Total Captured Leads</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#28352F] tracking-tight">{stats.total}</span>
            <span className="font-mono text-xs text-[#52796F]">100% Verified Origin</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Phone Numbers</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#28352F] tracking-tight">{stats.withPhone}</span>
            <span className="font-mono text-xs text-[#52796F]">WhatsApp / SMS Ready</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Verified Emails</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#28352F] tracking-tight">{stats.withEmail}</span>
            <span className="font-mono text-xs text-[#52796F]">RFC 5322 Compliant</span>
          </div>

          <div className="p-3.5 sm:p-4 bg-white border border-[#CAD8CE]/80 rounded-xl shadow-xs flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C6B64]">Google Contacts Sync</span>
            <span className="font-sans font-bold text-xl sm:text-2xl text-[#52796F] tracking-tight">{stats.syncedToGoogle}</span>
            <span className="font-mono text-xs text-[#5C6B64]">Gmail Auto-Dispatched</span>
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
            <Loader2 className="w-7 h-7 animate-spin text-[#52796F]" />
            <p className="text-xs font-mono text-[#5C6B64]">Loading contact submissions...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white border border-[#CAD8CE]/80 rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-3.5 shadow-xs my-1">
            <div className="w-12 h-12 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-sans font-semibold text-base text-[#28352F]">No Captured Leads Yet</h3>
              <p className="text-xs text-[#5C6B64] leading-normal">
                When visitors open your public bio {username ? <>at <span className="font-mono text-[#52796F]">/{username}</span></> : ''} and submit their contact details, they will appear here instantly.
              </p>
            </div>
            {username && (
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#52796F] text-white text-xs font-medium rounded-lg hover:bg-[#3D5C54] transition-all shadow-xs"
              >
                <span>Test Contact Form on Live Bio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white border border-[#CAD8CE]/80 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-xs my-1">
            <p className="text-sm font-semibold text-[#28352F]">No leads match your active filter</p>
            <p className="text-xs text-[#5C6B64]">
              {statusFilter !== 'all' ? `No ${statusFilter} leads found.` : 'No leads match your search query.'}
            </p>
            <button
              onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
              className="mt-1 text-xs font-semibold text-[#52796F] hover:underline cursor-pointer"
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
                  className="p-3 bg-white border border-[#CAD8CE]/80 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#52796F] transition-all group shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center text-[#52796F] font-bold text-sm shrink-0">
                      {(lead.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#28352F]">
                          {lead.fullName || 'Anonymous Contact'}
                        </span>
                        {lead.company && (
                          <span className="px-1.5 py-0.2 bg-[#F5F3ED] border border-[#CAD8CE] text-[#5C6B64] text-[0.62rem] font-medium rounded flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5 text-[#52796F]" />
                            {lead.company}
                          </span>
                        )}
                        <span className="font-mono text-[0.62rem] text-[#5C6B64]/70">
                          {new Date(lead.createdAt).toLocaleDateString()} at{' '}
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Contact Badges: Phone, Email, Note */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-[0.6875rem] font-mono text-[#28352F] bg-[#F5F3ED] px-2 py-0.5 rounded border border-[#CAD8CE]/60">
                            <Mail className="w-3 h-3 text-[#52796F]" />
                            <span>{lead.email}</span>
                            <button
                              onClick={() => handleCopy(lead.email, `email_${lead._id}`)}
                              className="text-[#5C6B64] hover:text-[#28352F] ml-0.5"
                              title="Copy Email"
                            >
                              {copiedKey === `email_${lead._id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-[0.6875rem] font-mono text-[#28352F] bg-[#F5F3ED] px-2 py-0.5 rounded border border-[#CAD8CE]/60">
                            <Phone className="w-3 h-3 text-[#52796F]" />
                            <span>{lead.phone}</span>
                            {lead.isWhatsApp && (
                              <span className="inline-flex items-center px-1 py-0.2 text-[9px] font-semibold text-emerald-800 bg-emerald-100 rounded border border-emerald-300" title="Available on WhatsApp">
                                WhatsApp
                              </span>
                            )}
                            <button
                              onClick={() => handleCopy(lead.phone, `phone_${lead._id}`)}
                              className="text-[#5C6B64] hover:text-[#28352F] ml-0.5"
                              title="Copy Phone"
                            >
                              {copiedKey === `phone_${lead._id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {lead.notes && (
                          <div className="flex items-center gap-1 text-[0.6875rem] text-[#5C6B64] bg-[#CAD8CE]/30 px-2 py-0.5 rounded italic truncate max-w-xs">
                            <MessageSquare className="w-2.5 h-2.5 text-[#52796F] shrink-0" />
                            <span className="truncate">&ldquo;{lead.notes}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Sync Status */}
                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#E0DCD3]">
                    {isSynced ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#CAD8CE]/50 text-[#28352F] text-[0.65rem] font-mono font-bold rounded border border-[#52796F]/20">
                        <CheckCircle2 className="w-3 h-3 text-[#52796F]" />
                        <span>Google Synced</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSyncLead(lead)}
                        disabled={isSyncing}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#CAD8CE] hover:border-[#52796F] text-[#28352F] text-xs font-semibold rounded shadow-xs transition-all cursor-pointer"
                        title="Sync Contact to Google Contacts & Gmail"
                      >
                        {isSyncing ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#52796F]" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-[#52796F]" />
                        )}
                        <span>Sync to Google</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteLead(lead._id)}
                      className="p-1.5 text-[#5C6B64] hover:text-rose-600 transition-colors"
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
