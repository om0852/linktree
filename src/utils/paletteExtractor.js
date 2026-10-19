/**
 * AI Palette Extraction Utility
 * Samples image pixels via HTML5 Canvas and computes harmonious color palettes.
 */

export async function extractPaletteFromImage(imageUrl, maxColors = 4) {
  return new Promise((resolve) => {
    if (!imageUrl || typeof window === 'undefined') {
      return resolve([]);
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);

        // Downscale for instant client-side computation
        const sampleSize = 64;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        const colorBuckets = {};

        // Sample pixels with quantization (16-step quantization per channel)
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-black/pure-white noise
          if (a < 128) continue;
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 15 || brightness > 245) continue;

          // 16-level quantization
          const qr = Math.round(r / 24) * 24;
          const qg = Math.round(g / 24) * 24;
          const qb = Math.round(b / 24) * 24;
          const key = `${qr},${qg},${qb}`;

          colorBuckets[key] = (colorBuckets[key] || 0) + 1;
        }

        // Sort by frequency
        const sorted = Object.entries(colorBuckets)
          .sort((a, b) => b[1] - a[1])
          .slice(0, maxColors)
          .map(([rgbStr]) => {
            const [r, g, b] = rgbStr.split(',').map(Number);
            return rgbToHex(r, g, b);
          });

        if (sorted.length === 0) {
          return resolve(['#10b981', '#064e3b', '#0f172a']);
        }

        resolve(sorted);
      } catch (err) {
        console.warn('Palette extraction failed (CORS or canvas limitation):', err);
        resolve([]);
      }
    };

    img.onerror = () => {
      resolve([]);
    };
  });
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateSuggestedThemes(colors) {
  if (!colors || colors.length === 0) return [];

  const primary = colors[0];
  const secondary = colors[1] || '#3b82f6';
  const accent = colors[2] || '#f59e0b';

  return [
    {
      id: 'palette_glass_noir',
      name: 'Glassmorphic Aura',
      bgClass: 'bg-zinc-950',
      primary,
      secondary,
      accent,
      previewGradients: `radial-gradient(circle at 50% 20%, ${primary}33, transparent 70%), radial-gradient(circle at 80% 80%, ${secondary}22, transparent 60%)`,
      description: 'Sleek dark glassmorphism tinted by your avatar',
    },
    {
      id: 'palette_vibrant_glow',
      name: 'Avatar Neon Glow',
      bgClass: 'bg-neutral-900',
      primary: secondary,
      secondary: primary,
      accent,
      previewGradients: `linear-gradient(135deg, ${primary}44 0%, ${secondary}33 100%)`,
      description: 'Vibrant edge highlights matching your portrait lighting',
    },
    {
      id: 'palette_minimal_monochrome',
      name: 'Curated Elegance',
      bgClass: 'bg-zinc-900',
      primary: accent,
      secondary: primary,
      accent: secondary,
      previewGradients: `linear-gradient(180deg, #18181b 0%, ${primary}22 100%)`,
      description: 'Understated editorial theme with your accent colors',
    },
  ];
}
