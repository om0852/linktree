import { NextResponse } from 'next/server';
import dns from 'dns';
import connectToDatabase from '@/lib/mongodb';
import CustomDomain from '@/models/CustomDomain';

// Ensure DNS lookups use ultra-fast, authoritative public nameservers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

import { DOMAIN_TARGET_CNAME as TARGET_CNAME, DOMAIN_TARGET_IP as TARGET_IP, RESERVED_HOSTNAMES } from '@/constants/domains';
import { requireAuth } from '@/lib/authorization';

function sanitizeHostname(raw) {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/\.$/, '');
}

function isValidDomain(hostname) {
  const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})+$/i;
  return domainRegex.test(hostname);
}

// GET /api/v1/domains?username=username
export async function GET(request) {
  try {
    await connectToDatabase();
    const access = await requireAuth(request);
    if (access.error) return access.error;
    const authUser = access.user;
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username')?.toLowerCase()?.trim();
    const username = rawUsername || authUser?.username;

    if (rawUsername && authUser.role !== 'admin' && rawUsername !== authUser.username) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });

    const query = username ? { username } : {};
    const domains = await CustomDomain.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      domains,
      instructions: {
        cname: {
          type: 'CNAME',
          target: TARGET_CNAME,
          recommendedFor: 'Subdomains (e.g., bio.yourbrand.com, links.yoursite.com)',
        },
        aRecord: {
          type: 'A',
          target: TARGET_IP,
          recommendedFor: 'Apex / Root domains (e.g., yoursite.com)',
        },
      },
    });
  } catch (error) {
    console.error('Domains GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/v1/domains (Add custom domain)
export async function POST(request) {
  try {
    await connectToDatabase();
    const access = await requireAuth(request);
    if (access.error) return access.error;
    const authUser = access.user;
    const body = await request.json();

    const rawHostname = body.hostname || body.domain;
    const rawUsername = body.username || authUser?.username;

    if (!rawHostname || !rawUsername) {
      return NextResponse.json(
        { success: false, error: 'Both hostname and username are required.' },
        { status: 400 }
      );
    }

    const hostname = sanitizeHostname(rawHostname);
    const username = rawUsername.toLowerCase().trim();

    if (authUser.username !== username && authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to add domains for another user.' },
        { status: 403 }
      );
    }

    if (!isValidDomain(hostname)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid domain format. Example: links.yourdomain.com or yourdomain.com',
        },
        { status: 400 }
      );
    }

    // Check if domain is a reserved system domain
    const isReserved = RESERVED_HOSTNAMES.some(
      (res) => hostname === res || hostname.endsWith(`.${res}`)
    );
    if (isReserved) {
      return NextResponse.json(
        { success: false, error: 'This domain is a reserved system host and cannot be added.' },
        { status: 400 }
      );
    }

    // Check if domain is already claimed
    const existing = await CustomDomain.findOne({ hostname });
    if (existing) {
      if (existing.username === username) {
        return NextResponse.json({
          success: true,
          message: 'Domain already registered to this profile.',
          domain: existing,
        });
      }
      return NextResponse.json(
        { success: false, error: 'This domain is already claimed by another user.' },
        { status: 409 }
      );
    }

    // Create new CustomDomain record
    const newDomain = await CustomDomain.create({
      hostname,
      username,
      verified: false,
      status: 'pending',
      target: TARGET_CNAME,
      expectedIp: TARGET_IP,
    });

    return NextResponse.json({
      success: true,
      message: 'Custom domain added successfully. Please configure your DNS records.',
      domain: newDomain,
      instructions: {
        cname: {
          type: 'CNAME',
          name: hostname.includes('.') ? hostname.split('.')[0] : 'bio',
          target: TARGET_CNAME,
        },
        aRecord: {
          type: 'A',
          name: '@',
          target: TARGET_IP,
        },
      },
    });
  } catch (error) {
    console.error('Domains POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/domains (Remove custom domain)
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const access = await requireAuth(request);
    if (access.error) return access.error;
    const authUser = access.user;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hostname = searchParams.get('hostname');

    if (!id && !hostname) {
      return NextResponse.json(
        { success: false, error: 'Domain id or hostname is required for deletion.' },
        { status: 400 }
      );
    }

    const query = id ? { _id: id } : { hostname: sanitizeHostname(hostname) };
    const domainRecord = await CustomDomain.findOne(query);

    if (!domainRecord) {
      return NextResponse.json({ success: false, error: 'Domain not found.' }, { status: 404 });
    }

    if (authUser.username !== domainRecord.username && authUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to delete this domain.' },
        { status: 403 }
      );
    }

    await CustomDomain.deleteOne({ _id: domainRecord._id });

    return NextResponse.json({
      success: true,
      message: `Domain ${domainRecord.hostname} was removed successfully.`,
    });
  } catch (error) {
    console.error('Domains DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
