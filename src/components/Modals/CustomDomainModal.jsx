'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Server,
  ArrowRight,
  Info,
  Loader2,
  Sparkles,
  Lock,
} from 'lucide-react';
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

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto border-[0.5px] border-line bg-white shadow-modal rounded-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-ink-500 hover:text-ink-700 hover:bg-surface-2 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b-[0.5px] border-line">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center ">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-sans font-semibold text-ink-700">Custom Domains &amp; SSL</h3>
              <span className="px-2 py-0.5 rounded-sm bg-brand-500/10 text-brand-500 text-[10px] font-mono border border-brand-500/20 font-semibold">
                Caddy On-Demand TLS
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Serve your TreeInBio page on your own branded domain with automated Let&apos;s Encrypt SSL
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div
            className={`p-3.5 rounded-xl mb-5 flex items-start gap-2.5 text-xs ${
              actionFeedback.type === 'success'
                ? 'bg-brand-500/10 border border-brand-500/30 text-ink-700'
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{actionFeedback.text}</p>
              {actionFeedback.details && (
                <div className="mt-1 text-[11px] opacity-80 font-mono space-y-0.5">
                  <p>Resolved CNAMEs: {actionFeedback.details.resolvedCnames?.join(', ') || 'None'}</p>
                  <p>Resolved IPs: {actionFeedback.details.resolvedIps?.join(', ') || 'None'}</p>
                  <p>Expected Target: {actionFeedback.details.expectedCname} (or IP {actionFeedback.details.expectedIp})</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Domain Form */}
        <form onSubmit={handleAddDomain} className="p-4 rounded-xl bg-surface-2 border-[0.5px] border-line mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" /> Connect a New Domain
            </span>
            <span className="text-[11px] font-mono text-brand-500 bg-white px-2 py-0.5 rounded-sm border-[0.5px] border-line">
              Profile: @{profile.username}
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. bio.yourbrand.com or links.yourname.com"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                className="tb-input w-full pl-9 text-xs"
                required
              />
              <Globe className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={addingDomain || !newHostname.trim()}
              className="tb-btn tb-btn-primary shrink-0 text-xs px-4 rounded-sm"
            >
              {addingDomain ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                </>
              ) : (
                <>Connect Domain</>
              )}
            </button>
          </div>
          <p className="text-[11px] text-ink-500">
            Tip: You can use any subdomain (e.g. <span className="font-mono text-brand-500">links.yourbrand.com</span>) or root domain (<span className="font-mono text-brand-500">yourbrand.com</span>).
          </p>
        </form>

        {/* DNS Configuration Instructions */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-500" /> DNS Setup Instructions (Oracle Cloud VM)
            </h4>
            <span className="text-[11px] text-brand-500 font-mono">IP: {IP_TARGET}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* CNAME Card */}
            <div className="p-3.5 rounded-xl bg-surface-2 border-[0.5px] border-line hover:border-brand-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-700 flex items-center gap-1">
                  Option 1: CNAME Record
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-500 border border-brand-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-ink-500 mb-2">For subdomains like <code className="text-brand-500">bio</code> or <code className="text-brand-500">links</code></p>
              
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between bg-white p-1.5 rounded-md border-[0.5px] border-line">
                  <span className="text-ink-500">Type:</span>
                  <span className="text-ink-700 font-semibold">CNAME</span>
                </div>
                <div className="flex justify-between bg-white p-1.5 rounded-md border-[0.5px] border-line">
                  <span className="text-ink-500">Name / Host:</span>
                  <span className="text-ink-700 font-semibold">subdomain (e.g. bio)</span>
                </div>
                <div className="flex justify-between items-center bg-white p-1.5 rounded-md border-[0.5px] border-line">
                  <span className="text-ink-500">Target / Value:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-brand-500 font-semibold">{CNAME_TARGET}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(CNAME_TARGET, 'cname')}
                      className="p-1 hover:text-ink-700 text-ink-500 transition-colors"
                      title="Copy CNAME target"
                    >
                      {copiedKey === 'cname' ? (
                        <Check className="w-3 h-3 text-brand-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* A Record Card */}
            <div className="p-3.5 rounded-xl bg-surface-2 border-[0.5px] border-line hover:border-brand-500 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-700 flex items-center gap-1">
                  Option 2: A Record
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Apex / Root
                </span>
              </div>
              <p className="text-[11px] text-ink-500 mb-2">For root apex domains (e.g. <code className="text-brand-500">yourbrand.com</code>)</p>
              
              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between bg-white p-1.5 rounded-md border-[0.5px] border-line">
                  <span className="text-ink-500">Type:</span>
                  <span className="text-ink-700 font-semibold">A</span>
                </div>
                <div className="flex justify-between bg-white p-1.5 rounded-md border-[0.5px] border-line">
                  <span className="text-ink-500">Name / Host:</span>
                  <span className="text-ink-700 font-semibold">@ (or root)</span>
                </div>
                <div className="flex justify-between items-center bg-white p-1.5 rounded-md border-[0.5px] border-line">
                  <span className="text-ink-500">Target / Value:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-brand-500 font-semibold">{IP_TARGET}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(IP_TARGET, 'ip')}
                      className="p-1 hover:text-ink-700 text-ink-500 transition-colors"
                      title="Copy IP target"
                    >
                      {copiedKey === 'ip' ? (
                        <Check className="w-3 h-3 text-brand-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Domains List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" /> Connected Custom Domains ({domains.length})
            </h4>
            <button
              onClick={refreshDomains}
              className="text-[11px] text-brand-500 hover:text-brand-600 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-ink-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <span className="text-xs">Loading domains...</span>
            </div>
          ) : domains.length === 0 ? (
            <div className="p-6 rounded-xl bg-surface-2 border border-dashed border-line text-center">
              <Globe className="w-8 h-8 text-ink-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-ink-700">No custom domains connected yet</p>
              <p className="text-[11px] text-ink-500 max-w-sm mx-auto mt-1">
                Add your branded domain above to serve this profile directly at your own URL with automatic SSL certificate issuance.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((dom) => {
                const isVerifying = verifyingId === dom._id;
                return (
                  <div
                    key={dom._id}
                    className="p-4 rounded-xl bg-surface-2 border-[0.5px] border-line hover:border-brand-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-700 font-mono flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-brand-500" />
                          {dom.hostname}
                        </span>

                        {dom.verified ? (
                          <span className="px-2 py-0.5 rounded-sm bg-brand-500/10 text-brand-500 text-[10px] font-semibold border border-brand-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-brand-500" /> SSL Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Pending Verification
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-ink-500 flex items-center gap-3">
                        <span>Target: <code className="text-brand-500">{dom.target}</code></span>
                        {dom.verifiedAt && (
                          <span className="text-ink-500">
                            Verified on {new Date(dom.verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {!dom.verified && dom.verificationToken && (
                        <div className="text-[11px] text-ink-500 space-y-0.5">
                          <p>Prove ownership with a TXT record:</p>
                          <p className="font-mono break-all">
                            Name: <code className="text-ink-700">{domainVerificationRecordName(dom.hostname)}</code>
                          </p>
                          <p className="font-mono break-all">
                            Value: <code className="text-ink-700">{dom.verificationToken}</code>
                          </p>
                        </div>
                      )}

                      {dom.lastDnsCheckError && !dom.verified && (
                        <p className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded-md border border-rose-200 line-clamp-2">
                          {dom.lastDnsCheckError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Verify DNS Button */}
                      <button
                        type="button"
                        onClick={() => handleVerifyDns(dom)}
                        disabled={isVerifying}
                        className={`tb-btn text-xs px-3 py-1.5 rounded-sm cursor-pointer ${
                          dom.verified
                            ? 'bg-white text-ink-700 hover:bg-surface-3 border-[0.5px] border-line'
                            : 'tb-btn-primary'
                        }`}
                        title="Run In-App DNS Verification Engine"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            {dom.verified ? 'Re-check DNS' : 'Verify DNS'}
                          </>
                        )}
                      </button>

                      {/* Visit Custom Domain */}
                      {dom.verified && (
                        <a
                          href={`https://${dom.hostname}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-sm bg-white hover:bg-surface-3 text-brand-500 border-[0.5px] border-line transition-all"
                          title="Open live custom domain in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Delete Domain */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(dom)}
                        className="p-2 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
                        title="Delete domain"
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
    </div>
  );
}
