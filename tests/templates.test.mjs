import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Profile from '../src/models/Profile.js';
import { PROFILE_TEMPLATES } from '../src/constants/templates.js';
import { THEME_PRESETS, CURATED_THEMES, AVATAR_SHAPE_IDS, GOOGLE_FONTS_LIST, PAGE_FONTS, LINK_HIGHLIGHT_IDS, linkHighlightClass, bentoWideFlags } from '../src/constants/app.js';

const THEME_IDS = [...THEME_PRESETS, ...CURATED_THEMES].map((t) => t.id);
const TITLE_FONTS = [...GOOGLE_FONTS_LIST.suggested, ...GOOGLE_FONTS_LIST.other].map((f) => f.name);
// Keys of ICON_MAP in the renderers (PhoneMockup / PublicBioView).
const ICONS = ['Video', 'Star', 'Mail', 'FileText', 'Music', 'ShoppingBag', 'Zap', 'Briefcase', 'BookOpen', 'Calendar', 'MessageSquare', 'TrendingUp', 'Ticket', 'Globe', 'Youtube', 'Instagram', 'Twitter', 'Linkedin', 'Spotify', 'Imdb'];

describe('Profile templates', () => {
  it('only use themes, fonts, shapes, corners, icons and highlights that exist', () => {
    assert.ok(PROFILE_TEMPLATES.length >= 6);
    const ids = new Set();
    for (const t of PROFILE_TEMPLATES) {
      assert.ok(!ids.has(t.id), `duplicate ${t.id}`);
      ids.add(t.id);
      assert.ok(THEME_IDS.includes(t.themeId), `${t.id} theme`);
      assert.ok(PAGE_FONTS.includes(t.font), `${t.id} page font ${t.font}`);
      assert.ok(TITLE_FONTS.includes(t.titleFont), `${t.id} title font ${t.titleFont}`);
      assert.ok(AVATAR_SHAPE_IDS.includes(t.avatarShape), `${t.id} avatar`);
      assert.ok(['sharp', 'slight', 'rounded', 'full'].includes(t.buttonRoundness), `${t.id} corners`);
      assert.ok(t.links.length >= 3);
      for (const item of t.links) {
        assert.ok(ICONS.includes(item.icon), `${t.id} icon ${item.icon}`);
        assert.ok(LINK_HIGHLIGHT_IDS.includes(item.highlight), `${t.id} highlight`);
      }
    }
  });

  it('saves link highlights and maps them to CSS classes', () => {
    const doc = new Profile({ username: 'fx_test', name: 'FX', links: [{ id: 'a', title: 'A', highlight: 'glow' }] });
    assert.equal(doc.validateSync(), undefined);
    assert.equal(doc.links[0].highlight, 'glow');
    assert.equal(linkHighlightClass({ highlight: 'ring' }), 'link-fx link-fx-ring');
    assert.equal(linkHighlightClass({ highlight: 'none' }), '');
    assert.equal(linkHighlightClass({ highlight: 'explode' }), '');
  });

  it('packs bento cards so no row is left half empty', () => {
    const L = { size: 'large' };
    const S = { size: 'small' };
    // wide, small (alone before the next wide), wide
    assert.deepEqual(bentoWideFlags([L, S, L]), [true, true, true]);
    // two smalls share a row; an odd small at the end widens
    assert.deepEqual(bentoWideFlags([S, S, S]), [false, false, true]);
    assert.deepEqual(bentoWideFlags([S, S, L, S, S]), [false, false, true, false, false]);
    // a single card never spans (its grid has one column)
    assert.deepEqual(bentoWideFlags([L]), [false]);
    assert.deepEqual(bentoWideFlags([S, { embed: { enabled: true } }]), [true, true]);
  });
});
