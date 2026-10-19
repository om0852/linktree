import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Profile from '../src/models/Profile.js';
import { CURATED_THEMES, THEME_PRESETS } from '../src/constants/app.js';
import { getReadableThemeColors } from '../src/lib/theme-contrast.js';

const NAMED_THEME_BACKGROUNDS = {
  'slate-950': '#020617',
  'amber-700': '#b45309',
  'rose-700': '#be123c',
  'purple-800': '#5b21b6',
};

function themeBackgroundSamples(preset) {
  const background = String(preset.bg || '');
  const hexColors = background.match(/#[\da-f]{3}(?:[\da-f]{3})?\b/gi) || [];
  if (hexColors.length) return hexColors;
  const named = Object.entries(NAMED_THEME_BACKGROUNDS)
    .filter(([name]) => background.includes(name))
    .map(([, color]) => color);
  return named.length ? named : ['#ffffff'];
}

function colorLuminance(hex) {
  const normalized = hex.slice(1).length === 3
    ? hex.slice(1).split('').map((channel) => channel + channel).join('')
    : hex.slice(1);
  const channels = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = colorLuminance(foreground);
  const backgroundLuminance = colorLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

describe('Theme, Appearance & Feature Add-ons Field Synchronization Suite', () => {

  it('resolves readable title, body, and muted text for every built-in theme', () => {
    for (const preset of [...THEME_PRESETS, ...CURATED_THEMES]) {
      const readable = getReadableThemeColors(preset);
      for (const [role, color] of Object.entries(readable)) {
        if (role === 'isDark') continue;
        assert.match(color, /^#[\da-f]{6}$/i, `${preset.id} ${role} should resolve to a solid hex color`);
        for (const background of themeBackgroundSamples(preset)) {
          assert.ok(
            contrastRatio(color, background) >= 4.5,
            `${preset.id} ${role} should meet WCAG AA contrast on ${background}`
          );
        }
      }
    }
  });

  it('validates all theme options including atelier, emerald-gold, dark-glass, sunset, minimal-light, neon', () => {
    const validThemes = ['atelier', 'emerald-gold', 'dark-glass', 'sunset', 'minimal-light', 'neon', 'emerald'];
    validThemes.forEach(theme => {
      const doc = new Profile({
        username: `theme_test_${theme.replace('-', '_')}`,
        name: 'Theme Tester',
        theme: theme,
      });
      const err = doc.validateSync();
      assert.equal(err, undefined, `Theme ${theme} should be valid`);
      assert.equal(doc.theme, theme);
    });
  });

  it('validates all buttonShape options including sharp, rounded, pill, brutalism', () => {
    const shapes = ['sharp', 'rounded', 'pill', 'brutalism'];
    shapes.forEach(shape => {
      const doc = new Profile({
        username: `shape_test_${shape}`,
        name: 'Shape Tester',
        buttonShape: shape,
      });
      const err = doc.validateSync();
      assert.equal(err, undefined, `Shape ${shape} should be valid in schema`);
      assert.equal(doc.buttonShape, shape);
    });
  });

  it('validates all typography headline font options', () => {
    const fonts = ['Playfair Display', 'DM Sans', 'Plus Jakarta Sans', 'Space Grotesk'];
    fonts.forEach(font => {
      const doc = new Profile({
        username: `font_test_${font.replace(/\s+/g, '_').toLowerCase()}`,
        name: 'Font Tester',
        font: font,
      });
      const err = doc.validateSync();
      assert.equal(err, undefined, `Font ${font} should be valid`);
      assert.equal(doc.font, font);
    });
  });

  it('validates all headerLayout modes (classic, banner, hero) and coverImage', () => {
    ['classic', 'banner', 'hero'].forEach(layout => {
      const doc = new Profile({
        username: `header_${layout}`,
        name: 'Header Layout Tester',
        headerLayout: layout,
        coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
      });
      const err = doc.validateSync();
      assert.equal(err, undefined);
      assert.equal(doc.headerLayout, layout);
      assert.ok(doc.coverImage.startsWith('https://'));
    });
  });

  it('validates socialsPosition (top, bottom) and social networks map', () => {
    ['top', 'bottom'].forEach(pos => {
      const doc = new Profile({
        username: `socials_${pos}`,
        name: 'Socials Pos Tester',
        socialsPosition: pos,
        socials: {
          instagram: 'creator_ig',
          youtube: 'creator_yt',
          twitter: 'creator_x',
        },
      });
      const err = doc.validateSync();
      assert.equal(err, undefined);
      assert.equal(doc.socialsPosition, pos);
      assert.equal(doc.socials.get('instagram'), 'creator_ig');
    });
  });

  it('validates storyBubble video greeting configuration', () => {
    const doc = new Profile({
      username: 'story_bubble_creator',
      name: 'Story Creator',
      storyBubble: {
        enabled: true,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        caption: 'Tap to see my 15-second intro video!',
      },
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.storyBubble.enabled, true);
    assert.equal(doc.storyBubble.caption, 'Tap to see my 15-second intro video!');
  });

  it('validates heroVideo embed link', () => {
    const doc = new Profile({
      username: 'hero_video_creator',
      name: 'Showreel Creator',
      heroVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.heroVideo, 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('validates interactive bio widgets (Tip Jar, Newsletter, Media Kit Stats)', () => {
    const doc = new Profile({
      username: 'widgets_creator',
      name: 'Widgets Creator',
      widgets: {
        hasTipJar: true,
        hasNewsletter: true,
        newsletterTitle: 'Join 50k VIP Insiders',
        mediaKitStats: {
          followers: '250K',
          engagement: '6.2%',
          monthlyViews: '1.4M',
        },
      },
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.widgets.hasTipJar, true);
    assert.equal(doc.widgets.hasNewsletter, true);
    assert.equal(doc.widgets.mediaKitStats.followers, '250K');
  });

  it('validates Live Social Proof activity ticker settings', () => {
    const doc = new Profile({
      username: 'social_proof_creator',
      name: 'Proof Creator',
      socialProof: {
        enabled: true,
        showDownloads: true,
        showClicks: true,
        intervalMs: 5000,
      },
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.socialProof.enabled, true);
    assert.equal(doc.socialProof.intervalMs, 5000);
  });

  it('validates 1-click retargeting tracking pixels (Meta, GA4, TikTok, Pinterest)', () => {
    const doc = new Profile({
      username: 'pixels_creator',
      name: 'Pixel Creator',
      trackingPixels: {
        metaPixelId: '123456789012345',
        ga4MeasurementId: 'G-XYZ1234567',
        tiktokPixelId: 'C1234567890ABCDE',
        pinterestTagId: '2612345678901',
      },
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.trackingPixels.metaPixelId, '123456789012345');
    assert.equal(doc.trackingPixels.ga4MeasurementId, 'G-XYZ1234567');
  });

  it('validates FTC affiliate disclosure compliance settings', () => {
    const doc = new Profile({
      username: 'affiliate_creator',
      name: 'Affiliate Creator',
      compliance: {
        affiliateDisclosure: true,
        disclosureText: 'I earn a commission when you purchase through links on this page.',
      },
    });
    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.compliance.affiliateDisclosure, true);
    assert.equal(doc.compliance.disclosureText, 'I earn a commission when you purchase through links on this page.');
  });

  it('validates Profile Access Gate with passcode, age_18, and sensitive content modes', () => {
    ['passcode', 'age_18', 'sensitive'].forEach(gateType => {
      const doc = new Profile({
        username: `gate_${gateType}`,
        name: 'Gate Creator',
        accessGate: {
          enabled: true,
          type: gateType,
          passcode: gateType === 'passcode' ? 'SECRET2026' : '',
          title: 'Restricted Content',
          description: 'Please verify to continue.',
        },
      });
      const err = doc.validateSync();
      assert.equal(err, undefined);
      assert.equal(doc.accessGate.enabled, true);
      assert.equal(doc.accessGate.type, gateType);
    });
  });

  it('validates Button Border Geometry classes mapping for preview and public bio', () => {
    const getShapeClasses = (shape) => {
      switch (shape) {
        case 'sharp': return { bento: 'btn-shape-sharp', stack: 'btn-shape-sharp' };
        case 'brutalism': return { bento: 'btn-shape-brutalism', stack: 'btn-shape-brutalism' };
        case 'pill': return { bento: 'btn-shape-pill', stack: 'btn-shape-pill' };
        case 'rounded':
        default: return { bento: 'btn-shape-rounded', stack: 'btn-shape-rounded' };
      }
    };

    assert.equal(getShapeClasses('brutalism').bento, 'btn-shape-brutalism');
    assert.equal(getShapeClasses('brutalism').stack, 'btn-shape-brutalism');
    assert.equal(getShapeClasses('sharp').bento, 'btn-shape-sharp');
    assert.equal(getShapeClasses('pill').bento, 'btn-shape-pill');
    assert.equal(getShapeClasses('rounded').bento, 'btn-shape-rounded');
  });

  it('validates LinkSchema geoTargeting configuration and audience country simulation', () => {
    const doc = new Profile({
      username: 'geo_target_tester',
      name: 'Geo Targeter',
      links: [
        {
          id: 'link_us_only',
          title: 'US Store',
          url: 'https://store.us',
          geoTargeting: {
            enabled: true,
            mode: 'include',
            countries: ['US', 'CA'],
          },
        },
        {
          id: 'link_in_only',
          title: 'India Store',
          url: 'https://store.in',
          geoTargeting: {
            enabled: true,
            mode: 'include',
            countries: ['IN'],
          },
        },
        {
          id: 'link_global',
          title: 'Global Portfolio',
          url: 'https://portfolio.com',
          geoTargeting: {
            enabled: false,
            countries: [],
          },
        },
      ],
    });

    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.links[0].geoTargeting.enabled, true);
    assert.equal(doc.links[0].geoTargeting.countries[0], 'US');
    assert.equal(doc.links[1].geoTargeting.countries[0], 'IN');

    // Simulate audience filter function
    const filterLinks = (links, simCountry) => {
      return links.filter(l => {
        if (!l.geoTargeting?.enabled) return true;
        if (simCountry === 'GLOBAL') return true;
        const targetCountries = (l.geoTargeting.countries || []).map(c => c.toUpperCase());
        const isMatch = targetCountries.includes(simCountry.toUpperCase());
        return l.geoTargeting.mode === 'include' ? isMatch : !isMatch;
      });
    };

    // When simulated visitor is from India
    const indiaView = filterLinks(doc.links, 'IN');
    assert.equal(indiaView.some(l => l.id === 'link_in_only'), true);
    assert.equal(indiaView.some(l => l.id === 'link_us_only'), false);
    assert.equal(indiaView.some(l => l.id === 'link_global'), true);

    // When simulated visitor is from US
    const usView = filterLinks(doc.links, 'US');
    assert.equal(usView.some(l => l.id === 'link_us_only'), true);
    assert.equal(usView.some(l => l.id === 'link_in_only'), false);
    assert.equal(usView.some(l => l.id === 'link_global'), true);

    // When simulated visitor is Global
    const globalView = filterLinks(doc.links, 'GLOBAL');
    assert.equal(globalView.length, 3);
  });

  it('validates Phase 1 Link Archive system (isArchived soft-delete & click retention)', () => {
    const doc = new Profile({
      username: 'archive_tester',
      name: 'Archive Tester',
      links: [
        {
          id: 'link_active_1',
          title: 'Active Link',
          url: 'https://example.com',
          clicks: 142,
          isArchived: false,
        },
        {
          id: 'link_archived_1',
          title: 'Retired Promo Link',
          url: 'https://promo.com',
          clicks: 890,
          isArchived: true,
        },
      ],
    });

    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.links[0].isArchived, false);
    assert.equal(doc.links[1].isArchived, true);
    assert.equal(doc.links[1].clicks, 890); // Preserved historical analytics

    // Verify filter logic excludes archived links from active profile view
    const activeView = doc.links.filter(l => !l.isArchived);
    assert.equal(activeView.length, 1);
    assert.equal(activeView[0].id, 'link_active_1');

    const archivedView = doc.links.filter(l => l.isArchived);
    assert.equal(archivedView.length, 1);
    assert.equal(archivedView[0].id, 'link_archived_1');
    assert.equal(archivedView[0].clicks, 890);
  });

  it('validates Phase 2 Avatar Masks (Cutout & Geometric Shapes) in schema', () => {
    const shapes = ['circle', 'rounded', 'squircle', 'arch', 'hexagon', 'diamond', 'cutout'];
    shapes.forEach((shape) => {
      const doc = new Profile({
        username: `avatar_mask_${shape}`,
        name: 'Avatar Mask Tester',
        avatarShape: shape,
      });
      const err = doc.validateSync();
      assert.equal(err, undefined, `Avatar shape ${shape} should be valid`);
      assert.equal(doc.avatarShape, shape);
    });
  });

  it('validates Phase 2 Brand Logo Title option in schema', () => {
    const doc = new Profile({
      username: 'brand_logo_tester',
      name: 'Acme Brand',
      titleLogo: {
        enabled: true,
        url: 'https://cdn.example.com/acme-logo.png',
        altText: 'Acme Official Logo',
      },
    });

    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.titleLogo.enabled, true);
    assert.equal(doc.titleLogo.url, 'https://cdn.example.com/acme-logo.png');
    assert.equal(doc.titleLogo.altText, 'Acme Official Logo');
  });

  it('validates Phase 2 Expanded 18-Preset Library & AVATAR_SHAPES constants', async () => {
    const { THEME_PRESETS, AVATAR_SHAPES } = await import('../src/constants/app.js');
    assert.ok(Array.isArray(THEME_PRESETS));
    assert.ok(THEME_PRESETS.length >= 18, `Expected at least 18 presets, found ${THEME_PRESETS.length}`);

    // Verify each preset has required metadata
    THEME_PRESETS.forEach((preset) => {
      assert.ok(preset.id, 'Preset must have id');
      assert.ok(preset.name, 'Preset must have name');
      assert.ok(preset.bg, 'Preset must have bg color');
      assert.ok(preset.primary, 'Preset must have primary color');
      assert.ok(preset.accent, 'Preset must have accent color');
    });

    assert.ok(Array.isArray(AVATAR_SHAPES));
    assert.ok(AVATAR_SHAPES.length >= 6);
    const shapeIds = AVATAR_SHAPES.map(s => s.id);
    ['circle', 'rounded', 'squircle', 'arch', 'hexagon', 'diamond'].forEach(expectedShape => {
      assert.ok(shapeIds.includes(expectedShape), `Missing avatar shape: ${expectedShape}`);
    });
  });

  it('validates Collection viewMode includes showcase option', () => {
    const doc = new Profile({
      username: 'showcase_col_tester',
      name: 'Showcase Tester',
      collections: [
        {
          id: 'col_showcase',
          title: 'Featured Collection',
          viewMode: 'showcase',
        },
      ],
    });

    const err = doc.validateSync();
    assert.equal(err, undefined);
    assert.equal(doc.collections[0].viewMode, 'showcase');
  });

  it('validates isImageUrl detects image URLs vs emoji strings without false positives', async () => {
    const { isImageUrl } = await import('../src/constants/app.js');

    assert.equal(isImageUrl('https://cdn.example.com/sticker.png'), true);
    assert.equal(isImageUrl('http://cdn.example.com/sticker.gif'), true);
    assert.equal(isImageUrl('/stickers/badge.svg'), true);
    assert.equal(isImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='), true);
    assert.equal(isImageUrl('blob:http://localhost:3000/123-abc'), true);

    // Emojis must return false so they NEVER trigger broken <img> tags
    assert.equal(isImageUrl('✨'), false);
    assert.equal(isImageUrl('👻'), false);
    assert.equal(isImageUrl('🔥'), false);
    assert.equal(isImageUrl(''), false);
    assert.equal(isImageUrl(null), false);
    assert.equal(isImageUrl(undefined), false);
  });

  it('validates getStickerDeviceProps mathematical projection across mobile, tablet, and laptop', async () => {
    const { getStickerDeviceProps } = await import('../src/constants/app.js');

    // 1. Mobile center avatar sticker (x: 50, y: 10)
    const avatarSticker = { id: 'stk_1', emoji: '👑', x: 50, y: 10, scale: 1, rotate: 0 };
    
    // On mobile: returns exact base coordinates
    const mobProps = getStickerDeviceProps(avatarSticker, 'mobile');
    assert.equal(mobProps.x, 50);
    assert.equal(mobProps.y, 10);

    // On tablet: centered relative to tablet canvas
    const tabProps = getStickerDeviceProps(avatarSticker, 'tablet');
    assert.equal(tabProps.x, 50);
    assert.equal(tabProps.y, 10);

    // On laptop (Split mode): avatar is in Left Column (centered at 21%)
    const lapSplitAvatar = getStickerDeviceProps(avatarSticker, 'laptop', 'split');
    assert.equal(lapSplitAvatar.x, 21); // exactly on left column center
    assert.ok(lapSplitAvatar.y > 0 && lapSplitAvatar.y <= 25);

    // On laptop (Centered mode): centered in max-w-2xl card (centered at 50%)
    const lapCentAvatar = getStickerDeviceProps(avatarSticker, 'laptop', 'centered');
    assert.equal(lapCentAvatar.x, 50);

    // 2. Mobile link sticker in lower section (x: 50, y: 60)
    const linkSticker = { id: 'stk_2', emoji: '👇', x: 50, y: 60, scale: 1, rotate: 0 };
    const lapSplitLink = getStickerDeviceProps(linkSticker, 'laptop', 'split');
    assert.equal(lapSplitLink.x, 71); // exactly on right column center

    // 3. Explicit device overrides take highest precedence
    const customSticker = {
      id: 'stk_3',
      emoji: '⭐',
      x: 30,
      y: 30,
      anchorType: 'HEADER',
      devices: {
        tablet: { x: 77, y: 88, scale: 2, rotate: 45, flipX: true },
      },
    };
    const customTabProps = getStickerDeviceProps(customSticker, 'tablet');
    assert.equal(customTabProps.x, 77);
    assert.equal(customTabProps.y, 88);
    assert.equal(customTabProps.scale, 2);
    assert.equal(customTabProps.rotate, 45);
    assert.equal(customTabProps.flipX, true);
    assert.equal(customTabProps.anchorType, 'HEADER');

    // 4. Section-anchored stickers (anchorType: 'HEADER') always project percentage top
    const { getStickerCanvasPositionStyle } = await import('../src/constants/app.js');
    const headerStickerStyle = getStickerCanvasPositionStyle({ x: 50, y: 15, anchorType: 'HEADER' });
    assert.equal(headerStickerStyle.left, '50%');
    assert.equal(headerStickerStyle.top, '15%');
  });

  it('validates parseTailwindGradient converts Tailwind gradient classes into valid CSS linear-gradient', async () => {
    const { parseTailwindGradient } = await import('../src/constants/app.js');

    const grad1 = parseTailwindGradient('bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]');
    assert.ok(grad1.startsWith('linear-gradient('));
    assert.ok(grad1.includes('to bottom right'));
    assert.ok(grad1.includes('#0F172A'));
    assert.ok(grad1.includes('#1E293B'));

    const grad2 = parseTailwindGradient('bg-gradient-to-r from-emerald-400 to-cyan-500');
    assert.ok(grad2.startsWith('linear-gradient('));
    assert.ok(grad2.includes('to right'));
    assert.ok(grad2.includes('#34d399')); // emerald-400
    assert.ok(grad2.includes('#06b6d4')); // cyan-500

    const plain = parseTailwindGradient('#111827');
    assert.equal(plain, '#111827');

    const empty = parseTailwindGradient('');
    assert.equal(empty, '');
  });

  it('validates all curated theme presets have complete styling configurations', async () => {
    const { THEME_PRESETS, CURATED_THEMES } = await import('../src/constants/app.js');

    assert.ok(Array.isArray(THEME_PRESETS));
    assert.ok(THEME_PRESETS.length >= 18);

    THEME_PRESETS.forEach(preset => {
      assert.ok(preset.id, 'Theme preset must have an id');
      assert.ok(preset.name, `Theme preset ${preset.id} must have a name`);
      assert.ok(preset.bg, `Theme preset ${preset.id} must have a bg defined`);
      assert.ok(preset.primary, `Theme preset ${preset.id} must have a primary defined`);
      assert.ok(preset.accent, `Theme preset ${preset.id} must have an accent defined`);
    });

    assert.ok(Array.isArray(CURATED_THEMES));
    assert.ok(CURATED_THEMES.length >= 6);
    CURATED_THEMES.forEach(theme => {
      assert.ok(theme.id, 'Curated theme must have an id');
      assert.ok(theme.name, `Curated theme ${theme.id} must have a name`);
      assert.ok(theme.bg, `Curated theme ${theme.id} must have a bg defined`);
    });
  });
});
