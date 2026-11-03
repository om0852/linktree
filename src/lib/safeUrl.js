const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const MEDIA_PROTOCOLS = new Set(['http:', 'https:']);

function isSameSitePath(value) {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

/**
 * Destination for a clickable link. Anything that is not http(s), mailto, tel,
 * a same-site path or '#' (for example `javascript:`) becomes '#'. A value
 * without a scheme such as `example.com/page` or `//example.com` is treated as https.
 */
export function safeLinkUrl(value) {
  if (typeof value !== 'string') return '#';
  const url = value.trim();
  if (!url || url === '#') return '#';
  if (isSameSitePath(url)) return url;
  let candidate = url;
  if (url.startsWith('//')) candidate = `https:${url}`;
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) candidate = `https://${url}`;
  try {
    const parsed = new URL(candidate);
    return LINK_PROTOCOLS.has(parsed.protocol) ? candidate : '#';
  } catch {
    return '#';
  }
}

/**
 * Source for an image or video. Allows http(s), same-site paths and, when
 * `allowDataImage` is set, inline `data:image/` uploads. Anything else becomes ''.
 */
export function safeMediaUrl(value, { allowDataImage = false } = {}) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  if (isSameSitePath(url)) return url;
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url)) return url;
  try {
    return MEDIA_PROTOCOLS.has(new URL(url).protocol) ? url : '';
  } catch {
    return '';
  }
}
