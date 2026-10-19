import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Profile from '@/models/Profile';
import Subscriber from '@/models/Subscriber';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { getComposioClient, isComposioConfigured } from '@/lib/composio';
import { extractVisitorTelemetry } from '@/lib/telemetry';
import { consumeRateLimit } from '@/lib/rateLimit';

export async function POST(req) {
  const startTime = Date.now();
  try {
    const rate = consumeRateLimit(req, 'lead-magnet', 8, 60 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many unlock requests. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = await req.json().catch(() => ({}));
    const {
      username,
      linkId,
      email,
      whatsApp = '',
      name = '',
    } = body || {};

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!linkId || typeof linkId !== 'string') {
      return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'A valid email address is required to unlock this download.' }, { status: 400 });
    }

    await connectMongo();

    const cleanEmail = email.trim().toLowerCase();
    const cleanWhatsApp = (whatsApp || '').trim();
    const cleanName = (name || '').trim();

    // Find profile
    const profile = await Profile.findOne({ username: username.toLowerCase() }).lean();
    if (!profile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const targetLink = (profile.links || []).find((l) => l.id === linkId && l.active !== false && !l.disabled && !l.isArchived);
    if (!targetLink) {
      return NextResponse.json({ error: 'Link not found on this profile' }, { status: 404 });
    }

    const leadMagnet = targetLink.leadMagnet || {};
    if (!leadMagnet.enabled) {
      return NextResponse.json({ error: 'This link is not a gated lead magnet' }, { status: 400 });
    }

    if (leadMagnet.requireWhatsApp && !cleanWhatsApp) {
      return NextResponse.json({ error: 'A valid WhatsApp phone number is required.' }, { status: 400 });
    }

    // Save/Upsert Subscriber
    const assetTitle = targetLink.title || 'Exclusive Creator Resource';
    const unlockedRecord = {
      linkId,
      assetTitle,
      unlockedAt: new Date(),
    };

    let syncStatus = 'none';
    let syncedTo = [];

    // Attempt marketing sync if platform selected
    if (leadMagnet.marketingPlatform && leadMagnet.marketingPlatform !== 'none') {
      syncStatus = 'pending';

      // If Composio is active, attempt background push
      if (isComposioConfigured()) {
        try {
          const client = getComposioClient();
          // Best effort sync to marketing tool if available
          if (leadMagnet.marketingPlatform === 'mailchimp') {
            const syncResult = await client.tools.execute('MAILCHIMP_ADD_LIST_MEMBER', {
              userId: username.toLowerCase(),
              arguments: {
                list_id: leadMagnet.marketingListId || 'default',
                email_address: cleanEmail,
                status: 'subscribed',
              },
            });
            if (syncResult?.successful !== false && !syncResult?.error) {
              syncStatus = 'synced';
              syncedTo.push(leadMagnet.marketingPlatform);
            } else syncStatus = 'failed';
          }
        } catch (error) {
          console.error('Lead magnet marketing sync failed:', error.message);
          syncStatus = 'failed';
        }
      }
    }

    const subscriber = await Subscriber.findOneAndUpdate(
      { profileUsername: username.toLowerCase(), email: cleanEmail },
      {
        $set: {
          profileUsername: username.toLowerCase(),
          email: cleanEmail,
          whatsApp: cleanWhatsApp,
          name: cleanName || undefined,
          leadMagnetLinkId: linkId,
          assetTitle,
          syncStatus,
          source: 'lead_magnet_gate',
        },
        $addToSet: {
          unlockedAssets: unlockedRecord,
          syncedTo: { $each: syncedTo },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Track conversion telemetry
    try {
      const telemetry = extractVisitorTelemetry(req, `magnet_${linkId}`);
      await AnalyticsEvent.create({
        id: `evt_magnet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        event_type: 'link_click',
        eventType: 'link_click',
        target_id: linkId,
        profileUsername: username.toLowerCase(),
        link_id: linkId,
        destination_url: leadMagnet.assetUrl || targetLink.url || '',
        ip_hash: telemetry.ip_hash,
        country: telemetry.country,
        country_code: telemetry.country_code,
        region: telemetry.region,
        city: telemetry.city,
        device: telemetry.device,
        os: telemetry.os,
        browser: telemetry.browser,
        referrer: telemetry.referrer,
        source: telemetry.source,
        language: telemetry.language,
        utm_source: telemetry.utm_source,
        utm_medium: telemetry.utm_medium,
        utm_campaign: telemetry.utm_campaign,
        is_unique: false,
        is_bot: false,
        latency_ms: Date.now() - startTime,
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      downloadUrl: leadMagnet.assetUrl || targetLink.url,
      assetTitle,
      assetType: leadMagnet.assetType || 'pdf',
      subscriberId: subscriber._id,
      message: 'Resource unlocked successfully! Your download is ready.',
    });
  } catch (error) {
    console.error('Lead magnet unlock error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error unlocking resource' }, { status: 500 });
  }
}
