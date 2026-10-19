import crypto from 'crypto';
import { isbot } from 'isbot';

const TELEMETRY_SALT = process.env.TELEMETRY_SALT || 'treeinbio_telemetry_engine_salt_2026_secured';

// In-memory LRU Beacon Cache with 60s TTL
const BEACON_CACHE = new Map();
const BEACON_TTL_MS = 60 * 1000;

function pruneBeaconCache() {
  const now = Date.now();
  for (const [key, timestamp] of BEACON_CACHE.entries()) {
    if (now - timestamp > BEACON_TTL_MS) {
      BEACON_CACHE.delete(key);
    }
  }
}

/**
 * Checks if this beacon has already been received within the last 60 seconds
 */
export function isDuplicateBeacon(targetId, ipHash, eventType, linkId = '') {
  pruneBeaconCache();
  const key = `${targetId}_${ipHash}_${eventType}_${linkId}`;
  const now = Date.now();
  if (BEACON_CACHE.has(key)) {
    return true;
  }
  BEACON_CACHE.set(key, now);
  return false;
}

/**
 * Real Client IP extraction with header precedence
 */
export function extractClientIp(request) {
  const headers = request.headers;
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor && xForwardedFor.trim()) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }

  const trueClientIp = headers.get('true-client-ip');
  if (trueClientIp && trueClientIp.trim()) {
    return trueClientIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Deterministic 32-character SHA-256 hash for privacy-preserving visitor uniqueness
 * Never stores raw IP addresses in plaintext (GDPR/CCPA compliant)
 */
export function hashVisitorIdentity(clientIp, userAgent) {
  const raw = `${clientIp || '127.0.0.1'}::${userAgent || 'unknown'}::${TELEMETRY_SALT}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

// ISO-2 to Full Country Name Dictionary
export const COUNTRY_NAMES = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  AU: 'Australia',
  BR: 'Brazil',
  JP: 'Japan',
  AE: 'United Arab Emirates',
  SG: 'Singapore',
  NL: 'Netherlands',
  SE: 'Sweden',
  ES: 'Spain',
  IT: 'Italy',
  MX: 'Mexico',
  KR: 'South Korea',
  ID: 'Indonesia',
  ZA: 'South Africa',
  NG: 'Nigeria',
  CH: 'Switzerland',
  PL: 'Poland',
  BE: 'Belgium',
  AT: 'Austria',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
  NZ: 'New Zealand',
  PT: 'Portugal',
  TR: 'Turkey',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  PH: 'Philippines',
  VN: 'Vietnam',
  TH: 'Thailand',
  MY: 'Malaysia',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  EG: 'Egypt',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  RU: 'Russia',
  UA: 'Ukraine',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  GL: 'Global'
};

/**
 * Extracts Country, Region, and City directly from Edge CDN Headers (Zero-Latency)
 */
export function extractGeoIntelligence(request) {
  const headers = request.headers;
  
  let rawCode = (
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code') ||
    'GL'
  ).toUpperCase().trim();

  // If local / private IP or missing
  if (!rawCode || rawCode === 'XX' || rawCode === 'T1' || rawCode.length !== 2) {
    rawCode = 'GL';
  }

  const countryName = COUNTRY_NAMES[rawCode] || (rawCode === 'GL' ? 'Global' : rawCode);

  const region = (
    headers.get('x-vercel-ip-country-region') ||
    headers.get('cf-region') ||
    headers.get('x-region') ||
    ''
  ).trim();

  const city = (
    headers.get('x-vercel-ip-city') ||
    headers.get('cf-ipcity') ||
    headers.get('x-city') ||
    ''
  ).trim();

  return {
    country_code: rawCode,
    country: countryName,
    region: region || 'Unknown Region',
    city: city ? decodeURIComponent(city) : 'Unknown City'
  };
}

/**
 * Converts ISO-2 country code to emoji flag
 */
export function getCountryFlag(countryCode) {
  if (!countryCode || countryCode === 'GL' || countryCode.length !== 2) {
    return '🌐';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Device, Operating System & Browser Intelligence (including In-App WebViews)
 */
export function extractDeviceAndBrowser(request, userAgentString) {
  const ua = userAgentString || request.headers.get('user-agent') || '';
  
  // 1. Device Category
  let device = 'Desktop';
  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = 'Mobile';
  }

  // 2. Operating System
  let os = 'Other';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // 3. Browser & In-App WebViews
  let browser = 'Other';
  if (/Instagram/i.test(ua)) {
    browser = 'Instagram WebView';
  } else if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) {
    browser = 'TikTok WebView';
  } else if (/WhatsApp/i.test(ua)) {
    browser = 'WhatsApp';
  } else if (/LinkedInApp/i.test(ua)) {
    browser = 'LinkedIn WebView';
  } else if (/Twitter|TwitterAndroid|TwitterforiPhone/i.test(ua)) {
    browser = 'X / Twitter WebView';
  } else if (/FBAN|FBAV/i.test(ua)) {
    browser = 'Facebook WebView';
  } else if (/Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  } else if (/OPR|Opera/i.test(ua)) {
    browser = 'Opera';
  }

  // 4. Browser Language
  const acceptLanguage = request.headers.get('accept-language') || '';
  const language = acceptLanguage.split(',')[0]?.split(';')[0]?.trim() || 'en';

  return { device, os, browser, language };
}

/**
 * Traffic Attribution & Normalized Referrer Extraction
 */
export function extractAttribution(request, body = {}) {
  const rawReferrer = request.headers.get('referer') || body.referrer || '';
  
  // Extract UTM tags from query params or body
  let urlObj = null;
  try {
    urlObj = new URL(request.url);
  } catch (e) {
    urlObj = null;
  }

  const utm_source = urlObj?.searchParams.get('utm_source') || body.utm_source || '';
  const utm_medium = urlObj?.searchParams.get('utm_medium') || body.utm_medium || '';
  const utm_campaign = urlObj?.searchParams.get('utm_campaign') || body.utm_campaign || '';
  const utm_term = urlObj?.searchParams.get('utm_term') || body.utm_term || '';
  const utm_content = urlObj?.searchParams.get('utm_content') || body.utm_content || '';

  let source = 'Direct';
  if (utm_source) {
    source = utm_source.charAt(0).toUpperCase() + utm_source.slice(1);
  } else if (rawReferrer) {
    const refLower = rawReferrer.toLowerCase();
    if (refLower.includes('youtube.com') || refLower.includes('youtu.be')) {
      source = 'YouTube';
    } else if (refLower.includes('instagram.com')) {
      source = 'Instagram';
    } else if (refLower.includes('t.co') || refLower.includes('twitter.com') || refLower.includes('x.com')) {
      source = 'X / Twitter';
    } else if (refLower.includes('tiktok.com')) {
      source = 'TikTok';
    } else if (refLower.includes('facebook.com') || refLower.includes('fb.com')) {
      source = 'Facebook';
    } else if (refLower.includes('linkedin.com') || refLower.includes('lnkd.in')) {
      source = 'LinkedIn';
    } else if (refLower.includes('google.')) {
      source = 'Google Search';
    } else if (refLower.includes('reddit.com')) {
      source = 'Reddit';
    } else if (refLower.includes('pinterest.')) {
      source = 'Pinterest';
    } else if (refLower.includes('discord.')) {
      source = 'Discord';
    } else {
      try {
        const parsed = new URL(rawReferrer);
        source = parsed.hostname.replace(/^www\./, '');
      } catch (e) {
        source = 'External Referrer';
      }
    }
  }

  return {
    referrer: rawReferrer,
    source,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  };
}

/**
 * Crawler & Bot Detection
 */
export function isBotOrCrawler(userAgentString) {
  const ua = (userAgentString || '').toLowerCase();
  if (isbot(ua)) return true;

  const botPatterns = [
    'facebookexternalhit',
    'whatsapp',
    'twitterbot',
    'telegrambot',
    'slackbot',
    'googlebot',
    'bingbot',
    'yandexbot',
    'duckduckbot',
    'baiduspider',
    'curl',
    'wget',
    'headlesschrome',
    'python-requests',
    'postmanruntime',
    'insomnia',
    'bot',
    'spider',
    'crawler',
    'lighthouse',
    'pagespeed'
  ];

  return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Convenience helper extracting comprehensive telemetry metadata from an incoming HTTP request
 */
export function extractVisitorTelemetry(request, body = {}) {
  const clientIp = extractClientIp(request);
  const uaString = request?.headers?.get?.('user-agent') || '';
  const ip_hash = hashVisitorIdentity(clientIp, uaString);
  const geo = extractGeoIntelligence(request);
  const dev = extractDeviceAndBrowser(request, uaString);
  const attr = extractAttribution(request, typeof body === 'object' && body !== null ? body : {});
  const is_bot = isBotOrCrawler(uaString);

  return {
    clientIp,
    ip_hash,
    country: geo.country,
    country_code: geo.country_code,
    region: geo.region,
    city: geo.city,
    device: dev.device,
    os: dev.os,
    browser: dev.browser,
    language: dev.language,
    referrer: attr.referrer,
    source: attr.source,
    utm_source: attr.utm_source,
    utm_medium: attr.utm_medium,
    utm_campaign: attr.utm_campaign,
    utm_term: attr.utm_term,
    utm_content: attr.utm_content,
    is_bot,
  };
}

