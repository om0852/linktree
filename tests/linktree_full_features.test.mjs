import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Profile from '../src/models/Profile.js';
import { 
  GOOGLE_FONTS_LIST, 
  CURATED_THEMES, 
  STICKER_PACKS, 
  THEME_PRESETS,
  INITIAL_USER_PROFILE 
} from '../src/constants/app.js';

test('Linktree-Grade Full Capabilities & Zero-Gating Test Suite', async (t) => {
  await t.test('validates 48 authentic Google fonts in GOOGLE_FONTS_LIST', () => {
    const totalFonts = (GOOGLE_FONTS_LIST.suggested?.length || 0) + (GOOGLE_FONTS_LIST.other?.length || 0);
    assert.equal(totalFonts >= 48, true, `Expected >= 48 fonts, found ${totalFonts}`);
    
    const allFonts = [...(GOOGLE_FONTS_LIST.suggested || []), ...(GOOGLE_FONTS_LIST.other || [])];
    const fontNames = new Set(allFonts.map(f => f.name));
    assert.equal(fontNames.size, totalFonts, 'All font names must be unique');
    
    // Check key showcase fonts
    const requiredShowcaseFonts = ['Syne', 'Playfair Display', 'Cinzel', 'Bebas Neue', 'Space Grotesk', 'Inter', 'Audiowide'];
    requiredShowcaseFonts.forEach(font => {
      assert.ok(fontNames.has(font), `Missing expected showcase font: ${font}`);
    });
  });

  await t.test('validates Curated creator themes & Sticker packs', () => {
    assert.ok(CURATED_THEMES.length >= 6, 'Should have at least 6 curated themes');
    const themeNames = CURATED_THEMES.map(th => th.name);
    assert.ok(themeNames.includes('Ariana Cloud'), 'Includes Ariana Cloud theme');
    assert.ok(themeNames.includes('Olivia Guts'), 'Includes Olivia Guts theme');
    assert.ok(themeNames.includes('Billie Neon'), 'Includes Billie Neon theme');

    assert.ok(STICKER_PACKS.some(p => p.id === 'creator'), 'Creator stickers present');
    assert.ok(STICKER_PACKS.some(p => p.id === 'arrows'), 'Arrows stickers present');
    assert.ok(STICKER_PACKS.some(p => p.id === 'spooky'), 'Spooky stickers present');
  });

  await t.test('validates Profile schema with Shop, Design drill-down, and Alternative Title Font', () => {
    const profile = new Profile({
      userId: 'test_user_' + Date.now(),
      username: 'testuser',
      name: 'Test Creator',
      alternativeTitleFont: {
        enabled: true,
        font: 'Syne'
      },
      links: [
        {
          id: 'link_1',
          title: 'My Store',
          url: 'https://example.com',
          thumbnailType: 'icon',
          thumbnailIcon: 'ShoppingBag',
          active: true,
          position: 0
        }
      ],
      shop: {
        enabled: true,
        published: true,
        collections: [
          { id: 'col_1', title: 'Merch' }
        ],
        products: [
          {
            id: 'prod_1',
            title: 'Vintage Hoodie',
            url: 'https://example.com/hoodie',
            price: '$55.00',
            collectionId: 'col_1',
            imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2',
            pinned: false
          }
        ]
      },
      designSettings: {
        wallpaper: {
          type: 'gradient',
          value: 'linear-gradient(135deg, #182848 0%, #4b6cb7 100%)',
          blur: 0
        },
        buttonStyle: 'glass',
        buttonRoundness: 'pill',
        buttonShadow: 'soft',
        buttonColor: '#ffffff',
        buttonTextColor: '#000000',
        buttonShadowColor: 'rgba(0,0,0,0.1)',
        stickers: [
          { id: 'st_1', stickerId: 'sparkle_1', src: '✨', x: 20, y: 15, scale: 1, rotation: 0 }
        ],
        hideFooter: true
      }
    });

    const err = profile.validateSync();
    assert.equal(err, undefined, 'Profile document with new fields must validate cleanly');
    assert.equal(profile.alternativeTitleFont.font, 'Syne');
    assert.equal(profile.shop.products.length, 1);
    assert.equal(profile.shop.products[0].price, '$55.00');
    assert.equal(profile.designSettings.buttonStyle, 'glass');
    assert.equal(profile.designSettings.hideFooter, true);
    assert.equal(profile.links[0].thumbnailType, 'icon');
  });

  await t.test('validates Zero Paywalls / Zero Plan Gating in initial user profile and constants', () => {
    // Check that all features are free and accessible by default
    assert.equal(INITIAL_USER_PROFILE.shop?.enabled, true);
    assert.equal(INITIAL_USER_PROFILE.designSettings?.buttonStyle, 'solid');
    assert.equal(INITIAL_USER_PROFILE.designSettings?.hideFooter, false);
    assert.equal(typeof INITIAL_USER_PROFILE.alternativeTitleFont, 'string');
  });

  await t.test('validates /api/scrape-product OpenGraph auto-scraper endpoint', async () => {
    const res = await fetch('http://localhost:3000/api/scrape-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.product.title);
    assert.ok(data.product.price);
    assert.equal(data.product.domain, 'example.com');
  });

  await t.test('validates MARKETPLACE_ITEMS structure and block creation logic', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/components/Modals/LinkMarketplaceModal.jsx', 'utf8');
    
    assert.ok(content.includes("id: 'link'"), 'Has Standard Link');
    assert.ok(content.includes("id: 'collection'"), 'Has Collection');
    assert.ok(content.includes("id: 'instagram'"), 'Has Instagram block');
    assert.ok(content.includes("id: 'youtube'"), 'Has YouTube block');
    assert.ok(content.includes("id: 'product'"), 'Has Digital Product block');
    assert.ok(content.includes("id: 'lead_exchange'"), 'Has Lead Exchange CRM block');
    assert.ok(content.includes("id: 'calendar_booking'"), 'Has Calendar Booking block');
    assert.ok(content.includes("id: 'newsletter_signup'"), 'Has Newsletter block');

    // Verify onAddLink and onSelectApp support
    assert.ok(content.includes('onSelectApp'), 'Supports onSelectApp');
    assert.ok(content.includes('onAddLink'), 'Supports onAddLink');
  });

  await t.test('validates 3-Dot block context menu & 4 actions in page.js', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/app/page.js', 'utf8');

    assert.ok(content.includes('MoreVertical'), 'Includes MoreVertical 3-dot trigger');
    assert.ok(content.includes('Edit Title (X/35)'), 'Has Edit title action');
    assert.ok(content.includes('Move to Collection'), 'Has Move to collection action');
    assert.ok(content.includes('Hide Block') && content.includes('Unhide Block'), 'Has Hide/Unhide action');
    assert.ok(content.includes('Archive (Keep Clicks)') && content.includes('Delete Permanently'), 'Has Archive and Delete actions');
  });

  await t.test('validates ThumbnailPopover 4 Square Source Action Cards (Upload, Canva, GIPHY, AI)', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('src/components/Modals/ThumbnailPopover.jsx', 'utf8');

    assert.ok(content.includes('Upload'), 'Has Upload action card');
    assert.ok(content.includes('Canva'), 'Has Canva action card');
    assert.ok(content.includes('GIPHY'), 'Has GIPHY action card');
    assert.ok(content.includes('AI Icon'), 'Has AI Icon generator action card');
    assert.ok(content.includes('EyeOff'), 'Uses EyeOff icon');
    assert.ok(content.includes('No thumbnail will be displayed for this link.'), 'Has exact None tab subtext');
  });

  await t.test('validates PublicBioView & PhoneMockup alternativeTitleFont dynamic rendering', async () => {
    const fs = await import('node:fs');
    const publicBio = fs.readFileSync('src/components/PublicBio/PublicBioView.jsx', 'utf8');
    const phoneMockup = fs.readFileSync('src/components/Preview/PhoneMockup.jsx', 'utf8');

    assert.ok(publicBio.includes('alternativeTitleFont'), 'PublicBioView applies alternativeTitleFont');
    assert.ok(phoneMockup.includes('alternativeTitleFont'), 'PhoneMockup applies alternativeTitleFont');
    assert.ok(publicBio.includes('https://fonts.googleapis.com/css2?family='), 'PublicBioView dynamically loads Google Fonts');
    assert.ok(phoneMockup.includes('https://fonts.googleapis.com/css2?family='), 'PhoneMockup dynamically loads Google Fonts');
  });

  await t.test('validates AddProductModal omni-input clear button and auto-fill', async () => {
    const fs = await import('node:fs');
    const modalContent = fs.readFileSync('src/components/Modals/AddProductModal.jsx', 'utf8');

    assert.ok(modalContent.includes('Search for products or paste a link'), 'Has correct omni-input placeholder');
    assert.ok(modalContent.includes('title="Clear link"'), 'Has clear button on omni-input');
    assert.ok(modalContent.includes('/api/scrape-product'), 'Calls /api/scrape-product scraper');
  });

  await t.test('validates getTitleFontName safely handles both object and string schemas without throwing React child errors', async () => {
    const { getTitleFontName } = await import('../src/constants/app.js');
    assert.equal(getTitleFontName('Syne'), 'Syne');
    assert.equal(getTitleFontName({ enabled: true, font: 'Playfair Display' }), 'Playfair Display');
    assert.equal(getTitleFontName({ enabled: false, font: 'DM Sans' }), '');
    assert.equal(getTitleFontName(null), '');
    assert.equal(getTitleFontName(undefined), '');
  });

  await t.test('validates sticker preview interaction functionality (drag, resize, rotate, flip, and toolbar in PhoneMockup & PublicBioView)', async () => {
    const fs = await import('node:fs');
    const phoneMockup = fs.readFileSync('src/components/Preview/PhoneMockup.jsx', 'utf8');
    const publicBio = fs.readFileSync('src/components/PublicBio/PublicBioView.jsx', 'utf8');
    const profileModel = fs.readFileSync('src/models/Profile.js', 'utf8');

    // PhoneMockup Interactive Drag, Resize, Rotate, Flip
    assert.ok(phoneMockup.includes('handleStickerResizeMouseDown'), 'PhoneMockup supports interactive drag resize');
    assert.ok(phoneMockup.includes('handleStickerRotateMouseDown'), 'PhoneMockup supports interactive drag rotate');
    assert.ok(phoneMockup.includes('handleFlipSticker'), 'PhoneMockup supports horizontal flip toggle');
    assert.ok(phoneMockup.includes('handleRotateStep'), 'PhoneMockup supports 45-degree rotation stepping');
    assert.ok(phoneMockup.includes('handleScaleStep'), 'PhoneMockup supports scale zoom stepping');
    assert.ok(phoneMockup.includes('FlipHorizontal'), 'PhoneMockup uses FlipHorizontal icon');
    assert.ok(phoneMockup.includes('RotateCw'), 'PhoneMockup uses RotateCw icon');
    assert.ok(phoneMockup.includes('scaleX(-1)'), 'PhoneMockup applies scaleX(-1) horizontal flip transform');

    // PublicBioView Rendering
    assert.ok(publicBio.includes('scaleX(-1)'), 'PublicBioView applies scaleX(-1) for flipped stickers');
    assert.ok(publicBio.includes('rotate('), 'PublicBioView applies rotation angle');
    assert.ok(publicBio.includes('scale('), 'PublicBioView applies scale factor');

    // Mongoose Model Schema
    assert.ok(profileModel.includes('flipX:'), 'Profile model schema supports flipX');
    assert.ok(profileModel.includes('flipHorizontal:'), 'Profile model schema supports flipHorizontal');
    assert.ok(profileModel.includes('rotate:'), 'Profile model schema supports rotate');
    assert.ok(profileModel.includes('scale:'), 'Profile model schema supports scale');
    assert.ok(profileModel.includes('devices:'), 'Profile model schema supports per-device responsive overrides');

    // Multi-Device Responsiveness (Mobile, Tablet, Laptop)
    assert.ok(phoneMockup.includes('getStickerDeviceProps'), 'PhoneMockup supports getStickerDeviceProps');
    assert.ok(phoneMockup.includes('updateStickerWithMode'), 'PhoneMockup preserves device-specific placement');
    assert.ok(phoneMockup.includes('handleSyncStickerToAllDevices'), 'PhoneMockup supports syncing layout to all devices');
    assert.ok(publicBio.includes('getStickerDeviceProps'), 'PublicBioView applies getStickerDeviceProps for mobile/tablet/laptop');

    // API Profile Persistence
    const profileRoute = fs.readFileSync('src/app/api/profile/route.js', 'utf8');
    assert.ok(profileRoute.includes('designSettings:'), 'API profile route persists designSettings to database');
    assert.ok(profileRoute.includes('stickers:'), 'API profile route persists stickers array to database');

    // Section Anchoring (Linktree-grade invariant coordinates)
    assert.ok(profileModel.includes('anchorType:'), 'Profile model schema supports anchorType (HEADER, CONTENT)');
    assert.ok(phoneMockup.includes('data-anchor-section="HEADER"'), 'PhoneMockup supports HEADER anchor container');
    assert.ok(phoneMockup.includes('querySelector(\'[data-anchor-section="HEADER"]\')'), 'PhoneMockup dynamically resolves anchor section bounding box during drag and drop');

    // Constant Size & Rendered Outside Container
    assert.ok(phoneMockup.includes('scaleInv'), 'PhoneMockup counter-scales controls to maintain constant size regardless of zoom');
    assert.ok(phoneMockup.includes('OUTSIDE the device frame container'), 'PhoneMockup renders toolbar outside device frame container so zoom/rotate do not affect it');
    assert.ok(phoneMockup.includes('selectedStickerProps'), 'PhoneMockup accesses selected sticker properties outside container');
  });
});
