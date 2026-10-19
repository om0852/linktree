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
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  const startEdgeTime = Date.now();

  try {
    const rate = consumeRateLimit(request, 'telemetry', 120, 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many tracking events.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = await request.json().catch(() => ({}));
    const targetId = (body.target_id || body.profile_id || body.username || body.profileUsername || '').toLowerCase().trim();

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'target_id (username or profile_id) is required' }, { status: 400 });
    }

    const eventType = body.event_type || (body.link_id ? 'link_click' : 'profile_view');
    const linkId = body.link_id || null;
    if (!['profile_view', 'view', 'link_click', 'click'].includes(eventType)) {
      return NextResponse.json({ success: false, error: 'Unsupported event type.' }, { status: 400 });
    }

    // 1. Zero-latency client IP extraction & deterministic SHA-256 privacy hash
    const clientIp = extractClientIp(request);
    const uaString = request.headers.get('user-agent') || '';
    const ipHash = hashVisitorIdentity(clientIp, uaString);

    // 2. Beacon Deduplication: Drop duplicate browser beacons within 60s
    if (isDuplicateBeacon(targetId, ipHash, eventType, linkId || '')) {
      return NextResponse.json({
        success: true,
        deduplicated: true,
        message: 'Duplicate beacon dropped (in-memory rate filter)'
      }, { status: 200 });
    }

    // 3. Bot & Crawler Detection
  const isBot = isBotOrCrawler(uaString);

    // 4. Edge Geographic Extraction (Zero-latency CDN headers)
    const geo = extractGeoIntelligence(request);

    // 5. Device, OS, Browser & WebView Detection
    const dev = extractDeviceAndBrowser(request, uaString);

    // 6. Traffic Attribution & Normalized Source
    const attr = extractAttribution(request, body);

    await connectToDatabase();
    const profile = await Profile.findOne({ username: targetId }).select('links').lean();
    if (!profile) return NextResponse.json({ success: false, error: 'Profile not found.' }, { status: 404 });
    let destinationUrl = '';
    if (['link_click', 'click'].includes(eventType)) {
      const link = (profile.links || []).find((item) => item.id === linkId && item.active !== false && !item.disabled && !item.isArchived);
      if (!link) return NextResponse.json({ success: false, error: 'Link not found.' }, { status: 404 });
      destinationUrl = link.url || '';
    }

    // 7. Server-Side Uniqueness Check: Check if this ip_hash has visited this target entity before
    const priorEvent = await AnalyticsEvent.exists({
      target_id: targetId,
      ip_hash: ipHash
    });
    const isUnique = !priorEvent;

    // 8. Atomic Counter Updates in MongoDB (exclude bots from creator metrics)
    if (!isBot) {
      if (eventType === 'link_click' && linkId) {
        Profile.updateOne(
          { username: targetId, 'links.id': linkId },
          { $inc: { 'links.$.clicks': 1 } }
        ).catch(err => console.error('Atomic link click increment error:', err));
      } else {
        Profile.updateOne(
          { username: targetId },
          { $inc: { views: 1 } }
        ).catch(err => console.error('Atomic profile view increment error:', err));
      }
    }

    // 9. Generate Deterministic Event ID & Persist Telemetry Event
    const eventId = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const latencyMs = Date.now() - startEdgeTime;

    await AnalyticsEvent.create({
      id: eventId,
      event_type: eventType,
      eventType: eventType,
      target_id: targetId,
      profileUsername: targetId,
      link_id: linkId,
      destination_url: destinationUrl,
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

    const totalEdgeMs = Date.now() - startEdgeTime;

    return NextResponse.json({
      success: true,
      event_id: eventId,
      is_unique: isUnique,
      is_bot: isBot,
      latency_ms: totalEdgeMs
    }, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Edge-Latency-Ms': String(totalEdgeMs)
      }
    });

  } catch (error) {
    console.error('Edge Telemetry Ingestion error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Telemetry ingestion failed'
    }, { status: 500 });
  }
}
