'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AtelierSidebar from '../../components/Atelier/AtelierSidebar';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { 
  BarChart3, 
  TrendingUp, 
  MousePointer, 
  Eye, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Sparkles, 
  ArrowUpRight, 
  RefreshCw, 
  ExternalLink, 
  Users,
  CheckCircle2,
  ShieldCheck,
  Download,
  Clock,
  Globe,
  Radio,
  Zap,
  Layers,
  ArrowRight,
  Filter,
  Check,
  Search,
  Activity,
  Calendar,
  Lock,
  Copy,
  Info
} from 'lucide-react';

export default function AnalyticsPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('30d'); // '24h' | '7d' | '30d' | 'all'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [hoveredTimelinePoint, setHoveredTimelinePoint] = useState(null);
  const [streamFilter, setStreamFilter] = useState('');
  const [mediaKitBusy, setMediaKitBusy] = useState(false);
  const [mediaKitMessage, setMediaKitMessage] = useState('');

  const username = currentProfile?.username || authUser?.username || 'omm';

  // Fetch live telemetry analytics from /api/v1/analytics
  const fetchAnalytics = useCallback(async (targetUsername, range) => {
    if (!targetUsername) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/analytics?target_id=${encodeURIComponent(targetUsername)}&range=${range}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error('Failed to load telemetry analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth and initial load
  useEffect(() => {
    async function loadSession() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        let target = '';

        if (meData.authenticated && meData.user) {
          setAuthUser(meData.user);
          target = meData.profile?.username || meData.user.username;
          if (meData.profile) {
            setCurrentProfile(meData.profile);
          }
        } else {
          const profileRes = await fetch('/api/profile');
          const profileData = await profileRes.json();
          if (profileData.success && profileData.profile) {
            setCurrentProfile(profileData.profile);
            target = profileData.profile.username;
          }
        }

        if (target) {
          fetchAnalytics(target, timeRange);
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      }
    }
    loadSession();
  }, [fetchAnalytics, timeRange]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setCurrentProfile(DEFAULT_EMPTY_PROFILE);
      setAnalyticsData(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleRangeChange = (newRange) => {
    setTimeRange(newRange);
    if (username) {
      fetchAnalytics(username, newRange);
    }
  };

  const handleMediaKitAction = async () => {
    setMediaKitBusy(true);
    setMediaKitMessage('');
    try {
      const enabled = Boolean(currentProfile?.performanceMediaKitEnabled);
      if (!enabled) {
        const response = await fetch(`/api/media-kit/${encodeURIComponent(username)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not enable the media kit.');
        setCurrentProfile((profile) => ({ ...profile, performanceMediaKitEnabled: true }));
      }
      const url = `${window.location.origin}/media-kit/${encodeURIComponent(username)}`;
      try {
        await navigator.clipboard.writeText(url);
        setMediaKitMessage(enabled ? 'Media kit link copied.' : 'Media kit enabled and link copied.');
      } catch {
        setMediaKitMessage('Media kit is ready. Use the link below to share it.');
      }
    } catch (error) {
      setMediaKitMessage(error.message || 'Could not update the media kit.');
    } finally {
      setMediaKitBusy(false);
    }
  };

  const handleDisableMediaKit = async () => {
    setMediaKitBusy(true);
    setMediaKitMessage('');
    try {
      const response = await fetch(`/api/media-kit/${encodeURIComponent(username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not disable the media kit.');
      setCurrentProfile((profile) => ({ ...profile, performanceMediaKitEnabled: false }));
      setMediaKitMessage('Public media kit disabled.');
    } catch (error) {
      setMediaKitMessage(error.message || 'Could not update the media kit.');
    } finally {
      setMediaKitBusy(false);
    }
  };

  // Metrics extraction
  const metrics = analyticsData?.metrics || {
    total_events: 0,
    profile_views: 0,
    link_clicks: 0,
    unique_visitors: 0,
    repeat_rate_pct: 0,
    conversion_rate_pct: 0,
    bot_events_filtered: 0,
    avg_latency_ms: 0,
  };

  const funnel = analyticsData?.conversion_funnel || {
    page_views: metrics.profile_views || 0,
    link_clicks: metrics.link_clicks || 0,
    leads: 0,
    bookings: 0,
    view_to_click_pct: metrics.conversion_rate_pct || 0,
    click_to_lead_pct: 0,
    view_to_booking_pct: 0,
    overall_conversion_pct: metrics.conversion_rate_pct || 0,
  };

  const timeline = analyticsData?.timeline || [];
  const hourlyPeak = analyticsData?.hourly_peak;
  const devices = analyticsData?.devices || { mobile: { count: 0, percentage: 0 }, desktop: { count: 0, percentage: 0 }, tablet: { count: 0, percentage: 0 } };
  const topCountries = analyticsData?.top_countries || [];
  const topCities = analyticsData?.top_cities || [];
  const operatingSystems = analyticsData?.operating_systems || [];
  const browsers = analyticsData?.browsers || [];
  const sources = analyticsData?.sources || [];
  const linkPerformance = analyticsData?.link_performance || [];
  const recentStream = analyticsData?.recent_stream || [];

  // Filtered live stream
  const filteredStream = useMemo(() => {
    if (!streamFilter.trim()) return recentStream;
    const q = streamFilter.toLowerCase().trim();
    return recentStream.filter(e => 
      e.country?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.device?.toLowerCase().includes(q) ||
      e.browser?.toLowerCase().includes(q) ||
      e.source?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q)
    );
  }, [recentStream, streamFilter]);

  // Timeline SVG calculations
  const maxTimelineVal = useMemo(() => {
    if (!timeline.length) return 10;
    return Math.max(...timeline.map(t => Math.max(t.views, t.clicks)), 5);
  }, [timeline]);

  return (
    <div className="min-h-screen bg-canvas text-ink-700 antialiased font-sans">
      {/* Atelier Sidebar */}
      <AtelierSidebar 
        mobileOpen={mobileOpen} 
        onToggleMobile={() => setMobileOpen(!mobileOpen)} 
      />

      <div className="lg:pl-[280px] flex flex-col min-h-screen">
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
              fetchAnalytics(newProfile.username, timeRange);
            }
          }}
        />

        {/* Main Analytics Content */}
        <main className="flex-1 mt-[74px] mx-[10px] mb-[10px] lg:ml-0 min-w-0 rounded-lg bg-white p-[15px] flex flex-col gap-[15px]">
          {/* Top Banner */}
          <div className="bg-surface-2 border-[0.5px] border-line/80 rounded-xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative overflow-visible">
            <div className="flex items-center gap-3.5 relative z-10 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white border-[0.5px] border-line flex items-center justify-center text-brand-700 shrink-0">
                <BarChart3 className="w-5 h-5 text-brand-700" />
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-[16px] font-sans font-semibold text-ink-900 whitespace-normal sm:whitespace-nowrap">
                  Real-time Telemetry &amp; Audience Intelligence
                </h1>
                {/* Information Tooltip */}
                <div className="relative group/tooltip inline-flex items-center">
                  <button
                    type="button"
                    className="text-[#406856]/70 hover:text-brand-700 transition-colors p-1 rounded-full cursor-pointer focus:outline-hidden"
                    aria-label="Telemetry and compliance details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <div className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 hidden group-hover/tooltip:flex group-focus-within/tooltip:flex flex-col w-72 p-3 bg-brand-800 text-white text-xs rounded-xl shadow-modal border border-brand-700/40 z-50 pointer-events-none">
                    <div className="flex items-center gap-1.5 font-semibold text-brand-300 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Edge Verified &amp; GDPR Compliant
                    </div>
                    <p className="text-ink-500 text-xs leading-relaxed font-normal">
                      Sub-millisecond edge metrics, deterministic privacy hashes, zero-latency geo-routing, and live visitor streams.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Controls: Range Selector & Actions */}
            <div className="flex items-center gap-2 flex-wrap relative z-10 shrink-0">
              {/* Time Range Pills */}
              <div className="bg-white border-[0.5px] border-line rounded-lg p-1 flex items-center ">
                {[
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'all', label: 'All Time' },
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleRangeChange(r.id)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md min-h-[34px] transition cursor-pointer ${
                      timeRange === r.id
                        ? 'bg-brand-700 text-white '
                        : 'text-ink-600 hover:text-ink-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAnalytics(username, timeRange)}
                disabled={loading}
                className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border-[0.5px] border-line bg-white hover:bg-surface-1 text-ink-700 transition cursor-pointer"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Export CSV Button */}
              <a
                href={`/api/v1/analytics/export?target_id=${encodeURIComponent(username)}&range=${timeRange}`}
                download
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] bg-white hover:bg-surface-1 text-ink-700 border-[0.5px] border-line text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-ink-500" />
                <span>Export CSV</span>
              </a>

              <button
                onClick={handleMediaKitAction}
                disabled={mediaKitBusy || !authUser}
                title={!authUser ? 'Sign in to publish a media kit' : 'Copy shareable performance media kit link'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] bg-white hover:bg-surface-1 text-ink-700 border-[0.5px] border-line text-xs sm:text-sm font-semibold rounded-lg transition disabled:opacity-50"
              >
                <Copy className="w-4 h-4 text-ink-500" />
                <span>{mediaKitBusy ? 'Saving…' : currentProfile?.performanceMediaKitEnabled ? 'Copy Media Kit' : 'Publish Media Kit'}</span>
              </button>

              {/* View Live Bio */}
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] bg-brand-700 hover:bg-brand-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer"
              >
                <span>Live Bio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {mediaKitMessage && <div className="-mt-2 rounded-lg border-[0.5px] border-line bg-white px-4 py-2 text-sm text-ink-600">
            {mediaKitMessage}
            {currentProfile?.performanceMediaKitEnabled && <a className="ml-2 font-semibold text-brand-700 underline" href={`/media-kit/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer">Open report</a>}
            {currentProfile?.performanceMediaKitEnabled && <button onClick={handleDisableMediaKit} disabled={mediaKitBusy} className="ml-3 font-semibold text-rose-700 underline disabled:opacity-50">Disable sharing</button>}
          </div>}

          {/* Primary KPI Summary Cards Strip (4 columns) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Profile Views */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
                  <span>Total Profile Views</span>
                  <Eye className="w-4 h-4 text-ink-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-semibold font-sans text-ink-900 mt-1">
                  {metrics.profile_views.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-line flex items-center justify-between text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-brand-700" /> {metrics.unique_visitors} unique
                </span>
                <span className="text-[11px] font-medium bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">
                  {metrics.repeat_rate_pct}% repeat
                </span>
              </div>
            </div>

            {/* 2. Total Outbound Link Clicks */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
                  <span>Outbound Link Clicks</span>
                  <MousePointer className="w-4 h-4 text-ink-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-semibold font-sans text-ink-900 mt-1">
                  {metrics.link_clicks.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-line flex items-center justify-between text-xs text-ink-500">
                <span>Total button clicks</span>
                <span className="text-[11px] font-medium bg-surface-2 text-ink-700 px-1.5 py-0.5 rounded">
                  {linkPerformance.length} active links
                </span>
              </div>
            </div>

            {/* 3. Funnel Conversion Rate (CTR) */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
                  <span>Funnel Conversion Rate</span>
                  <TrendingUp className="w-4 h-4 text-brand-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-semibold font-sans text-brand-700 mt-1">
                  {metrics.conversion_rate_pct}%
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-line flex items-center justify-between text-xs text-ink-500">
                <span>Clicks ÷ Views Funnel</span>
                <span className="text-[11px] text-ink-400 font-mono">
                  ({metrics.link_clicks}/{metrics.profile_views})
                </span>
              </div>
            </div>

            {/* 4. Security & Bot Defense */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
                  <span>Bot Traffic Shield</span>
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-semibold font-sans text-ink-900 mt-1 flex items-center gap-1.5">
                  <span>{metrics.bot_events_filtered}</span>
                  <span className="text-xs font-normal text-ink-400">crawlers isolated</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-line flex items-center justify-between text-xs text-ink-500">
                <span className="flex items-center gap-1 text-brand-600 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Human Verified
                </span>
                <span className="text-[11px] text-ink-400 font-mono">
                  ~{metrics.avg_latency_ms}ms edge
                </span>
              </div>
            </div>
          </div>

          {/* Creator Conversion Funnel Analytics Card */}
          <div className="bg-white border-[0.5px] border-line/70 rounded-xl p-4 sm:p-5 ">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                    Creator Conversion Funnel Analytics
                  </h2>
                  <p className="text-[11px] text-ink-500">
                    Audience journey: Page Views ⟶ Link Clicks ⟶ Leads Captured ⟶ 1:1 Bookings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-medium text-ink-500">End-to-End Conversion:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-700 text-white ">
                  {funnel.overall_conversion_pct}%
                </span>
              </div>
            </div>

            {/* 4-Stage Funnel Pipeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
              {/* Stage 1: Page Views */}
              <div className="relative p-3.5 rounded-xl bg-surface-1 border border-line/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-1">
                    <span>1. Page Views</span>
                    <Eye className="w-3.5 h-3.5 text-ink-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold font-sans text-ink-900">
                    {funnel.page_views.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-ink-500 mt-0.5">Top of Funnel (Bio Impressions)</p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                    <div className="bg-ink-700 h-1.5 rounded-full w-full" />
                  </div>
                  <div className="text-[10px] text-ink-400 text-right mt-1 font-mono">100% baseline</div>
                </div>
              </div>

              {/* Stage 2: Link Clicks */}
              <div className="relative p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
                    <span>2. Outbound Clicks</span>
                    <MousePointer className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold font-sans text-blue-900">
                    {funnel.link_clicks.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-blue-600 mt-0.5">Middle Funnel (Click-Through)</p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, funnel.view_to_click_pct))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold text-right mt-1">
                    {funnel.view_to_click_pct}% CTR from views
                  </div>
                </div>
              </div>

              {/* Stage 3: Leads & Magnets */}
              <div className="relative p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
                    <span>3. Leads &amp; Magnets</span>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold font-sans text-amber-950">
                    {funnel.leads.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-amber-700 mt-0.5">Email &amp; WhatsApp List Builder</p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, funnel.click_to_lead_pct || (funnel.leads > 0 ? 30 : 0)))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold text-right mt-1">
                    {funnel.click_to_lead_pct}% opt-in rate
                  </div>
                </div>
              </div>

              {/* Stage 4: Bookings & Consultations */}
              <div className="relative p-3.5 rounded-xl bg-brand-50/60 border border-brand-200/90 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-brand-800 uppercase tracking-wider mb-1">
                    <span>4. Bookings &amp; Sales</span>
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold font-sans text-emerald-950">
                    {funnel.bookings.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-brand-700 mt-0.5">High Intent 1:1 Consultations</p>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-brand-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-brand-700 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, funnel.view_to_booking_pct || (funnel.bookings > 0 ? 25 : 0)))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-brand-700 font-semibold text-right mt-1">
                    {funnel.view_to_booking_pct}% booking rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Timeline Chart & Hourly Heatmap (2 columns on large) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Interactive Timeline Chart (2 cols) */}
            <div className="lg:col-span-2 bg-white border-[0.5px] border-line/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                    Audience Engagement Timeline
                  </h2>
                  <p className="text-[11px] text-ink-500">
                    Profile views vs outbound link clicks across selected window.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-700"></span>
                    <span className="text-ink-600 font-medium">Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]"></span>
                    <span className="text-ink-600 font-medium">Clicks</span>
                  </div>
                </div>
              </div>

              {/* Timeline Chart Container */}
              <div className="relative h-48 w-full mt-2">
                {timeline.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-ink-400">
                    No activity recorded in this time range.
                  </div>
                ) : (
                  <div className="h-full flex items-end gap-1 sm:gap-2 pt-4 pb-6 px-1 relative">
                    {/* SVG Line representation */}
                    <svg className="absolute inset-0 h-[calc(100%-24px)] w-full overflow-visible pointer-events-none" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#166534" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#166534" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Column Bars */}
                    {timeline.map((point, idx) => {
                      const viewHeight = (point.views / maxTimelineVal) * 100;
                      const clickHeight = (point.clicks / maxTimelineVal) * 100;
                      const isHovered = hoveredTimelinePoint?.date === point.date;

                      return (
                        <div
                          key={point.date || idx}
                          onMouseEnter={() => setHoveredTimelinePoint(point)}
                          onMouseLeave={() => setHoveredTimelinePoint(null)}
                          className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                        >
                          {/* Tooltip */}
                          {isHovered && (
                            <div className="absolute -top-12 z-30 bg-ink-900 text-white text-[10px] rounded-lg py-1 px-2 shadow-pop whitespace-nowrap flex flex-col items-center">
                              <span className="font-semibold">{point.label}</span>
                              <span className="text-brand-300 font-medium">{point.views} views • {point.clicks} clicks</span>
                              <div className="w-2 h-2 bg-ink-900 rotate-45 -mb-1 mt-0.5"></div>
                            </div>
                          )}

                          {/* Bars container */}
                          <div className="w-full max-w-[18px] flex items-end justify-center gap-0.5 h-[calc(100%-20px)]">
                            {/* View bar */}
                            <div 
                              style={{ height: `${Math.max(viewHeight, 4)}%` }}
                              className={`w-1/2 rounded-t transition-all ${
                                isHovered ? 'bg-brand-800' : 'bg-brand-700'
                              }`}
                            />
                            {/* Click bar */}
                            <div 
                              style={{ height: `${Math.max(clickHeight, point.clicks > 0 ? 4 : 0)}%` }}
                              className={`w-1/2 rounded-t transition-all ${
                                isHovered ? 'bg-sky-500' : 'bg-sky-400'
                              }`}
                            />
                          </div>

                          {/* X-axis Label (spaced) */}
                          <span className="absolute bottom-0 text-[9px] text-ink-400 truncate max-w-full">
                            {idx % Math.ceil(timeline.length / 7) === 0 ? point.label : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 24-Hour Peak Engagement Matrix */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                    24-Hour Peak Activity Matrix
                  </h2>
                  <Clock className="w-4 h-4 text-brand-700" />
                </div>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  Audience traffic distribution across each hour of the day.
                </p>

                {/* Optimal Post Time Recommendation */}
                <div className="mt-3 bg-surface-2 border-[0.5px] border-line/70 rounded-lg p-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-700 shrink-0" />
                  <div className="text-xs">
                    <span className="text-ink-500">Optimal Time to Post: </span>
                    <span className="font-semibold text-brand-800">{hourlyPeak?.optimal_label || '2:00 PM'}</span>
                  </div>
                </div>

                {/* 24-Hour Bar Matrix */}
                <div className="grid grid-cols-12 gap-1 mt-4">
                  {hourlyPeak?.matrix?.map((item) => {
                    const isPeak = item.hour === hourlyPeak.optimal_hour && item.events > 0;
                    const intensity = item.events > 0 ? Math.min(100, Math.max(20, item.events * 25)) : 5;

                    return (
                      <div 
                        key={item.hour} 
                        className="flex flex-col items-center gap-1 group relative cursor-pointer"
                        title={`${item.label}: ${item.events} events`}
                      >
                        <div 
                          style={{ height: '56px' }} 
                          className="w-full rounded bg-surface-2 flex items-end p-0.5 overflow-hidden"
                        >
                          <div 
                            style={{ height: `${intensity}%` }} 
                            className={`w-full rounded-sm transition-all ${
                              isPeak ? 'bg-brand-700' : item.events > 0 ? 'bg-brand-500' : 'bg-transparent'
                            }`}
                          />
                        </div>
                        <span className="text-[8px] text-ink-400 font-mono truncate">
                          {item.hour % 3 === 0 ? item.hour : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-line text-[10px] text-ink-400 flex items-center justify-between">
                <span>12 AM (Midnight)</span>
                <span>12 PM (Noon)</span>
                <span>11 PM</span>
              </div>
            </div>
          </div>

          {/* Geographic Intelligence & Traffic Sources (2 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Countries Table */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 sm:p-5 ">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-700" />
                  <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                    Top Visitor Countries
                  </h2>
                </div>
                <span className="text-[11px] text-ink-400">{topCountries.length} countries recorded</span>
              </div>

              {topCountries.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-400">
                  No geographic telemetry captured yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {topCountries.map((c) => (
                    <div key={c.country_code} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <span className="font-medium text-ink-700">{c.country}</span>
                          <span className="font-mono text-[10px] text-ink-400">{c.country_code}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-semibold text-ink-700">{c.count}</span>
                          <span className="text-ink-400 text-[11px]">({c.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.max(c.percentage, 4)}%` }} 
                          className="h-full bg-brand-700 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Traffic Sources Breakdown */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 sm:p-5 ">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-brand-700" />
                  <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                    Traffic Sources &amp; Attribution
                  </h2>
                </div>
                <span className="text-[11px] text-ink-400">Normalized referrers</span>
              </div>

              {sources.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-400">
                  No traffic sources recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {sources.map((s) => (
                    <div key={s.source} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-700">{s.source}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-semibold text-ink-700">{s.count}</span>
                          <span className="text-ink-400 text-[11px]">({s.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.max(s.percentage, 4)}%` }} 
                          className="h-full bg-sky-500 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Device & Platform Breakdown (3 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Device Category */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 ">
              <h3 className="text-[14px] font-sans font-semibold text-ink-700 mb-3 uppercase tracking-wider text-ink-400">
                Device Categories
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-1 border border-line rounded-lg p-2.5 text-center">
                  <Smartphone className="w-4 h-4 mx-auto text-brand-700 mb-1" />
                  <div className="text-xs text-ink-500">Mobile</div>
                  <div className="text-sm font-semibold font-sans text-ink-700 mt-0.5">{devices.mobile?.percentage || 0}%</div>
                </div>

                <div className="bg-surface-1 border border-line rounded-lg p-2.5 text-center">
                  <Laptop className="w-4 h-4 mx-auto text-brand-700 mb-1" />
                  <div className="text-xs text-ink-500">Desktop</div>
                  <div className="text-sm font-semibold font-sans text-ink-700 mt-0.5">{devices.desktop?.percentage || 0}%</div>
                </div>

                <div className="bg-surface-1 border border-line rounded-lg p-2.5 text-center">
                  <Tablet className="w-4 h-4 mx-auto text-brand-700 mb-1" />
                  <div className="text-xs text-ink-500">Tablet</div>
                  <div className="text-sm font-semibold font-sans text-ink-700 mt-0.5">{devices.tablet?.percentage || 0}%</div>
                </div>
              </div>
            </div>

            {/* 2. Top Operating Systems */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 ">
              <h3 className="text-[14px] font-sans font-semibold text-ink-700 mb-3 uppercase tracking-wider text-ink-400">
                Operating Systems
              </h3>
              <div className="flex flex-col gap-2">
                {operatingSystems.slice(0, 4).map(o => (
                  <div key={o.os} className="flex items-center justify-between text-xs">
                    <span className="text-ink-700 font-medium">{o.os}</span>
                    <span className="font-mono text-ink-500">{o.count} ({o.percentage}%)</span>
                  </div>
                ))}
                {operatingSystems.length === 0 && (
                  <div className="text-xs text-ink-400 py-3 text-center">No OS telemetry yet</div>
                )}
              </div>
            </div>

            {/* 3. Browsers & In-App WebViews */}
            <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 ">
              <h3 className="text-[14px] font-sans font-semibold text-ink-700 mb-3 uppercase tracking-wider text-ink-400">
                Browsers &amp; In-App WebViews
              </h3>
              <div className="flex flex-col gap-2">
                {browsers.slice(0, 4).map(b => (
                  <div key={b.browser} className="flex items-center justify-between text-xs">
                    <span className="text-ink-700 font-medium truncate max-w-[150px]">{b.browser}</span>
                    <span className="font-mono text-ink-500">{b.count} ({b.percentage}%)</span>
                  </div>
                ))}
                {browsers.length === 0 && (
                  <div className="text-xs text-ink-400 py-3 text-center">No browser telemetry yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Individual Link Performance Table */}
          <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 sm:p-5 ">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                  Individual Link Performance
                </h2>
                <p className="text-[11px] text-ink-500">
                  Click through rate (CTR) conversion on each bio link button.
                </p>
              </div>
              <span className="text-xs text-ink-400 font-mono">
                {linkPerformance.length} links tracked
              </span>
            </div>

            {linkPerformance.length === 0 ? (
              <div className="py-6 text-center text-xs text-ink-400">
                No active links on this bio profile yet. Add links in the Studio to track clicks.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-400 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="pb-2">Button Title</th>
                      <th className="pb-2">Destination URL</th>
                      <th className="pb-2 text-right">Clicks</th>
                      <th className="pb-2 text-right">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {linkPerformance.map((l) => (
                      <tr key={l.id} className="hover:bg-surface-1/50 transition">
                        <td className="py-2.5 font-medium text-ink-700 flex items-center gap-1.5">
                          <span>{l.title}</span>
                          {l.badge && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-surface-2 text-ink-600 font-semibold">
                              {l.badge}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-ink-400 truncate max-w-[240px]">
                          {l.url}
                        </td>
                        <td className="py-2.5 font-mono font-semibold text-ink-700 text-right">
                          {l.clicks.toLocaleString()}
                        </td>
                        <td className="py-2.5 font-mono text-brand-600 font-semibold text-right">
                          {l.ctr}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Live Real-Time Telemetry Event Stream */}
          <div className="bg-white border-[0.5px] border-line/60 rounded-xl p-4 sm:p-5 ">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-600 animate-pulse" />
                  <h2 className="text-[16px] font-sans font-semibold text-ink-700">
                    Live Telemetry Event Stream
                  </h2>
                </div>
                <p className="text-[11px] text-ink-500">
                  Inspecting the 50 most recent raw telemetry beacons ingested at the edge.
                </p>
              </div>

              {/* Stream Search Input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter stream by country, device, source..."
                  value={streamFilter}
                  onChange={(e) => setStreamFilter(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 text-xs bg-surface-1 border border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            {filteredStream.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-400">
                No telemetry events match your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-72 overflow-y-auto divide-y divide-line border border-line rounded-lg">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-surface-1 z-10 text-ink-400 uppercase text-[9px] tracking-wider font-semibold border-b border-line">
                    <tr>
                      <th className="py-2 px-3">Event Type</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3">Device &amp; OS</th>
                      <th className="py-2 px-3">Browser</th>
                      <th className="py-2 px-3">Traffic Source</th>
                      <th className="py-2 px-3 text-center">Uniqueness</th>
                      <th className="py-2 px-3 text-right">Edge Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line font-sans text-xs">
                    {filteredStream.map(e => (
                      <tr key={e.id} className="hover:bg-surface-1/80 transition">
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            e.event_type === 'link_click' || e.event_type === 'click'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-brand-50 text-brand-700 border border-brand-200'
                          }`}>
                            {e.event_type === 'link_click' || e.event_type === 'click' ? 'CLICK' : 'VIEW'}
                          </span>
                        </td>
                        <td className="py-2 px-3 flex items-center gap-1.5 font-medium text-ink-700">
                          <span>{e.flag}</span>
                          <span>{e.city || e.country}</span>
                        </td>
                        <td className="py-2 px-3 text-ink-600">
                          {e.device} • {e.os}
                        </td>
                        <td className="py-2 px-3 text-ink-600 truncate max-w-[120px]">
                          {e.browser}
                        </td>
                        <td className="py-2 px-3 text-ink-600 font-medium">
                          {e.source || 'Direct'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {e.is_unique ? (
                            <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1 py-0.2 rounded">NEW</span>
                          ) : (
                            <span className="text-[10px] text-ink-400">REPEAT</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px] text-ink-400">
                          {e.latency_ms || 12}ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          mode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user) => {
            setAuthUser(user);
            setShowAuthModal(false);
            if (user?.username) {
              fetchAnalytics(user.username, timeRange);
            }
          }}
        />
      )}
    </div>
  );
}
