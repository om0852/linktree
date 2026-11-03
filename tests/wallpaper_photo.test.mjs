import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPhotoButtonColors,
  getReadableThemeColors,
  getThemeCardColor,
  resolveImageOverlay,
} from '../src/lib/theme-contrast.js';
import {
  getWallpaperImageLayer,
  safeWallpaperImageUrl,
  sanitizeWallpaperImage,
  sniffImageType,
} from '../src/lib/wallpaperImage.js';

const media = '/api/media/0123456789abcdef01234567';

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lum = (c) => {
  const l = c.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
// Each measured part of the photo as seen through the shade.
const shaded = (photo) => {
  const { tone, opacity } = resolveImageOverlay(photo);
  const over = tone === 'light' ? [1, 1, 1] : [0, 0, 0];
  return ['avg', 'dark', 'light', 'top'].map((k) => rgb(photo.imageMeta[k]).map((v, i) => v * (1 - opacity) + over[i] * opacity));
};
const busyPhoto = {
  type: 'image',
  imageUrl: media,
  imageMeta: { avg: '#7a6a5a', dark: '#101010', light: '#f4f1ea', top: '#c9d6e3', palette: ['#c0392b', '#7a6a5a', '#2c3e50'], width: 2560, height: 1707, smallWidth: 1280 },
};
const darkPhoto = {
  type: 'image',
  imageUrl: media,
  imageMeta: { avg: '#1b1d22', dark: '#08090b', light: '#4a4f58', top: '#22252b', palette: ['#1b1d22', '#3d5a80'], width: 1600, height: 2400, smallWidth: 853 },
};

describe('Photo wallpaper shade', () => {
  it('auto shade makes text readable on every measured part of a busy photo', () => {
    const shade = resolveImageOverlay(busyPhoto);
    assert.equal(shade.mode, 'auto');
    assert.ok(shade.opacity > 0 && shade.opacity <= 0.85);
    const readable = getReadableThemeColors(null, busyPhoto);
    for (const role of ['title', 'body', 'muted']) {
      for (const surface of shaded(busyPhoto)) assert.ok(contrast(rgb(readable[role]), surface) >= 4.5, `${role} ${readable[role]}`);
    }
  });

  it('a dark photo needs only a light touch', () => {
    assert.ok(resolveImageOverlay(darkPhoto).opacity <= resolveImageOverlay(busyPhoto).opacity);
    assert.equal(getReadableThemeColors(null, darkPhoto).isDark, true);
  });

  it('an unmeasured (linked) photo gets a strong shade', () => {
    const linked = { type: 'image', imageUrl: 'https://example.com/a.jpg' };
    assert.ok(resolveImageOverlay(linked).opacity >= 0.5);
  });

  it('manual shade is clamped and none means none', () => {
    assert.deepEqual(resolveImageOverlay({ ...busyPhoto, overlay: 'dark', overlayOpacity: 5 }), { mode: 'dark', tone: 'dark', opacity: 0.85 });
    assert.equal(resolveImageOverlay({ ...busyPhoto, overlay: 'none' }).opacity, 0);
  });

  it('cards turn to glass on a photo unless a card colour is set', () => {
    const glass = getReadableThemeColors(null, darkPhoto);
    assert.equal(glass.cardsFollowPage, true);
    assert.match(getThemeCardColor(null, glass), /^rgba\(0, 0, 0/);
    const solid = getReadableThemeColors(null, darkPhoto, { card: '#3a1d22' });
    assert.equal(getThemeCardColor(null, solid), '#3a1d22');
  });

  it('photo colours pick the most colourful tone and a readable label', () => {
    const colors = getPhotoButtonColors(busyPhoto);
    assert.match(colors.button, /^#[0-9a-f]{6}$/);
    assert.ok(contrast(rgb(colors.buttonText), rgb(colors.button)) >= 4.5, 'button label reads on the button');
    assert.ok(Math.min(...shaded(busyPhoto).map((surface) => contrast(rgb(colors.button), surface))) >= 1.6, 'button stands out from the photo');
    assert.equal(getPhotoButtonColors({ type: 'image', imageUrl: 'https://example.com/a.jpg' }), null);
  });
});

describe('Photo wallpaper storage and drawing', () => {
  it('only https links and our own uploads are accepted', () => {
    assert.equal(safeWallpaperImageUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
    assert.equal(safeWallpaperImageUrl(media), media);
    for (const bad of ['http://example.com/a.jpg', 'javascript:alert(1)', 'data:image/png;base64,AAAA', '/api/media/../../etc', '//evil.example/x.png', 'x") ; background:url(evil']) {
      assert.equal(safeWallpaperImageUrl(bad), '', bad);
    }
  });

  it('measurements are kept only for uploads and focal/shade values are clamped', () => {
    const linked = sanitizeWallpaperImage({ imageUrl: 'https://example.com/a.jpg', imageMeta: busyPhoto.imageMeta, focalX: 140, overlay: 'evil', overlayOpacity: -1, blur: 99 });
    assert.equal(linked.imageMeta, null);
    assert.equal(linked.focalX, 100);
    assert.equal(linked.overlay, 'auto');
    assert.equal(linked.overlayOpacity, 0);
    assert.equal(linked.blur, 24);
    const uploaded = sanitizeWallpaperImage({ ...busyPhoto, imageMeta: { ...busyPhoto.imageMeta, avg: 'red;', palette: ['#c0392b', 'url(x)'] } });
    assert.equal(uploaded.imageMeta, null, 'a malformed average colour drops the measurements');
  });

  it('uploads get a phone-sized source and a cover-aware sizes hint', () => {
    const layer = getWallpaperImageLayer({ ...busyPhoto, focalX: 30, focalY: 70 });
    assert.equal(layer.src, media);
    assert.equal(layer.srcSet, `${media}?size=small 1280w, ${media} 2560w`);
    assert.match(layer.sizes, /^\(max-aspect-ratio: 2560\/1707\) calc\(100vh \* 1\.4997\), 100vw$/);
    assert.equal(layer.objectPosition, '30% 70%');
    assert.equal(layer.placeholder, '#7a6a5a');
    assert.equal(getWallpaperImageLayer({ type: 'fill', value: '#000000' }), null);
  });

  it('file type is decided by content, not by name', () => {
    assert.equal(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])), 'image/jpeg');
    assert.equal(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 ')), 'image/webp');
    assert.equal(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
    assert.equal(sniffImageType(Buffer.from('<html><script>alert(1)</script>')), null);
  });
});
