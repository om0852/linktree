import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Subscriber from '@/models/Subscriber';
import Booking from '@/models/Booking';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Profile from '@/models/Profile';

export async function GET(req, { params }) {
  try {
    await connectMongo();
    const resolvedParams = await params;
    const username = (resolvedParams?.username || '').toLowerCase().trim();

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const profile = await Profile.findOne({ username }).lean();
    if (!profile) {
      return NextResponse.json({ success: true, events: [], intervalMs: 8000 });
    }

    if (profile.socialProof && profile.socialProof.enabled === false) {
      return NextResponse.json({ success: true, events: [], intervalMs: profile.socialProof?.intervalMs || 8000 });
    }

    const events = [];

    // 1. Recent downloads/subscribers
    const recentSubscribers = await Subscriber.find({ profileUsername: username, publicSocialProof: true })
      .sort({ subscribedAt: -1 })
      .limit(5)
      .lean();

    for (const sub of recentSubscribers) {
      const name = sub.name ? sub.name.split(' ')[0] : 'A creator';
      const timeDiffMs = Date.now() - new Date(sub.subscribedAt).getTime();
      const minsAgo = Math.max(1, Math.round(timeDiffMs / (1000 * 60)));
      const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : `${Math.round(minsAgo / 60)}h ago`;

      events.push({
        id: `sub_${sub._id}`,
        icon: 'sparkles',
        title: `${name} just downloaded`,
        subtitle: sub.assetTitle || 'Exclusive Resource',
        timeAgo: timeStr,
      });
    }

    // 2. Recent bookings
    const recentBookings = await Booking.find({ creatorUsername: username, status: 'confirmed', publicSocialProof: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    for (const b of recentBookings) {
      const name = b.clientName ? b.clientName.split(' ')[0] : 'A client';
      events.push({
        id: `book_${b._id}`,
        icon: 'calendar',
        title: `${name} just booked a slot`,
        subtitle: b.topic || '1:1 Consultation',
        timeAgo: 'recently',
      });
    }

    // 3. Weekly aggregate clicks social proof
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyClicks = await AnalyticsEvent.countDocuments({
      profileUsername: username,
      event_type: 'link_click',
      timestamp: { $gte: oneWeekAgo },
    });

    if (weeklyClicks > 10) {
      events.push({
        id: `clicks_${weeklyClicks}`,
        icon: 'trending',
        title: `🔥 ${weeklyClicks.toLocaleString()} link clicks`,
        subtitle: 'trending this week on this bio',
        timeAgo: 'this week',
      });
    }

    return NextResponse.json({
      success: true,
      events,
      intervalMs: profile.socialProof?.intervalMs || 8000,
    });
  } catch (error) {
    console.error('Social proof API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
