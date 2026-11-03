'use client';

import React, { useRef, useState } from 'react';
import { ACCEPTED_WALLPAPER_TYPES, uploadWallpaper } from '@/utils/wallpaperUpload';
import { getPhotoButtonColors, resolveImageOverlay } from '@/lib/theme-contrast';
import { getWallpaperImageLayer } from '@/lib/wallpaperImage';

const SHADES = [
  { id: 'auto', label: 'Auto' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'none', label: 'None' },
];

// How the photo is cropped on a phone and on a wide screen, so the owner can
// see that the part they care about stays in view on both.
function CropPreview({ layer, ratio, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden rounded-[6px] border-[0.5px] border-line bg-ink-900" style={{ aspectRatio: ratio, height: 88 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={layer.src} alt="" className="h-full w-full object-cover" style={{ objectPosition: layer.objectPosition, filter: layer.blur ? `blur(${layer.blur / 3}px)` : undefined }} />
        {layer.overlay && <div className="absolute inset-0" style={{ backgroundColor: layer.overlay }} />}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{label}</span>
    </div>
  );
}

/**
 * Studio controls for a photo wallpaper: upload (or paste a link), the point
 * that stays in view, the shade that keeps text readable, blur, and buttons
 * coloured from the photo. `onChange(patch)` merges into the wallpaper.
 */
export default function WallpaperPhotoPanel({ wallpaper = {}, onChange, onMatchColors }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const layer = getWallpaperImageLayer({ ...wallpaper, type: wallpaper.type === 'blur' ? 'blur' : 'image' });
  const shade = resolveImageOverlay(wallpaper);
  const photoColors = getPhotoButtonColors(wallpaper);
  const overlayMode = wallpaper.overlay || 'auto';

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const { url, meta } = await uploadWallpaper(file);
      onChange({ imageUrl: url, blurImage: url, imageMeta: meta, focalX: 50, focalY: 50 });
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const setFocal = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    onChange({ focalX: Math.min(100, Math.max(0, x)), focalY: Math.min(100, Math.max(0, y)) });
  };

  const isUpload = String(wallpaper.imageUrl || '').startsWith('/api/media/');

  return (
    <div className="space-y-4 p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        className={`rounded-[10px] border border-dashed p-4 text-center transition-colors ${dragging ? 'border-brand-500 bg-brand-50' : 'border-line bg-white'}`}
      >
        <p className="text-[13px] font-semibold text-ink-900">{layer ? 'Replace background photo' : 'Add a background photo'}</p>
        <p className="mt-1 text-[11px] text-ink-500">Drop a JPEG, PNG or WebP here. It is resized for phones and large screens automatically.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-[50px] bg-ink-900 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Uploading…' : 'Upload photo'}
        </button>
        <input ref={inputRef} type="file" accept={ACCEPTED_WALLPAPER_TYPES.join(',')} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        {error && <p role="alert" className="mt-2 text-[11px] font-medium text-red-600">{error}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="wallpaper-image-url" className="text-[11px] font-semibold text-ink-700">Or paste an https link</label>
        <input
          id="wallpaper-image-url"
          type="url"
          placeholder="https://images.unsplash.com/photo-..."
          value={isUpload ? '' : wallpaper.imageUrl || ''}
          onChange={(e) => onChange({ imageUrl: e.target.value, blurImage: e.target.value, imageMeta: null })}
          className="w-full rounded-[5px] border-[0.5px] border-line bg-white px-3 py-2 text-[12px]"
        />
        {!isUpload && wallpaper.imageUrl && (
          <p className="text-[11px] text-ink-500">Linked photos cannot be measured, so a stronger shade is used to keep text readable. Upload the photo for a lighter one.</p>
        )}
      </div>

      {layer && (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-ink-700">Click the part that must stay in view</p>
            <div className="relative cursor-crosshair overflow-hidden rounded-[8px] border-[0.5px] border-line" onClick={setFocal} role="presentation">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={layer.src} alt="Background photo" className="block max-h-[220px] w-full object-contain bg-ink-900" />
              <span
                className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-500/80 shadow-[0_0_0_2px_rgba(0,0,0,0.35)]"
                style={{ left: `${wallpaper.focalX ?? 50}%`, top: `${wallpaper.focalY ?? 50}%` }}
              />
            </div>
            <div className="flex items-end justify-center gap-4">
              <CropPreview layer={layer} ratio="9 / 19.5" label="Phone" />
              <CropPreview layer={layer} ratio="3 / 4" label="Tablet" />
              <CropPreview layer={layer} ratio="16 / 10" label="Desktop" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-ink-700">Shade for readable text</p>
            <div className="grid grid-cols-4 gap-1 rounded-[8px] bg-white p-1 border-[0.5px] border-line">
              {SHADES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ overlay: option.id })}
                  className={`rounded-[6px] py-1.5 text-[12px] font-semibold ${overlayMode === option.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-surface-2'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {overlayMode === 'auto' && (
              <p className="text-[11px] text-ink-500">
                {shade.tone ? `A ${Math.round(shade.opacity * 100)}% ${shade.tone} shade keeps your text readable on this photo.` : 'No shade needed.'}
              </p>
            )}
            {(overlayMode === 'dark' || overlayMode === 'light') && (
              <label className="flex items-center gap-3 text-[11px] text-ink-700">
                Strength
                <input
                  type="range"
                  min="0"
                  max="85"
                  step="5"
                  value={Math.round((wallpaper.overlayOpacity ?? 0.4) * 100)}
                  onChange={(e) => onChange({ overlayOpacity: Number(e.target.value) / 100 })}
                  className="flex-1 accent-brand-500"
                />
                <span className="w-9 text-right tabular-nums">{Math.round((wallpaper.overlayOpacity ?? 0.4) * 100)}%</span>
              </label>
            )}
            {overlayMode !== 'auto' && <p className="text-[11px] text-ink-500">Text colours still adjust automatically if they would be hard to read.</p>}
          </div>

          <label className="flex items-center gap-3 text-[11px] font-semibold text-ink-700">
            Blur
            <input
              type="range"
              min="0"
              max="24"
              step="1"
              value={wallpaper.blur || 0}
              onChange={(e) => onChange({ blur: Number(e.target.value) })}
              className="flex-1 accent-brand-500"
            />
            <span className="w-9 text-right tabular-nums font-normal">{wallpaper.blur || 0}px</span>
          </label>

          <div className="flex items-center justify-between gap-3 rounded-[8px] bg-white p-3 border-[0.5px] border-line">
            <div>
              <p className="text-[12px] font-semibold text-ink-900">Match colours to photo</p>
              <p className="text-[11px] text-ink-500">{photoColors ? 'Buttons take the photo’s strongest colour; cards turn to glass.' : 'Upload the photo to use its colours.'}</p>
            </div>
            <div className="flex items-center gap-2">
              {photoColors && <span className="h-6 w-6 rounded-full border-[0.5px] border-line" style={{ backgroundColor: photoColors.button }} />}
              <button
                type="button"
                disabled={!photoColors}
                onClick={() => onMatchColors(photoColors)}
                className="rounded-[50px] bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          <button type="button" onClick={() => onChange({ imageUrl: '', blurImage: '', imageMeta: null })} className="text-[11px] font-semibold text-red-600 hover:underline">
            Remove photo
          </button>
        </>
      )}
    </div>
  );
}
