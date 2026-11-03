'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MousePointerClick, Mail, Loader2 } from '@/components/icons';
import Modal from '@/components/ui/Modal';
import { KpiCard, KpiGrid, ChartCard, BreakdownRows, InfoChip, table } from '@/components/ui/patterns';

export default function AnalyticsModal({ profile, onClose }) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics/${profile.username}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (profile?.username) {
      fetchAnalytics();
    }
    return () => {
      isMounted = false;
    };
  }, [profile?.username]);

  // Compute stats from active DB data
  const localTotalClicks = (profile.links || []).reduce((acc, link) => acc + (link.clicks || 0), 0);
  const totalClicks = analyticsData?.stats?.totalClicks ?? localTotalClicks;
  const totalViews = analyticsData?.stats?.totalViews ?? totalClicks;
  const calculatedCTR = analyticsData?.stats?.ctr ?? (totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : '0.0%');
  const subscribersCount = analyticsData?.stats?.subscribersCount ?? 0;

  const device = analyticsData?.deviceBreakdown || { mobile: 0, desktop: 0, tablet: 0 };

  const linkRows = (analyticsData?.topLinks || profile.links || []).map((link) => {
    const clicks = link.clicks || 0;
    const percentage = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;
    return { key: link.id, label: link.title, value: clicks.toLocaleString(), share: percentage };
  });

  const referrerRows = (analyticsData?.topReferrers || []).map((r, i) => ({ key: i, label: r.source, value: r.count }));

  const deviceRows = [
    { key: 'mobile', label: 'Mobile', value: `${device.mobile}%` },
    { key: 'desktop', label: 'Desktop', value: `${device.desktop}%` },
    { key: 'tablet', label: 'Tablet', value: `${device.tablet}%` },
  ];

  return (
    <Modal
      onClose={onClose}
      title="Analytics"
      width="xl"
      headerExtra={
        <>
          <InfoChip>@{profile.username}</InfoChip>
          {loading && <Loader2 size={14} className="animate-spin text-[#808080]" />}
        </>
      }
    >
      <div className="flex flex-col gap-[15px]">
        <KpiGrid columns={4}>
          <KpiCard icon={MousePointerClick} value={totalClicks.toLocaleString()} label="Total Clicks" />
          <KpiCard icon={Users} value={totalViews.toLocaleString()} label="Unique Views" />
          <KpiCard icon={TrendingUp} value={calculatedCTR} label="Avg. CTR" />
          <KpiCard icon={Mail} value={subscribersCount} label="Subscribers" />
        </KpiGrid>

        <ChartCard title="Top Links">
          <div className="customScrollBar max-h-[192px] overflow-y-auto">
            <BreakdownRows rows={linkRows} empty="No links yet." />
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 gap-[15px] sm:grid-cols-2">
          <ChartCard title="Top Sources">
            <BreakdownRows rows={referrerRows} empty="No referrers yet." />
          </ChartCard>
          <ChartCard title="Devices">
            <BreakdownRows rows={deviceRows} />
          </ChartCard>
        </div>

        {/* Recent Subscribers & Inquiries */}
        {analyticsData?.recentSubscribers?.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            <span className="text-[14px] font-semibold text-[#333]">Recent Subscribers</span>
            <div className={table.wrapper}>
              <table className={table.table}>
                <thead className={table.head}>
                  <tr>
                    <th className={table.th}>Email</th>
                    <th className={table.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.recentSubscribers.map((s, i) => (
                    <tr key={i} className={table.row}>
                      <td className={table.td}>{s.email}</td>
                      <td className={table.td}><span className="text-[#808080]">{new Date(s.date).toLocaleDateString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
