import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import Profile from '@/models/Profile';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { 
  extractClientIp, 
  hashVisitorIdentity, 
  extractGeoIntelligence, 
  extractDeviceAndBrowser, 
  extractAttribution, 
  isBotOrCrawler, 
  isDuplicateBeacon 
} from '@/lib/telemetry';

// GET: Direct click tracking with instant 302 redirect
export async function GET(request, { params }) {
  const startEdgeTime = Date.now();

  try {
    const { linkId } = await params;
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('u')?.toLowerCase()?.trim();
    const requestedDestination = searchParams.get('dest');

    if (!linkId) {
      return NextResponse.json({ success: false, message: 'linkId is required' }, { status: 400 });
    }
    if (!username) return NextResponse.json({ success: false, message: 'username is required' }, { status: 400 });
    await connectToDatabase();
    const profile = await Profile.findOne({ username }).select('links').lean();
    const link = profile?.links?.find((item) => item.id === linkId && item.active !== false && !item.disabled && !item.isArchived);
    if (!link) return NextResponse.json({ success: false, message: 'Link not found' }, { status: 404 });
    let destination;
    try {
      destination = new URL(link.url);
      if (!['http:', 'https:'].includes(destination.protocol)) throw new Error('invalid protocol');
    } catch {
      return NextResponse.json({ success: false, message: 'Link destination is invalid' }, { status: 400 });
    }
    if (requestedDestination && requestedDestination !== link.url) {
      console.warn('Ignoring caller-supplied click destination that differs from the saved link.');
    }

    const clientIp = extractClientIp(request);
    const uaString = request.headers.get('user-agent') || '';
    const ipHash = hashVisitorIdentity(clientIp, uaString);
    const isBot = isBotOrCrawler(uaString);

    if (username && !isDuplicateBeacon(username, ipHash, 'link_click', linkId)) {
      const geo = extractGeoIntelligence(request);
      const dev = extractDeviceAndBrowser(request, uaString);
      const attr = extractAttribution(request, { destination: destination.toString() });

      const priorEvent = await AnalyticsEvent.exists({
        target_id: username,
        ip_hash: ipHash
      });
      const isUnique = !priorEvent;

      if (!isBot) {
        Profile.updateOne(
          { username, 'links.id': linkId },
          { $inc: { 'links.$.clicks': 1 } }
        ).catch((err) => console.error('Atomic click increment error:', err));
      }

      const eventId = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
      const latencyMs = Date.now() - startEdgeTime;

      await AnalyticsEvent.create({
        id: eventId,
        event_type: 'link_click',
        target_id: username,
        profileUsername: username,
        link_id: linkId,
        destination_url: destination.toString(),
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
      }).catch((err) => console.error('Error logging click telemetry:', err));
    }

    return NextResponse.redirect(destination.toString(), { status: 302 });
  } catch (error) {
    console.error('API Click GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Async click tracking from frontend
export async function POST(request, { params }) {
  const startEdgeTime = Date.now();

  try {
    const { linkId } = await params;
    const body = await request.json().catch(() => ({}));
    const username = (body.username || body.target_id || '').toLowerCase()?.trim();

    if (!linkId || !username) {
      return NextResponse.json(
        { success: false, message: 'linkId and username are required' },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(request);
    const uaString = request.headers.get('user-agent') || '';
    const ipHash = hashVisitorIdentity(clientIp, uaString);
    const isBot = isBotOrCrawler(uaString);

    if (isDuplicateBeacon(username, ipHash, 'link_click', linkId)) {
      return NextResponse.json({ success: true, deduplicated: true });
    }

    const geo = extractGeoIntelligence(request);
    const dev = extractDeviceAndBrowser(request, uaString);
    await connectToDatabase();
    const profile = await Profile.findOne({ username }).select('links').lean();
    const link = profile?.links?.find((item) => item.id === linkId && item.active !== false && !item.disabled && !item.isArchived);
    if (!link) return NextResponse.json({ success: false, message: 'Link not found' }, { status: 404 });
    const destination = link.url || '';
    const attr = extractAttribution(request, { destination });

    const priorEvent = await AnalyticsEvent.exists({
      target_id: username,
      ip_hash: ipHash
    });
    const isUnique = !priorEvent;

    if (!isBot) {
      Profile.updateOne(
        { username, 'links.id': linkId },
        { $inc: { 'links.$.clicks': 1 } }
      ).catch((err) => console.error('Atomic click increment error:', err));
    }

    const eventId = `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const latencyMs = Date.now() - startEdgeTime;

    await AnalyticsEvent.create({
      id: eventId,
      event_type: 'link_click',
      target_id: username,
      profileUsername: username,
      link_id: linkId,
      destination_url: destination || '',
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
      latency_ms: latencyMs
    });
  } catch (error) {
    console.error('API Click POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
