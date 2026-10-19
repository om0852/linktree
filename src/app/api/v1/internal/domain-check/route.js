import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomDomain from '@/models/CustomDomain';

/**
 * Caddy On-Demand TLS "Ask" Endpoint
 * 
 * Used by Caddy reverse proxy to verify that a custom domain is claimed
 * and verified in TreeInBio before issuing or renewing an SSL certificate.
 * 
 * @param request - Next.js Request with query param `?domain=...`
 * @returns HTTP 200 OK if verified (Caddy proceeds with Let's Encrypt TLS handshake)
 *          HTTP 404 Not Found if unverified (Caddy drops handshake, protecting against DDoS)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDomain = searchParams.get('domain') || searchParams.get('hostname');

    if (!rawDomain) {
      return new NextResponse('Missing domain query parameter', { status: 400 });
    }

    // Sanitize domain: strip protocol, trailing slashes, and ports
    const cleanDomain = rawDomain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/\.$/, '');

    if (!cleanDomain) {
      return new NextResponse('Invalid domain parameter', { status: 400 });
    }

    await connectToDatabase();

    // Query database for verified custom domain
    const domainRecord = await CustomDomain.findOne({
      hostname: cleanDomain,
      verified: true,
    }).lean();

    if (!domainRecord) {
      // 404 instructs Caddy to abort TLS issuance
      return NextResponse.json(
        {
          allowed: false,
          error: 'Domain is not registered or not yet verified in TreeInBio',
          domain: cleanDomain,
        },
        { status: 404 }
      );
    }

    // 200 instructs Caddy that SSL certificate generation is authorized
    return NextResponse.json(
      {
        allowed: true,
        domain: cleanDomain,
        username: domainRecord.username,
        verifiedAt: domainRecord.verifiedAt,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Caddy Ask Endpoint Error:', error);
    return NextResponse.json(
      {
        allowed: false,
        error: 'Internal verification error',
      },
      { status: 500 }
    );
  }
}
