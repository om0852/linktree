import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import CustomDomain from '@/models/CustomDomain';

/**
 * Internal Domain Resolver Endpoint
 * 
 * Used by Middleware and Server Components to map an incoming Host/X-Original-Host
 * header to the corresponding TreeInBio creator username.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDomain = searchParams.get('domain') || searchParams.get('hostname');

    if (!rawDomain) {
      return NextResponse.json({ success: false, message: 'Missing domain parameter' }, { status: 400 });
    }

    const cleanDomain = rawDomain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/\.$/, '');

    await connectToDatabase();

    const domainRecord = await CustomDomain.findOne({
      hostname: cleanDomain,
      verified: true,
    }).lean();

    if (!domainRecord) {
      return NextResponse.json(
        { success: false, message: 'Domain not found or unverified' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        domain: cleanDomain,
        username: domainRecord.username,
        verified: domainRecord.verified,
        status: domainRecord.status,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Domain Resolver Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
