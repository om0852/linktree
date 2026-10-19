import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Subscriber from '@/models/Subscriber';
import Tip from '@/models/Tip';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 });
    }

    const normalized = username.toLowerCase().trim();
    const profile = await Profile.findOne({ username: normalized });

    // Aggregate link clicks from profile
    const profileLinks = profile?.links || [];
    const dbTotalClicks = profileLinks.reduce((acc, l) => acc + (l.clicks || 0), 0);

    // Aggregate events from AnalyticsEvent collection
    const [clickCount, viewCount, deviceStats, referrerStats, subscribersCount, recentTips, recentSubscribers] = await Promise.all([
      AnalyticsEvent.countDocuments({ 
        $or: [{ profileUsername: normalized }, { target_id: normalized }],
        $or: [
          { event_type: { $in: ['click', 'link_click'] } },
          { eventType: { $in: ['click', 'link_click'] } }
        ],
        is_bot: { $ne: true }
      }),
      AnalyticsEvent.countDocuments({ 
        $or: [{ profileUsername: normalized }, { target_id: normalized }],
        $or: [
          { event_type: { $in: ['view', 'profile_view'] } },
          { eventType: { $in: ['view', 'profile_view'] } }
        ],
        is_bot: { $ne: true }
      }),
      AnalyticsEvent.aggregate([
        { $match: { 
          $or: [{ profileUsername: normalized }, { target_id: normalized }],
          is_bot: { $ne: true }
        } },
        { $group: { _id: '$device', count: { $sum: 1 } } }
      ]),
      AnalyticsEvent.aggregate([
        { $match: { 
          $or: [{ profileUsername: normalized }, { target_id: normalized }],
          is_bot: { $ne: true }
        } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Subscriber.countDocuments({ profileUsername: normalized }),
      Tip.find({ profileUsername: normalized }).sort({ timestamp: -1 }).limit(5),
      Subscriber.find({ profileUsername: normalized }).sort({ subscribedAt: -1 }).limit(5),
    ]);

    // Format device stats - purely real metrics from recorded events
    const hasDeviceEvents = deviceStats.length > 0;
    const totalDevices = deviceStats.reduce((sum, d) => sum + d.count, 0);
    const deviceBreakdown = {
      mobile: hasDeviceEvents && totalDevices > 0 ? Math.round(((deviceStats.find((d) => d._id === 'mobile')?.count || 0) / totalDevices) * 100) : 0,
      desktop: hasDeviceEvents && totalDevices > 0 ? Math.round(((deviceStats.find((d) => d._id === 'desktop')?.count || 0) / totalDevices) * 100) : 0,
      tablet: hasDeviceEvents && totalDevices > 0 ? Math.round(((deviceStats.find((d) => d._id === 'tablet')?.count || 0) / totalDevices) * 100) : 0,
    };

    // Real combined total clicks & views without artificial multipliers
    const effectiveClicks = Math.max(dbTotalClicks, clickCount);
    const effectiveViews = Math.max(viewCount, effectiveClicks);
    const ctr = effectiveViews > 0 ? ((effectiveClicks / effectiveViews) * 100).toFixed(1) : '0.0';

    // Format top links sorted by clicks
    const topLinks = [...profileLinks]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        title: l.title,
        clicks: l.clicks || 0,
        badge: l.badge,
        url: l.url,
      }));

    // Calculate total tips earned
    const totalTipsAmount = recentTips.reduce((sum, t) => sum + (t.amount || 0), 0);

    return NextResponse.json({
      success: true,
      username: normalized,
      stats: {
        totalClicks: effectiveClicks,
        totalViews: effectiveViews,
        ctr: `${ctr}%`,
        subscribersCount,
        tipsTotal: totalTipsAmount,
      },
      deviceBreakdown,
      topReferrers: referrerStats.map((r) => ({ source: r._id || 'Direct', count: r.count })),
      topLinks,
      recentTips: recentTips.map((t) => ({
        amount: t.amount,
        sender: t.senderName,
        message: t.message,
        date: t.timestamp,
      })),
      recentSubscribers: recentSubscribers.map((s) => ({
        email: s.email,
        date: s.subscribedAt,
      })),
    });
  } catch (error) {
    console.error('API Analytics GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
