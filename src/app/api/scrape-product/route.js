import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { isIP } from 'node:net';

function isPrivateAddress(address) {
  const ip = address.toLowerCase().split('%')[0];
  if (ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') || /^fe[89ab]/.test(ip)) return true;
  if (ip.startsWith('::ffff:')) return isPrivateAddress(ip.slice(7));
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) || parts[0] >= 224;
}

async function readLimitedBody(response, maxBytes = 1_000_000) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('The product page is too large to process.');
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
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
  const resolved = isIP(urlObj.hostname) ? [{ address: urlObj.hostname }] : await dns.lookup(urlObj.hostname, { all: true }).catch(() => []);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(urlObj, {
      signal: controller.signal,
      redirect: 'error',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('text/html')) return { error: 'The URL did not return an HTML product page.', status: 415 };
      const html = await readLimitedBody(res);

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

export async function POST(req) {
  try {
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

