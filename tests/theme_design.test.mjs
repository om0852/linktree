import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Profile from '../src/models/Profile.js';
import { CURATED_THEMES, THEME_PRESETS, AVATAR_SHAPES, AVATAR_SHAPE_IDS, getFontStack, PAGE_FONTS } from '../src/constants/app.js';
import {
  auditThemeAppearance,
  getPresetWallpaper,
  getReadableButtonText,
  getReadableThemeColors,
  getThemeAppearance,
} from '../src/lib/theme-contrast.js';
import { getVisitorCountry, isLinkVisibleInCountry } from '../src/lib/geoTargeting.js';

describe('Theme design', () => {
  it('every theme has readable text on page and cards, a readable button label and a visible button', () => {
    for (const theme of [...THEME_PRESETS, ...CURATED_THEMES]) {
      const look = getThemeAppearance(theme);
      assert.deepEqual(auditThemeAppearance(look, theme), [], `${theme.id} has contrast problems`);
    }
  });

  it('resolves named Tailwind backgrounds to real colours for the stored wallpaper', () => {
    assert.deepEqual(getPresetWallpaper({ bg: 'bg-white' }), { type: 'fill', value: '#ffffff', gradient: '' });
    assert.deepEqual(getPresetWallpaper({ bg: 'bg-slate-950' }), { type: 'fill', value: '#020617', gradient: '' });
    assert.equal(getPresetWallpaper({ bg: 'bg-[#0f241d]' }).value, '#0f241d');
    assert.equal(getPresetWallpaper({ bg: 'bg-gradient-to-b from-[#000000] to-[#111111]' }).type, 'gradient');
  });

  it('never keeps dark text on a dark custom wallpaper', () => {
    const light = THEME_PRESETS.find((theme) => theme.id === 'atelier');
    const colors = getReadableThemeColors(light, { type: 'fill', value: '#000000' }, { title: '#28352F', pageText: '#333333' });
    // Light text on the black page; the cream cards turn into glass over it.
    assert.equal(colors.isDark, true);
    assert.equal(colors.cardsFollowPage, true);
    for (const role of ['title', 'body', 'muted']) {
      assert.ok(parseInt(colors[role].slice(1, 3), 16) > 0x90, `${role} ${colors[role]} should be light`);
    }
  });

  it('replaces an unreadable button label but keeps a readable one', () => {
    assert.equal(getReadableButtonText('#25f43a', '#FFFFFF'), '#111827');
    assert.equal(getReadableButtonText('#16A34A', '#000000'), '#000000');
  });
});

describe('Fonts and avatar shapes', () => {
  it('quotes font names so names with digits stay valid CSS', () => {
    assert.equal(getFontStack('Press Start 2P'), '"Press Start 2P", system-ui, sans-serif');
    assert.equal(getFontStack('Evil"; color: red'), '"Evil color: red", system-ui, sans-serif');
    assert.equal(getFontStack(''), '');
    assert.ok(PAGE_FONTS.includes('Playfair Display') && PAGE_FONTS.includes('Inter'));
  });

  it('accepts every avatar shape the Studio offers', () => {
    assert.ok(AVATAR_SHAPES.length >= 13);
    for (const shape of AVATAR_SHAPE_IDS) {
      const doc = new Profile({ username: `shape_${shape}`, name: 'Shape', avatarShape: shape });
      assert.equal(doc.validateSync(), undefined, `${shape} should be valid`);
    }
  });

  it('keeps gradient, image and video wallpapers when saving', () => {
    const doc = new Profile({
      username: 'wallpaper_keep',
      name: 'Wallpaper',
      designSettings: { wallpaper: { type: 'gradient', gradient: 'from-[#000] to-[#fff]', imageUrl: 'https://x/y.png', videoUrl: 'https://x/v.mp4' } },
      alternativeTitleFont: { enabled: true, font: 'Pacifico' },
    });
    assert.equal(doc.designSettings.wallpaper.gradient, 'from-[#000] to-[#fff]');
    assert.equal(doc.designSettings.wallpaper.imageUrl, 'https://x/y.png');
    assert.equal(doc.designSettings.wallpaper.videoUrl, 'https://x/v.mp4');
    assert.equal(doc.alternativeTitleFont.font, 'Pacifico');
  });
});

describe('Location targeting (View As and the live page)', () => {
  const ukOnly = { geoTargeting: { enabled: true, mode: 'include', countries: ['GB'] } };
  const euOnly = { geoTargeting: { enabled: true, mode: 'include', countries: ['EU'] } };
  const notIndia = { geoTargeting: { enabled: true, mode: 'exclude', countries: ['IN'] } };

  it('shows every link when the country is unknown', () => {
    for (const link of [ukOnly, euOnly, notIndia]) {
      assert.equal(isLinkVisibleInCountry(link, ''), true);
      assert.equal(isLinkVisibleInCountry(link, 'global'), true);
    }
  });

  it('matches include and exclude rules, legacy UK codes and EU members', () => {
    assert.equal(isLinkVisibleInCountry(ukOnly, 'GB'), true);
    assert.equal(isLinkVisibleInCountry(ukOnly, 'uk'), true);
    assert.equal(isLinkVisibleInCountry(ukOnly, 'US'), false);
    assert.equal(isLinkVisibleInCountry(euOnly, 'DE'), true);
    assert.equal(isLinkVisibleInCountry(euOnly, 'US'), false);
    assert.equal(isLinkVisibleInCountry(notIndia, 'IN'), false);
    assert.equal(isLinkVisibleInCountry(notIndia, 'US'), true);
  });

  it('reads the visitor country from CDN headers', () => {
    const headers = (values) => ({ get: (name) => values[name] ?? null });
    assert.equal(getVisitorCountry(headers({ 'x-vercel-ip-country': 'de' })), 'DE');
    assert.equal(getVisitorCountry(headers({ 'cf-ipcountry': 'XX' })), '');
    assert.equal(getVisitorCountry(headers({})), '');
  });
});
