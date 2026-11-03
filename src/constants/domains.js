/**
 * TreeInBio - Custom Domain & DNS Target Constants
 */

export const DOMAIN_TARGET_CNAME = 'linktree.work.gd';
export const DOMAIN_TARGET_IP = '159.54.139.45';

// Ownership proof: a TXT record at `${DOMAIN_VERIFICATION_PREFIX}.<hostname>`
// whose value is the domain record's verificationToken.
export const DOMAIN_VERIFICATION_PREFIX = '_treeinbio-verify';

export function domainVerificationRecordName(hostname) {
  return `${DOMAIN_VERIFICATION_PREFIX}.${hostname}`;
}

export const RESERVED_PLATFORM_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'linktree.work.gd',
  'creataurus.work.gd',
  'linktree-sigma-eight.vercel.app',
  'treeinbio.com',
  'treeinbio.me',
  'treeinbio.vercel.app',
  'vercel.app',
];

export const RESERVED_HOSTNAMES = RESERVED_PLATFORM_HOSTS;

