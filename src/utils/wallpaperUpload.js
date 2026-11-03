// Prepares a wallpaper photo in the browser: fixes its orientation, makes a
// full-size and a phone-size copy (WebP, or JPEG where WebP cannot be
// encoded), measures its colours so text stays readable on it, and uploads it.

export const ACCEPTED_WALLPAPER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const LARGE_EDGE = 2560;
const SMALL_EDGE = 1280;
const LARGE_BUDGET = 2.3 * 1024 * 1024;
const SMALL_BUDGET = 850 * 1024;

const toHex = (rgb) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // fall back to an <img> below
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function draw(source, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // transparent PNGs get a white backing
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

async function encode(canvas, budget) {
  for (const quality of [0.82, 0.72, 0.62, 0.5]) {
    let blob = await toBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality + 0.04);
    if (blob && blob.size <= budget) return blob;
  }
  throw new Error('This photo is too detailed to compress. Try a smaller one.');
}

function fit(width, height, edge) {
  const scale = Math.min(1, edge / Math.max(width, height));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

// Average colour, darkest and lightest tenth, the top band (behind the
// header) and a small palette of its most common tones.
function measure(source) {
  const [w, h] = fit(source.width, source.height, 64);
  const data = draw(source, w, h).getContext('2d').getImageData(0, 0, w, h).data;
  const pixels = [];
  const top = [];
  const buckets = new Map();
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      pixels.push(rgb);
      if (y < h * 0.3) top.push(rgb);
      const key = rgb.map((c) => Math.round(c / 32) * 32).join(',');
      const bucket = buckets.get(key) || { count: 0, sum: [0, 0, 0] };
      bucket.count += 1;
      bucket.sum = bucket.sum.map((s, k) => s + rgb[k]);
      buckets.set(key, bucket);
    }
  }
  const average = (list) => list.reduce((sum, rgb) => sum.map((s, k) => s + rgb[k] / list.length), [0, 0, 0]);
  const sorted = [...pixels].sort((a, b) => lum(a) - lum(b));
  const tenth = Math.max(1, Math.floor(sorted.length / 10));
  const palette = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((bucket) => toHex(bucket.sum.map((s) => s / bucket.count)));
  return {
    avg: toHex(average(pixels)),
    dark: toHex(average(sorted.slice(0, tenth))),
    light: toHex(average(sorted.slice(-tenth))),
    top: toHex(average(top.length ? top : pixels)),
    palette,
  };
}

export async function prepareWallpaperUpload(file) {
  if (!file || !ACCEPTED_WALLPAPER_TYPES.includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That photo is over 25 MB. Choose a smaller one.');
  const source = await decode(file);
  if (!source.width || !source.height) throw new Error('That photo could not be read.');
  const [lw, lh] = fit(source.width, source.height, LARGE_EDGE);
  const [sw, sh] = fit(source.width, source.height, SMALL_EDGE);
  const large = await encode(draw(source, lw, lh), LARGE_BUDGET);
  const small = await encode(draw(source, sw, sh), SMALL_BUDGET);
  const meta = { ...measure(source), width: lw, height: lh, smallWidth: sw };
  if (typeof source.close === 'function') source.close();
  return { large, small, meta };
}

/** Upload a prepared photo; resolves to { url, meta }. */
export async function uploadWallpaper(file) {
  const { large, small, meta } = await prepareWallpaperUpload(file);
  const form = new FormData();
  form.append('large', large, 'wallpaper');
  form.append('small', small, 'wallpaper-small');
  form.append('meta', JSON.stringify(meta));
  const response = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.error || 'Upload failed. Please try again.');
  return { url: data.url, meta: data.meta || meta };
}
