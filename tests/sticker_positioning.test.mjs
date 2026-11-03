import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStickerDeviceProps,
  getStickerCanvasPositionStyle,
  getStickerGraphicSizeStyle,
} from '../src/constants/app.js';

test('header stickers keep their pixel distance from the centre on any width', () => {
  const props = { x: 65, y: 40, anchorType: 'PROFILE_HEADER', coordinateMode: 'pixel-offset', refWidth: 308 };
  const style = getStickerCanvasPositionStyle(props);

  // 15% of the 308px editor header = 46.2px right of centre, whatever the page width.
  assert.equal(style.left, 'calc(50% + 46.2px)');
  assert.equal(style.top, '40px');
});

test('content stickers stay proportional to the width, like the links they sit on', () => {
  const style = getStickerCanvasPositionStyle({ x: 80, y: 120, anchorType: 'CONTENT', coordinateMode: 'pixel-offset', refWidth: 308 });
  assert.equal(style.left, '80%');
  assert.equal(style.top, '120px');
});

test('stickers saved before refWidth existed render exactly as before', () => {
  assert.deepEqual(
    getStickerCanvasPositionStyle({ x: 30, y: 12, anchorType: 'HEADER', coordinateMode: 'pixel-offset' }),
    { left: '30%', top: '12px' },
  );
  assert.deepEqual(
    getStickerCanvasPositionStyle({ x: 30, y: 60, anchorType: 'CONTENT', coordinateMode: 'height-percent' }),
    { left: '30%', top: '60%' },
  );
});

test('device props carry the anchor width the sticker was placed against', () => {
  const sticker = {
    anchorType: 'PROFILE_HEADER',
    devices: {
      mobile: { x: 40, y: 10, anchorType: 'PROFILE_HEADER', coordinateMode: 'pixel-offset', refWidth: 308 },
      laptop: { x: 55, y: 18, anchorType: 'PROFILE_HEADER', coordinateMode: 'pixel-offset', refWidth: 380 },
    },
  };
  assert.equal(getStickerDeviceProps(sticker, 'mobile').refWidth, 308);
  assert.equal(getStickerDeviceProps(sticker, 'laptop').refWidth, 380);
});

test('sticker artwork has the same pixel size on every device', () => {
  for (const mode of ['mobile', 'tablet', 'laptop']) {
    assert.deepEqual(getStickerGraphicSizeStyle(mode, 'image'), { width: '40px', height: '40px' });
    assert.deepEqual(getStickerGraphicSizeStyle(mode, 'emoji'), { fontSize: '30px', lineHeight: '36px' });
  }
});

test('a block-pinned content sticker follows its block, not the page top', async () => {
  const { getBlockStickerPositionStyle } = await import('../src/lib/stickerBlocks.js');
  const props = { anchorType: 'CONTENT', blockKey: 'lead-capture', blockX: 80, blockY: 25 };

  // Studio preview: the card is 308x62 and starts 277px down.
  assert.deepEqual(
    getBlockStickerPositionStyle(props, { 'lead-capture': { left: 0, top: 277, width: 308, height: 62 } }),
    { left: '246.4px', top: '292.5px' },
  );
  // Public phone page: the same card is 326x128 and starts 292px down.
  assert.deepEqual(
    getBlockStickerPositionStyle(props, { 'lead-capture': { left: 24, top: 292, width: 326, height: 128 } }),
    { left: '284.8px', top: '324px' },
  );
});

test('a sticker whose block is gone falls back to its page position', async () => {
  const { getBlockStickerPositionStyle } = await import('../src/lib/stickerBlocks.js');
  assert.equal(getBlockStickerPositionStyle({ blockKey: 'link:deleted', blockX: 10, blockY: 10 }, {}), null);
  assert.equal(getBlockStickerPositionStyle({ x: 10, y: 10 }, { 'lead-capture': { left: 0, top: 0, width: 1, height: 1 } }), null);
});

test('device props carry the block pin from the per-device placement', () => {
  const sticker = {
    anchorType: 'CONTENT',
    devices: { mobile: { x: 80, y: 300, anchorType: 'CONTENT', coordinateMode: 'pixel-offset', blockKey: 'link:l_1', blockX: 90, blockY: 50 } },
  };
  const props = getStickerDeviceProps(sticker, 'mobile');
  assert.equal(props.blockKey, 'link:l_1');
  assert.equal(props.blockX, 90);
  assert.equal(props.blockY, 50);
});
