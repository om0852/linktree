'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AtelierSidebar from '../../components/Atelier/AtelierSidebar';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { AVAILABLE_CONNECTORS, CONNECTOR_CATEGORIES } from '@/constants/connectors';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Zap, 
  Play, 
  Trash2, 
  X,
  AlertCircle,
  RefreshCw,
  Terminal,
  Clock,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle
} from 'lucide-react';

export default function ConnectorsPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Real connected accounts from Composio
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('All Connectors');
  const [search, setSearch] = useState('');
  const [statusNotice, setStatusNotice] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Connecting state
  const [connectingSlug, setConnectingSlug] = useState(null);
  const [disconnectingId, setDisconnectingId] = useState(null);

  // Operations Runner Modal state
  const [activeOpsConnector, setActiveOpsConnector] = useState(null);
  const [activeTabMode, setActiveTabMode] = useState('curated'); // 'curated' | 'all'
  const [allTools, setAllTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [toolsSearch, setToolsSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolParams, setToolParams] = useState({});
  const [executingAction, setExecutingAction] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const currentUserId = currentProfile?.username || authUser?.username || 'creator';

  // Load auth session on mount
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
      setConnectedAccounts([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Fetch real connected accounts from Composio
  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const res = await fetch(`/api/connectors/accounts?userId=${encodeURIComponent(currentUserId)}`);
      const data = await res.json();
      setIsConfigured(data.configured !== false);
      if (data.accounts) {
        setConnectedAccounts(data.accounts);
      }
    } catch (err) {
      console.error('Failed to load connected accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Initiate real Composio OAuth link
  const handleConnect = async (connector) => {
    if (!authUser) {
      setStatusNotice({
        type: 'info',
        text: 'Please sign in or create an account to link your workspace connectors.'
      });
      setAuthModalMode('login');
      setShowAuthModal(true);
      setTimeout(() => setStatusNotice(null), 4000);
      return;
    }

    setConnectingSlug(connector.toolkitSlug);
    setStatusNotice({
      type: 'info',
      text: `Opening secure Composio authorization window for ${connector.name}...`
    });

    try {
      const res = await fetch('/api/connectors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          toolkitSlug: connector.toolkitSlug
        })
      });

      const data = await res.json();

      if (data.success && data.redirectUrl) {
        setStatusNotice({
          type: 'success',
          text: `Authorization popup opened. Please authorize ${connector.name} to continue.`
        });

        const popup = window.open(data.redirectUrl, '_blank', 'width=680,height=780');

        // Poll for connection status update
        const pollInterval = setInterval(async () => {
          await fetchAccounts();
          if (popup && popup.closed) {
            clearInterval(pollInterval);
            setConnectingSlug(null);
          }
        }, 3000);

        // Safety timeout
        setTimeout(() => {
          clearInterval(pollInterval);
          setConnectingSlug(null);
        }, 120000);
      } else {
        setStatusNotice({
          type: 'error',
          text: data.error || `Could not initiate connection for ${connector.name}.`
        });
        setConnectingSlug(null);
      }
    } catch (e) {
      setStatusNotice({
        type: 'error',
        text: `Error initiating connection: ${e.message}`
      });
      setConnectingSlug(null);
    }
  };

  // Disconnect real account from Composio
  const handleDisconnect = async (accountId, connectorName) => {
    if (!confirm(`Are you sure you want to disconnect ${connectorName}? Live automated actions will be disabled.`)) {
      return;
    }

    setDisconnectingId(accountId);
    try {
      const res = await fetch('/api/connectors/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();

      if (data.success) {
        setStatusNotice({
          type: 'info',
          text: `${connectorName} has been disconnected cleanly.`
        });
        await fetchAccounts();
        if (activeOpsConnector?.id === accountId) {
          setActiveOpsConnector(null);
        }
      } else {
        setStatusNotice({
          type: 'error',
          text: data.error || 'Failed to disconnect account.'
        });
      }
    } catch (e) {
      setStatusNotice({
        type: 'error',
        text: `Disconnect failed: ${e.message}`
      });
    } finally {
      setDisconnectingId(null);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  // Open Operations Console Modal
  const openOperationsModal = async (connector, matchedAccount) => {
    setActiveOpsConnector({ ...connector, matchedAccount });
    setActiveTabMode('curated');
    setSelectedTool(connector.popularActions?.[0] || null);
    setToolParams({});
    setExecutionResult(null);
    setAllTools([]);

    // Pre-fetch all live tools from Composio for this toolkit
    try {
      setLoadingTools(true);
      const res = await fetch(`/api/connectors/tools?toolkitSlug=${encodeURIComponent(connector.toolkitSlug)}`);
      const data = await res.json();
      if (data.success && data.tools) {
        setAllTools(data.tools);
      }
    } catch (err) {
      console.warn('Could not load all tools:', err);
    } finally {
      setLoadingTools(false);
    }
  };

  // Execute action through Composio
  const handleExecuteAction = async (e) => {
    e?.preventDefault();
    if (!selectedTool) return;

    setExecutingAction(true);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/connectors/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          toolSlug: selectedTool.slug,
          params: toolParams
        })
      });

      const data = await res.json();
      setExecutionResult(data);
    } catch (err) {
      setExecutionResult({
        success: false,
        error: err.message || 'Execution failed'
      });
    } finally {
      setExecutingAction(false);
    }
  };

  // Helper to match connected account
  const getConnectedAccount = (toolkitSlug) => {
    return connectedAccounts.find(acc => {
      const slug = (acc.toolkit?.slug || acc.app_name || acc.toolkitSlug || '').toLowerCase();
      return slug === toolkitSlug.toLowerCase();
    });
  };

  // Filter connectors
  const filteredConnectors = useMemo(() => {
    return AVAILABLE_CONNECTORS.filter(c => {
      const matchesCategory = selectedCategory === 'All Connectors' || c.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) || 
        c.badge.toLowerCase().includes(q) ||
        c.bioIntegration.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const totalConnectedCount = connectedAccounts.filter(acc => acc.status === 'ACTIVE' || acc.status === 'INITIATED').length;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 antialiased font-sans">
      {/* Atelier Sidebar */}
      <AtelierSidebar 
        mobileOpen={mobileOpen} 
        onToggleMobile={() => setMobileOpen(!mobileOpen)} 
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Atelier Header */}
        <AtelierHeader 
          currentProfile={currentProfile}
          authUser={authUser}
          onOpenAuthModal={(mode) => {
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

        {/* Status Notice Toast */}
        {statusNotice && (
          <div className="sticky top-0 z-40 max-w-4xl mx-auto w-full px-5 pt-3">
            <div className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-3 shadow-sm transition-all ${
              statusNotice.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : statusNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-indigo-50 border-indigo-200 text-indigo-800'
            }`}>
              <div className="flex items-center gap-2">
                {statusNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {statusNotice.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                {statusNotice.type === 'info' && <Zap className="w-4 h-4 text-indigo-600 shrink-0" />}
                <span className="font-medium">{statusNotice.text}</span>
              </div>
              <button 
                onClick={() => setStatusNotice(null)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="pt-16 sm:pt-20 px-5 sm:px-8 lg:px-10 pb-12 max-w-[1780px] mx-auto w-full flex flex-col gap-4 sm:gap-5">
          {/* Top Banner */}
          <div className="bg-[#F5F3ED] border border-[#CAD8CE]/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="flex items-start sm:items-center gap-3.5 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#2D6A4F] shadow-xs shrink-0">
                <Zap className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-sans font-bold text-lg sm:text-xl text-[#1B4332] tracking-tight">
                    Creator Connectors &amp; Cloud Workspaces
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Composio OAuth Engine
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#406856] mt-0.5 leading-normal">
                  Connect verified third-party tools to automate booking availability, capture contacts, sync media, and run live actions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              <button 
                onClick={fetchAccounts}
                disabled={loadingAccounts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CAD8CE] bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
                <span>Refresh Accounts</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-[#CAD8CE]/60 rounded-xl p-3.5 sm:p-4 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Available Connectors</div>
              <div className="text-xl sm:text-2xl font-bold font-sans text-slate-800 mt-1">{AVAILABLE_CONNECTORS.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Production integrations</div>
            </div>

            <div className="bg-white border border-[#CAD8CE]/60 rounded-xl p-3.5 sm:p-4 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Active Connected Accounts</div>
              <div className="text-xl sm:text-2xl font-bold font-sans text-[#2D6A4F] mt-1 flex items-center gap-2">
                <span>{connectedAccounts.length}</span>
                {connectedAccounts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Composio authenticated</div>
            </div>

            <div className="bg-white border border-[#CAD8CE]/60 rounded-xl p-3.5 sm:p-4 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Engine Status</div>
              <div className="text-xl sm:text-2xl font-bold font-sans text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Live
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Composio SDK Ready</div>
            </div>

            <div className="bg-white border border-[#CAD8CE]/60 rounded-xl p-3.5 sm:p-4 shadow-xs">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Security &amp; Permissions</div>
              <div className="text-xl sm:text-2xl font-bold font-sans text-slate-800 mt-1">Granular</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Token isolated per creator</div>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-white border border-[#CAD8CE]/60 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {CONNECTOR_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap min-h-[38px] transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search connectors or operations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 min-h-[38px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] transition"
              />
            </div>
          </div>

          {/* Connectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConnectors.map((connector) => {
              const matchedAccount = getConnectedAccount(connector.toolkitSlug);
              const isConnected = Boolean(matchedAccount);
              const isConnecting = connectingSlug === connector.toolkitSlug;
              const isDisconnecting = disconnectingId === matchedAccount?.id;

              return (
                <div 
                  key={connector.id}
                  className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all relative ${
                    isConnected ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-[#CAD8CE]/60 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={connector.iconUrl} 
                            alt={connector.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="font-sans font-semibold text-sm text-slate-800">
                              {connector.name}
                            </h2>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {connector.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{connector.category}</span>
                        </div>
                      </div>

                      {/* Connection Status Badge */}
                      <div>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                            Not Linked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {connector.description}
                    </p>

                    {/* Bio Integration Callout */}
                    <div className="bg-[#FAF9F5] border border-[#CAD8CE]/50 rounded-lg p-2.5 mb-3 text-[11px] text-[#2D6A4F] flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#2D6A4F] mt-0.5" />
                      <span>{connector.bioIntegration}</span>
                    </div>

                    {/* Connected Account Metadata */}
                    {isConnected && (
                      <div className="mb-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Account ID: <code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-700">{matchedAccount.id}</code></span>
                        <span className="text-emerald-600 font-medium">Status: {matchedAccount.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => openOperationsModal(connector, matchedAccount)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[40px] bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Perform Operations</span>
                        </button>
                        <button
                          onClick={() => handleDisconnect(matchedAccount.id, connector.name)}
                          disabled={isDisconnecting}
                          className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-medium rounded-lg transition cursor-pointer"
                          title="Disconnect Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(connector)}
                        disabled={isConnecting}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[40px] bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <Zap className={`w-4 h-4 text-emerald-400 ${isConnecting ? 'animate-bounce' : ''}`} />
                        <span>{isConnecting ? 'Authorizing in popup...' : 'Connect with 1-Click OAuth'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Operations & Action Runner Console Modal */}
      {activeOpsConnector && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeOpsConnector.iconUrl} alt={activeOpsConnector.name} className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans font-semibold text-base text-slate-800">
                      {activeOpsConnector.name} Operations Console
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      LIVE OAUTH ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Execute real authorized platform actions on your account via Composio.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveOpsConnector(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
              {/* Account details badge strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400">Account ID: </span>
                  <code className="font-mono text-slate-700 font-semibold">{activeOpsConnector.matchedAccount?.id}</code>
                </div>
                <div>
                  <span className="text-slate-400">Toolkit: </span>
                  <span className="font-medium text-slate-700">{activeOpsConnector.toolkitSlug}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className="font-bold text-emerald-600">{activeOpsConnector.matchedAccount?.status || 'ACTIVE'}</span>
                </div>
              </div>

              {/* Mode Tabs: Curated Quick Actions vs All Platform Tools */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTabMode('curated');
                      setSelectedTool(activeOpsConnector.popularActions?.[0] || null);
                      setToolParams({});
                      setExecutionResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeTabMode === 'curated' 
                        ? 'bg-[#2D6A4F] text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    Curated Operations ({activeOpsConnector.popularActions?.length || 0})
                  </button>

                  <button
                    onClick={() => {
                      setActiveTabMode('all');
                      if (allTools.length > 0) {
                        setSelectedTool(allTools[0]);
                      }
                      setToolParams({});
                      setExecutionResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTabMode === 'all' 
                        ? 'bg-[#2D6A4F] text-white shadow-xs' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>All Platform Tools</span>
                    {allTools.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                        {allTools.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab: Curated Actions Selection */}
              {activeTabMode === 'curated' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeOpsConnector.popularActions?.map(action => (
                    <button
                      key={action.slug}
                      type="button"
                      onClick={() => {
                        setSelectedTool(action);
                        setToolParams({});
                        setExecutionResult(null);
                      }}
                      className={`text-left p-3 rounded-lg border text-xs transition ${
                        selectedTool?.slug === action.slug
                          ? 'border-[#2D6A4F] bg-[#2D6A4F]/5 text-slate-900 ring-1 ring-[#2D6A4F]'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      <div className="font-semibold text-slate-800 flex items-center justify-between">
                        <span>{action.name}</span>
                        {selectedTool?.slug === action.slug && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Tab: All Platform Tools with Search */}
              {activeTabMode === 'all' && (
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${allTools.length} tools for ${activeOpsConnector.name}...`}
                      value={toolsSearch}
                      onChange={(e) => setToolsSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {loadingTools ? (
                      <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading tools from Composio...
                      </div>
                    ) : allTools.filter(t => !toolsSearch || t.name.toLowerCase().includes(toolsSearch.toLowerCase()) || t.slug.toLowerCase().includes(toolsSearch.toLowerCase())).map(tool => (
                      <button
                        key={tool.slug}
                        type="button"
                        onClick={() => {
                          setSelectedTool(tool);
                          setToolParams({});
                          setExecutionResult(null);
                        }}
                        className={`w-full text-left p-2.5 text-xs transition flex items-center justify-between ${
                          selectedTool?.slug === tool.slug ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          <code className="text-[10px] text-slate-400 font-mono">{tool.slug}</code>
                        </div>
                        {selectedTool?.slug === tool.slug && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Form & Parameter Inputs */}
              {selectedTool && (
                <form onSubmit={handleExecuteAction} className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-800">{selectedTool.name}</span>
                      <code className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                        {selectedTool.slug}
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {selectedTool.description}
                    </p>
                  </div>

                  {/* Render parameters if defined */}
                  {selectedTool.params && selectedTool.params.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operation Parameters</span>
                      {selectedTool.params.map(param => (
                        <div key={param.key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                            <span>{param.label}</span>
                            {param.required && <span className="text-rose-500">*</span>}
                          </label>
                          {param.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              placeholder={param.placeholder}
                              defaultValue={param.defaultValue || ''}
                              value={toolParams[param.key] || ''}
                              onChange={(e) => setToolParams({ ...toolParams, [param.key]: e.target.value })}
                              required={param.required}
                              className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                            />
                          ) : (
                            <input
                              type={param.type || 'text'}
                              placeholder={param.placeholder}
                              defaultValue={param.defaultValue || ''}
                              value={toolParams[param.key] || ''}
                              onChange={(e) => setToolParams({ ...toolParams, [param.key]: e.target.value })}
                              required={param.required}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic raw parameters helper if using custom tool */}
                  {(!selectedTool.params || selectedTool.params.length === 0) && selectedTool.inputParameters?.properties && Object.keys(selectedTool.inputParameters.properties).length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Schema Parameters</span>
                      {Object.entries(selectedTool.inputParameters.properties).slice(0, 4).map(([key, prop]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-700">
                            {prop.title || key} {selectedTool.inputParameters.required?.includes(key) && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={prop.description?.slice(0, 80) || key}
                            value={toolParams[key] || ''}
                            onChange={(e) => setToolParams({ ...toolParams, [key]: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={executingAction}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${executingAction ? 'animate-spin' : ''}`} />
                      <span>{executingAction ? 'Executing Operation...' : 'Execute Live Action'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Execution Result Console */}
              {executionResult && (
                <div className="bg-slate-900 text-slate-100 rounded-lg p-3.5 text-xs font-mono flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300">Live Operation Output</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {executionResult.durationMs && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {executionResult.durationMs}ms
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        executionResult.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {executionResult.success ? '200 OK' : 'ERROR'}
                      </span>
                    </div>
                  </div>

                  <pre className="max-h-56 overflow-auto text-[11px] text-slate-300 scrollbar-thin">
                    {JSON.stringify(executionResult.result || executionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Operations execute with user permissions granted via Composio.
              </span>
              <button
                type="button"
                onClick={() => setActiveOpsConnector(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          mode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setAuthUser(user);
            setShowAuthModal(false);
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
}
