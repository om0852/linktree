import { NextResponse } from 'next/server';

async function scrapeUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { error: 'Valid URL is required', status: 400 };
  }

  // Default metadata fallback from URL
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace(/^www\./, '');

  let title = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Product`;
  let description = '';
  let image = '';
  let price = '';
  let currency = '$';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();

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
    image = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80`;
  }

  return {
    success: true,
    product: {
      title: title.slice(0, 80),
      description: description.slice(0, 160),
      price: price ? `${currency}${price}` : `${currency}29.99`,
      url,
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

