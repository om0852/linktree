// Whether an address is off-limits for server-side fetches (SSRF): loopback,
// private, link-local, carrier-grade NAT, benchmarking, multicast/reserved,
// documentation ranges, and IPv4 addresses hidden inside IPv6 forms. Public
// IPv4 and IPv6 addresses are allowed; anything that is not an IP is refused.
import { isIP } from 'node:net';

function isPrivateV4([a, b, c]) {
  return a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) || (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113) || a >= 224;
}

const v4Parts = (ip) => ip.split('.').map(Number);
const fromHextets = (high, low) => [high >> 8, high & 0xff, low >> 8, low & 0xff];

// "2001:db8::1" or "::ffff:1.2.3.4" → eight 16-bit numbers.
function expandV6(ip) {
  let text = ip;
  const tail = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const [a, b, c, d] = v4Parts(tail[1]);
    text = `${text.slice(0, -tail[1].length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, rest] = text.split('::');
  const left = head ? head.split(':') : [];
  const right = rest !== undefined && rest ? rest.split(':') : [];
  const missing = 8 - left.length - right.length;
  const groups = rest !== undefined ? [...left, ...Array(missing).fill('0'), ...right] : left;
  return groups.map((group) => parseInt(group, 16));
}

function isPrivateV6(ip) {
  const h = expandV6(ip);
  if (h.length !== 8 || h.some((x) => !Number.isInteger(x) || x < 0 || x > 0xffff)) return true;
  const zeroUntil = (n) => h.slice(0, n).every((x) => x === 0);
  if (zeroUntil(8) || (zeroUntil(7) && h[7] === 1)) return true; // :: and ::1
  if (zeroUntil(5) && h[5] === 0xffff) return isPrivateV4(fromHextets(h[6], h[7])); // ::ffff:a.b.c.d
  if (zeroUntil(6)) return true; // deprecated ::a.b.c.d
  if (h[0] === 0x64 && h[1] === 0xff9b && h.slice(2, 6).every((x) => x === 0)) return isPrivateV4(fromHextets(h[6], h[7])); // NAT64
  if (h[0] === 0x2002) return isPrivateV4(fromHextets(h[1], h[2])); // 6to4
  if (h[0] === 0x2001 && h[1] === 0) return true; // Teredo
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true; // documentation
  if (h[0] === 0x0100 && h[1] === 0 && h[2] === 0 && h[3] === 0) return true; // discard
  if ((h[0] & 0xfe00) === 0xfc00) return true; // unique local fc00::/7
  if ((h[0] & 0xffc0) === 0xfe80 || (h[0] & 0xffc0) === 0xfec0) return true; // link/site-local
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

export function isPrivateAddress(address) {
  const ip = String(address || '').trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  const version = isIP(ip);
  if (version === 4) return isPrivateV4(v4Parts(ip));
  if (version === 6) return isPrivateV6(ip);
  return true;
}
