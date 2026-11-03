// Geo-targeted links: one country list and one visibility rule for the link
// editor, the Studio's "View as" preview and the public page.

export const GEO_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'EU', name: 'European Union', flag: '🇪🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
];

const EU_MEMBERS = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);

// Older profiles stored the UK as "UK"; visitors arrive with ISO "GB".
const normalize = (code) => {
  const value = String(code || '').toUpperCase().trim();
  return value === 'UK' ? 'GB' : value;
};

function targetMatches(target, country) {
  if (target === country) return true;
  // "European Union" covers visitors from any member state.
  return (target === 'EU' && EU_MEMBERS.has(country)) || (country === 'EU' && EU_MEMBERS.has(target));
}

/**
 * Whether a visitor from `country` sees `link`. An unknown country (no CDN
 * header, local development, "global") sees every link.
 */
export function isLinkVisibleInCountry(link, country) {
  const rule = link?.geoTargeting;
  if (!rule?.enabled || !Array.isArray(rule.countries) || rule.countries.length === 0) return true;
  const visitor = normalize(country);
  if (!visitor || visitor === 'GLOBAL' || visitor === 'GL') return true;
  const isMatch = rule.countries.map(normalize).some((target) => targetMatches(target, visitor));
  return (rule.mode || 'include') === 'exclude' ? !isMatch : isMatch;
}

/** Visitor country from CDN headers (Vercel / Cloudflare), or '' when unknown. */
export function getVisitorCountry(headers) {
  const code = normalize(headers?.get('x-vercel-ip-country') || headers?.get('cf-ipcountry') || headers?.get('x-country-code'));
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1' ? code : '';
}
