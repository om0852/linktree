import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import Profile from '@/models/Profile';
import { 
  extractClientIp, 
  hashVisitorIdentity, 
  extractGeoIntelligence, 
  extractDeviceAndBrowser, 
  extractAttribution, 
  isBotOrCrawler, 
  isDuplicateBeacon 
} from '@/lib/telemetry';

export async function POST(request) {
  const startEdgeTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const username = (body.username || body.profileUsername || body.target_id || '').toLowerCase().trim();

    if (!username) {
      return NextResponse.json({ success: false, message: 'username is required' }, { status: 400 });
    }

    const clientIp = extractClientIp(request);
    const uaString = request.headers.get('user-agent') || '';
    const ipHash = hashVisitorIdentity(clientIp, uaString);

    if (isDuplicateBeacon(username, ipHash, 'profile_view', '')) {
      return NextResponse.json({ success: true, deduplicated: true, message: 'Duplicate beacon dropped' });
    }

    const isBot = isBotOrCrawler(uaString);
    const geo = extractGeoIntelligence(request);
    const dev = extractDeviceAndBrowser(request, uaString);
    const attr = extractAttribution(request, body);

    await connectToDatabase();

    const priorEvent = await AnalyticsEvent.exists({
      $or: [{ target_id: username }, { profileUsername: username }],
      ip_hash: ipHash
    });
    const isUnique = !priorEvent;

    if (!isBot) {
      Profile.updateOne(
        { username },
        { $inc: { views: 1 } }
      ).catch(err => console.error('Atomic profile view increment error:', err));
    }

    const eventId = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const latencyMs = Number(body.latency_ms) || (Date.now() - startEdgeTime);

    await AnalyticsEvent.create({
      id: eventId,
      event_type: 'profile_view',
      target_id: username,
      profileUsername: username,
      link_id: null,
      destination_url: '',
      timestamp: new Date(),
      ip_hash: ipHash,
      country: geo.country,
      country_code: geo.country_code,
      region: geo.region,
      city: geo.city,
      device: dev.device,
      os: dev.os,
      browser: dev.browser,
      referrer: attr.referrer,
      source: attr.source,
      language: dev.language,
      utm_source: attr.utm_source,
      utm_medium: attr.utm_medium,
      utm_campaign: attr.utm_campaign,
      utm_term: attr.utm_term,
      utm_content: attr.utm_content,
      is_unique: isUnique,
      is_bot: isBot,
      latency_ms: latencyMs
    });

    return NextResponse.json({ 
      success: true, 
      event_id: eventId,
      is_unique: isUnique,
      is_bot: isBot,
      message: 'Profile view recorded with edge telemetry' 
    });
  } catch (error) {
    console.error('Track View error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
