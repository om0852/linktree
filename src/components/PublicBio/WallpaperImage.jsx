'use client';

import React from 'react';
import { getWallpaperImageLayer } from '@/lib/wallpaperImage';

/**
 * Photo wallpaper drawn behind the page. `fixed` pins it to the screen (public
 * page) so it never stretches with a long page; inside a Studio device frame
 * it fills the frame instead. The parent must be a stacking context
 * (`isolate`) so the photo sits above its background and below the content.
 */
export default function WallpaperImage({ wallpaper, fixed = false }) {
  const layer = getWallpaperImageLayer(wallpaper);
  if (!layer) return null;
  return (
    <div
      aria-hidden="true"
      className={`${fixed ? 'fixed' : 'absolute'} inset-0 -z-10 overflow-hidden pointer-events-none`}
      style={{ backgroundColor: layer.placeholder }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- srcset/sizes are computed for a full-screen crop */}
      <img
        src={layer.src}
        srcSet={layer.srcSet}
        sizes={layer.sizes}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="h-full w-full object-cover"
        style={{
          objectPosition: layer.objectPosition,
          // Scale up a little when blurred so the soft edges stay off screen.
          ...(layer.blur ? { filter: `blur(${layer.blur}px)`, transform: 'scale(1.08)' } : {}),
        }}
      />
      {layer.overlay && <div className="absolute inset-0" style={{ backgroundColor: layer.overlay }} />}
    </div>
  );
}
