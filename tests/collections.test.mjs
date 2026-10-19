import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import Profile from '../src/models/Profile.js';

describe('Collections & Grouped Layouts Model Suite', () => {
  test('Profile schema validates collections and collectionId on links', () => {
    const sampleProfile = new Profile({
      username: 'test_collections_creator',
      name: 'Test Creator',
      collections: [
        {
          id: 'col_gear',
          title: 'My Video Gear',
          viewMode: 'grid',
          active: true,
        },
        {
          id: 'col_podcasts',
          title: 'Featured Podcasts',
          viewMode: 'carousel',
          active: true,
        },
      ],
      links: [
        {
          id: 'link_camera',
          title: 'Sony FX3 Cinema Camera',
          url: 'https://sony.com',
          collectionId: 'col_gear',
        },
        {
          id: 'link_lens',
          title: '24-70mm GM II Lens',
          url: 'https://sony.com/lens',
          collectionId: 'col_gear',
        },
        {
          id: 'link_ep1',
          title: 'Episode 100 on Spotify',
          url: 'https://spotify.com/ep100',
          collectionId: 'col_podcasts',
        },
        {
          id: 'link_portfolio',
          title: 'Personal Portfolio',
          url: 'https://portfolio.com',
          collectionId: '', // Ungrouped link
        },
      ],
    });

    const validationError = sampleProfile.validateSync();
    assert.equal(validationError, undefined, 'Profile with collections and collection-linked items should validate without errors');
    assert.equal(sampleProfile.collections.length, 2);
    assert.equal(sampleProfile.collections[0].title, 'My Video Gear');
    assert.equal(sampleProfile.collections[0].viewMode, 'grid');
    assert.equal(sampleProfile.collections[1].viewMode, 'carousel');
    assert.equal(sampleProfile.links[0].collectionId, 'col_gear');
    assert.equal(sampleProfile.links[3].collectionId, '');
  });

  test('Collection defaults viewMode to "list" if unspecified', () => {
    const sampleProfile = new Profile({
      username: 'test_default_viewmode',
      name: 'Default Mode Creator',
      collections: [
        {
          id: 'col_basic',
          title: 'General Resources',
        },
      ],
    });

    assert.equal(sampleProfile.collections[0].viewMode, 'list');
    assert.equal(sampleProfile.collections[0].active, true);
  });

  test('Profile schema validates headerLayout modes and socialsPosition', () => {
    const bannerProfile = new Profile({
      username: 'test_banner_creator',
      name: 'Banner Creator',
      headerLayout: 'banner',
      coverImage: 'https://images.unsplash.com/photo-banner',
      socialsPosition: 'bottom',
    });

    const heroProfile = new Profile({
      username: 'test_hero_creator',
      name: 'Hero Creator',
      headerLayout: 'hero',
      socialsPosition: 'top',
    });

    const defaultProfile = new Profile({
      username: 'test_classic_creator',
      name: 'Classic Creator',
    });

    assert.equal(bannerProfile.validateSync(), undefined);
    assert.equal(bannerProfile.headerLayout, 'banner');
    assert.equal(bannerProfile.coverImage, 'https://images.unsplash.com/photo-banner');
    assert.equal(bannerProfile.socialsPosition, 'bottom');

    assert.equal(heroProfile.validateSync(), undefined);
    assert.equal(heroProfile.headerLayout, 'hero');
    assert.equal(heroProfile.socialsPosition, 'top');

    assert.equal(defaultProfile.validateSync(), undefined);
    assert.equal(defaultProfile.headerLayout, 'classic');
    assert.equal(defaultProfile.socialsPosition, 'top');
  });

  test('Profile schema validates accessGate configuration', () => {
    const gatedProfile = new Profile({
      username: 'test_passcode_creator',
      name: 'Gated Creator',
      accessGate: {
        enabled: true,
        type: 'passcode',
        passcode: 'SECRET123',
        title: 'VIP Access Only',
        description: 'Please enter the VIP key to enter.',
      },
    });

    const ageGatedProfile = new Profile({
      username: 'test_age_creator',
      name: 'Age Gated Creator',
      accessGate: {
        enabled: true,
        type: 'age_18',
      },
    });

    assert.equal(gatedProfile.validateSync(), undefined);
    assert.equal(gatedProfile.accessGate.enabled, true);
    assert.equal(gatedProfile.accessGate.type, 'passcode');
    assert.equal(gatedProfile.accessGate.passcode, 'SECRET123');
    assert.equal(gatedProfile.accessGate.title, 'VIP Access Only');

    assert.equal(ageGatedProfile.validateSync(), undefined);
    assert.equal(ageGatedProfile.accessGate.type, 'age_18');
  });

  test('Collection link grouping correctly partitions 2 links under grid and carousel viewModes', () => {
    const profile = new Profile({
      username: 'test_grid_carousel_creator',
      name: 'Grid Carousel Creator',
      collections: [
        {
          id: 'col_gear_grid',
          title: 'Gear Bento Grid',
          viewMode: 'grid',
          active: true,
        },
        {
          id: 'col_slider_carousel',
          title: 'Products Carousel Slider',
          viewMode: 'carousel',
          active: true,
        },
      ],
      links: [
        {
          id: 'link_camera',
          title: 'Main Camera',
          collectionId: 'col_gear_grid',
        },
        {
          id: 'link_lens',
          title: 'Prime Lens',
          collectionId: 'col_gear_grid',
        },
        {
          id: 'link_preset1',
          title: 'Warm Preset',
          collectionId: 'col_slider_carousel',
        },
        {
          id: 'link_preset2',
          title: 'Cool Preset',
          collectionId: 'col_slider_carousel',
        },
        {
          id: 'link_top_level',
          title: 'Top Level Bio Link',
          collectionId: '',
        },
      ],
    });

    assert.equal(profile.validateSync(), undefined);

    // Verify grid collection has exactly 2 links for a 2-column grid layout
    const gridLinks = profile.links.filter(l => l.collectionId === 'col_gear_grid');
    assert.equal(gridLinks.length, 2, 'Grid collection should contain exactly 2 assigned links');
    assert.equal(gridLinks[0].title, 'Main Camera');
    assert.equal(gridLinks[1].title, 'Prime Lens');

    // Verify carousel collection has exactly 2 items for swipeable slider
    const carouselLinks = profile.links.filter(l => l.collectionId === 'col_slider_carousel');
    assert.equal(carouselLinks.length, 2, 'Carousel collection should contain exactly 2 assigned links');

    // Verify ungrouped links remain separate
    const ungrouped = profile.links.filter(l => !l.collectionId);
    assert.equal(ungrouped.length, 1);
    assert.equal(ungrouped[0].id, 'link_top_level');
  });

  test('Validates Instagram, YouTube, and Store product carousel collections and cards', () => {
    const profile = new Profile({
      username: 'multi_carousel_creator',
      name: 'Multi Carousel Creator',
      collections: [
        {
          id: 'col_ig_reels',
          title: 'Instagram Posts & Reels',
          viewMode: 'carousel',
          type: 'instagram',
        },
        {
          id: 'col_yt_videos',
          title: 'YouTube Uploads & Playlists',
          viewMode: 'carousel',
          type: 'youtube',
        },
        {
          id: 'col_amaze_products',
          title: 'Amaze Store Products',
          viewMode: 'carousel',
          type: 'products',
        },
      ],
      links: [
        {
          id: 'link_ig_reel1',
          title: 'Behind the Scenes Reel',
          url: 'https://instagram.com/reel/12345',
          collectionId: 'col_ig_reels',
          mediaType: 'instagram',
          thumbnail: 'https://images.unsplash.com/photo-1534528741775',
        },
        {
          id: 'link_yt_video1',
          title: 'My Morning Routine 2026',
          url: 'https://youtube.com/watch?v=abcd',
          collectionId: 'col_yt_videos',
          mediaType: 'youtube',
          badge: '14:20',
          thumbnail: 'https://images.unsplash.com/photo-1518173946687',
        },
        {
          id: 'link_product1',
          title: 'Creator Minimalist Tee',
          url: 'https://amaze.co/products/tee',
          collectionId: 'col_amaze_products',
          mediaType: 'product',
          price: '$34.00',
          badge: 'SALE',
          thumbnail: 'https://images.unsplash.com/photo-1523275335684',
        },
      ],
    });

    const err = profile.validateSync();
    assert.equal(err, undefined);
    assert.equal(profile.collections.length, 3);
    assert.equal(profile.collections[0].type, 'instagram');
    assert.equal(profile.collections[1].type, 'youtube');
    assert.equal(profile.collections[2].type, 'products');
    assert.equal(profile.links[0].mediaType, 'instagram');
    assert.equal(profile.links[1].mediaType, 'youtube');
    assert.equal(profile.links[2].price, '$34.00');
  });
});

