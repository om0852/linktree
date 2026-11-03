'use client';

import React, { useEffect, useRef, useState } from 'react';

import { measureStickerBlocks } from '@/lib/stickerBlocks';

export { measureStickerBlocks, findStickerBlockAt, getBlockStickerPositionStyle } from '@/lib/stickerBlocks';

/**
 * Renders `children(rects)` inside a content canvas and keeps the block rects
 * current as blocks resize, load images or reflow. Place it as a direct child
 * of the canvas (the element the stickers are absolutely positioned in).
 */
export default function StickerBlockLayer({ children }) {
  const markerRef = useRef(null);
  const [rects, setRects] = useState({});

  useEffect(() => {
    const canvas = markerRef.current?.parentElement;
    if (!canvas) return undefined;

    // A timer rather than requestAnimationFrame: rAF never fires while the
    // page is not being drawn (background tab), which left stickers unplaced.
    let timer = 0;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setRects(measureStickerBlocks(canvas)), 16);
    };

    const resizeObserver = new ResizeObserver(update);
    const observeBlocks = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(canvas);
      canvas.querySelectorAll('[data-sticker-block]').forEach((block) => resizeObserver.observe(block));
    };
    // Blocks are added, removed and reordered as the profile is edited.
    const mutationObserver = new MutationObserver(() => {
      observeBlocks();
      update();
    });
    mutationObserver.observe(canvas, { childList: true, subtree: true });
    observeBlocks();
    update();

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <>
      <span ref={markerRef} aria-hidden="true" style={{ display: 'none' }} />
      {children(rects)}
    </>
  );
}
