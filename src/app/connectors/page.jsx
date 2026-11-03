'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import { Toolbar, PillTab, SearchPill, RoundIconButton, InfoChip } from '@/components/ui';
import AuthModal from '../../components/Auth/AuthModal';
import { AVAILABLE_CONNECTORS, CONNECTOR_CATEGORIES } from '@/constants/connectors';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { endSignedOutSession } from '@/lib/workspaceStore';
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
} from '@/components/icons';

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
        if (!data.authenticated || !data.user) {
          endSignedOutSession();
          return;
        }
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
    let cancelled = false;
    const loadInitialAccounts = async () => {
      try {
        const res = await fetch(`/api/connectors/accounts?userId=${encodeURIComponent(currentUserId)}`);
        const data = await res.json();
        if (cancelled) return;
        setIsConfigured(data.configured !== false);
        if (data.accounts) setConnectedAccounts(data.accounts);
      } catch (err) {
        if (!cancelled) console.error('Failed to load connected accounts:', err);
      } finally {
        if (!cancelled) setLoadingAccounts(false);
      }
    };
    loadInitialAccounts();
    return () => { cancelled = true; };
  }, [currentUserId]);

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
        body: JSON.stringify({ accountId, userId: currentUserId })
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
    <div className="min-h-screen bg-canvas text-ink-700 antialiased font-sans">

      <div className="lg:pl-[280px] h-dvh overflow-hidden flex flex-col">


        {/* Main Content Viewport */}
        <main style={{ height: 'calc(100dvh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
        <AtelierHeader
          title="Connectors"
          mobileOpen={mobileOpen} 
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
              setConnectedAccounts([]);
              setLoadingAccounts(true);
            }
          }}
        />
        <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
          {statusNotice && (
            <div className={`flex items-center justify-between gap-[8px] rounded-[5px] border-[0.5px] px-[12px] py-[8px] text-[11px] ${
              statusNotice.type === 'error'
                ? 'border-[#FFC2CA] bg-[#FFEDEF] text-[#FF4359]'
                : 'border-[#DCDCDC] bg-[#F8F8F9] text-[#333333]'
            }`}>
              <span>{statusNotice.text}</span>
              <button type="button" onClick={() => setStatusNotice(null)} aria-label="Dismiss" className="shrink-0 text-[#808080] hover:text-black">
                <X size={14} />
              </button>
            </div>
          )}

          <Toolbar
            left={CONNECTOR_CATEGORIES.map((cat) => (
              <PillTab key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)}>
                {cat}
              </PillTab>
            ))}
            right={
              <>
                <SearchPill value={search} onChange={setSearch} placeholder="Search connectors" />
                <RoundIconButton icon={RefreshCw} title="Refresh" onClick={fetchAccounts} disabled={loadingAccounts} iconClassName={loadingAccounts ? 'animate-spin' : ''} />
              </>
            }
          />

          <div className="flex items-center gap-[6px]">
            <InfoChip>Connected ({connectedAccounts.length}/{AVAILABLE_CONNECTORS.length})</InfoChip>
          </div>

          {/* On phones the number and status columns fold into the name column. */}
          <div>
            <div className="grid grid-cols-7 max-md:grid-cols-[minmax(0,1fr)_96px_52px] border-b-[0.5px] border-[#C4C4C466] text-[12px] font-medium">
              <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px] max-md:hidden">Sr. No.</div>
              <div className="col-span-3 max-md:col-span-1 flex items-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px]">Connector</div>
              <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px] max-md:hidden">Status</div>
              <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[12px]">Action</div>
              <div className="flex items-center justify-center px-[12px] py-[12px]">Remove</div>
            </div>

            {filteredConnectors.length === 0 && (
              <p className="mt-[15px] text-center text-[12px]">No results found. Please adjust your search or filter criteria.</p>
            )}

            {filteredConnectors.map((connector, index) => {
              const matchedAccount = getConnectedAccount(connector.toolkitSlug);
              const isConnected = Boolean(matchedAccount);
              const isConnecting = connectingSlug === connector.toolkitSlug;
              const isDisconnecting = disconnectingId === matchedAccount?.id;

              return (
                <div
                  key={connector.id}
                  className={`group grid grid-cols-7 max-md:grid-cols-[minmax(0,1fr)_96px_52px] hover:bg-[#F8F8F9] ${index === filteredConnectors.length - 1 ? '' : 'border-b-[0.5px] border-[#C4C4C466]'}`}
                >
                  <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px] text-[12px] max-md:hidden">{index + 1}</div>
                  <div className="col-span-3 max-md:col-span-1 flex min-w-0 items-center gap-[10px] border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px]" title={`${connector.description} ${connector.bioIntegration || ''}`.trim()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={connector.iconUrl}
                      alt=""
                      className="h-[25px] w-[25px] shrink-0 object-contain"
                      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px]">{connector.name}</span>
                      <span className="block truncate text-[10px] text-[#808080]">{connector.category}<span className="md:hidden">{isConnected ? ' · Active' : ''}</span></span>
                    </span>
                  </div>
                  <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px] text-[12px] max-md:hidden">
                    {isConnected ? 'Active' : <span className="text-[#808080]">Not connected</span>}
                  </div>
                  <div className="flex items-center justify-center border-r-[0.5px] border-[#C4C4C466] px-[12px] py-[8px]">
                    {isConnected ? (
                      <button type="button" onClick={() => openOperationsModal(connector, matchedAccount)} className="text-[12px] text-[#16A34A] hover:underline">
                        Operations
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleConnect(connector)} disabled={isConnecting} className="text-[12px] text-[#16A34A] hover:underline disabled:opacity-50">
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-center px-[12px] py-[8px]">
                    {isConnected && (
                      <RoundIconButton
                        icon={Trash2}
                        tone="danger"
                        title="Disconnect"
                        onClick={() => handleDisconnect(matchedAccount.id, connector.name)}
                        disabled={isDisconnecting}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </main>
      </div>

      {/* Operations & Action Runner Console Modal */}
      {activeOpsConnector && (
        <div className="fixed inset-0 z-50 bg-[#00000A73] backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-line shadow-modal max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 bg-surface-1/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-line p-1.5 flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeOpsConnector.iconUrl} alt={activeOpsConnector.name} className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-sans font-semibold text-ink-700">
                      {activeOpsConnector.name} Operations Console
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-800">
                      LIVE OAUTH ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-ink-500">
                    Execute real authorized platform actions on your account via Composio.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveOpsConnector(null)}
                className="w-8 h-8 rounded-lg hover:bg-line flex items-center justify-center text-ink-400 hover:text-ink-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
              {/* Account details badge strip */}
              <div className="bg-surface-1 border border-line rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-ink-400">Account ID: </span>
                  <code className="font-mono text-ink-700 font-semibold">{activeOpsConnector.matchedAccount?.id}</code>
                </div>
                <div>
                  <span className="text-ink-400">Toolkit: </span>
                  <span className="font-medium text-ink-700">{activeOpsConnector.toolkitSlug}</span>
                </div>
                <div>
                  <span className="text-ink-400">Status: </span>
                  <span className="font-semibold text-brand-600">{activeOpsConnector.matchedAccount?.status || 'ACTIVE'}</span>
                </div>
              </div>

              {/* Mode Tabs: Curated Quick Actions vs All Platform Tools */}
              <div className="flex items-center justify-between border-b border-line pb-2">
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
                        ? 'bg-brand-700 text-white ' 
                        : 'bg-surface-2 hover:bg-line text-ink-600'
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
                        ? 'bg-brand-700 text-white ' 
                        : 'bg-surface-2 hover:bg-line text-ink-600'
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
                          ? 'border-brand-700 bg-brand-700/5 text-ink-900 ring-1 ring-brand-700'
                          : 'border-line hover:border-ink-300 bg-white text-ink-600'
                      }`}
                    >
                      <div className="font-semibold text-ink-700 flex items-center justify-between">
                        <span>{action.name}</span>
                        {selectedTool?.slug === action.slug && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-700" />
                        )}
                      </div>
                      <p className="text-[11px] text-ink-500 mt-1 line-clamp-2">
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
                    <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${allTools.length} tools for ${activeOpsConnector.name}...`}
                      value={toolsSearch}
                      onChange={(e) => setToolsSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-1 border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-line rounded-lg divide-y divide-line">
                    {loadingTools ? (
                      <div className="p-4 text-center text-xs text-ink-400 flex items-center justify-center gap-2">
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
                          selectedTool?.slug === tool.slug ? 'bg-brand-50 text-brand-900 font-semibold' : 'hover:bg-surface-1 text-ink-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{tool.name}</div>
                          <code className="text-[10px] text-ink-400 font-mono">{tool.slug}</code>
                        </div>
                        {selectedTool?.slug === tool.slug && (
                          <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Form & Parameter Inputs */}
              {selectedTool && (
                <form onSubmit={handleExecuteAction} className="bg-surface-1/80 border border-line rounded-lg p-3.5 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-ink-700">{selectedTool.name}</span>
                      <code className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-line text-ink-500">
                        {selectedTool.slug}
                      </code>
                    </div>
                    <p className="text-[11px] text-ink-600 mt-1">
                      {selectedTool.description}
                    </p>
                  </div>

                  {/* Render parameters if defined */}
                  {selectedTool.params && selectedTool.params.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-line">
                      <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Operation Parameters</span>
                      {selectedTool.params.map(param => (
                        <div key={param.key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-ink-700 flex items-center gap-1">
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
                              className="w-full p-2 text-xs bg-white border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700"
                            />
                          ) : (
                            <input
                              type={param.type || 'text'}
                              placeholder={param.placeholder}
                              defaultValue={param.defaultValue || ''}
                              value={toolParams[param.key] || ''}
                              onChange={(e) => setToolParams({ ...toolParams, [param.key]: e.target.value })}
                              required={param.required}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic raw parameters helper if using custom tool */}
                  {(!selectedTool.params || selectedTool.params.length === 0) && selectedTool.inputParameters?.properties && Object.keys(selectedTool.inputParameters.properties).length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-line">
                      <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Schema Parameters</span>
                      {Object.entries(selectedTool.inputParameters.properties).slice(0, 4).map(([key, prop]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-ink-700">
                            {prop.title || key} {selectedTool.inputParameters.required?.includes(key) && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={prop.description?.slice(0, 80) || key}
                            value={toolParams[key] || ''}
                            onChange={(e) => setToolParams({ ...toolParams, [key]: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={executingAction}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${executingAction ? 'animate-spin' : ''}`} />
                      <span>{executingAction ? 'Executing Operation...' : 'Execute Live Action'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Execution Result Console */}
              {executionResult && (
                <div className="bg-ink-900 text-ink-500 rounded-lg p-3.5 text-xs font-mono flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between pb-2 border-b border-ink-700 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-ink-300">Live Operation Output</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {executionResult.durationMs && (
                        <span className="text-ink-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {executionResult.durationMs}ms
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        executionResult.success ? 'bg-emerald-950 text-brand-400 border border-brand-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {executionResult.success ? '200 OK' : 'ERROR'}
                      </span>
                    </div>
                  </div>

                  <pre className="max-h-56 overflow-auto text-[11px] text-ink-300 scrollbar-thin">
                    {JSON.stringify(executionResult.result || executionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-line bg-surface-1 flex items-center justify-between">
              <span className="text-[11px] text-ink-500">
                Operations execute with user permissions granted via Composio.
              </span>
              <button
                type="button"
                onClick={() => setActiveOpsConnector(null)}
                className="px-3 py-1.5 rounded-lg border border-line bg-white hover:bg-surface-2 text-xs font-medium text-ink-700 transition"
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
