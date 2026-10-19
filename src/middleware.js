import { NextResponse } from 'next/server';

// Platform hostnames that should bypass custom domain routing
const PLATFORM_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'creataurus.work.gd',
  'tiny-url-self.vercel.app',
  'treeinbio.com',
];

// Simple in-memory cache for domain-to-username mappings in Edge runtime
const domainCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function cleanHost(rawHost) {
  if (!rawHost) return '';
  return rawHost
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/\.$/, '');
}

function isPlatformHost(host) {
  if (!host) return true;
  return (
    PLATFORM_HOSTS.includes(host) ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.treeinbio.com') ||
    host.includes('localhost')
  );
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Skip Next.js internal assets, public files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/static/') ||
    pathname.includes('.') // Static files (.ico, .png, .jpg, .svg, .css, .js)
  ) {
    return NextResponse.next();
  }

  // 2. Identify incoming Host (Caddy passes X-Original-Host or X-Forwarded-Host)
  const incomingHost =
    request.headers.get('x-original-host') ||
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    '';

  const host = cleanHost(incomingHost);

  // 3. If it's standard platform traffic, proceed normally
  if (isPlatformHost(host)) {
    return NextResponse.next();
  }

  // 4. Custom Domain Routing: Resolve host to creator username
  let creatorUsername = null;
  const now = Date.now();
  const cached = domainCache.get(host);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    creatorUsername = cached.username;
  } else {
    try {
      const resolveUrl = new URL(`/api/v1/internal/domain-resolve?domain=${encodeURIComponent(host)}`, request.url);
      const res = await fetch(resolveUrl.toString(), {
        headers: { 'x-middleware-internal': '1' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.username) {
          creatorUsername = data.username;
          domainCache.set(host, { username: data.username, timestamp: now });
        }
      }
    } catch (err) {
      console.error(`Middleware custom domain lookup failed for ${host}:`, err);
    }
  }

  // 5. Rewrite to the creator's profile page while keeping the custom domain in address bar
  if (creatorUsername) {
    const rewritePath = pathname === '/' ? `/${creatorUsername}` : `/${creatorUsername}${pathname}`;
    const rewriteUrl = new URL(rewritePath, request.url);

    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set('x-custom-domain', host);
    response.headers.set('x-creator-username', creatorUsername);
    return response;
  }

  // Fallback: If domain was pointed but not resolved yet, rewrite to custom domain slug
  // so [username]/page.js can perform secondary fallback or display unclaimed domain screen
  const fallbackUrl = new URL(`/${host}${pathname === '/' ? '' : pathname}`, request.url);
  const response = NextResponse.rewrite(fallbackUrl);
  response.headers.set('x-custom-domain', host);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
