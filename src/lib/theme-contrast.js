const NAMED_COLORS = {
  white: '#ffffff', black: '#000000',
  'stone-900': '#1c1917', 'stone-50': '#fafaf9',
  'slate-950': '#020617', 'slate-900': '#0f172a',
  'emerald-400': '#34d399',
  'amber-700': '#b45309', 'rose-700': '#be123c', 'purple-800': '#5b21b6',
};

function parseColor(input) {
  if (!input) return null;
  const value = String(input).trim().toLowerCase();
  const hex = value.match(/#([\da-f]{3}|[\da-f]{6})\b/i);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) digits = digits.split('').map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255);
  }
  const named = NAMED_COLORS[value];
  if (named) return parseColor(named);
  return null;
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

function backgroundSamples(preset, wallpaper) {
  if (wallpaper?.type === 'fill' && parseColor(wallpaper.value)) return [parseColor(wallpaper.value)];

  const background = wallpaper?.type === 'gradient' && wallpaper.gradient
    ? wallpaper.gradient
    : preset?.bg;
  const colors = (String(background || '').match(/#[\da-f]{3,8}\b/gi) || [])
    .map(parseColor).filter(Boolean);
  if (colors.length) return colors;

  const tokens = String(background || '').split(/\s+/).map((token) => token.replace(/^(bg|from|via|to)-/, ''));
  const named = tokens.map((token) => NAMED_COLORS[token]).filter(Boolean).map(parseColor);
  return named.length ? named : [parseColor('#ffffff')];
}

function minContrast(foreground, backgrounds) {
  const color = parseColor(foreground);
  return color ? Math.min(...backgrounds.map((background) => contrastRatio(color, background))) : 0;
}

function resolveReadableColor(candidate, backgrounds, fallback) {
  if (minContrast(candidate, backgrounds) >= 4.5) return candidate;
  const black = '#111827';
  const white = '#ffffff';
  return Math.min(...backgrounds.map((background) => contrastRatio(parseColor(black), background))) >=
    Math.min(...backgrounds.map((background) => contrastRatio(parseColor(white), background)))
    ? black : white;
}

export function getReadableThemeColors(preset, wallpaper, customColors = {}) {
  const backgrounds = backgroundSamples(preset, wallpaper);
  const isDark = backgrounds.reduce((sum, color) => sum + luminance(color), 0) / backgrounds.length < 0.35;
  const presetText = preset?.text?.match(/#([\da-f]{3}|[\da-f]{6})\b/i)?.[0]
    || (preset?.text?.includes('white') ? '#ffffff' : null)
    || (preset?.text?.includes('emerald-400') ? '#34d399' : null)
    || (preset?.text?.includes('stone-900') ? '#1c1917' : null);
  const safeDefault = isDark ? '#f8fafc' : '#1f2937';
  const title = resolveReadableColor(customColors.title || customColors.titleColor || presetText || safeDefault, backgrounds, safeDefault);
  const body = resolveReadableColor(customColors.pageText || customColors.pageTextColor || (isDark ? '#e2e8f0' : '#475569'), backgrounds, safeDefault);
  const muted = resolveReadableColor(isDark ? '#cbd5e1' : '#64748b', backgrounds, safeDefault);
  return { isDark, title, body, muted };
}
