import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Profile from '@/models/Profile';
import Booking from '@/models/Booking';
import Subscriber from '@/models/Subscriber';
import { getCountryFlag } from '@/lib/telemetry';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = (searchParams.get('target_id') || searchParams.get('username') || '').toLowerCase().trim();
    const range = (searchParams.get('range') || '30d').toLowerCase();

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'target_id or username parameter is required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Calculate Date Range Filter
    const now = new Date();
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30d

    if (range === '24h' || range === 'today') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'all') {
      startDate = new Date(0); // Epoch start
    }

    const queryFilter = {
      $or: [
        { target_id: targetId },
        { profileUsername: targetId }
      ],
      timestamp: { $gte: startDate }
    };

    // 2. Fetch Profile to get live link configuration
    const profile = await Profile.findOne({ username: targetId }).lean();
    const profileLinks = profile?.links || [];

    // 3. Parallel Aggregations for High-Throughput Analytics
    const [
      humanEvents,
      botCount,
      uniqueVisitorIds,
      deviceAgg,
      osAgg,
      browserAgg,
      countryAgg,
      cityAgg,
      sourceAgg,
      recentEvents,
      leadsCount,
      bookingsCount
    ] = await Promise.all([
      // A. All Human Events (views & clicks) in range
      AnalyticsEvent.find({ ...queryFilter, is_bot: false })
        .select('event_type link_id timestamp ip_hash latency_ms')
        .lean(),

      // B. Bot Events count
      AnalyticsEvent.countDocuments({ ...queryFilter, is_bot: true }),

      // C. Distinct Unique IP Hashes (human only)
      AnalyticsEvent.distinct('ip_hash', { ...queryFilter, is_bot: false }),

      // D. Device Breakdown
      AnalyticsEvent.aggregate([
        { $match: { ...queryFilter, is_bot: false } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // E. Operating System Breakdown
      AnalyticsEvent.aggregate([
        { $match: { ...queryFilter, is_bot: false } },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // F. Browser & WebViews Breakdown
      AnalyticsEvent.aggregate([
        { $match: { ...queryFilter, is_bot: false } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // G. Country Aggregation
      AnalyticsEvent.aggregate([
        { $match: { ...queryFilter, is_bot: false } },
        { $group: { _id: { code: '$country_code', name: '$country' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // H. City Aggregation
      AnalyticsEvent.aggregate([
        { $match: { ...queryFilter, is_bot: false, city: { $nin: ['', 'Unknown City'] } } },
        { $group: { _id: { city: '$city', region: '$region', country: '$country' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),

      // I. Traffic Sources Aggregation
      AnalyticsEvent.aggregate([
        { $match: { ...queryFilter, is_bot: false } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // J. Recent Live Stream (50 events)
      AnalyticsEvent.find(queryFilter)
        .sort({ timestamp: -1 })
        .limit(50)
        .select('id event_type link_id timestamp country country_code city device os browser source is_unique is_bot latency_ms destination_url')
        .lean(),

      // K. Leads captured in range
      Subscriber.countDocuments({ profileUsername: targetId, subscribedAt: { $gte: startDate } }),

      // L. Bookings scheduled in range
      Booking.countDocuments({ creatorUsername: targetId, createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } })
    ]);

    // 4. Compute Engagement KPIs & Funnel Conversion Rate
    let profileViews = 0;
    let linkClicks = 0;
    let totalLatency = 0;

    // Per link clicks aggregation
    const linkClicksMap = {};

    humanEvents.forEach(evt => {
      if (evt.event_type === 'profile_view' || evt.event_type === 'view') {
        profileViews++;
      } else if (evt.event_type === 'link_click' || evt.event_type === 'click') {
        linkClicks++;
        if (evt.link_id) {
          linkClicksMap[evt.link_id] = (linkClicksMap[evt.link_id] || 0) + 1;
        }
      }
      totalLatency += (evt.latency_ms || 0);
    });

    const totalEvents = profileViews + linkClicks;
    const uniqueVisitors = uniqueVisitorIds.length;
    
    // Funnel conversion rate: (Link Clicks / Profile Views) * 100
    const conversionRatePct = profileViews > 0 
      ? Number(((linkClicks / profileViews) * 100).toFixed(1)) 
      : 0;

    const conversionFunnel = {
      page_views: profileViews,
      link_clicks: linkClicks,
      leads: leadsCount || 0,
      bookings: bookingsCount || 0,
      view_to_click_pct: profileViews > 0 ? Number(((linkClicks / profileViews) * 100).toFixed(1)) : 0,
      click_to_lead_pct: linkClicks > 0 ? Number((((leadsCount || 0) / linkClicks) * 100).toFixed(1)) : 0,
      view_to_booking_pct: profileViews > 0 ? Number((((bookingsCount || 0) / profileViews) * 100).toFixed(1)) : 0,
      overall_conversion_pct: profileViews > 0 ? Number(((((leadsCount || 0) + (bookingsCount || 0)) / profileViews) * 100).toFixed(1)) : 0,
    };

    // Repeat Visitor Rate: ((Views - Unique) / Views) * 100
    const repeatRatePct = profileViews > uniqueVisitors
      ? Number((((profileViews - uniqueVisitors) / profileViews) * 100).toFixed(1))
      : 0;

    const avgLatencyMs = humanEvents.length > 0
      ? Math.round(totalLatency / humanEvents.length)
      : 0;

    // 5. Build Timeline Chart Data
    const isHourly = range === '24h' || range === 'today';
    const timelineMap = new Map();

    if (isHourly) {
      // 24 hourly buckets
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStr = d.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        const label = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
        timelineMap.set(hourStr, { label, date: d.toISOString(), views: 0, clicks: 0, unique: new Set() });
      }
      humanEvents.forEach(evt => {
        const hourKey = new Date(evt.timestamp).toISOString().slice(0, 13);
        if (timelineMap.has(hourKey)) {
          const item = timelineMap.get(hourKey);
          if (evt.event_type === 'profile_view' || evt.event_type === 'view') {
            item.views++;
          } else {
            item.clicks++;
          }
          item.unique.add(evt.ip_hash);
        }
      });
    } else {
      // Daily buckets (7d or 30d)
      const numDays = range === '7d' ? 7 : 30;
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
        const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        timelineMap.set(dateKey, { label, date: dateKey, views: 0, clicks: 0, unique: new Set() });
      }
      humanEvents.forEach(evt => {
        const dateKey = new Date(evt.timestamp).toISOString().slice(0, 10);
        if (timelineMap.has(dateKey)) {
          const item = timelineMap.get(dateKey);
          if (evt.event_type === 'profile_view' || evt.event_type === 'view') {
            item.views++;
          } else {
            item.clicks++;
          }
          item.unique.add(evt.ip_hash);
        }
      });
    }

    const timeline = Array.from(timelineMap.values()).map(item => ({
      label: item.label,
      date: item.date,
      views: item.views,
      clicks: item.clicks,
      unique: item.unique.size
    }));

    // 6. 24-Hour Peak Engagement Matrix
    const hourlyMatrix = Array.from({ length: 24 }, (_, h) => {
      const period = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      return { hour: h, label: period, events: 0, views: 0, clicks: 0 };
    });

    humanEvents.forEach(evt => {
      const h = new Date(evt.timestamp).getHours();
      if (hourlyMatrix[h]) {
        hourlyMatrix[h].events++;
        if (evt.event_type === 'profile_view' || evt.event_type === 'view') {
          hourlyMatrix[h].views++;
        } else {
          hourlyMatrix[h].clicks++;
        }
      }
    });

    // Find optimal hour to post
    let peakHourObj = hourlyMatrix[0];
    hourlyMatrix.forEach(item => {
      if (item.events > peakHourObj.events) {
        peakHourObj = item;
      }
    });

    // 7. Format Devices Split
    const totalDeviceCount = deviceAgg.reduce((acc, d) => acc + d.count, 0);
    const devices = {
      mobile: {
        count: deviceAgg.find(d => String(d._id).toLowerCase() === 'mobile')?.count || 0,
        percentage: totalDeviceCount > 0 ? Math.round(((deviceAgg.find(d => String(d._id).toLowerCase() === 'mobile')?.count || 0) / totalDeviceCount) * 100) : 0
      },
      desktop: {
        count: deviceAgg.find(d => String(d._id).toLowerCase() === 'desktop')?.count || 0,
        percentage: totalDeviceCount > 0 ? Math.round(((deviceAgg.find(d => String(d._id).toLowerCase() === 'desktop')?.count || 0) / totalDeviceCount) * 100) : 0
      },
      tablet: {
        count: deviceAgg.find(d => String(d._id).toLowerCase() === 'tablet')?.count || 0,
        percentage: totalDeviceCount > 0 ? Math.round(((deviceAgg.find(d => String(d._id).toLowerCase() === 'tablet')?.count || 0) / totalDeviceCount) * 100) : 0
      }
    };

    // 8. Format Operating Systems Split
    const totalOsCount = osAgg.reduce((acc, o) => acc + o.count, 0);
    const operatingSystems = osAgg.map(o => ({
      os: o._id || 'Other',
      count: o.count,
      percentage: totalOsCount > 0 ? Math.round((o.count / totalOsCount) * 100) : 0
    }));

    // 9. Format Browsers Split
    const totalBrowserCount = browserAgg.reduce((acc, b) => acc + b.count, 0);
    const browsers = browserAgg.map(b => ({
      browser: b._id || 'Other',
      count: b.count,
      percentage: totalBrowserCount > 0 ? Math.round((b.count / totalBrowserCount) * 100) : 0
    }));

    // 10. Format Countries List
    const totalCountryCount = countryAgg.reduce((acc, c) => acc + c.count, 0);
    const topCountries = countryAgg.map(c => ({
      country_code: c._id.code || 'GL',
      country: c._id.name || 'Global',
      flag: getCountryFlag(c._id.code),
      count: c.count,
      percentage: totalCountryCount > 0 ? Math.round((c.count / totalCountryCount) * 100) : 0
    }));

    // 11. Format Cities List
    const topCities = cityAgg.map(c => ({
      city: c._id.city,
      region: c._id.region,
      country: c._id.country,
      count: c.count
    }));

    // 12. Format Sources List
    const totalSourcesCount = sourceAgg.reduce((acc, s) => acc + s.count, 0);
    const sources = sourceAgg.map(s => ({
      source: s._id || 'Direct',
      count: s.count,
      percentage: totalSourcesCount > 0 ? Math.round((s.count / totalSourcesCount) * 100) : 0
    }));

    // 13. Format Link Performance
    const linkPerformance = profileLinks.map(link => {
      const clicks = linkClicksMap[link.id] || link.clicks || 0;
      const ctr = profileViews > 0 ? ((clicks / profileViews) * 100).toFixed(1) : '0.0';
      return {
        id: link.id,
        title: link.title || 'Untitled Link',
        url: link.url,
        badge: link.badge || '',
        clicks,
        ctr: `${ctr}%`
      };
    }).sort((a, b) => b.clicks - a.clicks);

    return NextResponse.json({
      success: true,
      target_id: targetId,
      range,
      metrics: {
        total_events: totalEvents,
        profile_views: profileViews,
        link_clicks: linkClicks,
        unique_visitors: uniqueVisitors,
        repeat_rate_pct: repeatRatePct,
        conversion_rate_pct: conversionRatePct,
        bot_events_filtered: botCount,
        avg_latency_ms: avgLatencyMs
      },
      conversion_funnel: conversionFunnel,
      timeline,
      hourly_peak: {
        matrix: hourlyMatrix,
        optimal_hour: peakHourObj.hour,
        optimal_label: peakHourObj.label,
        peak_events: peakHourObj.events
      },
      devices,
      operating_systems: operatingSystems,
      browsers,
      top_countries: topCountries,
      top_cities: topCities,
      sources,
      link_performance: linkPerformance,
      recent_stream: recentEvents.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        event_type: e.event_type,
        link_id: e.link_id,
        destination_url: e.destination_url,
        country: e.country,
        country_code: e.country_code,
        flag: getCountryFlag(e.country_code),
        city: e.city,
        device: e.device,
        os: e.os,
        browser: e.browser,
        source: e.source,
        is_unique: e.is_unique,
        is_bot: e.is_bot,
        latency_ms: e.latency_ms
      }))
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (error) {
    console.error('GET /api/v1/analytics error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to aggregate analytics'
    }, { status: 500 });
  }
}
