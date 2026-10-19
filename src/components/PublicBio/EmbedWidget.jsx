'use client';

import React, { useState } from 'react';
import { Play, Pause, ChevronDown, ChevronUp, Music, Video } from 'lucide-react';

export default function EmbedWidget({ embed, title = '' }) {
  const [expanded, setExpanded] = useState(true);

  if (!embed || !embed.enabled || !embed.embedId || embed.platform === 'none') {
    return null;
  }

  const { platform, embedId } = embed;

  return (
    <div className="w-full mt-2.5 pt-2.5 border-t border-[#CAD8CE]/60 overflow-hidden transition-all duration-300">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5C6B64]">
          {platform === 'spotify' || platform === 'apple_music' ? (
            <Music size={13} className="text-[#52796F]" />
          ) : (
            <Video size={13} className="text-[#52796F]" />
          )}
          <span className="capitalize">{platform.replace('_', ' ')} Preview</span>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-[#5C6B64] hover:text-[#28352F] p-1 rounded-md transition-colors"
          title={expanded ? 'Collapse preview' : 'Expand preview'}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="w-full rounded-xl overflow-hidden bg-[#F5F3ED] border border-[#CAD8CE] shadow-xs animate-fadeIn">
          {platform === 'spotify' && (
            <iframe
              src={`https://open.spotify.com/embed/track/${embedId}?utm_source=generator&theme=0`}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-xl"
            />
          )}

          {platform === 'apple_music' && (
            <iframe
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              frameBorder="0"
              height="150"
              style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', borderRadius: '12px' }}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              src={`https://embed.music.apple.com/us/song/${embedId}`}
              loading="lazy"
            />
          )}

          {platform === 'youtube' && (
            <div className="relative w-full pt-[56.25%] rounded-xl overflow-hidden">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${embedId}?rel=0&modestbranding=1`}
                title={title || 'YouTube video player'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}

          {platform === 'tiktok' && (
            <div className="relative w-full flex justify-center py-2 bg-black/60">
              <iframe
                src={`https://www.tiktok.com/embed/v2/${embedId}`}
                style={{ width: '100%', maxWidth: '340px', height: '480px', border: 'none', borderRadius: '12px' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
