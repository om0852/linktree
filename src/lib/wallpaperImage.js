// Photo wallpapers: what is stored, how it is checked, and how it is drawn.
// Shared by the profile API, the MCP tools, the Studio preview and the public page.
import { getImageOverlayColor, isImageWallpaper } from './theme-contrast.js';

export const MEDIA_URL = /^\/api\/media\/[a-f0-9]{24}$/;
export const OVERLAY_MODES = ['auto', 'none', 'dark', 'light'];
export const MAX_WALLPAPER_BLUR = 24;
const HEX = /^#[0-9a-f]{6}$/i;

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

/** Colours measured from a photo at upload; anything malformed is dropped. */
export function sanitizeImageMeta(meta) {
  if (!meta || typeof meta !== 'object') return null;
  const color = (value) => (typeof value === 'string' && HEX.test(value) ? value.toLowerCase() : null);
  const clean = {
    avg: color(meta.avg),
    dark: color(meta.dark),
    light: color(meta.light),
    top: color(meta.top),
    palette: Array.isArray(meta.palette) ? meta.palette.map(color).filter(Boolean).slice(0, 6) : [],
    width: Math.round(clampNumber(meta.width, 0, 10000, 0)),
    height: Math.round(clampNumber(meta.height, 0, 10000, 0)),
    smallWidth: Math.round(clampNumber(meta.smallWidth, 0, 10000, 0)),
  };
  return clean.avg && clean.dark && clean.light ? clean : null;
}

/** Image source for a wallpaper: https, or a photo uploaded to TreeInBio. */
export function safeWallpaperImageUrl(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (MEDIA_URL.test(url)) return url;
  try {
    return new URL(url).protocol === 'https:' && url.length <= 2048 ? url : '';
  } catch {
    return '';
  }
}

/** The photo fields of a saved wallpaper, checked. */
export function sanitizeWallpaperImage(wallpaper = {}) {
  const imageUrl = safeWallpaperImageUrl(wallpaper.imageUrl || wallpaper.blurImage || '');
  return {
    imageUrl,
    blurImage: imageUrl,
    focalX: clampNumber(wallpaper.focalX, 0, 100, 50),
    focalY: clampNumber(wallpaper.focalY, 0, 100, 50),
    overlay: OVERLAY_MODES.includes(wallpaper.overlay) ? wallpaper.overlay : 'auto',
    overlayOpacity: clampNumber(wallpaper.overlayOpacity, 0, 0.85, 0.4),
    blur: clampNumber(wallpaper.blur, 0, MAX_WALLPAPER_BLUR, 0),
    // Measurements only count for our own uploads; a pasted link is unmeasured.
    imageMeta: MEDIA_URL.test(imageUrl) ? sanitizeImageMeta(wallpaper.imageMeta) : null,
  };
}

/** JPEG, PNG or WebP by their first bytes; anything else (SVG, HTML, ...) is refused. */
export function sniffImageType(bytes) {
  if (!bytes || bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/**
 * Everything needed to draw a photo wallpaper, or null for other wallpapers.
 * The photo fills the screen (not the scrolling page), cropped around the
 * focal point, so it looks the same on a phone, a tablet and a wide monitor.
 */
export function getWallpaperImageLayer(wallpaper) {
  if (!isImageWallpaper(wallpaper)) return null;
  const clean = sanitizeWallpaperImage(wallpaper);
  if (!clean.imageUrl) return null;
  const meta = clean.imageMeta;
  const uploaded = MEDIA_URL.test(clean.imageUrl);
  let srcSet;
  let sizes;
  if (uploaded && meta?.width && meta?.height && meta.smallWidth) {
    srcSet = `${clean.imageUrl}?size=small ${meta.smallWidth}w, ${clean.imageUrl} ${meta.width}w`;
    // Cropped to cover the screen, the photo is as wide as the screen, or wider
    // when the screen is taller than the photo (a landscape photo on a phone).
    const ratio = (meta.width / meta.height).toFixed(4);
    sizes = `(max-aspect-ratio: ${meta.width}/${meta.height}) calc(100vh * ${ratio}), 100vw`;
  }
  const blur = wallpaper.type === 'blur' && !clean.blur ? 12 : clean.blur;
  return {
    src: clean.imageUrl,
    srcSet,
    sizes,
    objectPosition: `${clean.focalX}% ${clean.focalY}%`,
    blur,
    overlay: getImageOverlayColor({ ...wallpaper, ...clean }),
    placeholder: meta?.avg || '#1f2937',
  };
}
