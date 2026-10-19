import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  extractClientIp, 
  hashVisitorIdentity, 
  extractGeoIntelligence, 
  extractDeviceAndBrowser, 
  extractAttribution, 
  isBotOrCrawler, 
  isDuplicateBeacon,
  getCountryFlag,
  COUNTRY_NAMES
} from '../src/lib/telemetry.js';

test('Telemetry Engine Unit Suite', async (t) => {
  await t.test('Client IP Extraction Precedence', () => {
    // 1. cf-connecting-ip has highest priority
    const req1 = {
      headers: new Headers({
        'cf-connecting-ip': '1.1.1.1',
        'x-forwarded-for': '2.2.2.2, 3.3.3.3',
        'x-real-ip': '4.4.4.4'
      })
    };
    assert.equal(extractClientIp(req1), '1.1.1.1');

    // 2. x-forwarded-for first IP has second priority
    const req2 = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195, 10.0.0.1',
        'x-real-ip': '4.4.4.4'
      })
    };
    assert.equal(extractClientIp(req2), '203.0.113.195');

    // 3. x-real-ip has third priority
    const req3 = {
      headers: new Headers({
        'x-real-ip': '198.51.100.22'
      })
    };
    assert.equal(extractClientIp(req3), '198.51.100.22');

    // 4. Fallback to 127.0.0.1
    const req4 = {
      headers: new Headers({})
    };
    assert.equal(extractClientIp(req4), '127.0.0.1');
  });

  await t.test('Deterministic SHA-256 Privacy Hash', () => {
    const ip = '203.0.113.50';
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
    const hash1 = hashVisitorIdentity(ip, ua);
    const hash2 = hashVisitorIdentity(ip, ua);

    // Must be deterministic
    assert.equal(hash1, hash2);
    // Must be 32 characters
    assert.equal(hash1.length, 32);
    // Must not contain raw IP
    assert.equal(hash1.includes('203.0.113.50'), false);
    // Different IP must yield different hash
    const hashDiff = hashVisitorIdentity('198.51.100.1', ua);
    assert.notEqual(hash1, hashDiff);
  });

  await t.test('Zero-Latency Edge Geo Intelligence Extraction', () => {
    const req = {
      headers: new Headers({
        'cf-ipcountry': 'IN',
        'cf-region': 'Maharashtra',
        'cf-ipcity': 'Mumbai'
      })
    };
    const geo = extractGeoIntelligence(req);
    assert.equal(geo.country_code, 'IN');
    assert.equal(geo.country, 'India');
    assert.equal(geo.region, 'Maharashtra');
    assert.equal(geo.city, 'Mumbai');
    assert.equal(getCountryFlag('IN'), '🇮🇳');
    assert.equal(getCountryFlag('US'), '🇺🇸');
  });

  await t.test('Device & In-App WebView Detection', () => {
    // 1. Mobile & Instagram WebView
    const reqInsta = {
      headers: new Headers({
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 310.0',
        'accept-language': 'en-US,en;q=0.9'
      })
    };
    const devInsta = extractDeviceAndBrowser(reqInsta);
    assert.equal(devInsta.device, 'Mobile');
    assert.equal(devInsta.os, 'iOS');
    assert.equal(devInsta.browser, 'Instagram WebView');
    assert.equal(devInsta.language, 'en-US');

    // 2. Desktop & Chrome
    const reqDesktop = {
      headers: new Headers({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      })
    };
    const devDesk = extractDeviceAndBrowser(reqDesktop);
    assert.equal(devDesk.device, 'Desktop');
    assert.equal(devDesk.os, 'Windows');
    assert.equal(devDesk.browser, 'Chrome');
  });

  await t.test('Traffic Attribution & Normalized Source', () => {
    // 1. YouTube attribution
    const reqYt = {
      url: 'https://treeinbio.com/creator',
      headers: new Headers({
        'referer': 'https://www.youtube.com/watch?v=xyz'
      })
    };
    const attrYt = extractAttribution(reqYt);
    assert.equal(attrYt.source, 'YouTube');

    // 2. UTM Source Override
    const reqUtm = {
      url: 'https://treeinbio.com/creator?utm_source=newsletter&utm_medium=email',
      headers: new Headers({})
    };
    const attrUtm = extractAttribution(reqUtm);
    assert.equal(attrUtm.source, 'Newsletter');
    assert.equal(attrUtm.utm_medium, 'email');

    // 3. Direct attribution
    const reqDirect = {
      url: 'https://treeinbio.com/creator',
      headers: new Headers({})
    };
    const attrDirect = extractAttribution(reqDirect);
    assert.equal(attrDirect.source, 'Direct');
  });

  await t.test('Crawler & Automated Bot Filtering', () => {
    assert.equal(isBotOrCrawler('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'), true);
    assert.equal(isBotOrCrawler('Twitterbot/1.0'), true);
    assert.equal(isBotOrCrawler('Googlebot/2.1 (+http://www.google.com/bot.html)'), true);
    assert.equal(isBotOrCrawler('curl/8.4.0'), true);
    assert.equal(isBotOrCrawler('Mozilla/5.0 (compatible; HeadlessChrome/119.0.0.0)'), true);
    // Real human browser
    assert.equal(isBotOrCrawler('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36'), false);
  });

  await t.test('Beacon Deduplication Cache', () => {
    const target = 'creator_test';
    const hash = 'sample_hash_dedup_test_123';
    
    // First beacon should pass
    const isDup1 = isDuplicateBeacon(target, hash, 'view', '');
    assert.equal(isDup1, false);

    // Second immediate beacon should be caught as duplicate
    const isDup2 = isDuplicateBeacon(target, hash, 'view', '');
    assert.equal(isDup2, true);
  });
});
