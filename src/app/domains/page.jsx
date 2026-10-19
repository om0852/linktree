'use client';

import React, { useState, useEffect } from 'react';
import AtelierSidebar from '../../components/Atelier/AtelierSidebar';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DOMAIN_TARGET_CNAME, DOMAIN_TARGET_IP } from '@/constants/domains';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import {
  Globe,
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
  Zap,
} from 'lucide-react';

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
    const un = targetUsername || authUser?.username;
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
        if (data.authenticated && data.user) {
          setAuthUser(data.user);
          if (data.profile) {
            setCurrentProfile(data.profile);
          }
          await refreshDomains(data.user.username);
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
          username: authUser.username,
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

        {/* Main Domains Content Workspace */}
        <main className="flex-1 pt-16 sm:pt-20 px-5 sm:px-8 lg:px-10 pb-12 w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
          {/* Top Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0DCD3]/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#52796F] uppercase tracking-wider font-mono">
                  Custom Branding
                </span>
                <span className="px-2 py-0.5 bg-[#CAD8CE]/70 text-[#28352F] font-mono text-xs font-semibold rounded">
                  Free Automatic SSL
                </span>
              </div>
              <h1 className="font-sans font-bold text-lg sm:text-xl text-[#28352F] tracking-tight mt-1">
                Custom Domains &amp; Branded URLs
              </h1>
              <p className="text-xs text-[#5C6B64] mt-0.5 leading-normal">
                Point any custom apex domain or subdomain to your TreeInBio profile with instant, automated SSL certificates.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 bg-[#F5F3ED] border border-[#CAD8CE] px-3 py-1.5 rounded-lg shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#52796F]" />
                <span className="text-xs font-mono font-medium text-[#28352F]">Automatic HTTPS</span>
              </div>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center justify-between shadow-xs ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : actionFeedback.type === 'warning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {actionFeedback.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                {actionFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span className="font-medium">{actionFeedback.text}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-xs font-mono underline hover:no-underline ml-3"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add Domain Card */}
          <div className="bg-[#F5F3ED] border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base text-[#28352F]">
                  Connect a Branded Custom Domain
                </h3>
                <p className="text-xs text-[#5C6B64] mt-0.5">
                  Enter your domain name (e.g., <span className="font-mono text-[#52796F]">links.yourbrand.com</span> or <span className="font-mono text-[#52796F]">yourname.com</span>)
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDomain} className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder="links.yourdomain.com or yourbrand.com"
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  className="w-full px-4 py-2.5 min-h-[42px] bg-white border border-[#CAD8CE] rounded-lg text-sm text-[#28352F] font-mono focus:outline-none focus:border-[#52796F] shadow-xs"
                />
              </div>
              <button
                type="submit"
                disabled={addingDomain}
                className="px-5 py-2.5 min-h-[42px] bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {addingDomain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Add Custom Domain</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* DNS Configuration Instructions */}
          <div className="bg-white border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DCD3]">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#52796F]" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-[#28352F]">
                  DNS Configuration Records
                </h3>
              </div>
              <span className="text-xs font-mono text-[#5C6B64]">
                Configure at your domain registrar (GoDaddy, Cloudflare, Namecheap)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {/* CNAME Record */}
              <div className="p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#CAD8CE] text-[#28352F] text-xs font-mono font-bold rounded">
                      OPTION 1: SUBDOMAIN (Recommended)
                    </span>
                    <span className="text-xs font-mono text-[#52796F] font-bold">TYPE: CNAME</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#28352F] mt-2 font-medium">
                    For subdomains such as <span className="font-mono text-[#52796F]">links.yourbrand.com</span> or <span className="font-mono text-[#52796F]">bio.yourdomain.com</span>:
                  </p>
                </div>

                <div className="p-3 bg-white border border-[#CAD8CE] rounded-lg font-mono text-xs flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-[#5C6B64] text-xs block">CNAME TARGET:</span>
                    <span className="font-bold text-[#28352F] truncate">{CNAME_TARGET}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(CNAME_TARGET, 'cname')}
                    className="p-1.5 hover:bg-[#F5F3ED] text-[#52796F] rounded-lg transition-colors ml-2 cursor-pointer"
                    title="Copy CNAME"
                  >
                    {copiedKey === 'cname' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* A Record */}
              <div className="p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-[#CAD8CE] text-[#28352F] text-xs font-mono font-bold rounded">
                      OPTION 2: ROOT DOMAIN
                    </span>
                    <span className="text-xs font-mono text-[#52796F] font-bold">TYPE: A RECORD</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#28352F] mt-2 font-medium">
                    For root / apex domains such as <span className="font-mono text-[#52796F]">yourbrand.com</span>:
                  </p>
                </div>

                <div className="p-3 bg-white border border-[#CAD8CE] rounded-lg font-mono text-xs flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-[#5C6B64] text-xs block">A RECORD IP:</span>
                    <span className="font-bold text-[#28352F] truncate">{IP_TARGET}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(IP_TARGET, 'ip')}
                    className="p-1.5 hover:bg-[#F5F3ED] text-[#52796F] rounded-lg transition-colors ml-2 cursor-pointer"
                    title="Copy IP"
                  >
                    {copiedKey === 'ip' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Domains Table */}
          <div className="bg-white border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0DCD3]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#52796F]" />
                <h3 className="font-sans font-bold text-sm sm:text-base text-[#28352F]">
                  Your Connected Domains ({domains.length})
                </h3>
              </div>
              <button
                onClick={() => refreshDomains()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#52796F] hover:text-[#28352F] hover:bg-[#F5F3ED] rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs sm:text-sm text-[#5C6B64] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#52796F]" />
                <span>Checking domain status...</span>
              </div>
            ) : domains.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-[#5C6B64] border border-dashed border-[#CAD8CE] rounded-xl flex flex-col items-center gap-2">
                <Globe className="w-8 h-8 text-[#CAD8CE]" />
                <p>No custom domains connected yet.</p>
                <p className="text-xs">Add your first branded domain above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {domains.map((d) => (
                  <div
                    key={d._id || d.hostname}
                    className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#52796F] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#28352F] truncate">
                            {d.hostname}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[0.62rem] font-mono font-bold uppercase ${
                              d.verified || d.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.verified || d.status === 'active' ? 'Active & SSL Verified' : 'DNS Pending'}
                          </span>
                        </div>
                        <span className="text-[0.65rem] text-[#5C6B64] font-mono block">
                          Routes to: @{d.username} • Target: {d.target || CNAME_TARGET}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Verify Button */}
                      <button
                        onClick={() => handleVerify(d._id, d.hostname)}
                        disabled={verifyingId === d._id}
                        className="px-2.5 py-1 rounded bg-white hover:bg-[#F5F3ED] text-[#28352F] border border-[#CAD8CE] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                      >
                        {verifyingId === d._id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-[#52796F]" />
                            <span>Checking...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 text-[#52796F]" />
                            <span>Check DNS</span>
                          </>
                        )}
                      </button>

                      {/* Open Link */}
                      <a
                        href={`https://${d.hostname}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-[#5C6B64] hover:text-[#28352F] transition-colors rounded"
                        title="Open Domain"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(d._id, d.hostname)}
                        className="p-1 text-[#5C6B64] hover:text-rose-600 transition-colors rounded cursor-pointer"
                        title="Delete Domain"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
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
