'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Lays its children out at exactly `width` px, the width the public page
 * uses, and scales the result down to fit the available space. Without this
 * the Studio's laptop preview laid content out at the frame's own width, so
 * blocks were smaller than on the published page and fixed-size stickers
 * looked larger and sat elsewhere.
 */
export default function ScaledCanvas({ width, children }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;
    const update = () => {
      setScale(Math.min(1, (outer.clientWidth || width) / width));
      setHeight(inner.offsetHeight);
    };
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    update();
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={outerRef} style={{ width: '100%', height: height ? height * scale : undefined, overflow: 'visible' }}>
      <div ref={innerRef} style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
}
