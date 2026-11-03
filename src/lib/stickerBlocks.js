/*
 * Content stickers can be pinned to the block they were placed on (a link,
 * the contact form, the shop...). The Studio preview and the public page lay
 * blocks out with different sizes and spacing, so a sticker measured from the
 * top of the page drifts; measured from its block it stays on that block.
 *
 * Blocks carry the same `data-sticker-block` key in both renderers.
 */

/** Size of one canvas px on screen (the Studio preview can be zoomed). */
function screenScale(canvas) {
  const rect = canvas.getBoundingClientRect();
  return canvas.offsetWidth ? rect.width / canvas.offsetWidth : 1;
}

/** Block rects inside `canvas`, in the canvas's own (unzoomed) px. */
export function measureStickerBlocks(canvas) {
  if (!canvas) return {};
  const origin = canvas.getBoundingClientRect();
  const scale = screenScale(canvas) || 1;
  const rects = {};
  canvas.querySelectorAll('[data-sticker-block]').forEach((block) => {
    const key = block.getAttribute('data-sticker-block');
    if (!key || rects[key]) return;
    const r = block.getBoundingClientRect();
    rects[key] = {
      left: (r.left - origin.left) / scale,
      top: (r.top - origin.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
    };
  });
  return rects;
}

/**
 * The innermost tagged block under a screen point, ignoring stickers.
 * Returns the key and where the point sits in it (percent of width/height).
 */
export function findStickerBlockAt(canvas, clientX, clientY) {
  if (!canvas || typeof document === 'undefined') return null;
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    if (el.closest('[data-sticker-id]')) continue;
    const block = el.closest('[data-sticker-block]');
    if (!block || !canvas.contains(block)) continue;
    const r = block.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    return {
      blockKey: block.getAttribute('data-sticker-block'),
      blockX: Number((((clientX - r.left) / r.width) * 100).toFixed(2)),
      blockY: Number((((clientY - r.top) / r.height) * 100).toFixed(2)),
    };
  }
  return null;
}

/** Position for a block-pinned sticker, or null to use the canvas position. */
export function getBlockStickerPositionStyle(props, rects) {
  const rect = props?.blockKey ? rects?.[props.blockKey] : null;
  if (!rect || typeof props.blockX !== 'number' || typeof props.blockY !== 'number') return null;
  return {
    left: `${Number((rect.left + (props.blockX / 100) * rect.width).toFixed(2))}px`,
    top: `${Number((rect.top + (props.blockY / 100) * rect.height).toFixed(2))}px`,
  };
}
