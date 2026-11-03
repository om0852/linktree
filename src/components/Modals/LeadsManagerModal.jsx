'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Phone, Mail, CheckCircle2, Trash2, RefreshCw, Loader2, Copy, Check } from '@/components/icons';
import Modal from '@/components/ui/Modal';
import {
  KpiCard,
  KpiGrid,
  SearchPill,
  RoundIconButton,
  ToolbarPill,
  InfoChip,
  InfoTip,
  EmptyState,
  SkeletonRows,
  table,
} from '@/components/ui/patterns';

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
    <Modal
      onClose={onClose}
      title="Leads"
      width="xl"
      headerExtra={
        <>
          <InfoChip>@{profile.username}</InfoChip>
          <InfoTip content="Contact form submissions from your bio page. Synced leads go to your connected Google Contacts." />
        </>
      }
    >
      <div className="flex flex-col gap-[15px]">
        <KpiGrid columns={4}>
          <KpiCard icon={Users} value={stats.total} label="Total Leads" />
          <KpiCard icon={Phone} value={stats.withPhone} label="Phone Numbers" />
          <KpiCard icon={Mail} value={stats.withEmail} label="Emails" />
          <KpiCard icon={CheckCircle2} value={stats.syncedToGoogle} label="Google Synced" />
        </KpiGrid>

        {feedback && (
          <div
            className={`rounded-[5px] border-[0.5px] px-[10px] py-[8px] text-[12px] ${
              feedback.type === 'success'
                ? 'border-[#16A34A33] bg-[#E8F7EE] text-[#333333]'
                : 'border-[#FFE082] bg-[#FFF8E1] text-[#92400E]'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-[10px] border-b-[0.5px] border-[#DCDCDC] pb-[15px]">
          <SearchPill value={searchQuery} onChange={setSearchQuery} placeholder="Search leads" className="w-[260px] max-w-full" />
          <div className="flex items-center gap-[10px]">
            <RoundIconButton icon={RefreshCw} title="Refresh" onClick={() => setRefreshIndex((n) => n + 1)} />
            <ToolbarPill as="a" href={`/api/leads/export?username=${profile.username}`} download title="Export all leads as CSV">
              Export CSV
            </ToolbarPill>
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : leads.length === 0 ? (
          <EmptyState title="No leads yet">Contact form submissions appear here.</EmptyState>
        ) : (
          <div className={table.wrapper}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Name</th>
                  <th className={table.th}>Phone</th>
                  <th className={table.th}>Email</th>
                  <th className={table.th}>Note</th>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th} />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const isSyncing = syncingId === lead._id;
                  return (
                    <tr key={lead._id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{lead.fullName || 'Anonymous'}</span>
                          {lead.company && <span className="truncate text-[10px] text-[#808080]">{lead.company}</span>}
                        </div>
                      </td>
                      <td className={`${table.td} whitespace-nowrap`}>
                        {lead.phone ? (
                          <div className="flex items-center gap-[4px]">
                            <a href={`tel:${lead.phone}`} className="hover:underline">
                              {lead.phone}
                            </a>
                            <RoundIconButton
                              icon={copiedKey === `phone_${lead._id}` ? Check : Copy}
                              title="Copy phone number"
                              tone="brand"
                              onClick={() => handleCopy(lead.phone, `phone_${lead._id}`)}
                            />
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={table.td}>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="hover:underline">
                            {lead.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={table.td}>
                        <span className="line-clamp-2 max-w-[180px]" title={lead.note}>{lead.note || '-'}</span>
                      </td>
                      <td className={`${table.td} whitespace-nowrap`}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                        <span className="block text-[10px] text-[#808080]">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className={table.td}>
                        {lead.syncedToGoogleContacts ? (
                          <span className="whitespace-nowrap rounded-[4px] bg-[#E8F7EE] px-[6px] py-[2px] text-[10px] font-medium text-[#16A34A]">Synced</span>
                        ) : (
                          <span className="whitespace-nowrap rounded-[4px] bg-[#FFF8E1] px-[6px] py-[2px] text-[10px] font-medium text-[#92400E]">Pending</span>
                        )}
                      </td>
                      <td className={table.td}>
                        <div className="flex items-center justify-end gap-[6px]">
                          {!lead.syncedToGoogleContacts && (
                            <button
                              type="button"
                              onClick={() => handleSyncLead(lead)}
                              disabled={isSyncing}
                              title="Sync to connected Google Contacts account"
                              className="flex items-center gap-[4px] whitespace-nowrap rounded-[50px] border-[1px] border-[#C4C4C4] px-[10px] py-[4px] text-[10px] hover:bg-[#F8F8F9] disabled:opacity-50"
                            >
                              {isSyncing && <Loader2 size={12} className="animate-spin" />}
                              Sync
                            </button>
                          )}
                          <RoundIconButton
                            icon={Trash2}
                            title="Delete lead"
                            tone="danger"
                            onClick={() => handleDeleteLead(lead._id, lead.fullName)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
