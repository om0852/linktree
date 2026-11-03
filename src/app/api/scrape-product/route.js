import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { requireAuth } from '@/lib/authorization';
import { consumeRateLimit } from '@/lib/rateLimit';
import { isPrivateAddress } from '@/lib/ipAddress';

/**
 * GET the page from the already-validated address. Connecting by that address
 * (instead of letting the client resolve the hostname again) stops a DNS
 * rebinding answer from sending the request to an internal host. Redirects are
 * not followed, since their target was never validated.
 */
function fetchPinned(urlObj, { address, family }, { headers, timeoutMs = 6000, maxBytes = 1_000_000 }) {
  const client = urlObj.protocol === 'https:' ? https : http;
  const lookup = (_hostname, options, callback) => (options?.all
    ? callback(null, [{ address, family }])
    : callback(null, address, family));
  return new Promise((resolve, reject) => {
    const req = client.request(urlObj, { method: 'GET', headers, lookup, timeout: timeoutMs }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxBytes) {
          req.destroy(new Error('The product page is too large to process.'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 300,
        contentType: String(res.headers['content-type'] || ''),
        body: Buffer.concat(chunks).toString('utf8'),
      }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('The product page took too long to respond.')));
    req.on('error', reject);
    req.end();
  });
}

async function scrapeUrl(url) {
  if (!url || typeof url !== 'string') {
    return { error: 'Valid URL is required', status: 400 };
  }

  // Default metadata fallback from URL
  let urlObj;
  try { urlObj = new URL(url); } catch { return { error: 'Valid URL is required', status: 400 }; }
  if (!['http:', 'https:'].includes(urlObj.protocol) || urlObj.username || urlObj.password || !urlObj.hostname) {
    return { error: 'Only public HTTP or HTTPS product URLs are allowed.', status: 400 };
  }
  const resolved = isIP(urlObj.hostname)
    ? [{ address: urlObj.hostname, family: isIP(urlObj.hostname) }]
    : await dns.lookup(urlObj.hostname, { all: true }).catch(() => []);
  if (!resolved.length || resolved.some(({ address }) => isPrivateAddress(address))) {
    return { error: 'The product URL must resolve to a public internet address.', status: 400 };
  }
  const domain = urlObj.hostname.replace(/^www\./, '');

  let title = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Product`;
  let description = '';
  let image = '';
  let price = '';
  let currency = '$';

  try {
    // Every address was checked above; prefer IPv4, which every network can reach.
    const target = resolved.find(({ family }) => family === 4) || resolved[0];
    const res = await fetchPinned(urlObj, target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (res.ok) {
      if (!res.contentType.toLowerCase().includes('text/html')) return { error: 'The URL did not return an HTML product page.', status: 415 };
      const html = res.body;

      // Extract Title
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (ogTitle && ogTitle[1]) {
        title = ogTitle[1].trim().replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      }

      // Extract Image
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImage && ogImage[1]) {
        image = ogImage[1].trim();
        if (image.startsWith('//')) image = `https:${image}`;
      }

      // Extract Description
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (ogDesc && ogDesc[1]) {
        description = ogDesc[1].trim();
      }

      // Extract Price & Currency
      const ogPrice = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/["']price["']\s*:\s*["']?([0-9]+\.?[0-9]*)["']?/i);
      if (ogPrice && ogPrice[1]) {
        price = ogPrice[1].trim();
      }

      const ogCurrency = html.match(/<meta[^>]*property=["']og:price:currency["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*property=["']product:price:currency["'][^>]*content=["']([^"']+)["']/i);
      if (ogCurrency && ogCurrency[1]) {
        const curr = ogCurrency[1].trim().toUpperCase();
        if (curr === 'USD') currency = '$';
        else if (curr === 'EUR') currency = '€';
        else if (curr === 'GBP') currency = '£';
        else if (curr === 'INR') currency = '₹';
        else currency = `${curr} `;
      }
    }
  } catch (fetchErr) {
    console.warn('Scrape fetch warning:', fetchErr.message);
  }

  if (!image) {
    image = '';
  }

  return {
    success: true,
    product: {
      title: title.slice(0, 80),
      description: description.slice(0, 160),
      price: price ? `${currency}${price}` : `${currency}29.99`,
      url: urlObj.toString(),
      imageUrl: image,
      domain,
    },
    // Also provide metadata alias for backward compatibility
    metadata: {
      title: title.slice(0, 80),
      description: description.slice(0, 160),
      image,
      price: price ? `${currency}${price}` : `${currency}29.99`,
      domain,
    }
  };
}

// The scraper makes outbound requests on the caller's behalf, so it is limited
// to signed-in creators and rate limited per client.
async function guardScraper(req) {
  const access = await requireAuth(req);
  if (access.error) return access.error;
  const rate = consumeRateLimit(req, 'scrape-product', 30, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ success: false, error: 'Too many product lookups. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
  return null;
}

export async function POST(req) {
  try {
    const denied = await guardScraper(req);
    if (denied) return denied;
    const { url } = await req.json();
    const result = await scrapeUrl(url);
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const denied = await guardScraper(req);
    if (denied) return denied;
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const result = await scrapeUrl(url);
    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status || 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

