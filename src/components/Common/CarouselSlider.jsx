'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Folder, 
  ExternalLink, 
  ShoppingBag, 
  Play, 
  Video, 
  Sparkles,
  Heart,
  Eye,
  Film,
  Lock
} from 'lucide-react';
import { InstagramIcon, YoutubeIcon } from './SocialIcons';

export default function CarouselSlider({
  collection,
  links = [],
  onLinkClick,
  buttonShapeClass = 'rounded-2xl',
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Check scroll position to enable/disable arrow buttons
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);

    // Calculate approx active item index
    const itemWidth = 190;
    const newIndex = Math.min(
      links.length - 1,
      Math.max(0, Math.round(scrollLeft / itemWidth))
    );
    setActiveIndex(newIndex);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [links]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 220;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!links.length) return null;

  // Detect collection category
  const titleLower = (collection?.title || '').toLowerCase();
  const isInstagram = collection?.type === 'instagram' || titleLower.includes('instagram') || titleLower.includes('reel');
  const isYouTube = collection?.type === 'youtube' || titleLower.includes('youtube') || titleLower.includes('video') || titleLower.includes('playlist');
  const isStore = collection?.type === 'products' || titleLower.includes('store') || titleLower.includes('shop') || titleLower.includes('amaze') || titleLower.includes('product');

  // Helper to determine single link media type
  const getLinkMediaType = (link) => {
    if (link.mediaType) return link.mediaType;
    const url = (link.url || '').toLowerCase();
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (link.price || isStore) return 'product';
    if (isInstagram) return 'instagram';
    if (isYouTube) return 'youtube';
    return 'standard';
  };

  // Header Icon & Title
  const renderHeaderBadge = () => {
    if (isInstagram) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white ">
            <InstagramIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[14px] font-sans font-semibold text-ink-700 flex items-center gap-1.5">
              {collection.title}
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-pink-100 text-pink-700">Reels</span>
            </h3>
          </div>
        </div>
      );
    }

    if (isYouTube) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white ">
            <YoutubeIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[14px] font-sans font-semibold text-ink-700 flex items-center gap-1.5">
              {collection.title}
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-red-100 text-red-700">Videos</span>
            </h3>
          </div>
        </div>
      );
    }

    if (isStore) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-700 flex items-center justify-center text-white ">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[14px] font-sans font-semibold text-ink-700 flex items-center gap-1.5">
              {collection.title}
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-brand-100 text-brand-800">Store</span>
            </h3>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-500">
          <Folder className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-[14px] font-sans font-semibold text-ink-700">
          {collection.title}
        </h3>
        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold bg-brand-50 text-brand-500">
          {links.length}
        </span>
      </div>
    );
  };

  // Card Renderers
  const renderCard = (link, idx) => {
    const mediaType = getLinkMediaType(link);

    // 1. Instagram Posts & Reels Carousel Card
    if (mediaType === 'instagram') {
      const thumb = link.thumbnail || `https://images.unsplash.com/photo-${1534528741775 + (idx % 5) * 1000}?auto=format&fit=crop&w=500&q=80`;
      return (
        <div
          key={link.id || idx}
          onClick={() => onLinkClick && onLinkClick(link)}
          className={`group relative flex flex-col justify-between overflow-hidden ${buttonShapeClass} bg-black border-[0.5px] border-line/80 cursor-pointer transition-all w-[185px] sm:w-[200px] shrink-0 scroll-snap-align-start aspect-[4/5]`}
        >
          {/* Background Image / Reel Video Thumbnail */}
          <img
            src={thumb}
            alt={link.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
          />

          {/* Top Overlay Badge */}
          <div className="relative z-10 p-2.5 flex items-center justify-between">
            <span className="p-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
              <InstagramIcon className="w-3.5 h-3.5" />
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono font-semibold text-white uppercase border border-white/20 flex items-center gap-1">
              <Film className="w-2.5 h-2.5 text-pink-400" /> Reel
            </span>
          </div>

          {/* Center Play Icon */}
          <div className="relative z-10 flex items-center justify-center my-auto">
            <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-pop">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
          </div>

          {/* Bottom Gradient Caption */}
          <div className="relative z-10 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent text-white flex flex-col gap-1">
            <p className="text-xs font-semibold line-clamp-1 leading-snug">
              {link.title}
            </p>
            <div className="flex items-center justify-between text-[10px] text-zinc-300 font-mono">
              <span className="flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                {link.clicks ? `${link.clicks + 120}` : '1.4k'}
              </span>
              <span className="flex items-center gap-1 text-[9px] text-zinc-400 hover:text-white">
                View Reel <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 2. YouTube Videos, Channels & Playlists Carousel Card
    if (mediaType === 'youtube') {
      const thumb = link.thumbnail || `https://images.unsplash.com/photo-${1518173946687 + (idx % 5) * 1000}?auto=format&fit=crop&w=640&q=80`;
      return (
        <div
          key={link.id || idx}
          onClick={() => onLinkClick && onLinkClick(link)}
          className={`group relative flex flex-col overflow-hidden ${buttonShapeClass} bg-white border-[0.5px] border-line cursor-pointer hover:border-red-500 transition-all w-[210px] sm:w-[230px] shrink-0 scroll-snap-align-start`}
        >
          {/* 16:9 Thumbnail Header */}
          <div className="relative w-full aspect-[16/9] bg-black overflow-hidden">
            <img
              src={thumb}
              alt={link.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
            />
            {/* Center Red Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-white ml-0.5" />
              </div>
            </div>
            {/* Duration Tag */}
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-semibold text-white">
              {link.badge || '10:24'}
            </span>
          </div>

          {/* Video Metadata Body */}
          <div className="p-2.5 flex flex-col justify-between flex-1 gap-1 text-left">
            <h4 className="text-[12px] font-semibold text-ink-700 line-clamp-2 group-hover:text-red-600 transition-colors">
              {link.title}
            </h4>
            <p className="text-[10px] text-ink-500 font-mono truncate">
              {link.subtitle || 'YouTube Upload'}
            </p>
          </div>
        </div>
      );
    }

    // 3. Amaze Store Products Carousel Card
    if (mediaType === 'product') {
      const thumb = link.thumbnail || `https://images.unsplash.com/photo-${1523275335684 + (idx % 5) * 1000}?auto=format&fit=crop&w=400&q=80`;
      const price = link.price || link.badge || '$29.99';
      return (
        <div
          key={link.id || idx}
          onClick={() => onLinkClick && onLinkClick(link)}
          className={`group relative flex flex-col justify-between overflow-hidden ${buttonShapeClass} bg-white border-[0.5px] border-line cursor-pointer hover:border-brand-600 transition-all w-[185px] sm:w-[200px] shrink-0 scroll-snap-align-start p-2.5`}
        >
          {/* Product Photo */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-2 mb-2">
            <img
              src={thumb}
              alt={link.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Price Pill */}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-ink-900 text-white text-[11px] font-mono font-semibold ">
              {price.startsWith('$') ? price : `$${price}`}
            </span>
            {link.badge && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider bg-brand-100 text-brand-800 border border-brand-300">
                {link.badge}
              </span>
            )}
          </div>

          {/* Product Details */}
          <div className="text-left mb-2 flex-1">
            <h4 className="text-[12px] font-semibold text-ink-700 line-clamp-1 group-hover:text-ink-900 transition-colors">
              {link.title}
            </h4>
            <p className="text-[10px] text-ink-500 truncate mt-0.5">
              {link.subtitle || 'Official Store Merchandise'}
            </p>
          </div>

          {/* 1-Tap Buy Now Button */}
          <button
            type="button"
            className="w-full py-1.5 px-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Buy Now</span>
          </button>
        </div>
      );
    }

    // 4. Standard Link Bento Carousel Card
    return (
      <div
        key={link.id || idx}
        onClick={() => onLinkClick && onLinkClick(link)}
        className={`group relative flex flex-col justify-between overflow-hidden ${buttonShapeClass} bg-white border-[0.5px] border-line cursor-pointer hover:border-brand-500 transition-all w-[180px] sm:w-[195px] shrink-0 scroll-snap-align-start p-3 text-left`}
      >
        {link.badge && (
          <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold uppercase tracking-wider bg-brand-50 text-brand-500 border-[0.5px] border-line/60">
            {link.badge}
          </span>
        )}

        {link.leadMagnet?.enabled ? (
          <div className="w-8 h-8 rounded-xl bg-surface-2 border-[0.5px] border-line flex items-center justify-center text-brand-500 mb-3">
            <Lock className="w-4 h-4" />
          </div>
        ) : null}

        <div>
          <h4 className="text-[12px] font-semibold text-ink-700 line-clamp-2 group-hover:text-brand-500 transition-colors">
            {link.title}
          </h4>
          <p className="text-[10px] text-ink-500 truncate mt-0.5">
            {link.subtitle || 'Explore link'}
          </p>
        </div>

        <div className="mt-2.5 pt-2 border-t-[0.5px] border-line/50 flex items-center justify-between text-[10px] font-mono text-ink-500">
          <span>{link.clicks || 0} clicks</span>
          <span className="text-brand-500 font-semibold group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 min-w-0">
      {/* Visual Header with Navigation Slider Controls */}
      <div className="w-full flex items-center justify-between px-1">
        {renderHeaderBadge()}

        {/* Carousel Slider Controls (Left / Right Arrows) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            className="w-7 h-7 rounded-lg bg-white border-[0.5px] border-line flex items-center justify-center text-ink-700 hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            className="w-7 h-7 rounded-lg bg-white border-[0.5px] border-line flex items-center justify-center text-ink-700 hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Swipeable Scroll Track */}
      <div className="w-full overflow-hidden relative">
        <div
          ref={scrollRef}
          className="flex flex-row flex-nowrap gap-2.5 overflow-x-auto overflow-y-hidden py-1 px-0.5 scroll-smooth no-scrollbar scroll-snap-x-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {links.map((link, idx) => renderCard(link, idx))}
        </div>
      </div>

      {/* Carousel Dots Progress Indicator */}
      {links.length > 1 && (
        <div className="flex items-center justify-center gap-1 pt-0.5">
          {links.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-4 bg-brand-500'
                  : 'w-1 bg-brand-100'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
