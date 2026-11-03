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
