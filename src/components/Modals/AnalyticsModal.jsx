'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  X, 
  TrendingUp, 
  Users, 
  MousePointerClick, 
  DollarSign, 
  Globe, 
  Smartphone, 
  Laptop,
  Mail,
  Heart,
  Loader2
} from 'lucide-react';

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

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto border border-[#CAD8CE] bg-[#FFFEFA] shadow-2xl rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E0DCD3] pb-4">
          <div className="w-10 h-10 rounded-full bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/20 flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-[#28352F] flex items-center gap-2">
              Audience &amp; Conversion Analytics
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#52796F]/10 text-[#52796F] border border-[#52796F]/30 font-mono">
                LIVE STATS
              </span>
            </h3>
            <p className="text-xs text-[#5C6B64]">
              Live traffic for @{profile.username} &bull; {profile.title}
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE]">
            <div className="flex items-center justify-between text-[#52796F] mb-1">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-[10px] font-bold text-[#52796F]">Live</span>
            </div>
            <p className="text-xs text-[#5C6B64]">Total Clicks</p>
            <p className="text-xl font-bold text-[#28352F] font-mono mt-0.5">{totalClicks.toLocaleString()}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE]">
            <div className="flex items-center justify-between text-[#52796F] mb-1">
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-bold text-[#52796F]">Visitors</span>
            </div>
            <p className="text-xs text-[#5C6B64]">Unique Views</p>
            <p className="text-xl font-bold text-[#28352F] font-mono mt-0.5">{totalViews.toLocaleString()}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE]">
            <div className="flex items-center justify-between text-[#52796F] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-bold text-[#52796F]">CTR</span>
            </div>
            <p className="text-xs text-[#5C6B64]">Avg. CTR</p>
            <p className="text-xl font-bold text-[#28352F] font-mono mt-0.5">{calculatedCTR}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE]">
            <div className="flex items-center justify-between text-[#52796F] mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-[10px] font-bold text-[#52796F]">Leads</span>
            </div>
            <p className="text-xs text-[#5C6B64]">Subscribers</p>
            <p className="text-xl font-bold text-[#28352F] font-mono mt-0.5">{subscribersCount}</p>
          </div>
        </div>

        {/* Top Links Click Breakdown */}
        <div className="mt-5 space-y-2">
          <h4 className="text-xs font-bold text-[#28352F] uppercase tracking-wider">
            Link Click Leaderboard &amp; Distribution
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(analyticsData?.topLinks || profile.links || []).map((link) => {
              const clicks = link.clicks || 0;
              const percentage = totalClicks > 0 ? Math.round((clicks / totalClicks) * 100) : 0;
              return (
                <div key={link.id} className="p-2.5 rounded-lg bg-[#F5F3ED] border border-[#CAD8CE] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#28352F] truncate max-w-xs">{link.title}</span>
                    <span className="font-mono text-[#52796F] font-bold shrink-0">
                      {clicks.toLocaleString()} clicks ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E0DCD3] overflow-hidden">
                    <div 
                      className="h-full bg-[#52796F] rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic & Device Telemetry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
            <h5 className="text-[11px] font-semibold text-[#28352F] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#52796F]" /> Top Traffic Sources
            </h5>
            <div className="text-xs space-y-1.5 text-[#28352F]">
              {analyticsData?.topReferrers && analyticsData.topReferrers.length > 0 ? (
                analyticsData.topReferrers.map((r, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="truncate">{r.source}</span>
                    <span className="font-mono font-bold text-[#52796F]">{r.count}</span>
                  </div>
                ))
              ) : (
                <div className="py-2 text-center text-[#5C6B64] text-[11px] italic">
                  No external referral sources recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
            <h5 className="text-[11px] font-semibold text-[#28352F] uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#52796F]" /> Device Breakdown
            </h5>
            <div className="text-xs space-y-1.5 text-[#28352F]">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-[#28352F]"><Smartphone className="w-3.5 h-3.5 text-[#52796F]" /> Mobile Phones</span>
                <span className="font-mono font-bold text-[#52796F]">{device.mobile}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-[#28352F]"><Laptop className="w-3.5 h-3.5 text-[#52796F]" /> Desktop &amp; Laptops</span>
                <span className="font-mono font-bold text-[#52796F]">{device.desktop}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-[#28352F]"><Smartphone className="w-3.5 h-3.5 text-[#52796F]" /> Tablets &amp; iPads</span>
                <span className="font-mono font-bold text-[#52796F]">{device.tablet}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Subscribers & Inquiries */}
        {analyticsData?.recentSubscribers?.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE]">
            <h5 className="text-[11px] font-semibold text-[#28352F] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Mail className="w-3.5 h-3.5 text-[#52796F]" /> Recent Newsletter Leads
            </h5>
            <div className="space-y-1 text-xs text-[#28352F]">
              {analyticsData.recentSubscribers.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-[#E0DCD3] last:border-0">
                  <span className="font-mono text-[#52796F]">{s.email}</span>
                  <span className="text-[10px] text-[#5C6B64]">{new Date(s.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
