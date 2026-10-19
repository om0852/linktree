'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, X, Sparkles } from 'lucide-react';

export default function StoryBubbleAvatar({ 
  avatarUrl, 
  name, 
  storyBubble,
  avatarShape = 'circle',
  sizeClasses = 'w-24 h-24 sm:w-28 sm:h-28' 
}) {
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const hasStory = Boolean(storyBubble?.enabled && storyBubble?.videoUrl);

  const getShapeStyles = (shape) => {
    switch (shape) {
      case 'rounded':
        return {
          container: 'rounded-2xl',
          ring: 'rounded-2xl',
          img: 'rounded-2xl'
        };
      case 'squircle':
        return {
          container: 'rounded-[32%]',
          ring: 'rounded-[32%]',
          img: 'rounded-[32%]'
        };
      case 'arch':
        return {
          container: 'rounded-t-full rounded-b-xl',
          ring: 'rounded-t-full rounded-b-xl',
          img: 'rounded-t-full rounded-b-xl'
        };
      case 'hexagon':
        return {
          container: '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]',
          ring: '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]',
          img: '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]'
        };
      case 'diamond':
        return {
          container: 'rounded-xl rotate-45 scale-90 overflow-hidden',
          ring: 'rounded-xl rotate-45 scale-95',
          img: '-rotate-45 scale-125'
        };
      case 'cutout':
        return {
          container: 'rounded-none bg-transparent !border-0 !shadow-none drop-shadow-md',
          ring: 'rounded-2xl',
          img: 'rounded-none object-contain'
        };
      case 'circle':
      default:
        return {
          container: 'rounded-full',
          ring: 'rounded-full',
          img: 'rounded-full'
        };
    }
  };

  const shapeStyles = getShapeStyles(avatarShape);

  const handleAvatarClick = () => {
    if (hasStory) {
      setShowStoryModal(true);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleVideoEnded = () => {
    setShowStoryModal(false);
    setProgress(0);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      <div 
        className={`relative inline-block ${hasStory ? 'cursor-pointer group' : ''}`}
        onClick={handleAvatarClick}
      >
        {/* Pulsing Gradient Ring if Story Bubble Active */}
        {hasStory && (
          <div className={`absolute -inset-1 ${shapeStyles.ring} bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 animate-spin-slow opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all shadow-lg shadow-rose-500/25 p-[2.5px]`}>
            <div className={`w-full h-full bg-zinc-950 ${shapeStyles.ring}`} />
          </div>
        )}

        {/* Avatar Image */}
        <div className={`relative ${sizeClasses} ${shapeStyles.container} overflow-hidden border-2 border-[#CAD8CE] bg-[#52796F] shadow-md flex items-center justify-center transition-transform group-hover:scale-[1.02]`}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name || 'Creator Avatar'} 
              className={`w-full h-full object-cover ${shapeStyles.img}`}
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {(name || 'C').charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Mini Story Indicator Badge */}
        {hasStory && (
          <div className="absolute bottom-0 right-0 p-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md border-2 border-zinc-950">
            <Play size={10} className="fill-white" />
          </div>
        )}
      </div>

      {/* Vertical Video Story Modal */}
      {showStoryModal && hasStory && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowStoryModal(false)}
        >
          <div 
            className="relative w-full max-w-sm aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Progress Bar */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center gap-1">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Creator Header on Top of Video */}
            <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between text-white drop-shadow-md">
              <div className="flex items-center gap-2.5">
                <img 
                  src={avatarUrl || ''} 
                  alt={name} 
                  className="w-8 h-8 rounded-full border border-white/40 object-cover" 
                />
                <span className="text-xs font-semibold">{name}</span>
                <span className="text-[10px] text-zinc-300 font-normal">Video Greeting</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <button 
                  onClick={() => setShowStoryModal(false)}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative w-full h-full flex items-center justify-center bg-zinc-950" onClick={togglePlay}>
              <video
                ref={videoRef}
                src={storyBubble.videoUrl}
                autoPlay
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play size={48} className="text-white fill-white opacity-80" />
                </div>
              )}
            </div>

            {/* Bottom Caption Overlay */}
            {storyBubble.caption && (
              <div className="absolute bottom-4 left-4 right-4 z-20 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs leading-relaxed">
                {storyBubble.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
