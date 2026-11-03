'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, RefreshCw, Trash2, ExternalLink } from '@/components/icons';
import Modal from '@/components/ui/Modal';
import { InfoChip, RoundIconButton, SkeletonRows, InfoTip, table } from '@/components/ui/patterns';
import { DOMAIN_TARGET_CNAME, DOMAIN_TARGET_IP, domainVerificationRecordName } from '@/constants/domains';

export default function CustomDomainModal({ profile, onClose }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHostname, setNewHostname] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const CNAME_TARGET = DOMAIN_TARGET_CNAME;
  const IP_TARGET = DOMAIN_TARGET_IP;

  const refreshDomains = async () => {
    const username = profile?.username;
    if (!username) return;
    try {
      const res = await fetch(`/api/v1/domains?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.domains)) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error('Failed to refresh domains:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const username = profile?.username;
    if (!username) return;

    async function loadInitialDomains() {
      try {
        const res = await fetch(`/api/v1/domains?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.domains)) {
          setDomains(data.domains);
        }
      } catch (err) {
        console.error('Failed to load domains:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialDomains();

    return () => {
      isMounted = false;
    };
  }, [profile?.username]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newHostname.trim() || !profile?.username) return;

    try {
      setAddingDomain(true);
      setActionFeedback(null);
      const res = await fetch('/api/v1/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: newHostname,
          username: profile.username,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          type: 'success',
          text: `Added ${data.domain?.hostname || newHostname}! Configure your DNS records below.`,
        });
        setNewHostname('');
        refreshDomains();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Failed to add custom domain.',
        });
      }
    } catch (err) {
      console.error('Error adding domain:', err);
      setActionFeedback({
        type: 'error',
        text: 'Network error while adding custom domain.',
      });
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDns = async (domain) => {
    try {
      setVerifyingId(domain._id);
      setActionFeedback(null);

      const res = await fetch('/api/v1/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: domain._id,
          hostname: domain.hostname,
        }),
      });

      const data = await res.json();
      if (data.success && data.verified) {
        setActionFeedback({
          type: 'success',
          text: `Verified! Caddy automatic SSL is now active for ${domain.hostname}.`,
        });
      } else {
        setActionFeedback({
          type: 'error',
          text: data.message || 'DNS verification failed. Records have not propagated yet.',
          details: data.diagnostics,
        });
      }
      refreshDomains();
    } catch (err) {
      console.error('Error verifying DNS:', err);
      setActionFeedback({
        type: 'error',
        text: 'Network error during DNS verification.',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteDomain = async (domain) => {
    if (!confirm(`Are you sure you want to disconnect ${domain.hostname}?`)) return;

    try {
      const res = await fetch(`/api/v1/domains?id=${domain._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          type: 'success',
          text: `Disconnected ${domain.hostname}.`,
        });
        refreshDomains();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Failed to delete domain.',
        });
      }
    } catch (err) {
      console.error('Error deleting domain:', err);
    }
  };

  const dnsRecords = [
    { key: 'cname', type: 'CNAME', host: 'Subdomain (e.g. bio)', value: CNAME_TARGET },
    { key: 'ip', type: 'A', host: '@ (root domain)', value: IP_TARGET },
  ];

  return (
    <Modal
      onClose={onClose}
      title="Custom Domains"
      headerExtra={<InfoChip>@{profile.username}</InfoChip>}
      width="lg"
      bodyClassName="flex flex-col gap-[15px] pr-[4px]"
    >
      {actionFeedback && (
        <div
          className={`rounded-[5px] border-[0.5px] px-[12px] py-[8px] text-[11px] ${
            actionFeedback.type === 'success'
              ? 'border-[#DCDCDC] bg-[#F8F8F9] text-[#333333]'
              : 'border-[#FFC2CA] bg-[#FFEDEF] text-[#FF4359]'
          }`}
        >
          <p>{actionFeedback.text}</p>
          {actionFeedback.details && (
            <div className="mt-[4px] flex flex-col gap-[2px] text-[10px] opacity-80">
              <p>Resolved CNAMEs: {actionFeedback.details.resolvedCnames?.join(', ') || 'None'}</p>
              <p>Resolved IPs: {actionFeedback.details.resolvedIps?.join(', ') || 'None'}</p>
              <p>Expected: {actionFeedback.details.expectedCname} (or IP {actionFeedback.details.expectedIp})</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAddDomain} className="flex items-center gap-[10px]">
        <input
          type="text"
          placeholder="e.g. links.yourbrand.com"
          value={newHostname}
          onChange={(e) => setNewHostname(e.target.value)}
          className="h-[34px] w-full rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] px-[15px] text-[12px] font-light outline-none placeholder:text-[#808080] focus:border-[#404040]"
          required
        />
        <button
          type="submit"
          disabled={addingDomain || !newHostname.trim()}
          className="h-[34px] shrink-0 rounded-[5px] bg-[#16A34A] px-[15px] text-[12px] font-medium text-white hover:bg-[#15803D] disabled:opacity-50"
        >
          {addingDomain ? 'Adding...' : 'Add Domain'}
        </button>
      </form>

      <div>
        <div className="flex items-center">
          <span className="text-[14px] font-medium">DNS Records</span>
          <InfoTip content="Add one of these records at your domain registrar, then press Verify. Subdomains use CNAME; root domains use the A record." />
        </div>
        <div className={`mt-[10px] ${table.wrapper}`}>
          <table className={table.table}>
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Type</th>
                <th className={table.th}>Name / Host</th>
                <th className={table.th}>Value</th>
              </tr>
            </thead>
            <tbody>
              {dnsRecords.map((record) => (
                <tr key={record.key} className={table.row}>
                  <td className={table.td}>{record.type}</td>
                  <td className={table.td}>{record.host}</td>
                  <td className={table.td}>
                    <span className="flex items-center gap-[6px]">
                      <span className="break-all">{record.value}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(record.value, record.key)}
                        title="Copy"
                        aria-label={`Copy ${record.type} value`}
                        className="shrink-0 text-[#808080] hover:text-[#333333]"
                      >
                        {copiedKey === record.key ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium">Domains ({domains.length})</span>
          <RoundIconButton icon={RefreshCw} title="Refresh" onClick={refreshDomains} />
        </div>

        {loading ? (
          <SkeletonRows rows={2} />
        ) : domains.length === 0 ? (
          <p className="mt-[10px] text-center text-[12px] text-[#808080]">No domains connected yet.</p>
        ) : (
          <div className="mt-[10px] flex flex-col gap-[10px]">
            {domains.map((dom) => {
              const isVerifying = verifyingId === dom._id;
              return (
                <div key={dom._id} className="flex flex-col gap-[8px] rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[12px]">
                  <div className="flex items-center justify-between gap-[10px]">
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <div className="flex min-w-0 items-center gap-[8px]">
                        <span className="truncate text-[12px] font-medium" title={dom.hostname}>{dom.hostname}</span>
                        {dom.verified ? (
                          <span className="shrink-0 rounded-[4px] bg-[#E8F7EE] px-[6px] py-[2px] text-[10px] text-[#16A34A]">SSL Active</span>
                        ) : (
                          <span className="shrink-0 rounded-[4px] bg-[#FFF8E1] px-[6px] py-[2px] text-[10px] text-[#92400E]">Pending</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#808080]">
                        Target: {dom.target}
                        {dom.verifiedAt && ` · Verified ${new Date(dom.verifiedAt).toLocaleDateString()}`}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-[6px]">
                      <button
                        type="button"
                        onClick={() => handleVerifyDns(dom)}
                        disabled={isVerifying}
                        className={`h-[30px] rounded-[5px] border-[0.5px] px-[12px] text-[12px] disabled:opacity-50 ${
                          dom.verified
                            ? 'border-[#C4C4C4] bg-[#F8F8F9] text-[#333333] hover:border-[#404040]'
                            : 'border-[#16A34A] bg-[#16A34A] font-medium text-white hover:bg-[#15803D]'
                        }`}
                        title="Check DNS records"
                      >
                        {isVerifying ? 'Verifying...' : dom.verified ? 'Re-check' : 'Verify'}
                      </button>
                      {dom.verified && (
                        <a
                          href={`https://${dom.hostname}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#808080] hover:bg-[#F8F8F9] hover:text-[#333333]"
                          title="Open domain"
                          aria-label="Open domain"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <RoundIconButton icon={Trash2} tone="danger" title="Delete domain" onClick={() => handleDeleteDomain(dom)} />
                    </div>
                  </div>

                  {!dom.verified && dom.verificationToken && (
                    <div className="border-t-[0.5px] border-[#F0F0F0] pt-[8px] text-[11px] text-[#808080]">
                      <p>Prove ownership with a TXT record:</p>
                      <p className="break-all">
                        Name: <span className="text-[#333333]">{domainVerificationRecordName(dom.hostname)}</span>
                      </p>
                      <p className="break-all">
                        Value: <span className="text-[#333333]">{dom.verificationToken}</span>
                      </p>
                    </div>
                  )}

                  {dom.lastDnsCheckError && !dom.verified && (
                    <p className="line-clamp-2 rounded-[5px] border-[0.5px] border-[#FFC2CA] bg-[#FFEDEF] px-[8px] py-[6px] text-[10px] text-[#FF4359]">
                      {dom.lastDnsCheckError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
