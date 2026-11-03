'use client';

import React, { useState, useEffect } from 'react';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DOMAIN_TARGET_CNAME, DOMAIN_TARGET_IP, domainVerificationRecordName } from '@/constants/domains';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { InfoChip, RoundIconButton, SkeletonRows, Tooltip, table } from '@/components/ui';
import { RefreshCw, Trash2, Copy, Check, Info, X } from '@/components/icons';
import { endSignedOutSession } from '@/lib/workspaceStore';

export default function DomainsPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newHostname, setNewHostname] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const CNAME_TARGET = DOMAIN_TARGET_CNAME;
  const IP_TARGET = DOMAIN_TARGET_IP;

  const refreshDomains = async (targetUsername) => {
    const un = targetUsername || currentProfile?.username || authUser?.username;
    if (!un) {
      setDomains([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/domains?username=${encodeURIComponent(un)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.domains)) {
        setDomains(data.domains);
      }
    } catch (err) {
      console.error('Failed to refresh domains:', err);
    } finally {
      setLoading(false);
    }
  };

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
          if (data.profile) {
            setCurrentProfile(data.profile);
          }
          await refreshDomains(data.profile?.username || data.user.username);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!authUser) {
      setActionFeedback({
        type: 'info',
        text: 'Please sign in or create an account to connect a custom domain.',
      });
      setAuthModalMode('login');
      setShowAuthModal(true);
      return;
    }

    if (!newHostname.trim()) return;

    try {
      setAddingDomain(true);
      setActionFeedback(null);
      const res = await fetch('/api/v1/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: newHostname.trim(),
          username: currentProfile?.username || authUser.username,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActionFeedback({
          type: 'success',
          text: `Added ${newHostname}. Please configure your DNS CNAME or A record below.`,
        });
        setNewHostname('');
        await refreshDomains();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Failed to add custom domain.',
        });
      }
    } catch (err) {
      console.error('Add domain error:', err);
      setActionFeedback({
        type: 'error',
        text: 'Network error adding domain.',
      });
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerify = async (id, hostname) => {
    try {
      setVerifyingId(id);
      setActionFeedback(null);
      const res = await fetch('/api/v1/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: id }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.status === 'active' || data.verified) {
          setActionFeedback({
            type: 'success',
            text: `Domain verified! ${hostname} is active with automatic SSL.`,
          });
        } else {
          setActionFeedback({
            type: 'warning',
            text: `DNS check in progress. Please ensure your DNS record points to ${CNAME_TARGET} (or IP ${IP_TARGET}).`,
          });
        }
        await refreshDomains();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Verification check failed.',
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setActionFeedback({
        type: 'error',
        text: 'Failed to verify domain DNS records.',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (id, hostname) => {
    if (!confirm(`Are you sure you want to remove ${hostname}?`)) return;

    try {
      const res = await fetch(`/api/v1/domains?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          type: 'success',
          text: `Removed ${hostname}.`,
        });
        await refreshDomains();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.error || 'Failed to remove domain.',
        });
      }
    } catch (err) {
      console.error('Delete domain error:', err);
      setActionFeedback({
        type: 'error',
        text: 'Failed to delete domain.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setCurrentProfile(DEFAULT_EMPTY_PROFILE);
      setDomains([]);
      setActionFeedback({ type: 'success', text: 'You have been signed out.' });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-700">

      <div className="lg:pl-[280px] h-dvh overflow-hidden flex flex-col">

        {/* Main Domains Content Workspace */}
        <main style={{ height: 'calc(100dvh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
        <AtelierHeader
          title="Custom Domains"
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
              refreshDomains(newProfile.username);
            }
          }}
        />
        <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
          {actionFeedback && (
            <div className={`flex items-center justify-between gap-[8px] rounded-[5px] border-[0.5px] px-[12px] py-[8px] text-[11px] ${
              actionFeedback.type === 'error'
                ? 'border-[#FFC2CA] bg-[#FFEDEF] text-[#FF4359]'
                : actionFeedback.type === 'warning'
                ? 'border-[#FFE082] bg-[#FFF8E1] text-[#92400E]'
                : 'border-[#DCDCDC] bg-[#F8F8F9] text-[#333333]'
            }`}>
              <span>{actionFeedback.text}</span>
              <button type="button" onClick={() => setActionFeedback(null)} aria-label="Dismiss" className="shrink-0 text-[#808080] hover:text-black">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleAddDomain} className="flex items-center gap-[10px]">
            <input
              type="text"
              required
              placeholder="Enter a domain, e.g. links.yourbrand.com"
              value={newHostname}
              onChange={(e) => setNewHostname(e.target.value)}
              className="h-[34px] w-full rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] px-[15px] text-[12px] font-light outline-none placeholder:text-[#808080] focus:border-[#404040]"
            />
            <button
              type="submit"
              disabled={addingDomain}
              className="h-[34px] shrink-0 rounded-[5px] bg-[#16A34A] px-[15px] text-[12px] font-medium text-white hover:bg-[#15803D] disabled:opacity-50"
            >
              {addingDomain ? 'Adding...' : 'Add Domain'}
            </button>
          </form>

          <div className="flex items-center justify-between">
            <InfoChip>Domains ({domains.length})</InfoChip>
            <RoundIconButton icon={RefreshCw} title="Refresh" onClick={() => refreshDomains()} iconClassName={loading ? 'animate-spin' : ''} />
          </div>

          {/* On phones the number and status columns fold into the name column. */}
          <div>
            <div className="grid grid-cols-7 max-md:grid-cols-[minmax(0,1fr)_96px_52px] border-b-[0.5px] border-[#C4C4C466] text-[12px] font-medium">
              <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px] max-md:hidden">Sr. No.</div>
              <div className="col-span-3 max-md:col-span-1 flex items-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px]">Domain</div>
              <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px] max-md:hidden">Status</div>
              <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px]">DNS</div>
              <div className="flex items-center justify-center px-[12px] py-[12px]">Remove</div>
            </div>

            {loading ? (
              <SkeletonRows rows={3} />
            ) : domains.length === 0 ? (
              <p className="mt-[15px] text-center text-[12px]">Add a domain above to use your own address for your bio.</p>
            ) : (
              domains.map((d, index) => {
                const active = d.verified || d.status === 'active';
                return (
                  <div key={d._id || d.hostname} className={`group grid grid-cols-7 max-md:grid-cols-[minmax(0,1fr)_96px_52px] hover:bg-[#F8F8F9] ${index === domains.length - 1 ? '' : 'border-b-[0.5px] border-[#C4C4C466]'}`}>
                    <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px] text-[12px] max-md:hidden">{index + 1}</div>
                    <div className="col-span-3 max-md:col-span-1 flex min-w-0 flex-col justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px]">
                      <a href={`https://${d.hostname}`} target="_blank" rel="noopener noreferrer" className="truncate text-[14px] hover:underline" title={`Open ${d.hostname}`}>
                        {d.hostname}
                      </a>
                      <span className="truncate text-[10px] text-[#808080]">@{d.username}<span className="md:hidden"> · {active ? 'Active' : 'Pending'}</span></span>
                    </div>
                    <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px] text-[12px] max-md:hidden">
                      {active ? 'Active' : <span className="text-[#92400E]">Pending</span>}
                    </div>
                    <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px]">
                      <button
                        type="button"
                        onClick={() => handleVerify(d._id, d.hostname)}
                        disabled={verifyingId === d._id}
                        className="text-[12px] text-[#16A34A] hover:underline disabled:opacity-50"
                      >
                        {verifyingId === d._id ? 'Checking...' : 'Check'}
                      </button>
                    </div>
                    <div className="flex items-center justify-center px-[12px] py-[8px]">
                      <RoundIconButton icon={Trash2} tone="danger" title="Remove domain" onClick={() => handleDelete(d._id, d.hostname)} />
                    </div>
                    {!active && d.verificationToken && (
                      <div className="col-span-7 max-md:col-span-3 border-t-[0.5px] border-[#F0F0F0] px-[12px] py-[8px] text-[11px] text-[#808080]">
                        Add TXT record <span className="text-[#333333]">{domainVerificationRecordName(d.hostname)}</span> with value{' '}
                        <button type="button" onClick={() => handleCopy(d.verificationToken, `txt_${d._id}`)} className="text-[#333333] hover:underline" title="Copy value">
                          {d.verificationToken}
                        </button>
                        {copiedKey === `txt_${d._id}` && <span className="ml-[6px] text-[#16A34A]">Copied</span>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[15px]">
            <div className="flex items-center">
              <span className="text-[14px] font-semibold">DNS Records</span>
              <Tooltip content="Add one of these records at your domain registrar, then press Check. Subdomains use CNAME; root domains use the A record." width={220}>
                <Info className="ml-[6px] cursor-pointer text-[#aaa] hover:text-black" size={15} strokeWidth={1.5} />
              </Tooltip>
            </div>
            <div className="mt-[10px] overflow-x-auto">
              <table className={table.table}>
                <thead className={table.head}>
                  <tr>
                    <th className={table.th}>Type</th>
                    <th className={table.th}>Used for</th>
                    <th className={table.th}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'cname', type: 'CNAME', use: 'Subdomain (links.yourbrand.com)', value: CNAME_TARGET },
                    { key: 'ip', type: 'A', use: 'Root domain (yourbrand.com)', value: IP_TARGET },
                  ].map((record) => (
                    <tr key={record.key} className={table.row}>
                      <td className={table.td}>{record.type}</td>
                      <td className={table.td}>{record.use}</td>
                      <td className={table.td}>
                        <span className="flex items-center gap-[6px]">
                          <span>{record.value}</span>
                          <button type="button" onClick={() => handleCopy(record.value, record.key)} title="Copy" aria-label={`Copy ${record.type} value`} className="text-[#808080] hover:text-[#333333]">
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
            setActionFeedback({
              type: 'success',
              text: `Signed in as @${user.username}`,
            });
            refreshDomains(user.username);
          }}
        />
      )}
    </div>
  );
}
