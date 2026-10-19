'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  X, 
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
  ExternalLink,
  Sparkles,
  Copy,
  Check
} from 'lucide-react';

export default function LeadsManagerModal({ profile, onClose }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, withPhone: 0, withEmail: 0, syncedToGoogle: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncingId, setSyncingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const username = profile?.username;

  useEffect(() => {
    if (!username) return;
    let isCancelled = false;

    async function loadLeads() {
      try {
        setLoading(true);
        const url = `/api/leads?username=${encodeURIComponent(username)}${
          statusFilter !== 'all' ? `&status=${statusFilter}` : ''
        }${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`;

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

    loadLeads();

    return () => {
      isCancelled = true;
    };
  }, [username, statusFilter, searchQuery, refreshIndex]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
          username: profile.username,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Synced ${lead.fullName || 'contact'} to Google Contacts / Gmail!`,
        });
      } else {
        setFeedback({
          type: 'info',
          text: data.message || 'Google account not connected yet. Connect Google in the Integrations tab.',
        });
      }
      setRefreshIndex((n) => n + 1);
    } catch (err) {
      console.error('Error syncing lead:', err);
      setFeedback({ type: 'error', text: 'Error connecting to sync service' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteLead = async (id, name) => {
    if (!confirm(`Delete contact lead "${name || 'Unnamed'}"?`)) return;

    try {
      const res = await fetch(`/api/leads?id=${id}&username=${profile.username}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRefreshIndex((n) => n + 1);
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto border border-[#CAD8CE] bg-[#FFFEFA] shadow-2xl rounded-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#E0DCD3]">
          <div className="w-12 h-12 rounded-full bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/20 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-base font-semibold text-[#28352F]">Captured Contact Leads</h3>
              <span className="px-2 py-0.5 rounded-sm bg-[#52796F]/10 text-[#52796F] text-[10px] font-mono border border-[#52796F]/30 font-semibold">
                @{profile.username}
              </span>
            </div>
            <p className="text-xs text-[#5C6B64] mt-0.5">
              Contact submissions captured from your Link-in-Bio form dialog and synced to Gmail Contacts
            </p>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-center">
            <span className="text-[10px] font-semibold text-[#5C6B64] uppercase">Total Leads</span>
            <p className="text-xl font-bold text-[#28352F] font-mono mt-0.5">{stats.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-center">
            <span className="text-[10px] font-semibold text-[#52796F] uppercase">Phone Numbers</span>
            <p className="text-xl font-bold text-[#52796F] font-mono mt-0.5">{stats.withPhone}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-center">
            <span className="text-[10px] font-semibold text-[#52796F] uppercase">Emails</span>
            <p className="text-xl font-bold text-[#52796F] font-mono mt-0.5">{stats.withEmail}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-center">
            <span className="text-[10px] font-semibold text-[#52796F] uppercase">Google Synced</span>
            <p className="text-xl font-bold text-[#52796F] font-mono mt-0.5">{stats.syncedToGoogle}</p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#52796F]/10 border border-[#52796F]/30 text-[#28352F]'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#52796F] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Search, Filter & Export Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4 justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search leads by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tb-input w-full pl-9 text-xs"
            />
            <Search className="w-4 h-4 text-[#5C6B64] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeads}
              className="tb-btn tb-btn-ghost text-xs p-2 text-[#28352F] rounded-sm cursor-pointer"
              title="Refresh leads"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <a
              href={`/api/leads/export?username=${profile.username}`}
              download
              className="tb-btn tb-btn-primary text-xs shrink-0 flex items-center gap-1.5 rounded-sm"
              title="Export all leads as CSV file"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          </div>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="p-8 text-center text-[#5C6B64] flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#52796F]" />
            <span className="text-xs">Loading leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#F5F3ED] border border-dashed border-[#CAD8CE] text-center space-y-2">
            <Users className="w-8 h-8 text-[#5C6B64] mx-auto" />
            <p className="text-xs font-bold text-[#28352F]">No contact leads captured yet</p>
            <p className="text-[11px] text-[#5C6B64] max-w-sm mx-auto">
              When visitors open your link-in-bio profile, they can submit their contact info which will appear here and automatically sync to your connected Google Contacts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const isSyncing = syncingId === lead._id;
              return (
                <div
                  key={lead._id}
                  className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] hover:border-[#52796F] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#28352F]">
                        {lead.fullName || 'Anonymous Visitor'}
                      </span>
                      {lead.company && (
                        <span className="px-2 py-0.5 rounded-sm bg-[#FFFEFA] text-[#28352F] text-[10px] font-mono border border-[#CAD8CE] flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5 text-[#5C6B64]" /> {lead.company}
                        </span>
                      )}
                      {lead.syncedToGoogleContacts ? (
                        <span className="px-2 py-0.5 rounded-sm bg-[#52796F]/10 text-[#52796F] text-[10px] font-semibold border border-[#52796F]/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-[#52796F]" /> Synced to Gmail
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                          Pending Sync
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#28352F]">
                      {lead.phone && (
                        <div className="flex items-center gap-1 font-mono text-[#52796F] font-semibold">
                          <Phone className="w-3 h-3 text-[#52796F]" />
                          <a href={`tel:${lead.phone}`} className="hover:underline">
                            {lead.phone}
                          </a>
                          <button
                            onClick={() => handleCopy(lead.phone, `phone_${lead._id}`)}
                            className="p-0.5 text-[#5C6B64] hover:text-[#28352F] cursor-pointer"
                            title="Copy phone number"
                          >
                            {copiedKey === `phone_${lead._id}` ? (
                              <Check className="w-2.5 h-2.5 text-[#52796F]" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {lead.email && (
                        <div className="flex items-center gap-1 text-[#28352F]">
                          <Mail className="w-3 h-3 text-[#52796F]" />
                          <a href={`mailto:${lead.email}`} className="hover:underline text-[#28352F]">
                            {lead.email}
                          </a>
                        </div>
                      )}

                      <span className="text-[10px] text-[#5C6B64]">
                        {new Date(lead.createdAt).toLocaleDateString()} at{' '}
                        {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {lead.note && (
                      <p className="text-xs text-[#5C6B64] italic bg-[#FFFEFA] p-2 rounded-md border border-[#CAD8CE] line-clamp-2">
                        &quot;{lead.note}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Manual Sync to Google Contacts Button */}
                    {!lead.syncedToGoogleContacts && (
                      <button
                        onClick={() => handleSyncLead(lead)}
                        disabled={isSyncing}
                        className="tb-btn tb-btn-ghost text-xs px-2.5 py-1.5 text-[#52796F] border border-[#CAD8CE] flex items-center gap-1 rounded-sm cursor-pointer"
                        title="Sync to connected Google Contacts account"
                      >
                        {isSyncing ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-[#52796F]" />
                        )}
                        <span>Sync to Google</span>
                      </button>
                    )}

                    {/* Delete Lead Button */}
                    <button
                      onClick={() => handleDeleteLead(lead._id, lead.fullName)}
                      className="p-2 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                      title="Delete contact lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
