import { NextResponse } from 'next/server';
import dns from 'dns';
import connectToDatabase from '@/lib/mongodb';
import CustomDomain from '@/models/CustomDomain';

// Ensure DNS queries use authoritative public resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

import { DOMAIN_TARGET_CNAME as TARGET_CNAME, DOMAIN_TARGET_IP as TARGET_IP } from '@/constants/domains';

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

/**
 * POST /api/v1/domains/verify
 * 
 * In-App DNS Verification Engine
 * Checks CNAME (creataurus.work.gd) and A record (159.54.139.45) via live DNS queries.
 * When verified, marks verified = true in MongoDB, allowing Caddy On-Demand TLS
 * to immediately issue and maintain free SSL certificates.
 */
export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const domainId = body.domainId || body.id;
    const rawHostname = body.hostname || body.domain;

    if (!domainId && !rawHostname) {
      return NextResponse.json(
        { success: false, error: 'Domain ID or hostname is required to verify DNS.' },
        { status: 400 }
      );
    }

    const query = domainId ? { _id: domainId } : { hostname: sanitizeHostname(rawHostname) };
    const domainRecord = await CustomDomain.findOne(query);

    if (!domainRecord) {
      return NextResponse.json(
        { success: false, error: 'Custom domain record not found in database.' },
        { status: 404 }
      );
    }

    const hostname = domainRecord.hostname;
    let resolvedCnames = [];
    let resolvedIps = [];
    let isCnameOk = false;
    let isIpOk = false;
    let dnsErrors = [];

    // 1. Check CNAME records
    try {
      const cnames = await dns.promises.resolveCname(hostname);
      resolvedCnames = cnames.map((c) => c.toLowerCase().replace(/\.$/, ''));
      isCnameOk = resolvedCnames.some(
        (c) => c === TARGET_CNAME || c.includes(TARGET_CNAME)
      );
    } catch (err) {
      dnsErrors.push(`CNAME lookup: ${err.code || err.message}`);
    }

    // 2. Check A records (for root/apex domains or direct A record setups)
    try {
      const ips = await dns.promises.resolve4(hostname);
      resolvedIps = ips;
      isIpOk = ips.includes(TARGET_IP);
    } catch (err) {
      dnsErrors.push(`A record lookup: ${err.code || err.message}`);
    }

    const isVerified = isCnameOk || isIpOk;
    const now = new Date();

    domainRecord.lastCheckedAt = now;
    domainRecord.dnsResolvedCnames = resolvedCnames;
    domainRecord.dnsResolvedIps = resolvedIps;

    if (isVerified) {
      domainRecord.verified = true;
      domainRecord.status = 'verified';
      domainRecord.verifiedAt = domainRecord.verifiedAt || now;
      domainRecord.verificationMethod = isCnameOk ? 'cname' : 'a_record';
      domainRecord.lastDnsCheckError = '';
      await domainRecord.save();

      return NextResponse.json({
        success: true,
        verified: true,
        message: `🎉 Domain ${hostname} verified successfully! Caddy Automatic TLS is now active.`,
        domain: domainRecord,
        diagnostics: {
          matchedRule: isCnameOk ? `CNAME points to ${TARGET_CNAME}` : `A record points to ${TARGET_IP}`,
          resolvedCnames,
          resolvedIps,
          sslReady: true,
        },
      });
    } else {
      domainRecord.verified = false;
      domainRecord.status = 'failed';
      const diagnosticMsg =
        `DNS not pointed correctly yet. Found CNAMEs: [${resolvedCnames.join(', ') || 'none'}], IPs: [${resolvedIps.join(', ') || 'none'}]. Expected CNAME "${TARGET_CNAME}" or IP "${TARGET_IP}".`;
      domainRecord.lastDnsCheckError = diagnosticMsg;
      await domainRecord.save();

      return NextResponse.json({
        success: false,
        verified: false,
        message: 'DNS verification failed. Records have not propagated yet or are misconfigured.',
        error: diagnosticMsg,
        domain: domainRecord,
        diagnostics: {
          resolvedCnames,
          resolvedIps,
          expectedCname: TARGET_CNAME,
          expectedIp: TARGET_IP,
          dnsErrors,
        },
      });
    }
  } catch (error) {
    console.error('Domain verify error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
