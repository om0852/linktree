// Theme colour resolution shared by the Studio preview, the public page and
// the theme picker. Every text colour is checked against the page background
// and the card surface it sits on (WCAG AA, 4.5:1), and button text against
// the button fill, so a theme can never put dark text on a dark background.

const NAMED_COLORS = {
  white: '#ffffff', black: '#000000',
  'stone-50': '#fafaf9', 'stone-200': '#e7e5e4', 'stone-900': '#1c1917',
  'slate-900': '#0f172a', 'slate-950': '#020617',
  'emerald-400': '#34d399', 'emerald-500': '#10b981',
  'amber-700': '#b45309', 'rose-700': '#be123c', 'purple-800': '#5b21b6',
};

const DARK_TEXT = '#111827';
const LIGHT_TEXT = '#ffffff';
const AA = 4.5;

function parseColor(input) {
  if (!input) return null;
  const value = String(input).trim().toLowerCase().replace(/^(bg|text|from|via|to)-/, '');
  const hex = value.match(/#([\da-f]{3}|[\da-f]{6})\b/i);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) digits = digits.split('').map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255);
  }
  const named = NAMED_COLORS[value];
  return named ? parseColor(named) : null;
}

function toHex(rgb) {
  return `#${rgb.map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function mix(a, b, amount) {
  return a.map((channel, i) => channel * (1 - amount) + b[i] * amount);
}

function luminance(rgb) {
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a, b) {
  const left = luminance(a);
  const right = luminance(b);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

function minContrast(foreground, backgrounds) {
  const color = parseColor(foreground);
  return color ? Math.min(...backgrounds.map((background) => contrastRatio(color, background))) : 0;
}

// `bg-[#123456]`, `bg-white/20`, `bg-slate-900/90 backdrop-blur` → { rgb, alpha }
function parseSurface(className) {
  const token = String(className || '').split(/\s+/).find((part) => part.startsWith('bg-') && !part.startsWith('bg-gradient'));
  if (!token) return null;
  const [colorPart, alphaPart] = token.slice(3).replace(/^\[|\]/g, '').split('/');
  const rgb = parseColor(colorPart);
  if (!rgb) return null;
  const alpha = alphaPart ? Math.min(1, Number(alphaPart) / 100) : 1;
  return { rgb, alpha: Number.isFinite(alpha) ? alpha : 1 };
}

export function isImageWallpaper(wallpaper) {
  return ['image', 'blur'].includes(wallpaper?.type) && Boolean(wallpaper.imageUrl || wallpaper.blurImage);
}

// Colours measured from an uploaded photo (wallpaper.imageMeta). Without them
// (a pasted link) the photo could be anything, so plan for black and white.
function imageSamples(wallpaper) {
  const meta = wallpaper?.imageMeta || {};
  const measured = [meta.avg, meta.dark, meta.light, meta.top].map(parseColor).filter(Boolean);
  return measured.length >= 3 ? measured : [[0, 0, 0], [1, 1, 1]];
}

const OVERLAY_TONES = { dark: [0, 0, 0], light: [1, 1, 1] };

/**
 * The shade laid over a photo wallpaper so text reads on it: { tone, opacity }.
 * 'auto' picks the lightest dark or light shade that lets white or dark text
 * reach AA on every measured part of the photo.
 */
export function resolveImageOverlay(wallpaper) {
  const mode = ['auto', 'none', 'dark', 'light'].includes(wallpaper?.overlay) ? wallpaper.overlay : 'auto';
  if (mode === 'none') return { mode, tone: null, opacity: 0 };
  if (mode !== 'auto') {
    const requested = Number(wallpaper.overlayOpacity);
    return { mode, tone: mode, opacity: Number.isFinite(requested) ? Math.min(0.85, Math.max(0, requested)) : 0.4 };
  }
  const samples = imageSamples(wallpaper);
  let best = null;
  for (const tone of ['dark', 'light']) {
    for (let step = 2; step <= 17; step += 1) {
      const opacity = step / 20;
      if (best && opacity >= best.opacity) break;
      const shaded = samples.map((sample) => mix(sample, OVERLAY_TONES[tone], opacity));
      if (Math.max(minContrast(LIGHT_TEXT, shaded), minContrast(DARK_TEXT, shaded)) >= AA) {
        best = { mode, tone, opacity };
        break;
      }
    }
  }
  return best || { mode, tone: 'dark', opacity: 0.85 };
}

/** CSS colour of the photo overlay, or null when there is none. */
export function getImageOverlayColor(wallpaper) {
  const { tone, opacity } = resolveImageOverlay(wallpaper);
  if (!tone || !opacity) return null;
  const channel = tone === 'dark' ? 0 : 255;
  return `rgba(${channel}, ${channel}, ${channel}, ${opacity})`;
}

function pageSamples(preset, wallpaper) {
  if (wallpaper?.type === 'fill' && parseColor(wallpaper.value)) return [parseColor(wallpaper.value)];
  if (isImageWallpaper(wallpaper)) {
    const { tone, opacity } = resolveImageOverlay(wallpaper);
    return imageSamples(wallpaper).map((sample) => (tone ? mix(sample, OVERLAY_TONES[tone], opacity) : sample));
  }

  const background = wallpaper?.type === 'gradient' && wallpaper.gradient
    ? wallpaper.gradient
    : preset?.bg;
  const tokens = String(background || '').split(/\s+/);
  const colors = tokens
    .map((token) => token.replace(/^(bg|from|via|to)-/, '').replace(/^\[|\]$/g, ''))
    .map(parseColor)
    .filter(Boolean);
  return colors.length ? colors : [parseColor('#ffffff')];
}

// Card colour as it is actually seen: translucent cards blended over the page,
// and over another card (the laptop split layout nests cards in a card).
function cardSamples(preset, backgrounds, customCard) {
  // A custom card colour (customColors.card) is a solid surface.
  const custom = parseColor(customCard);
  if (custom) return [custom];
  const surface = parseSurface(preset?.cardBg);
  if (!surface) return [];
  const once = backgrounds.map((background) => mix(background, surface.rgb, surface.alpha));
  return surface.alpha < 1 ? [...once, ...once.map((card) => mix(card, surface.rgb, surface.alpha))] : once;
}

function pickReadable(candidates, surfaces) {
  for (const candidate of candidates) {
    if (candidate && minContrast(candidate, surfaces) >= AA) return toHex(parseColor(candidate));
  }
  const darkScore = minContrast(DARK_TEXT, surfaces);
  const lightScore = minContrast(LIGHT_TEXT, surfaces);
  return darkScore >= lightScore ? DARK_TEXT : LIGHT_TEXT;
}

function average(colors) {
  return colors.reduce((sum, color) => sum.map((channel, i) => channel + color[i] / colors.length), [0, 0, 0]);
}

function presetTextColor(preset) {
  const token = String(preset?.text || '').split(/\s+/).find((part) => part.startsWith('text-'));
  return token ? parseColor(token.replace(/^text-\[|\]$/g, '').replace(/^text-/, '')) : null;
}

/**
 * Title, body and muted text for a theme. Body and muted text are tints of the
 * title colour toward the background (so they belong to the palette instead of
 * a generic grey), and fall back to the title colour when a tint is too weak.
 */
export function getReadableThemeColors(preset, wallpaper, customColors = {}) {
  const backgrounds = pageSamples(preset, wallpaper);
  const isDark = backgrounds.reduce((sum, color) => sum + luminance(color), 0) / backgrounds.length < 0.35;
  const themeText = presetTextColor(preset);
  const safeDefault = isDark ? '#f8fafc' : '#1f2937';
  const titleCandidates = [customColors.title, customColors.titleColor, themeText && toHex(themeText), safeDefault];

  // Text must read on the page and on the theme's cards. A custom wallpaper
  // can make that impossible (black page, cream cards): then text follows the
  // page and the cards switch to a glass surface over it (cardsFollowPage).
  const customCard = parseColor(customColors.card) ? toHex(parseColor(customColors.card)) : null;
  let surfaces = [...backgrounds, ...cardSamples(preset, backgrounds, customCard)];
  let cardsFollowPage = false;
  // On a photo the theme's own cards would hide it, so cards become glass
  // unless the owner picked a card colour.
  const onImage = isImageWallpaper(wallpaper);
  if ((onImage && !customCard) || minContrast(pickReadable(titleCandidates, surfaces), surfaces) < AA) {
    surfaces = backgrounds;
    cardsFollowPage = true;
  }

  const title = pickReadable(titleCandidates, surfaces);
  const pageAverage = average(backgrounds);
  const tint = (amount) => toHex(mix(parseColor(title), pageAverage, amount));
  const body = pickReadable([customColors.pageText, customColors.pageTextColor, tint(0.18), tint(0.1), title], surfaces);
  const muted = pickReadable([tint(0.32), tint(0.24), tint(0.12), title], surfaces);
  // Accent colour used for text and icons (stats, prices); falls back to the title.
  const accent = pickReadable([preset?.accent, title], surfaces);
  return { isDark, title, body, muted, accent, cardsFollowPage, onImage, customCard: cardsFollowPage ? null : customCard };
}

/** Text colour for a filled button; keeps the requested colour when it is readable. */
export function getReadableButtonText(buttonColor, requestedText, fallbackText) {
  const fill = parseColor(buttonColor);
  if (!fill) return requestedText || LIGHT_TEXT;
  return pickReadable([requestedText, fallbackText], [fill]);
}

/**
 * Button colours taken from an uploaded photo: its most colourful tone,
 * lightened or darkened until the buttons stand out from the shaded photo.
 * Null when the photo was not measured (a pasted link).
 */
export function getPhotoButtonColors(wallpaper) {
  const palette = (wallpaper?.imageMeta?.palette || []).map(parseColor).filter(Boolean);
  if (!palette.length) return null;
  const backgrounds = pageSamples(null, wallpaper);
  const chroma = (rgb) => Math.max(...rgb) - Math.min(...rgb);
  const ranked = [...palette].sort((a, b) => chroma(b) - chroma(a));
  for (const base of ranked) {
    for (const shift of [0, 0.15, -0.15, 0.3, -0.3, 0.45, -0.45]) {
      const candidate = toHex(shift > 0 ? mix(base, [1, 1, 1], shift) : mix(base, [0, 0, 0], -shift));
      if (minContrast(candidate, backgrounds) >= 1.6) {
        return { button: candidate, buttonText: getReadableButtonText(candidate, null, LIGHT_TEXT) };
      }
    }
  }
  const fallback = toHex(ranked[0]);
  return { button: fallback, buttonText: getReadableButtonText(fallback, null, LIGHT_TEXT) };
}

/** Outline buttons draw their label on the page, so the label must read there. */
export function getReadableOutlineColor(buttonColor, preset, wallpaper, fallback) {
  const backgrounds = pageSamples(preset, wallpaper);
  return minContrast(buttonColor, backgrounds) >= 3 ? buttonColor : fallback;
}

/**
 * Glass buttons on a dark page: frosted white when white text still reads on
 * it, otherwise smoked glass (bright gradients such as Sunset). Light pages use
 * milky glass with the title colour.
 */
export function getGlassButtonColors(preset, wallpaper, readable) {
  if (!readable?.isDark) {
    return { background: 'rgba(255, 255, 255, 0.7)', color: readable?.title || '#333333', border: '1px solid rgba(255, 255, 255, 0.85)' };
  }
  const backgrounds = pageSamples(preset, wallpaper);
  const surfaces = readable.cardsFollowPage ? backgrounds : [...backgrounds, ...cardSamples(preset, backgrounds, readable.customCard)];
  const white = parseColor(LIGHT_TEXT);
  const frosted = surfaces.map((surface) => mix(surface, white, 0.12));
  if (Math.min(...frosted.map((surface) => contrastRatio(white, surface))) >= AA) {
    return { background: 'rgba(255, 255, 255, 0.12)', color: LIGHT_TEXT, border: '1px solid rgba(255, 255, 255, 0.35)' };
  }
  return { background: 'rgba(0, 0, 0, 0.28)', color: LIGHT_TEXT, border: '1px solid rgba(255, 255, 255, 0.3)' };
}

/**
 * Background colour of a theme card, as a CSS colour. Pass the resolved text
 * colours so cards follow the page when the theme's own card would not read.
 */
export function getThemeCardColor(preset, readable) {
  // Over a photo, smoked or milky glass only adds contrast for the text on it.
  if (readable?.cardsFollowPage && readable.onImage) return readable.isDark ? 'rgba(0, 0, 0, 0.32)' : 'rgba(255, 255, 255, 0.72)';
  if (readable?.cardsFollowPage) return readable.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.7)';
  if (readable?.customCard) return readable.customCard;
  const surface = parseSurface(preset?.cardBg);
  if (!surface) return null;
  const [r, g, b] = surface.rgb.map((channel) => Math.round(channel * 255));
  return surface.alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${surface.alpha})` : toHex(surface.rgb);
}

/** The wallpaper a preset applies, with named Tailwind colours resolved to hex. */
export function getPresetWallpaper(preset) {
  const bg = String(preset?.bg || '');
  if (bg.includes('gradient')) {
    return { type: 'gradient', value: '', gradient: bg.replace(/^bg-/, '') };
  }
  const rgb = parseColor(bg.replace(/^bg-\[|\]$/g, '').replace(/^bg-/, ''));
  return { type: 'fill', value: rgb ? toHex(rgb) : '#ffffff', gradient: '' };
}

/** Everything a theme paints, resolved and readable; used for previews and audits. */
export function getThemeAppearance(preset) {
  const wallpaper = getPresetWallpaper(preset);
  const colors = getReadableThemeColors(preset, wallpaper);
  const button = preset?.button || preset?.primary || '#16A34A';
  return {
    ...colors,
    wallpaper,
    card: getThemeCardColor(preset),
    button,
    buttonText: getReadableButtonText(button, preset?.buttonText, colors.isDark ? '#0b0b0f' : LIGHT_TEXT),
  };
}

/** Contrast problems in a resolved theme (empty when the theme is good). */
export function auditThemeAppearance(appearance, preset) {
  const backgrounds = pageSamples(preset, appearance.wallpaper);
  const surfaces = [...backgrounds, ...cardSamples(preset, backgrounds)];
  const problems = [];
  for (const role of ['title', 'body', 'muted', 'accent']) {
    if (minContrast(appearance[role], surfaces) < AA) problems.push(role);
  }
  if (minContrast(appearance.buttonText, [parseColor(appearance.button)]) < AA) problems.push('buttonText');
  // A button must stand apart from the page it sits on.
  if (minContrast(appearance.button, backgrounds) < 1.35) problems.push('buttonVisibility');
  return problems;
}
