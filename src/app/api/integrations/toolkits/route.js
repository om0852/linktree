import { NextResponse } from 'next/server';
import { getComposioClient, isComposioConfigured, FEATURED_TOOLKITS } from '@/lib/composio';

// In-memory cache for toolkits catalog to make searches instantaneous
let cachedToolkits = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function normalizeCategory(item) {
  const slug = (item.slug || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const rawCat = (item.meta?.categories?.[0]?.name || item.category || '').toLowerCase();

  if (
    slug.includes('insta') || slug.includes('twitter') || slug.includes('x_') || 
    slug.includes('facebook') || slug.includes('linkedin') || slug.includes('tiktok') ||
    slug.includes('reddit') || slug.includes('threads') || slug.includes('pinterest') ||
    rawCat.includes('social')
  ) {
    return 'Social Media';
  }

  if (
    slug.includes('spotify') || slug.includes('sound') || slug.includes('music') ||
    slug.includes('audio') || slug.includes('podcast') || rawCat.includes('music')
  ) {
    return 'Music & Audio';
  }

  if (
    slug.includes('youtube') || slug.includes('video') || slug.includes('vimeo') ||
    slug.includes('twitch') || slug.includes('loom') || rawCat.includes('video')
  ) {
    return 'Video & Media';
  }

  if (
    slug.includes('git') || slug.includes('linear') || slug.includes('jira') ||
    slug.includes('sentry') || slug.includes('supabase') || slug.includes('vercel') ||
    slug.includes('postman') || slug.includes('docker') || slug.includes('aws') ||
    rawCat.includes('dev') || rawCat.includes('code')
  ) {
    return 'Developer';
  }

  if (
    slug.includes('discord') || slug.includes('slack') || slug.includes('telegram') ||
    slug.includes('whatsapp') || slug.includes('circle') || rawCat.includes('comm')
  ) {
    return 'Community & Social';
  }

  if (
    slug.includes('stripe') || slug.includes('shop') || slug.includes('pay') ||
    slug.includes('gumroad') || slug.includes('commerce') || rawCat.includes('pay') ||
    rawCat.includes('commerce')
  ) {
    return 'Payments & E-Commerce';
  }

  if (
    slug.includes('google') || slug.includes('notion') || slug.includes('airtable') ||
    slug.includes('calend') || slug.includes('mail') || slug.includes('trello') ||
    slug.includes('asana') || slug.includes('clickup') || rawCat.includes('product')
  ) {
    return 'Productivity';
  }

  if (
    slug.includes('hubspot') || slug.includes('salesforce') || slug.includes('mailchimp') ||
    slug.includes('klaviyo') || slug.includes('convertkit') || rawCat.includes('market') ||
    rawCat.includes('crm')
  ) {
    return 'Marketing & CRM';
  }

  return 'Productivity';
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const configured = isComposioConfigured();

    const now = Date.now();
    let toolkits = [];

    // Use memory cache if still fresh
    if (cachedToolkits && (now - lastCacheTime < CACHE_TTL_MS)) {
      toolkits = [...cachedToolkits];
    } else {
      const slugMap = new Map();

      // 1. Seed with our rich featured definitions
      FEATURED_TOOLKITS.forEach(t => slugMap.set(t.slug.toLowerCase(), t));

      // 2. Fetch 300+ live toolkits directly from Composio API
      if (configured) {
        try {
          const client = getComposioClient();
          const rawResult = await client.toolkits.getToolkits({ limit: 400 });
          const items = Array.isArray(rawResult) ? rawResult : (rawResult?.items || []);

          items.forEach(item => {
            const slug = (item.slug || item.name || '').toLowerCase();
            const existing = slugMap.get(slug);

            const isManaged = Boolean(
              item.composioManagedAuthSchemes && 
              item.composioManagedAuthSchemes.length > 0
            );

            const resolvedCategory = existing?.category || normalizeCategory(item);
            const resolvedLogo = item.meta?.logo || item.logo || existing?.iconUrl || `https://avatar.vercel.sh/${slug}`;
            const resolvedDesc = existing?.description || item.meta?.description || item.description || `Integrate ${item.name} with live bio sync.`;

            slugMap.set(slug, {
              slug: item.slug || item.name,
              name: item.name || item.slug,
              category: resolvedCategory,
              authType: isManaged ? 'managed' : (existing?.authType || 'custom'),
              iconUrl: resolvedLogo,
              color: existing?.color || '#1e293b',
              accentColor: existing?.accentColor || (isManaged ? '#34d399' : '#f59e0b'),
              description: resolvedDesc,
              bioUseCase: existing?.bioUseCase || `Live ${item.name} connection & data widget`,
              popularActions: existing?.popularActions || [],
              toolsCount: item.meta?.toolsCount || 10
            });
          });
        } catch (sdkError) {
          console.warn('Composio SDK live toolkits fetch fallback:', sdkError.message);
        }
      }

      toolkits = Array.from(slugMap.values());
      cachedToolkits = toolkits;
      lastCacheTime = now;
    }

    // Filter by category
    if (category && category !== 'All') {
      toolkits = toolkits.filter(t => 
        (t.category || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by search query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      toolkits = toolkits.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.slug.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      configured,
      total: toolkits.length,
      toolkits
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
