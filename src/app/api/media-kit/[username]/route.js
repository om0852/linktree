import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Booking from '@/models/Booking';
import Lead from '@/models/Lead';
import Profile from '@/models/Profile';
import Subscriber from '@/models/Subscriber';
import { requireProfileOwner } from '@/lib/authorization';

const json = (body, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store, max-age=0' },
});

export async function GET(_request, { params }) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername || '').trim().toLowerCase();
    if (!username) return json({ error: 'Creator not found.' }, 404);

    await connectToDatabase();
    const profile = await Profile.findOne({ username }).select('username name title bio avatar performanceMediaKitEnabled links').lean();
    if (!profile || !profile.performanceMediaKitEnabled) return json({ error: 'This media kit is not available.' }, 404);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const eventMatch = {
      profileUsername: username,
      timestamp: { $gte: since },
      is_bot: { $ne: true },
      event_type: { $in: ['profile_view', 'view', 'link_click', 'click'] },
    };

    const [eventGroups, linkGroups, leads, subscribers, bookings] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: eventMatch },
        { $group: { _id: '$event_type', count: { $sum: 1 }, unique: { $sum: { $cond: ['$is_unique', 1, 0] } } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { ...eventMatch, event_type: { $in: ['link_click', 'click'] }, link_id: { $type: 'string', $ne: '' } } },
        { $group: { _id: '$link_id', clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 5 },
      ]),
      Lead.countDocuments({ creatorUsername: username, createdAt: { $gte: since } }),
      Subscriber.countDocuments({ profileUsername: username, subscribedAt: { $gte: since } }),
      Booking.countDocuments({ creatorUsername: username, createdAt: { $gte: since }, status: { $ne: 'cancelled' } }),
    ]);

    const values = eventGroups.reduce((result, group) => {
      if (group._id === 'profile_view' || group._id === 'view') {
        result.views += group.count;
        result.uniqueViews += group.unique;
      } else {
        result.clicks += group.count;
      }
      return result;
    }, { views: 0, uniqueViews: 0, clicks: 0 });
    const linksById = new Map((profile.links || [])
      .filter((link) => link.active !== false && !link.disabled && !link.isArchived)
      .map((link) => [String(link.id), link.title || 'Link']));
    const conversions = leads + subscribers + bookings;

    return json({
      creator: { username: profile.username, name: profile.name || profile.title || profile.username, bio: profile.bio || '', avatar: profile.avatar || '' },
      period: { label: 'Last 30 days', start: since.toISOString(), end: new Date().toISOString() },
      metrics: {
        profileViews: values.views,
        uniqueViews: values.uniqueViews,
        linkClicks: values.clicks,
        leads,
        subscribers,
        bookings,
        conversions,
        clickThroughRate: values.views ? Number((values.clicks / values.views * 100).toFixed(1)) : 0,
      },
      topLinks: linkGroups
        .filter((item) => linksById.has(String(item._id)))
        .map((item) => ({ title: linksById.get(String(item._id)), clicks: item.clicks })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET /api/media-kit/[username] error:', error);
    return json({ error: 'Unable to load this media kit.' }, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername || '').trim().toLowerCase();
    const access = await requireProfileOwner(request, username);
    if (access.error) return json({ error: access.error.status === 401 ? 'Authentication required.' : 'Not authorized.' }, access.error.status);

    const body = await request.json();
    if (typeof body.enabled !== 'boolean') return json({ error: 'enabled must be a boolean.' }, 400);
    await connectToDatabase();
    const profile = await Profile.findOneAndUpdate(
      { username },
      { $set: { performanceMediaKitEnabled: body.enabled } },
      { new: true, projection: { username: 1, performanceMediaKitEnabled: 1 } }
    ).lean();
    if (!profile) return json({ error: 'Profile not found.' }, 404);
    return json({ enabled: profile.performanceMediaKitEnabled });
  } catch (error) {
    console.error('PATCH /api/media-kit/[username] error:', error);
    return json({ error: 'Unable to update media kit settings.' }, 500);
  }
}
