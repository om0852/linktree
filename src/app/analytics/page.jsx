'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import AuthModal from '../../components/Auth/AuthModal';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { Toolbar, PillTab, ToolbarPill, SearchPill, RoundIconButton, KpiCard, KpiGrid, ChartCard, BreakdownRows, SERIES_COLORS, table } from '@/components/ui';
import { Eye, MousePointer, Users, TrendingUp, RefreshCw } from '@/components/icons';
import { endSignedOutSession } from '@/lib/workspaceStore';

const RANGES = [
  { id: '24h', label: '24 Hours' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

/** 12.4K style: one decimal, trailing .0 dropped (Creatosaurus numberFormater). */
function formatNumber(value) {
  const n = Number(value) || 0;
  const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [size, suffix] of units) {
    if (Math.abs(n) >= size) return `${(n / size).toFixed(1).replace(/\.0$/, '')}${suffix}`;
  }
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Blurred "Not enough data" overlay used on empty charts. */
function NotEnoughData() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-b-[10px] bg-white/75 backdrop-blur-[4px]">
      <div className="mb-[10px] flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#E8E8E8] bg-[#F5F5F5]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="2" strokeLinecap="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      </div>
      <p className="text-[13px] font-semibold text-[#333]">Not enough data</p>
      <p className="mt-[5px] max-w-[300px] text-center text-[11px] leading-[16px] text-[#999]">Share your bio link to start collecting activity.</p>
    </div>
  );
}

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

  const username = currentProfile?.username || authUser?.username || '';

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

        if (!meData.authenticated || !meData.user) {
          endSignedOutSession();
          return;
        }
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

      <div className="lg:pl-[280px] h-screen overflow-hidden flex flex-col">

        {/* Main Analytics Content */}
        <main style={{ height: 'calc(100vh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
        <AtelierHeader
          title="Analytics"
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
              fetchAnalytics(newProfile.username, timeRange);
            }
          }}
        />
        <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
          <Toolbar
            left={RANGES.map((r) => (
              <PillTab key={r.id} active={timeRange === r.id} onClick={() => handleRangeChange(r.id)}>{r.label}</PillTab>
            ))}
            right={
              <>
                <RoundIconButton icon={RefreshCw} title="Refresh" onClick={() => fetchAnalytics(username, timeRange)} disabled={loading || !username} iconClassName={loading ? 'animate-spin' : ''} />
                <ToolbarPill
                  onClick={handleMediaKitAction}
                  disabled={mediaKitBusy || !authUser || !username}
                  title={!authUser ? 'Sign in to publish a media kit' : 'Copy the link to your public media kit'}
                >
                  {mediaKitBusy ? 'Saving...' : currentProfile?.performanceMediaKitEnabled ? 'Copy Media Kit' : 'Publish Media Kit'}
                </ToolbarPill>
                <ToolbarPill as="a" href={`/api/v1/analytics/export?target_id=${encodeURIComponent(username)}&range=${timeRange}`} download className="w-[55px]">
                  Export
                </ToolbarPill>
              </>
            }
          />

          {mediaKitMessage && (
            <div className="flex items-center gap-[10px] rounded-[5px] border-[0.5px] border-[#DCDCDC] bg-[#F8F8F9] px-[12px] py-[8px] text-[11px] text-[#333333]">
              <span>{mediaKitMessage}</span>
              {currentProfile?.performanceMediaKitEnabled && (
                <>
                  <a className="text-[#16A34A] hover:underline" href={`/media-kit/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer">Open</a>
                  <button type="button" onClick={handleDisableMediaKit} disabled={mediaKitBusy} className="text-[#FF4359] hover:underline disabled:opacity-50">Disable</button>
                </>
              )}
            </div>
          )}

          <KpiGrid>
            <KpiCard icon={Eye} value={formatNumber(metrics.profile_views)} label="Views" tooltip="Times your bio page was opened in this period." />
            <KpiCard icon={MousePointer} value={formatNumber(metrics.link_clicks)} label="Clicks" tooltip="Clicks on links in your bio." />
            <KpiCard icon={Users} value={formatNumber(metrics.unique_visitors)} label="Visitors" tooltip={`Unique visitors. ${metrics.repeat_rate_pct || 0}% came back more than once.`} />
            <KpiCard icon={TrendingUp} value={`${metrics.conversion_rate_pct || 0}%`} label="Click Rate" tooltip={`Clicks divided by views. ${formatNumber(metrics.bot_events_filtered)} bot events were excluded.`} />
          </KpiGrid>

          <ChartCard title="Conversion Funnel" info="How visitors move from viewing your bio to clicking, leaving their details and booking a meeting.">
            <div className="mt-[10px] grid grid-cols-2 gap-[15px] lg:grid-cols-4">
              {[
                { label: 'Views', value: funnel.page_views, rate: null },
                { label: 'Clicks', value: funnel.link_clicks, rate: funnel.view_to_click_pct },
                { label: 'Leads', value: funnel.leads, rate: funnel.click_to_lead_pct },
                { label: 'Bookings', value: funnel.bookings, rate: funnel.view_to_booking_pct },
              ].map((stage) => (
                <div key={stage.label} className="rounded-[5px] bg-[#FAFAFA] px-[12px] py-[10px]">
                  <span className="block text-[12px] text-[#808080]">{stage.label}</span>
                  <span className="mt-[2px] block text-[16px] font-semibold tabular-nums leading-none">{formatNumber(stage.value)}</span>
                  {stage.rate !== null && <span className="mt-[4px] block text-[10px] text-[#808080]">{stage.rate || 0}% of previous step</span>}
                </div>
              ))}
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 gap-[15px] xl:grid-cols-3">
            <ChartCard title="Views and Clicks" className="xl:col-span-2" info="Daily views and link clicks for the selected period.">
              <div className="relative mt-[10px] h-[250px]">
                {timeline.length === 0 ? (
                  <NotEnoughData />
                ) : (
                  <div className="flex h-full items-end gap-[3px] border-b-[0.5px] border-[#f0f0f0]">
                    {timeline.map((point, idx) => {
                      const isHovered = hoveredTimelinePoint?.date === point.date;
                      return (
                        <div
                          key={point.date || idx}
                          className="relative flex h-full flex-1 flex-col justify-end"
                          onMouseEnter={() => setHoveredTimelinePoint(point)}
                          onMouseLeave={() => setHoveredTimelinePoint(null)}
                        >
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 z-10 mb-[6px] w-[150px] -translate-x-1/2 rounded-[8px] border border-[#e8e8e8] bg-white px-[12px] py-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                              <p className="mb-[6px] border-b border-[#f2f2f2] pb-[6px] text-[11px] font-semibold text-[#333]">{point.label}</p>
                              {[['Views', point.views, SERIES_COLORS[0]], ['Clicks', point.clicks, SERIES_COLORS[1]]].map(([label, value, color]) => (
                                <p key={label} className="flex items-center justify-between text-[11px]">
                                  <span className="flex items-center gap-[6px] text-[#555]"><span className="size-[8px] rounded-full" style={{ background: color }} />{label}</span>
                                  <span className="font-semibold text-[#222]">{value.toLocaleString()}</span>
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="flex h-full items-end justify-center gap-[1px]">
                            <div className="w-[45%] max-w-[14px] rounded-t-[2px]" style={{ height: `${(point.views / maxTimelineVal) * 100}%`, background: SERIES_COLORS[0], opacity: isHovered ? 1 : 0.85 }} />
                            <div className="w-[45%] max-w-[14px] rounded-t-[2px]" style={{ height: `${(point.clicks / maxTimelineVal) * 100}%`, background: SERIES_COLORS[1], opacity: isHovered ? 1 : 0.85 }} />
                          </div>
                          <span className="absolute -bottom-[16px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] text-[#666]">
                            {idx % Math.ceil(timeline.length / 7) === 0 ? point.label : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-[20px]">
                <BreakdownRows rows={[
                  { label: 'Views', value: timeline.reduce((sum, p) => sum + p.views, 0).toLocaleString(), color: SERIES_COLORS[0] },
                  { label: 'Clicks', value: timeline.reduce((sum, p) => sum + p.clicks, 0).toLocaleString(), color: SERIES_COLORS[1] },
                ]} />
              </div>
            </ChartCard>

            <ChartCard title="Active Hours" info="Activity by hour of the day (UTC). The darkest bar is your busiest hour.">
              <div className="relative mt-[10px] h-[250px]">
                {!hourlyPeak?.matrix?.some((h) => h.events > 0) ? (
                  <NotEnoughData />
                ) : (
                  <div className="flex h-full items-end gap-[2px] border-b-[0.5px] border-[#f0f0f0]">
                    {hourlyPeak.matrix.map((item) => {
                      const max = Math.max(...hourlyPeak.matrix.map((h) => h.events), 1);
                      const isPeak = item.hour === hourlyPeak.optimal_hour && item.events > 0;
                      return (
                        <div key={item.hour} className="relative flex h-full flex-1 items-end" title={`${item.label}: ${item.events} events`}>
                          <div className="w-full rounded-t-[2px]" style={{ height: `${(item.events / max) * 100}%`, background: isPeak ? '#15803D' : '#86D3A3' }} />
                          {item.hour % 6 === 0 && <span className="absolute -bottom-[16px] left-0 text-[11px] text-[#666]">{item.hour}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="mt-[20px]">
                <BreakdownRows rows={hourlyPeak?.peak_events ? [{ label: 'Busiest hour', value: hourlyPeak.optimal_label, color: '#15803D' }] : []} empty="No activity yet." />
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-[15px] lg:grid-cols-2">
            <ChartCard title="Top Countries">
              <BreakdownRows rows={topCountries.slice(0, 8).map((c, i) => ({ key: c.country_code, label: `${c.flag || ''} ${c.country}`.trim(), value: c.count.toLocaleString(), share: c.percentage, color: SERIES_COLORS[i % SERIES_COLORS.length] }))} />
            </ChartCard>
            <ChartCard title="Traffic Sources">
              <BreakdownRows rows={sources.slice(0, 8).map((s, i) => ({ key: s.source, label: s.source, value: s.count.toLocaleString(), share: s.percentage, color: SERIES_COLORS[i % SERIES_COLORS.length] }))} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-[15px] lg:grid-cols-3">
            <ChartCard title="Devices">
              <BreakdownRows rows={['mobile', 'desktop', 'tablet'].map((key, i) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), value: (devices[key]?.count || 0).toLocaleString(), share: devices[key]?.percentage || 0, color: SERIES_COLORS[i] }))} />
            </ChartCard>
            <ChartCard title="Operating Systems">
              <BreakdownRows rows={operatingSystems.slice(0, 6).map((o, i) => ({ key: o.os, label: o.os, value: o.count.toLocaleString(), share: o.percentage, color: SERIES_COLORS[i % SERIES_COLORS.length] }))} />
            </ChartCard>
            <ChartCard title="Browsers">
              <BreakdownRows rows={browsers.slice(0, 6).map((b, i) => ({ key: b.browser, label: b.browser, value: b.count.toLocaleString(), share: b.percentage, color: SERIES_COLORS[i % SERIES_COLORS.length] }))} />
            </ChartCard>
          </div>

          <ChartCard title="Link Performance" info="Clicks per link. Click rate is clicks divided by bio views.">
            <div className={`${table.wrapper} mt-[10px]`}>
              <table className={table.table}>
                <thead className={table.head}>
                  <tr>
                    <th className={table.th}>Link</th>
                    <th className={`${table.th} text-right`}>Clicks</th>
                    <th className={`${table.th} text-right`}>Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {linkPerformance.length === 0 ? (
                    <tr><td colSpan={3} className="py-[24px] text-center text-[12px] text-[#777]">No data available.</td></tr>
                  ) : linkPerformance.map((link) => (
                    <tr key={link.id} className={table.row}>
                      <td className={table.td}>
                        <span className="block max-w-[320px] truncate font-medium" title={link.title}>{link.title}</span>
                        <span className="block max-w-[320px] truncate text-[10px] text-[#b0b0b0]" title={link.url}>{link.url}</span>
                      </td>
                      <td className={`${table.td} text-right tabular-nums`}>{link.clicks.toLocaleString()}</td>
                      <td className={`${table.td} text-right tabular-nums`}>{link.ctr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard
            title="Recent Activity"
            info="The 50 most recent views and clicks on your bio."
            actions={<SearchPill value={streamFilter} onChange={setStreamFilter} placeholder="Filter activity" className="w-[200px]" />}
          >
            <div className={`${table.wrapper} mt-[10px] max-h-[420px] overflow-y-auto`}>
              <table className={table.table}>
                <thead className={`${table.head} sticky top-0 z-10`}>
                  <tr>
                    <th className={table.th}>Event</th>
                    <th className={table.th}>Location</th>
                    <th className={table.th}>Device</th>
                    <th className={table.th}>Browser</th>
                    <th className={table.th}>Source</th>
                    <th className={table.th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStream.length === 0 ? (
                    <tr><td colSpan={6} className="py-[24px] text-center text-[12px] text-[#777]">No data available.</td></tr>
                  ) : filteredStream.map((e) => (
                    <tr key={e.id} className={table.row}>
                      <td className={table.td}>{e.event_type === 'link_click' || e.event_type === 'click' ? 'Click' : 'View'}</td>
                      <td className={table.td}>{e.flag} {e.city || e.country || '—'}</td>
                      <td className={`${table.td} capitalize`}>{e.device}{e.os ? ` · ${e.os}` : ''}</td>
                      <td className={table.td}>{e.browser || '—'}</td>
                      <td className={table.td}>{e.source || 'Direct'}</td>
                      <td className={`${table.td} whitespace-nowrap text-[#808080]`}>{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
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
