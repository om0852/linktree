'use client';

import React, { useState } from 'react';
import { getReadableThemeColors } from '@/lib/theme-contrast';
import TipModal from '../Modals/TipModal';
import { 
  InstagramIcon, 
  YoutubeIcon, 
  TwitterIcon, 
  LinkedinIcon, 
  SpotifyIcon, 
  ImdbIcon 
} from '../Common/SocialIcons';
import { 
  CheckCircle2, 
  ExternalLink, 
  MapPin, 
  Sparkles, 
  Heart, 
  Send, 
  Coffee, 
  Share2, 
  Music, 
  Video, 
  Star, 
  Mail, 
  FileText, 
  ShoppingBag, 
  Zap, 
  Briefcase, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Ticket, 
  Globe,
  Smartphone,
  Tablet,
  Laptop,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Folder,
  ChevronDown,
  ChevronRight,
  Eye,
  MapPin as MapPinIcon,
  Check,
  Lock,
  Unlock,
  Tag,
  PhoneCall,
  RotateCw,
  FlipHorizontal,
  Trash2,
  Move,
  X,
  Layers,
} from 'lucide-react';
import LeadCaptureModal from '../Modals/LeadCaptureModal';
import ScheduleMeetingModal from '../Modals/ScheduleMeetingModal';
import ViewAsModal from '../Modals/ViewAsModal';
import AccessGateScreen from '../Common/AccessGateScreen';
import StoryBubbleAvatar from '../PublicBio/StoryBubbleAvatar';
import SocialProofTicker from '../PublicBio/SocialProofTicker';
import CarouselSlider from '../Common/CarouselSlider';
import { THEME_PRESETS, CURATED_THEMES, getTitleFontName, getStickerDeviceProps, getStickerCanvasPositionStyle, getStickerGraphicSizeStyle, isImageUrl, parseTailwindGradient } from '../../constants/app';

const ICON_MAP = {
  Video, Star, Mail, FileText, Music, ShoppingBag, Zap, Briefcase, BookOpen, Calendar, MessageSquare, TrendingUp, Ticket, Globe,
  Youtube: YoutubeIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  Linkedin: LinkedinIcon,
  Spotify: SpotifyIcon,
  Imdb: ImdbIcon
};

export default function PhoneMockup({ profile, onIncrementClick, onUpdateStickers }) {
  const [deviceMode, setDeviceMode] = useState('mobile');
  const [zoomScale, setZoomScale] = useState(1);

  // Scrollable Content Canvas Refs for Sticker coordinate mapping
  const contentCanvasRef = React.useRef(null);
  const contentCanvasTabletRef = React.useRef(null);
  const contentCanvasLaptopRef = React.useRef(null);
  const phoneViewportRef = React.useRef(null);
  const ignoreNextViewportClickRef = React.useRef(false);
  const interactionTimerRef = React.useRef(null);
  const stickerSequenceRef = React.useRef(0);
  const stickerInstanceId = React.useId();

  const markStickerInteraction = () => {
    ignoreNextViewportClickRef.current = true;
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    interactionTimerRef.current = setTimeout(() => {
      ignoreNextViewportClickRef.current = false;
      interactionTimerRef.current = null;
    }, 800);
  };

  const getActiveCanvasRef = React.useCallback(() => {
    if (deviceMode === 'tablet') return contentCanvasTabletRef;
    if (deviceMode === 'laptop') return contentCanvasLaptopRef;
    return contentCanvasRef;
  }, [deviceMode]);

  // Upgrade existing content-anchored stickers that are actually sitting in
  // the profile header. Older Studio builds saved those against the full page.
  React.useEffect(() => {
    if (!onUpdateStickers) return;
    const canvas = getActiveCanvasRef()?.current;
    const header = canvas?.querySelector('[data-anchor-section="PROFILE_HEADER"]');
    if (!canvas || !header) return;

    const canvasRect = canvas.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    if (!canvasRect.width || !canvas.offsetWidth || !headerRect.height || !header.offsetWidth) return;

    const headerTop = (headerRect.top - canvasRect.top) * (canvas.offsetWidth / canvasRect.width);
    const headerLeft = (headerRect.left - canvasRect.left) * (canvas.offsetWidth / canvasRect.width);
    const headerHeight = header.offsetHeight;
    const headerWidth = header.offsetWidth;
    const stickers = profile?.designSettings?.stickers || [];
    let changed = false;

    const migrated = stickers.map((sticker) => {
      const props = getStickerDeviceProps(sticker, deviceMode, 'split');
      if (props.anchorType !== 'CONTENT') return sticker;

      const yInCanvas = props.coordinateMode === 'pixel-offset'
        ? props.y
        : (props.y / 100) * canvas.offsetHeight;
      if (yInCanvas < headerTop - 12 || yInCanvas > headerTop + headerHeight + 12) return sticker;

      changed = true;
      const xInCanvas = (props.x / 100) * canvas.offsetWidth;
      const deviceProps = {
        ...props,
        x: Math.max(2, Math.min(98, Number((((xInCanvas - headerLeft) / headerWidth) * 100).toFixed(3)))),
        y: Number(Math.max(0, yInCanvas - headerTop).toFixed(3)),
        anchorType: 'PROFILE_HEADER',
        coordinateMode: 'pixel-offset',
      };

      return {
        ...sticker,
        devices: {
          ...(sticker.devices || {}),
          [deviceMode]: {
            ...(sticker.devices?.[deviceMode] || {}),
            ...deviceProps,
          },
        },
      };
    });

    if (changed) onUpdateStickers(migrated);
  }, [deviceMode, getActiveCanvasRef, onUpdateStickers, profile?.designSettings?.stickers]);

  const handleViewportClick = (e) => {
    // If user just dragged, resized, rotated, or clicked a sticker, do NOT deselect!
    if (ignoreNextViewportClickRef.current) {
      ignoreNextViewportClickRef.current = false;
      return;
    }
    // Only deselect if user explicitly clicked outside stickers
    if (e.target.closest('[data-sticker-id]')) {
      return;
    }
    setSelectedStickerId(null);
  };

  const ZOOM_PRESETS = [0.5, 0.65, 0.75, 0.85, 1, 1.15, 1.25];

  const handleZoomIn = () => {
    setZoomScale((prev) => {
      const next = ZOOM_PRESETS.find((z) => z > prev + 0.04);
      return next !== undefined ? next : Math.min(1.5, Number((prev + 0.1).toFixed(2)));
    });
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const reversed = [...ZOOM_PRESETS].reverse();
      const next = reversed.find((z) => z < prev - 0.04);
      return next !== undefined ? next : Math.max(0.4, Number((prev - 0.1).toFixed(2)));
    });
  };

  const handleZoomReset = () => {
    setZoomScale(1);
  };

  // Dynamic Google Font Loader for expressive alternative title fonts in studio preview
  React.useEffect(() => {
    const font = getTitleFontName(profile?.alternativeTitleFont);
    if (!font) return;
    const fontId = `gfont-${font.replace(/\s+/g, '-').toLowerCase()}`;
    if (typeof document !== 'undefined' && !document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800&display=swap`;
      document.head.appendChild(link);
    }
  }, [profile?.alternativeTitleFont]);

  const getDeviceBaseScale = () => {
    switch (deviceMode) {
      case 'laptop': return 0.46; // Scales 920px laptop frame to 423px to fit neatly into 5-col studio preview
      case 'tablet': return 0.62; // Scales 680px tablet frame to 421px
      case 'mobile':
      default: return 1.0;
    }
  };

  const effectiveScale = getDeviceBaseScale() * zoomScale;

  const getContainerHeight = () => {
    switch (deviceMode) {
      case 'laptop': return `${Math.round(620 * effectiveScale)}px`;
      case 'tablet': return `${Math.round(780 * effectiveScale)}px`;
      case 'mobile':
      default: return `${Math.round(760 * effectiveScale)}px`;
    }
  };
  const [activeBioTab, setActiveBioTab] = useState('links');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [collapsedCollections, setCollapsedCollections] = useState({});
  const [showViewAsModal, setShowViewAsModal] = useState(false);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const [simulation, setSimulation] = useState({
    location: 'global',
    platform: 'all',
    language: 'en',
  });

  const getIcon = (iconName) => {
    if (!iconName || iconName === 'link' || iconName === 'external') return null;
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4 shrink-0" /> : null;
  };

  const handleLinkClick = (link) => {
    if (onIncrementClick) onIncrementClick(link.id);

    // Asynchronously log click to MongoDB
    if (profile.username && link.id) {
      fetch(`/api/click/${link.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          destination: link.url || '',
        }),
      }).catch((err) => console.error('Click track error:', err));
    }

    if (link.url && link.url !== '#') {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          username: profile.username,
        }),
      });
      setNewsletterSuccess(true);
      setTimeout(() => setNewsletterSuccess(false), 4000);
      setNewsletterEmail('');
    } catch (err) {
      console.error('Newsletter error:', err);
    }
  };

  const handleCopyShare = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/${profile.username || ''}` : '';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Find theme preset across all presets and curated themes
  const getActiveThemePreset = () => {
    return (
      THEME_PRESETS.find((p) => p.id === profile?.theme) ||
      CURATED_THEMES.find((t) => t.id === profile?.theme) ||
      null
    );
  };

  const getThemeClass = () => {
    switch (profile?.theme) {
      case 'sunset': return 'theme-sunset';
      case 'emerald': return 'theme-emerald';
      case 'minimal-light': return 'theme-minimal-light';
      case 'neon': return 'theme-neon';
      case 'dark-glass': return 'theme-dark-glass';
      case 'emerald-gold': return 'theme-emerald-gold';
      case 'atelier': return 'theme-atelier';
      default: return 'theme-atelier';
    }
  };

  // Dynamic Wallpaper Style based on Studio designSettings and active theme preset
  const getWallpaperStyle = () => {
    const wp = profile?.designSettings?.wallpaper;
    const preset = getActiveThemePreset();

    // 1. Explicit Image / Blur / Pattern overrides
    if (wp) {
      if ((wp.type === 'image' || wp.type === 'blur') && (wp.imageUrl || wp.blurImage)) {
        return {
          backgroundImage: `url("${wp.imageUrl || wp.blurImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        };
      }
      if (wp.type === 'pattern') {
        return {
          backgroundColor: '#FFFEFA',
          backgroundImage: 'radial-gradient(#CAD8CE 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        };
      }
      // If user explicitly configured a gradient in wallpaper settings
      if (wp.type === 'gradient' && wp.gradient) {
        return { background: parseTailwindGradient(wp.gradient) };
      }
      // If user customized a specific fill color that isn't the blank default, or if preset matches
      if (wp.type === 'fill' && wp.value && wp.value !== '#FFFEFA') {
        return { backgroundColor: wp.value };
      }
    }

    // 2. Active Theme Preset Background (Hex, Tailwind Named Color, or Gradient)
    if (preset && preset.bg) {
      if (preset.bg.startsWith('bg-[#') && preset.bg.endsWith(']')) {
        return { backgroundColor: preset.bg.slice(4, -1) };
      }
      if (preset.bg.includes('gradient')) {
        return { background: parseTailwindGradient(preset.bg) };
      }
      if (preset.bg === 'bg-slate-950') return { backgroundColor: '#020617' };
      if (preset.bg === 'bg-white') return { backgroundColor: '#ffffff' };
      if (preset.bg.startsWith('#')) return { backgroundColor: preset.bg };
    }

    if (wp?.type === 'fill' && wp.value) {
      return { backgroundColor: wp.value };
    }

    return {};
  };

  // Comprehensive theme styling resolver for cards, typography, and borders
  const getThemeStyles = () => {
    const preset = getActiveThemePreset();
    const ds = profile?.designSettings;
    const customColors = ds?.customColors || {};

    // Resolve contrast from the actual background so preview and public pages agree.
    const readableColors = getReadableThemeColors(preset, ds?.wallpaper, customColors);
    const { isDark } = readableColors;
    const titleColor = readableColors.title;
    const bioColor = readableColors.body;
    const mutedColor = readableColors.muted;

    // 3. Card Background & Border Style
    const cardStyle = {};
    if (preset?.cardBg) {
      if (preset.cardBg.startsWith('bg-[#') && preset.cardBg.endsWith(']')) {
        cardStyle.backgroundColor = preset.cardBg.slice(4, -1);
      } else if (preset.cardBg.startsWith('bg-white/')) {
        const opacity = parseInt(preset.cardBg.split('/')[1], 10) / 100;
        cardStyle.backgroundColor = `rgba(255, 255, 255, ${opacity || 0.15})`;
        cardStyle.backdropFilter = 'blur(16px)';
        cardStyle.WebkitBackdropFilter = 'blur(16px)';
      } else if (preset.cardBg.startsWith('bg-black/')) {
        const opacity = parseInt(preset.cardBg.split('/')[1], 10) / 100;
        cardStyle.backgroundColor = `rgba(0, 0, 0, ${opacity || 0.4})`;
        cardStyle.backdropFilter = 'blur(16px)';
        cardStyle.WebkitBackdropFilter = 'blur(16px)';
      } else if (preset.cardBg.includes('/')) {
        const parts = preset.cardBg.split('/');
        const colorPart = parts[0].replace('bg-[', '').replace(']', '');
        const op = parseInt(parts[1], 10) / 100;
        if (colorPart.startsWith('#')) {
          const r = parseInt(colorPart.slice(1, 3), 16);
          const g = parseInt(colorPart.slice(3, 5), 16);
          const b = parseInt(colorPart.slice(5, 7), 16);
          cardStyle.backgroundColor = `rgba(${r}, ${g}, ${b}, ${op || 0.25})`;
        }
      } else if (preset.cardBg === 'bg-white') {
        cardStyle.backgroundColor = '#FFFFFF';
      } else if (preset.cardBg === 'bg-stone-50') {
        cardStyle.backgroundColor = '#fafaf9';
      }
    }

    if (!cardStyle.backgroundColor) {
      cardStyle.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F3ED';
    }

    // Border Resolution
    if (preset?.border) {
      if (preset.border.startsWith('border-[#') && preset.border.includes(']/')) {
        const [c, op] = preset.border.replace('border-[', '').split(']/');
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        cardStyle.borderColor = `rgba(${r}, ${g}, ${b}, ${parseInt(op, 10)/100 || 0.35})`;
      } else if (preset.border.startsWith('border-[#') && preset.border.endsWith(']')) {
        cardStyle.borderColor = preset.border.slice(8, -1);
      } else if (preset.border.startsWith('border-white/')) {
        const op = parseInt(preset.border.split('/')[1], 10) / 100;
        cardStyle.borderColor = `rgba(255, 255, 255, ${op || 0.25})`;
      } else if (preset.border === 'border-stone-200') {
        cardStyle.borderColor = '#e7e5e4';
      } else {
        cardStyle.borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : '#CAD8CE';
      }
    } else {
      cardStyle.borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : '#CAD8CE';
    }

    // Corner Roundness synchronized across all cards & buttons
    const roundness = ds?.buttonRoundness || profile?.buttonShape;
    let cardRadius = '16px';
    let btnRadius = '12px';
    if (roundness === 'sharp') {
      cardRadius = '0px';
      btnRadius = '0px';
    } else if (roundness === 'slight') {
      cardRadius = '8px';
      btnRadius = '6px';
    } else if (roundness === 'rounded') {
      cardRadius = '16px';
      btnRadius = '12px';
    } else if (roundness === 'full' || roundness === 'pill') {
      cardRadius = '22px';
      btnRadius = '9999px';
    }
    cardStyle.borderRadius = cardRadius;

    // Card Drop Shadow
    const shadow = ds?.buttonShadow || 'soft';
    if (shadow === 'none') {
      cardStyle.boxShadow = 'none';
    } else if (shadow === 'soft') {
      cardStyle.boxShadow = isDark ? '0 4px 18px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)';
    } else if (shadow === 'hard') {
      cardStyle.boxShadow = isDark ? '0 8px 28px rgba(0, 0, 0, 0.5)' : '0 6px 20px rgba(0, 0, 0, 0.14)';
    } else if (shadow === 'offset') {
      cardStyle.boxShadow = `3px 3px 0px ${preset?.accent || (isDark ? '#FFFFFF' : '#28352F')}`;
    }

    // Icon Container Box Style
    const iconBoxStyle = {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: cardStyle.borderColor,
      color: titleColor,
      borderRadius: btnRadius,
    };

    return {
      isDark,
      titleColor,
      bioColor,
      mutedColor,
      cardStyle,
      iconBoxStyle,
      btnRadius,
      cardRadius,
      accentColor: preset?.accent || '#52796F',
      primaryColor: preset?.primary || '#52796F',
    };
  };

  // Dynamic Button Custom Styling based on Studio designSettings
  const getButtonCustomStyle = () => {
    const ds = profile?.designSettings;
    const preset = getActiveThemePreset();
    const themeStyles = getThemeStyles();
    const style = {};

    // 1. Corner Roundness
    const roundness = ds?.buttonRoundness || profile?.buttonShape;
    if (roundness === 'sharp') {
      style.borderRadius = '0px';
    } else if (roundness === 'slight') {
      style.borderRadius = '8px';
    } else if (roundness === 'rounded') {
      style.borderRadius = '16px';
    } else if (roundness === 'full' || roundness === 'pill') {
      style.borderRadius = '9999px';
    } else {
      style.borderRadius = '16px';
    }

    // 2. Button Fill Style & Colors
    const btnColor = ds?.buttonColor || preset?.primary || '#52796F';
    const textColor = ds?.buttonTextColor || '#FFFFFF';
    const btnStyle = ds?.buttonStyle || 'solid';

    if (btnStyle === 'solid') {
      style.backgroundColor = btnColor;
      style.color = textColor;
      style.border = '1px solid transparent';
    } else if (btnStyle === 'glass') {
      style.backgroundColor = themeStyles.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.7)';
      style.backdropFilter = 'blur(16px)';
      style.WebkitBackdropFilter = 'blur(16px)';
      style.color = themeStyles.isDark ? '#FFFFFF' : (themeStyles.titleColor || '#28352F');
      style.border = themeStyles.isDark ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.85)';
    } else if (btnStyle === 'outline') {
      style.backgroundColor = 'transparent';
      style.color = btnColor;
      style.borderColor = btnColor;
      style.borderWidth = '2px';
      style.borderStyle = 'solid';
    }

    // 3. Drop Shadow Elevation (only if not outline)
    if (btnStyle !== 'outline') {
      const shadow = ds?.buttonShadow || 'soft';
      if (shadow === 'none') {
        style.boxShadow = 'none';
      } else if (shadow === 'soft') {
        style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.08)';
      } else if (shadow === 'hard') {
        style.boxShadow = '0 8px 22px rgba(0, 0, 0, 0.2)';
      } else if (shadow === 'offset') {
        style.boxShadow = `3px 3px 0px ${preset?.accent || '#28352F'}`;
      }
    } else {
      style.boxShadow = 'none';
    }

    return style;
  };

  const themeStyles = getThemeStyles();
  const btnCustomStyle = getButtonCustomStyle();

  // Sticker Drag and Drop handlers
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e, targetCanvasRef) => {
    e.preventDefault();
    try {
      const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      if (!rawData) return;
      const stickerData = JSON.parse(rawData);
      if (!stickerData.emoji) return;

      const canvasEl = targetCanvasRef?.current || contentCanvasRef.current;
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();

      const profileHeaderEl = canvasEl.querySelector('[data-anchor-section="PROFILE_HEADER"]') || canvasEl;
      const profileHeaderRect = profileHeaderEl.getBoundingClientRect();

      const clientX = e.clientX;
      const clientY = e.clientY;

      // Keep newly placed header stickers anchored to the full profile header.
      const isProfileHeaderDrop = clientY >= profileHeaderRect.top - 15
        && clientY <= profileHeaderRect.bottom + 15;
      const targetEl = isProfileHeaderDrop ? profileHeaderEl : canvasEl;
      const targetRect = isProfileHeaderDrop ? profileHeaderRect : rect;
      const anchorType = isProfileHeaderDrop ? 'PROFILE_HEADER' : 'CONTENT';

      const relativeX = clientX - targetRect.left;
      const xPct = Math.max(5, Math.min(95, Math.round((relativeX / targetRect.width) * 100)));

      const relativeY = clientY - targetRect.top;
      const coordinateMode = isProfileHeaderDrop ? 'pixel-offset' : 'height-percent';
      const y = coordinateMode === 'pixel-offset'
        ? Number((relativeY * targetEl.offsetHeight / targetRect.height).toFixed(3))
        : Math.max(2, Math.min(98, Math.round((relativeY / targetRect.height) * 100)));

      const stickerSequence = ++stickerSequenceRef.current;
      const baseSticker = {
        id: `stk_${stickerInstanceId}_${stickerSequence}`,
        src: isImageUrl(stickerData.src) ? stickerData.src : '',
        emoji: stickerData.emoji || '✨',
        name: stickerData.name || 'Sticker',
        anchorType,
        x: xPct,
        y,
        coordinateMode,
        scale: 1,
        rotate: ((stickerSequence * 7) % 20) - 10,
        flipX: false,
      };

      const newSticker = {
        ...baseSticker,
        devices: {
          mobile: { x: xPct, y, scale: 1, rotate: baseSticker.rotate, flipX: false, anchorType, coordinateMode },
          tablet: { x: xPct, y, scale: 1, rotate: baseSticker.rotate, flipX: false, anchorType, coordinateMode },
          laptop: { x: xPct, y, scale: 1, rotate: baseSticker.rotate, flipX: false, anchorType, coordinateMode },
          [deviceMode]: {
            x: xPct,
            y,
            scale: 1,
            rotate: baseSticker.rotate,
            flipX: false,
            anchorType,
            coordinateMode,
          },
        },
      };

      const currentStickers = profile?.designSettings?.stickers || [];
      if (onUpdateStickers) {
        onUpdateStickers([...currentStickers, newSticker]);
        setSelectedStickerId(newSticker.id);
      }
    } catch (err) {
      console.error('Error dropping sticker:', err);
    }
  };

  // Update a sticker: preserves and updates device-specific overrides for seamless cross-device responsiveness
  const updateStickerWithMode = (stickerId, updater) => {
    if (!onUpdateStickers) return;
    const currentStickers = profile?.designSettings?.stickers || [];
    const updated = currentStickers.map((s) => {
      if (s.id !== stickerId) return s;
      const currentProps = getStickerDeviceProps(s, deviceMode, 'split');
      const newProps = updater(currentProps, s);

      const existingDevices = s.devices || {};
      const newDevices = {
        ...existingDevices,
        [deviceMode]: {
          ...(existingDevices[deviceMode] || {}),
          ...newProps,
        },
      };

      // When modifying on the primary mobile view, synchronize coordinates across all devices
      if (deviceMode === 'mobile') {
        newDevices.tablet = { ...(newDevices.tablet || {}), ...newProps };
        newDevices.laptop = { ...(newDevices.laptop || {}), ...newProps };
      }

      return {
        ...s,
        ...newProps,
        devices: newDevices,
      };
    });
    onUpdateStickers(updated);
  };

  // Sync current device layout of sticker to ALL devices (Mobile, Tablet, Laptop)
  const handleSyncStickerToAllDevices = (e, stickerId) => {
    e?.stopPropagation?.();
    if (!onUpdateStickers) return;
    const currentStickers = profile?.designSettings?.stickers || [];
    const updated = currentStickers.map((s) => {
      if (s.id !== stickerId) return s;
      const currentProps = getStickerDeviceProps(s, deviceMode, 'split');

      return {
        ...s,
        ...currentProps,
        devices: {
          mobile: { ...currentProps },
          tablet: { ...currentProps },
          laptop: { ...currentProps },
        },
      };
    });
    onUpdateStickers(updated);
  };

  const handleStickerMouseDown = (e, stickerId, targetCanvasRef) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    e.stopPropagation();
    setSelectedStickerId(stickerId);
    markStickerInteraction();
    if (!onUpdateStickers) return;

    const canvasEl = targetCanvasRef?.current || contentCanvasRef.current;
    if (!canvasEl) return;

    const currentStickers = profile?.designSettings?.stickers || [];
    const targetSticker = currentStickers.find((s) => s.id === stickerId);
    const stickerAnchor = targetSticker?.anchorType || 'HEADER';

    const targetEl = stickerAnchor === 'PROFILE_HEADER'
      ? canvasEl.querySelector('[data-anchor-section="PROFILE_HEADER"]') || canvasEl
      : stickerAnchor === 'HEADER'
        ? canvasEl.querySelector('[data-anchor-section="HEADER"]') || canvasEl
        : canvasEl;
    const targetRect = targetEl.getBoundingClientRect();
    const coordinateMode = stickerAnchor === 'PROFILE_HEADER' ? 'pixel-offset' : 'height-percent';

    let hasMoved = false;

    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      hasMoved = true;
      markStickerInteraction();
      const currentX = moveEvent.clientX - targetRect.left;
      const currentY = moveEvent.clientY - targetRect.top;
      const xPct = Math.max(2, Math.min(98, Math.round((currentX / targetRect.width) * 100)));
      const y = coordinateMode === 'pixel-offset'
        ? Number((currentY * targetEl.offsetHeight / targetRect.height).toFixed(3))
        : Math.max(2, Math.min(98, Math.round((currentY / targetRect.height) * 100)));

      updateStickerWithMode(stickerId, (props) => ({ ...props, x: xPct, y, anchorType: stickerAnchor, coordinateMode }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      markStickerInteraction();
      setSelectedStickerId(stickerId);

      if (hasMoved) {
        // Prevent trailing synthetic click events from deselecting sticker or activating cards
        const swallowClick = (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        window.addEventListener('click', swallowClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener('click', swallowClick, { capture: true });
        }, 350);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Interactive Drag-to-Resize Handle
  const handleStickerResizeMouseDown = (e, stickerId) => {
    e.stopPropagation();
    setSelectedStickerId(stickerId);
    markStickerInteraction();
    if (!onUpdateStickers) return;

    const currentStickers = profile?.designSettings?.stickers || [];
    const targetSticker = currentStickers.find((s) => s.id === stickerId);
    if (!targetSticker) return;

    const startProps = getStickerDeviceProps(targetSticker, deviceMode);
    const startScale = startProps.scale ?? 1;
    const stickerEl = e.currentTarget.closest('[data-sticker-id]');
    if (!stickerEl) return;
    const rect = stickerEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Exclude the selection border: its width changes inversely with scale to
    // keep the outline visually thin, while the graphic itself is the anchor.
    const stickerWidth = stickerEl.clientWidth || stickerEl.offsetWidth;
    const stickerHeight = stickerEl.clientHeight || stickerEl.offsetHeight;
    const startX = startProps.x ?? 50;
    const startY = startProps.y ?? 50;
    const rotation = ((startProps.rotate ?? 0) * Math.PI) / 180;

    const canvasEl = getActiveCanvasRef()?.current;
    const anchorType = startProps.anchorType || targetSticker.anchorType || 'HEADER';
    const positionAnchor = anchorType === 'PROFILE_HEADER'
      ? canvasEl?.querySelector('[data-anchor-section="PROFILE_HEADER"]')
      : anchorType === 'HEADER'
        ? canvasEl?.querySelector('[data-anchor-section="HEADER"]')
        : canvasEl;
    const anchorWidth = positionAnchor?.offsetWidth || canvasEl?.offsetWidth || 1;
    const anchorHeight = positionAnchor?.offsetHeight || canvasEl?.offsetHeight || 1;
    const anchorRect = positionAnchor?.getBoundingClientRect();
    const screenScaleX = anchorRect && anchorWidth ? anchorRect.width / anchorWidth : 1;
    const screenScaleY = anchorRect && anchorHeight ? anchorRect.height / anchorHeight : 1;

    const handleRect = e.currentTarget.getBoundingClientRect();
    const grabOffsetX = e.clientX - (handleRect.left + handleRect.width / 2);
    const grabOffsetY = e.clientY - (handleRect.top + handleRect.height / 2);
    const fixedCornerX = centerX - (Math.cos(rotation) * (stickerWidth * startScale / 2) - Math.sin(rotation) * (stickerHeight * startScale / 2)) * screenScaleX;
    const fixedCornerY = centerY - (Math.sin(rotation) * (stickerWidth * startScale / 2) + Math.cos(rotation) * (stickerHeight * startScale / 2)) * screenScaleY;
    let hasMoved = false;

    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      hasMoved = true;
      markStickerInteraction();
      const cornerVectorX = moveEvent.clientX - grabOffsetX - fixedCornerX;
      const cornerVectorY = moveEvent.clientY - grabOffsetY - fixedCornerY;
      const normalizedVectorX = cornerVectorX / (screenScaleX || 1);
      const normalizedVectorY = cornerVectorY / (screenScaleY || 1);
      const unrotatedX = normalizedVectorX * Math.cos(rotation) + normalizedVectorY * Math.sin(rotation);
      const unrotatedY = -normalizedVectorX * Math.sin(rotation) + normalizedVectorY * Math.cos(rotation);
      const sizeDenominator = (stickerWidth ** 2) + (stickerHeight ** 2);
      const requestedScale = ((unrotatedX * stickerWidth) + (unrotatedY * stickerHeight)) / sizeDenominator;
      const newScale = Math.max(0.4, Math.min(3.5, Number(requestedScale.toFixed(2))));
      const scaleDelta = newScale - startScale;

      // Resizing from the lower-right handle should keep the opposite corner
      // fixed. Sticker x/y represent its center, so move that center by half
      // the size delta, rotated into the canvas coordinate system.
      const localHalfWidthDelta = (stickerWidth * scaleDelta) / 2;
      const localHalfHeightDelta = (stickerHeight * scaleDelta) / 2;
      const centerDeltaX = Math.cos(rotation) * localHalfWidthDelta - Math.sin(rotation) * localHalfHeightDelta;
      const centerDeltaY = Math.sin(rotation) * localHalfWidthDelta + Math.cos(rotation) * localHalfHeightDelta;
      const nextX = startX + (centerDeltaX / anchorWidth) * 100;
      const nextY = startProps.coordinateMode === 'pixel-offset'
        ? startY + centerDeltaY
        : startY + (centerDeltaY / anchorHeight) * 100;

      updateStickerWithMode(stickerId, (props) => ({ ...props, x: nextX, y: nextY, scale: newScale }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      markStickerInteraction();
      setSelectedStickerId(stickerId);

      if (hasMoved) {
        const swallowClick = (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        window.addEventListener('click', swallowClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener('click', swallowClick, { capture: true });
        }, 350);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Interactive Drag-to-Rotate Lollipop Handle
  const handleStickerRotateMouseDown = (e, stickerId) => {
    e.stopPropagation();
    setSelectedStickerId(stickerId);
    markStickerInteraction();
    if (!onUpdateStickers) return;

    const currentStickers = profile?.designSettings?.stickers || [];
    const targetSticker = currentStickers.find((s) => s.id === stickerId);
    if (!targetSticker) return;

    const startProps = getStickerDeviceProps(targetSticker, deviceMode);
    const startRotate = startProps.rotate ?? 0;
    const stickerEl = e.currentTarget.closest('[data-sticker-id]');
    if (!stickerEl) return;
    const rect = stickerEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    let hasMoved = false;

    const onMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      hasMoved = true;
      markStickerInteraction();
      const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
      const angleDiff = currentAngle - initialAngle;
      let newRotate = Math.round((startRotate + angleDiff) % 360);
      if (newRotate < 0) newRotate += 360;

      // Hold Shift to snap to 15-degree increments
      if (moveEvent.shiftKey) {
        newRotate = Math.round(newRotate / 15) * 15;
      }

      updateStickerWithMode(stickerId, (props) => ({ ...props, rotate: newRotate, rotation: newRotate }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      markStickerInteraction();
      setSelectedStickerId(stickerId);

      if (hasMoved) {
        const swallowClick = (clickEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        window.addEventListener('click', swallowClick, { capture: true, once: true });
        setTimeout(() => {
          window.removeEventListener('click', swallowClick, { capture: true });
        }, 350);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Flip Horizontal Toggle
  const handleFlipSticker = (e, stickerId) => {
    e?.stopPropagation?.();
    updateStickerWithMode(stickerId, (props) => ({ ...props, flipX: !props.flipX }));
  };

  // Step-wise 45-degree rotation
  const handleRotateStep = (e, stickerId, deg = 45) => {
    e?.stopPropagation?.();
    updateStickerWithMode(stickerId, (props) => {
      let newRot = Math.round(((props.rotate || 0) + deg) % 360);
      if (newRot < 0) newRot += 360;
      return { ...props, rotate: newRot, rotation: newRot };
    });
  };

  // Step-wise Scale adjustment
  const handleScaleStep = (e, stickerId, delta = 0.15) => {
    e?.stopPropagation?.();
    updateStickerWithMode(stickerId, (props) => {
      const newScale = Math.max(0.4, Math.min(3.5, Number(((props.scale || 1) + delta).toFixed(2))));
      return { ...props, scale: newScale };
    });
  };

  const handleDeleteSticker = (stickerId) => {
    const currentStickers = profile?.designSettings?.stickers || [];
    if (onUpdateStickers) {
      onUpdateStickers(currentStickers.filter((s) => s.id !== stickerId));
      if (selectedStickerId === stickerId) {
        setSelectedStickerId(null);
      }
    }
  };

  // Placed Stickers Component anchored to scrollable content canvas
  // Placed Stickers Component anchored to header or content canvas
  const renderStickers = (targetCanvasRef, sectionFilter = 'HEADER') => {
    const stickersList = profile?.designSettings?.stickers || [];
    if (!stickersList.length) return null;

    const filtered = stickersList.filter((s) => {
      const anchor = s.anchorType || 'HEADER';
      return anchor === sectionFilter;
    });

    if (!filtered.length) return null;

    return (
      <>
        {filtered.map((stk) => {
          const isSelected = selectedStickerId === stk.id;
          const props = getStickerDeviceProps(stk, deviceMode);
          const isFlipped = Boolean(props.flipX);
          const scaleInv = Number((1 / (props.scale || 1)).toFixed(3));

          return (
            <div
              key={stk.id}
              data-sticker-id={stk.id}
              className={`absolute z-30 select-none group cursor-grab active:cursor-grabbing rounded-lg ${
                isSelected ? 'shadow-xs' : ''
              }`}
              style={{
                ...getStickerCanvasPositionStyle(props),
                transform: `translate(-50%, -50%) scale(${props.scale}) rotate(${props.rotate}deg)`,
                touchAction: 'none',
                borderWidth: isSelected ? `${Math.max(0.75, scaleInv)}px` : '0px',
                borderColor: isSelected ? '#52796F' : 'transparent',
                borderStyle: 'solid',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStickerId(stk.id);
                markStickerInteraction();
              }}
              onMouseDown={(e) => handleStickerMouseDown(e, stk.id, targetCanvasRef)}
              title={`[${deviceMode.toUpperCase()}] Drag to move, click to edit sticker`}
            >
              {/* Top Rotation Lollipop Handle (anchored directly to top boundary 50% 0%) */}
              {onUpdateStickers && isSelected && (
                <div
                  className="absolute flex flex-col items-center cursor-grab active:cursor-grabbing z-50 transition-opacity duration-150"
                  style={{
                    left: '50%',
                    top: '0%',
                    transform: `translate(-50%, -100%) scale(${scaleInv})`,
                    transformOrigin: 'bottom center',
                  }}
                  onMouseDown={(e) => handleStickerRotateMouseDown(e, stk.id)}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag handle to rotate sticker (hold Shift for 15° snap)"
                >
                  <div className="w-4 h-4 rounded-full bg-white border border-[#52796F] text-[#52796F] shadow-xs flex items-center justify-center hover:scale-125 transition-transform">
                    <RotateCw className="w-2.5 h-2.5 text-[#52796F]" />
                  </div>
                  <div className="w-px h-3 bg-[#52796F]" />
                </div>
              )}

              {/* Bottom-Right Corner Resize Drag Handle (anchored directly to corner boundary 100% 100%) */}
              {onUpdateStickers && isSelected && (
                <div
                  className="absolute cursor-se-resize hover:scale-125 transition-transform z-50 flex items-center justify-center pointer-events-auto"
                  style={{
                    left: '100%',
                    top: '100%',
                    width: '14px',
                    height: '14px',
                    transform: `translate(-50%, -50%) scale(${scaleInv})`,
                    transformOrigin: 'center center',
                  }}
                  onMouseDown={(e) => handleStickerResizeMouseDown(e, stk.id)}
                  onClick={(e) => e.stopPropagation()}
                  title="Drag handle to resize sticker"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white border border-[#52796F] text-[#52796F] shadow-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#52796F] rounded-full" />
                  </div>
                </div>
              )}

              {/* Inner Graphic Container (applies horizontal flip) */}
              <div
                className="p-1 inline-flex items-center justify-center transition-transform"
                style={{
                  transform: isFlipped ? 'scaleX(-1)' : 'none',
                }}
              >
                {isImageUrl(stk.src || stk.imageUrl) ? (
                  <img
                    src={stk.src || stk.imageUrl}
                    alt={stk.name || 'Sticker'}
                    className="object-contain pointer-events-none select-none drop-shadow-md"
                    style={getStickerGraphicSizeStyle(deviceMode, 'image')}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'inline-block';
                      }
                    }}
                  />
                ) : null}
                <span 
                  className="filter drop-shadow-md inline-block select-none pointer-events-none"
                  style={{ ...getStickerGraphicSizeStyle(deviceMode, 'emoji'), display: isImageUrl(stk.src || stk.imageUrl) ? 'none' : 'inline-block' }}
                >
                  {stk.emoji || stk.src || '✨'}
                </span>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const getBentoShapeClass = () => {
    switch (profile.buttonShape) {
      case 'sharp': return 'btn-shape-sharp';
      case 'brutalism': return 'btn-shape-brutalism';
      case 'pill': return 'btn-shape-pill';
      case 'rounded':
      default: return 'btn-shape-rounded';
    }
  };

  const getStackShapeClass = () => {
    switch (profile.buttonShape) {
      case 'sharp': return 'btn-shape-sharp';
      case 'brutalism': return 'btn-shape-brutalism';
      case 'pill': return 'btn-shape-pill';
      case 'rounded':
      default: return 'btn-shape-rounded';
    }
  };

  const getFontClass = () => {
    switch (profile?.font) {
      case 'Playfair Display': return 'font-playfair';
      case 'DM Sans': return 'font-dmsans';
      case 'Plus Jakarta Sans': return 'font-jakarta';
      case 'Space Grotesk': return 'font-space';
      default: return 'font-sans';
    }
  };

  // Determine grid styling based on active device
  const getBentoGridClass = () => {
    if (deviceMode === 'laptop' || deviceMode === 'fluid') return 'laptop-bento-grid';
    if (deviceMode === 'tablet') return 'tablet-bento-grid';
    return 'phone-bento-grid';
  };

  // Helper to render social badges row in mockup
  const renderSocialBadges = () => {
    if (!profile.socials) return null;
    const themeStyles = getThemeStyles();
    return (
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {profile.socials.instagram && (
          <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className="p-1.5 rounded-lg hover:scale-105 transition-all border shadow-2xs" title="Instagram">
            <InstagramIcon className="w-3.5 h-3.5" style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.youtube && (
          <a href={`https://youtube.com/${profile.socials.youtube}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className="p-1.5 rounded-lg hover:scale-105 transition-all border shadow-2xs" title="YouTube">
            <YoutubeIcon className="w-3.5 h-3.5" style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.twitter && (
          <a href={`https://twitter.com/${profile.socials.twitter}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className="p-1.5 rounded-lg hover:scale-105 transition-all border shadow-2xs" title="Twitter / X">
            <TwitterIcon className="w-3.5 h-3.5" style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.linkedin && (
          <a href={`https://linkedin.com/in/${profile.socials.linkedin}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className="p-1.5 rounded-lg hover:scale-105 transition-all border shadow-2xs" title="LinkedIn">
            <LinkedinIcon className="w-3.5 h-3.5" style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.spotify && (
          <a href="https://spotify.com" target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className="p-1.5 rounded-lg hover:scale-105 transition-all border shadow-2xs" title="Spotify">
            <SpotifyIcon className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} />
          </a>
        )}
      </div>
    );
  };

  // 1. Creator Identity & Header (Supports Classic, Banner, Hero layouts)
  const renderProfileHeader = ({ isSplit = false } = {}) => {
    const layoutMode = profile?.headerLayout || 'classic';
    const hasCover = Boolean(profile?.coverImage && profile.coverImage.trim());
    const socialsPos = profile?.socialsPosition || 'top';
    const themeStyles = getThemeStyles();

    const avatarUrl = profile?.avatar && typeof profile.avatar === 'string' && profile.avatar.trim() !== ''
      ? profile.avatar.trim()
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || profile?.title || 'Creator')}&background=52796F&color=FFFEFA&bold=true&size=256`;

    return (
      <div 
        style={isSplit ? themeStyles.cardStyle : undefined}
        data-anchor-section="PROFILE_HEADER"
        className={`relative flex flex-col items-center text-center w-full overflow-visible ${
          isSplit ? 'p-4 border' : ''
        }`}
      >
        {renderStickers(getActiveCanvasRef(), 'PROFILE_HEADER')}

          {/* Visual Identity & Avatar Container */}
        <div 
          data-anchor-section="HEADER"
          className="relative w-full flex flex-col items-center overflow-visible"
        >
          {renderStickers(getActiveCanvasRef(), 'HEADER')}
          {/* Banner Cover Image (Banner Mode) */}
          {layoutMode === 'banner' && (
            <div className={`w-full ${deviceMode === 'tablet' ? 'h-28' : deviceMode === 'laptop' ? 'h-32' : 'h-20'} rounded-t-xl relative overflow-hidden bg-gradient-to-r from-[#28352F] via-[#52796F] to-[#CAD8CE]`}>
              {hasCover ? (
                <img 
                  src={profile.coverImage} 
                  alt="Profile Cover" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full opacity-30 bg-[radial-gradient(#FFFEFA_1px,transparent_1px)] [background-size:12px_12px]" />
              )}
            </div>
          )}

          <div className={`w-full flex flex-col items-center ${
            layoutMode === 'banner' ? '-mt-8 px-3' : isSplit ? 'p-1' : 'p-1'
          }`}>
            {/* Avatar (Hero Portrait vs Classic / Banner) */}
            {layoutMode === 'hero' ? (
              <div className="w-full max-w-[180px] aspect-[4/5] rounded-2xl overflow-hidden border-2 border-white shadow-md relative group mb-2 bg-[#F5F3ED]">
                <img 
                  src={avatarUrl} 
                  alt={profile?.name || profile?.title || 'Creator'} 
                  className="w-full h-full object-cover"
                />
                {profile.verified && (
                  <div className="absolute bottom-2 right-2 bg-[#52796F] text-white rounded-full p-1 shadow-sm border-2 border-white" title="Verified Profile">
                    <CheckCircle2 className="w-3 h-3 fill-[#52796F] text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative group mt-1">
                <StoryBubbleAvatar
                  avatarUrl={avatarUrl}
                  name={profile?.name || profile?.title || 'Creator'}
                  storyBubble={profile?.storyBubble}
                  avatarShape={profile?.avatarShape || (profile?.headerLayout === 'cutout' ? 'cutout' : 'circle')}
                  sizeClasses={isSplit ? 'w-20 h-20' : deviceMode === 'tablet' ? 'w-24 h-24' : 'w-20 h-20'}
                />
                {profile.verified && (
                  <div className="absolute bottom-0 right-0 bg-[#52796F] text-white rounded-full p-1 shadow-sm border-2 border-white" title="Verified Profile">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-[#52796F] text-white" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`w-full flex flex-col items-center ${
          layoutMode === 'banner' ? 'px-3 pb-2' : isSplit ? 'p-1' : 'p-1'
        }`}>

          {profile.titleLogo?.enabled && profile.titleLogo?.url ? (
            <div className="flex items-center justify-center mt-2 max-h-12">
              <img 
                src={profile.titleLogo.url} 
                alt={profile.titleLogo.altText || profile.name || profile.title || 'Brand Logo'} 
                className="max-h-10 max-w-[190px] object-contain drop-shadow-xs" 
              />
            </div>
          ) : (
            <h2 
              style={{
                color: themeStyles.titleColor,
                ...(getTitleFontName(profile.alternativeTitleFont) ? { fontFamily: getTitleFontName(profile.alternativeTitleFont) } : {})
              }} 
              className={`${
                isSplit ? 'text-lg mt-2' : deviceMode === 'tablet' ? 'text-xl mt-2.5' : 'text-base mt-2'
              } font-bold tracking-tight flex items-center justify-center gap-1.5 ${getFontClass()}`}
            >
              {profile.name || profile.title || 'Creator'}
            </h2>
          )}

          {profile.location && (
            <p 
              style={{ color: themeStyles.bioColor }}
              className="text-[11px] flex items-center justify-center gap-1 mt-0.5 font-medium"
            >
              <MapPin className="w-3 h-3" style={{ color: themeStyles.accentColor }} /> {profile.location}
            </p>
          )}

          <p 
            style={{ color: themeStyles.bioColor }}
            className="text-[12px] mt-1.5 max-w-sm leading-relaxed font-normal mx-auto opacity-90"
          >
            {profile.bio}
          </p>

          {/* Social Badges Row if positioned at TOP */}
          {socialsPos === 'top' && (
            <div className="mt-2.5">
              {renderSocialBadges()}
            </div>
          )}

          {/* Media Kit Live Stats Bar */}
          {profile.widgets?.mediaKitStats && (
            <div 
              style={themeStyles.cardStyle}
              className="phone-stats-card w-full mt-3 p-3 border divide-x divide-white/10"
            >
              <div className="px-1">
                <p style={{ color: themeStyles.mutedColor }} className="text-[9px] uppercase font-bold tracking-wider">Followers</p>
                <p style={{ color: themeStyles.titleColor }} className="text-xs sm:text-sm font-extrabold mt-0.5">{profile.widgets.mediaKitStats.followers}</p>
              </div>
              <div className="px-1">
                <p style={{ color: themeStyles.mutedColor }} className="text-[9px] uppercase font-bold tracking-wider">Engagement</p>
                <p style={{ color: themeStyles.accentColor }} className="text-xs sm:text-sm font-extrabold mt-0.5">{profile.widgets.mediaKitStats.engagement}</p>
              </div>
              <div className="px-1">
                <p style={{ color: themeStyles.mutedColor }} className="text-[9px] uppercase font-bold tracking-wider">Views</p>
                <p style={{ color: themeStyles.titleColor }} className="text-xs sm:text-sm font-extrabold mt-0.5">{profile.widgets.mediaKitStats.monthlyViews}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. Lead Capture Action Card
  const renderLeadCapture = () => {
    if (profile.leadCapture?.enabled === false) return null;
    const btnCustomStyle = getButtonCustomStyle();
    const themeStyles = getThemeStyles();
    return (
      <div 
        onClick={() => setShowLeadModal(true)}
        style={themeStyles.cardStyle}
        className="p-3.5 border flex items-center justify-between gap-3 w-full transition-all cursor-pointer group hover:scale-[1.01]"
      >
        <div className="flex items-center gap-2.5 text-left min-w-0">
          <div 
            style={themeStyles.iconBoxStyle}
            className="w-8 h-8 flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform"
          >
            <PhoneCall className="w-4 h-4" style={{ color: themeStyles.accentColor }} />
          </div>
          <div className="truncate">
            <h4 style={{ color: themeStyles.titleColor }} className="text-xs font-bold truncate">
              {profile.leadCapture?.title || "Let's Connect"}
            </h4>
            <p style={{ color: themeStyles.bioColor }} className="text-[10px] truncate opacity-85">
              {profile.leadCapture?.subtitle || "Drop your contact info"}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLeadModal(true);
          }}
          style={btnCustomStyle}
          className="px-3.5 py-1.5 font-semibold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
        >
          <Sparkles className="w-3 h-3" />
          {profile.leadCapture?.buttonText || "Connect"}
        </button>
      </div>
    );
  };

  // 3. Schedule 1:1 Meeting Card
  const renderScheduleMeeting = () => {
    if (profile.scheduleMeeting?.enabled === false) return null;
    const btnCustomStyle = getButtonCustomStyle();
    const themeStyles = getThemeStyles();
    return (
      <div 
        style={themeStyles.cardStyle}
        className="p-3.5 border flex items-center justify-between gap-3 w-full transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center gap-2.5 text-left min-w-0">
          <div 
            style={themeStyles.iconBoxStyle}
            className="w-8 h-8 flex items-center justify-center shrink-0 border"
          >
            <Calendar className="w-4 h-4" style={{ color: themeStyles.titleColor }} />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h4 style={{ color: themeStyles.titleColor }} className="text-xs font-bold truncate">
                {profile.scheduleMeeting?.title || "Book a 1:1 Consultation"}
              </h4>
              <span 
                style={{
                  backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
                  color: themeStyles.titleColor,
                  borderColor: themeStyles.cardStyle.borderColor,
                }}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold border"
              >
                {profile.scheduleMeeting?.price || "Free"}
              </span>
            </div>
            <p style={{ color: themeStyles.bioColor }} className="text-[10px] truncate mt-0.5 opacity-85">
              {profile.scheduleMeeting?.durationMinutes || 30}m Video Call • Available this week
            </p>
          </div>
        </div>
        <button
          id="mockup-schedule-meeting-btn"
          onClick={() => setShowScheduleModal(true)}
          style={btnCustomStyle}
          className="px-3.5 py-1.5 font-semibold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
        >
          <Video className="w-3 h-3" />
          {profile.scheduleMeeting?.buttonText || "Schedule"}
        </button>
      </div>
    );
  };

  // 4. Hero Video
  
  const renderLinkThumbnail = (link) => {
    if (link.thumbnailType === 'none') return null;
    if (link.thumbnailType === 'image' && link.thumbnail) {
      return (
        <img
          src={link.thumbnail}
          alt=""
          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[#CAD8CE]"
        />
      );
    }
    if (link.thumbnailType === 'icon' && link.thumbnail && !link.thumbnail.startsWith('http') && !link.thumbnail.startsWith('data:')) {
      return <span className="text-xl shrink-0 leading-none">{link.thumbnail}</span>;
    }
    if (link.thumbnailIcon) {
      const IconComp = ICON_MAP[link.thumbnailIcon];
      if (IconComp) {
        return (
          <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-[#52796F] shrink-0">
            <IconComp className="w-4 h-4" />
          </div>
        );
      }
    }
    if (link.leadMagnet?.enabled) {
      return <Lock className="w-4 h-4 text-[#52796F]" />;
    }
    const fallbackIcon = getIcon(link.icon);
    return fallbackIcon ? (
      <div className="p-2 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] text-[#52796F] shrink-0">
        {fallbackIcon}
      </div>
    ) : null;
  };

  const renderHeroVideo = () => {
    if (!profile.heroVideo) return null;
    return (
      <div className="phone-video-card w-full">
        <iframe 
          src={profile.heroVideo} 
          title="Showreel Video Player" 
          allowFullScreen
        ></iframe>
      </div>
    );
  };

  // Helper for single stack card in mockup
  const renderStackCard = (link) => {
    const iconElement = renderLinkThumbnail(link);
    const btnCustomStyle = getButtonCustomStyle();
    const isSolid = (profile?.designSettings?.buttonStyle || 'solid') === 'solid';
    const textColor = btnCustomStyle.color || '#28352F';

    return (
      <button
        key={link.id}
        onClick={() => handleLinkClick(link)}
        style={btnCustomStyle}
        className={`phone-stack-card ${getStackShapeClass()} w-full transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between p-3.5`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {iconElement && (
            <div 
              className="p-2 rounded-xl shrink-0"
              style={{
                backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.2)' : '#F5F3ED',
                color: isSolid ? '#FFFFFF' : '#52796F',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              {iconElement}
            </div>
          )}
          <span 
            className="text-left font-bold text-xs sm:text-sm truncate"
            style={{ color: textColor }}
          >
            {link.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {link.badge && (
            <span 
              className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase shadow-xs"
              style={{
                backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.25)' : '#CAD8CE',
                color: textColor
              }}
            >
              {link.badge}
            </span>
          )}
          <ExternalLink 
            className="w-3.5 h-3.5" 
            style={{ color: textColor, opacity: 0.8 }}
          />
        </div>
      </button>
    );
  };

  // Helper for single bento card in mockup
  const renderBentoCard = (link, isLarge = false, isCarousel = false) => {
    const iconElement = renderLinkThumbnail(link);
    const btnCustomStyle = getButtonCustomStyle();
    const isSolid = (profile?.designSettings?.buttonStyle || 'solid') === 'solid';
    const textColor = btnCustomStyle.color || '#28352F';

    return (
      <button
        key={link.id}
        type="button"
        onClick={() => handleLinkClick(link)}
        style={btnCustomStyle}
        className={`phone-bento-card ${getBentoShapeClass()} ${
          isCarousel ? '' : isLarge ? 'col-span-2' : 'col-span-1'
        } w-full text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] p-3.5 relative flex flex-col justify-between`}
      >
        {link.badge && (
          <span 
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-xs"
            style={{
              backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.25)' : '#CAD8CE',
              color: textColor
            }}
          >
            {link.badge}
          </span>
        )}

        <div className="flex items-center justify-between mb-2 w-full">
          {iconElement ? (
            <div 
              className="p-2 rounded-xl"
              style={{
                backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.2)' : '#F5F3ED',
                color: isSolid ? '#FFFFFF' : '#52796F',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              {iconElement}
            </div>
          ) : (
            <div />
          )}
          <ExternalLink 
            className="w-3 h-3 ml-auto" 
            style={{ color: textColor, opacity: 0.8 }}
          />
        </div>

        <div className="w-full text-left">
          <h4 
            className="text-[12px] font-bold line-clamp-2 leading-tight"
            style={{ color: textColor }}
          >
            {link.title}
          </h4>
          {link.clicks !== undefined && (
            <p 
              className="text-[9px] mt-1 font-mono font-semibold"
              style={{ color: textColor, opacity: 0.75 }}
            >
              {link.clicks.toLocaleString()} clicks
            </p>
          )}
        </div>
      </button>
    );
  };

  // Helper to render collections in mockup
  const renderCollectionBlock = (collection, collectionLinks) => {
    if (!collectionLinks.length) return null;
    const viewMode = collection.viewMode || 'list';

    // 1. CAROUSEL SLIDER VIEW MODE (Horizontal Scroll Slider with Navigation)
    if (viewMode === 'carousel') {
      return (
        <div key={collection.id} className="w-full pt-1 min-w-0">
          <CarouselSlider
            collection={collection}
            links={collectionLinks}
            onLinkClick={handleLinkClick}
            buttonShapeClass={getBentoShapeClass()}
          />
        </div>
      );
    }

    // 2. SHOWCASE (Featured Hero Card + Grid) VIEW MODE
    if (viewMode === 'showcase') {
      const [featuredLink, ...remainingLinks] = collectionLinks;
      return (
        <div key={collection.id} className="w-full space-y-2 pt-1 min-w-0">
          <div className="w-full flex items-center justify-between px-1.5 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-[#52796F]/15 flex items-center justify-center text-[#52796F]">
                <Folder className="w-3 h-3" />
              </div>
              <span className="font-sans font-bold text-xs text-[#28352F]">
                {collection.title}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-[#E8EFEA] text-[#52796F]">
                {collectionLinks.length}
              </span>
            </div>
            <span className="text-[8px] uppercase font-bold tracking-wider text-[#5C6B64] bg-[#F5F3ED] px-1.5 py-0.5 rounded border border-[#CAD8CE]">
              Showcase
            </span>
          </div>
          {featuredLink && renderBentoCard(featuredLink, true)}
          {remainingLinks.length > 0 && (
            <div className="space-y-2 w-full">
              {remainingLinks.map(link => renderStackCard(link))}
            </div>
          )}
        </div>
      );
    }

    // 3. 2-COLUMN GRID (Bento Style) VIEW MODE
    if (viewMode === 'grid') {
      return (
        <div key={collection.id} className="w-full space-y-2 pt-1 min-w-0">
          <div className="w-full flex items-center justify-between px-1.5 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-[#52796F]/15 flex items-center justify-center text-[#52796F]">
                <Folder className="w-3 h-3" />
              </div>
              <span className="font-sans font-bold text-xs text-[#28352F]">
                {collection.title}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold bg-[#E8EFEA] text-[#52796F]">
                {collectionLinks.length}
              </span>
            </div>
            <span className="text-[8px] uppercase font-bold tracking-wider text-[#5C6B64] bg-[#F5F3ED] px-1.5 py-0.5 rounded border border-[#CAD8CE]">
              2-Grid
            </span>
          </div>
          <div className="phone-bento-grid w-full">
            {collectionLinks.map(link => renderBentoCard(link, false, false))}
          </div>
        </div>
      );
    }

    // 4. VERTICAL LIST (Stacked Cards) VIEW MODE
    const themeStyles = getThemeStyles();
    return (
      <div key={collection.id} className="w-full space-y-2 pt-1 min-w-0">
        <div className="w-full flex items-center justify-between px-1.5 py-1 text-left">
          <div className="flex items-center gap-1.5">
            <div style={themeStyles.iconBoxStyle} className="w-5 h-5 rounded-md flex items-center justify-center border">
              <Folder className="w-3 h-3" style={{ color: themeStyles.accentColor }} />
            </div>
            <span style={{ color: themeStyles.titleColor }} className="font-sans font-bold text-xs">
              {collection.title}
            </span>
            <span 
              style={{
                backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
                color: themeStyles.accentColor,
              }}
              className="px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold"
            >
              {collectionLinks.length}
            </span>
          </div>
          <span 
            style={{
              backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
              color: themeStyles.mutedColor,
              borderColor: themeStyles.cardStyle.borderColor,
            }}
            className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border"
          >
            List
          </span>
        </div>
        <div className="space-y-2 w-full">
          {collectionLinks.map(link => renderStackCard(link))}
        </div>
      </div>
    );
  };

  // 5. Links Section (Adaptive Bento vs Classic Stack with Collections)
  
  const renderShopGrid = () => {
    const products = profile.shop?.products || [];
    const themeStyles = getThemeStyles();
    if (products.length === 0) {
      return (
        <div 
          style={themeStyles.cardStyle}
          className="p-6 text-center border text-xs w-full"
        >
          <ShoppingBag className="w-8 h-8 mx-auto mb-2" style={{ color: themeStyles.accentColor }} />
          <p style={{ color: themeStyles.titleColor }} className="font-bold">No products published yet</p>
          <p style={{ color: themeStyles.bioColor }} className="text-[11px] mt-0.5 opacity-80">Check back soon for new drops &amp; releases!</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-2.5 w-full">
        {products.map((prod) => (
          <a
            key={prod.id}
            href={prod.url}
            target="_blank"
            rel="noreferrer"
            style={themeStyles.cardStyle}
            className="p-2.5 border shadow-xs flex flex-col justify-between gap-2 group transition-all text-left hover:scale-[1.02]"
          >
            {prod.image ? (
              <img src={prod.image} alt={prod.title} className="w-full h-20 object-cover rounded-lg group-hover:scale-105 transition-transform" />
            ) : (
              <div 
                style={themeStyles.iconBoxStyle}
                className="w-full h-20 rounded-lg flex items-center justify-center border"
              >
                <ShoppingBag className="w-6 h-6" style={{ color: themeStyles.accentColor }} />
              </div>
            )}
            <div className="min-w-0">
              <h4 style={{ color: themeStyles.titleColor }} className="text-[11px] font-bold line-clamp-2 leading-tight">
                {prod.title}
              </h4>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-[11px]" style={{ color: themeStyles.accentColor }}>
                  {prod.currency === 'USD' ? '$' : prod.currency === 'EUR' ? '€' : prod.currency === 'GBP' ? '£' : prod.currency === 'INR' ? '₹' : ''}{prod.price}
                </span>
                <ExternalLink className="w-3 h-3" style={{ color: themeStyles.accentColor }} />
              </div>
            </div>
          </a>
        ))}
      </div>
    );
  };

  const renderActiveLinks = () => {
    const rawLinks = profile.links || [];
    const simCountry = (simulation.location || 'global').toUpperCase();

    const activeLinks = rawLinks.filter((l) => {
      if (l.disabled || l.isArchived) return false;
      // Country & Geo-Targeting Rule check
      if (l.geoTargeting?.enabled && Array.isArray(l.geoTargeting.countries) && l.geoTargeting.countries.length > 0) {
        if (simCountry !== 'GLOBAL') {
          const targetCountries = l.geoTargeting.countries.map(c => c.toUpperCase());
          const isMatch = targetCountries.includes(simCountry);
          const mode = l.geoTargeting.mode || 'include';
          if (mode === 'include' && !isMatch) return false;
          if (mode === 'exclude' && isMatch) return false;
        }
      }
      return true;
    });

    const collections = (profile.collections || []).filter(c => c.active !== false);

    if (collections.length > 0) {
      const ungroupedLinks = activeLinks.filter(l => !l.collectionId);

      return (
        <div className="space-y-3 w-full">
          {collections.map(col => {
            const colLinks = activeLinks.filter(l => l.collectionId === col.id);
            return renderCollectionBlock(col, colLinks);
          })}

          {ungroupedLinks.length > 0 && (
            <div className="space-y-2 pt-1 w-full">
              {profile.layout === 'bento' ? (
                <div className={`grid gap-2.5 w-full ${ungroupedLinks.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {ungroupedLinks.map((link, idx) => {
                    const isOddLast = ungroupedLinks.length > 2 && ungroupedLinks.length % 2 !== 0 && idx === ungroupedLinks.length - 1;
                    const isLarge = link.size === 'large' || link.type === 'featured' || isOddLast;
                    return renderBentoCard(link, isLarge);
                  })}
                </div>
              ) : (
                <div className="phone-stack-container w-full">
                  {ungroupedLinks.map(link => renderStackCard(link))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (profile.layout !== 'bento') {
      return (
        <div className="phone-stack-container w-full">
          {activeLinks.map(link => renderStackCard(link))}
        </div>
      );
    }

    const linksCount = activeLinks.length;
    return (
      <div className={`grid gap-2.5 w-full ${linksCount === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {activeLinks.map((link, idx) => {
          const isOddLast = linksCount > 2 && linksCount % 2 !== 0 && idx === linksCount - 1;
          const isLarge = link.size === 'large' || link.type === 'featured' || isOddLast;
          return renderBentoCard(link, isLarge);
        })}
      </div>
    );
  };

  // 6. Tip Jar Card
  const renderTipJar = () => {
    if (!profile.widgets?.hasTipJar) return null;
    const btnCustomStyle = getButtonCustomStyle();
    const themeStyles = getThemeStyles();
    return (
      <div 
        style={themeStyles.cardStyle}
        className="p-3 border flex flex-col gap-2 text-center w-full"
      >
        <p style={{ color: themeStyles.titleColor }} className="text-xs font-bold flex items-center justify-center gap-1.5">
          <Coffee className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} />
          {profile.widgets.tipJarTitle || 'Support My Content'}
        </p>
        <button 
          onClick={() => setShowTipModal(true)}
          style={btnCustomStyle}
          className="w-full py-2 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
        >
          <Heart className="w-3.5 h-3.5" /> Send $5 Tip with Confetti ✨
        </button>
      </div>
    );
  };

  // 7. Newsletter Subscription Card
  const renderNewsletter = () => {
    if (!profile.widgets?.hasNewsletter) return null;
    const btnCustomStyle = getButtonCustomStyle();
    const themeStyles = getThemeStyles();
    return (
      <div 
        style={themeStyles.cardStyle}
        className="p-3 border flex flex-col gap-2 text-center w-full"
      >
        <h4 style={{ color: themeStyles.titleColor }} className="text-xs font-bold flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} />
          {profile.widgets.newsletterTitle || 'Subscribe to Newsletter'}
        </h4>
        {newsletterSuccess ? (
          <div 
            style={{
              backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
              color: themeStyles.accentColor,
              borderColor: themeStyles.cardStyle.borderColor,
            }}
            className="p-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed successfully!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-1.5 mt-1">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
                color: themeStyles.titleColor,
                borderColor: themeStyles.cardStyle.borderColor,
              }}
              className="flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
            <button 
              type="submit" 
              style={btnCustomStyle}
              className="px-3 py-1.5 text-xs font-semibold shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    );
  };

  // 8. Footer Branding
  const renderFooter = () => (
    <div className="pt-2 text-center w-full flex flex-col items-center">
      {profile?.socialsPosition === 'bottom' && (
        <div className="mb-2">
          {renderSocialBadges()}
        </div>
      )}
      {profile?.compliance?.affiliateDisclosure && (
        <div 
          className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] text-zinc-300 backdrop-blur-md max-w-xs text-center shadow-xs cursor-help"
          title={profile.compliance.disclosureText || 'This page contains affiliate links.'}
        >
          <span className="text-amber-400">🏷️</span>
          <span>Contains Affiliate Links</span>
        </div>
      )}
      {!profile?.designSettings?.hideFooter && (
        <p className="text-[9px] text-[#5C6B64] font-mono tracking-wider uppercase font-bold">
          Powered by TreeInBio
        </p>
      )}
    </div>
  );

  // Profile Content Rendered Inside Device Screens
  const renderProfileContent = () => {
    // If access gate is enabled and not unlocked yet in preview
    if (profile.accessGate?.enabled && profile.accessGate?.type !== 'none' && !isGateUnlocked) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-4">
          <AccessGateScreen
            accessGate={profile.accessGate}
            profileTitle={profile.name || profile.title || profile.username || 'creator'}
            onUnlock={() => setIsGateUnlocked(true)}
          />
        </div>
      );
    }

    if (deviceMode === 'laptop' || deviceMode === 'fluid') {
      return (
        <div className="flex flex-row items-start gap-4 w-full text-left">
          {/* Left Column: Creator Identity & Tip Jar */}
          <div className="w-[42%] shrink-0 space-y-3">
            {renderProfileHeader({ isSplit: true })}
            {renderTipJar()}
          </div>

          {/* Right Column: Actions, Meetings, Links & Newsletter */}
          <div className="flex-1 min-w-0 space-y-3">
            {renderLeadCapture()}
            {renderScheduleMeeting()}
            {renderHeroVideo()}
            {profile.shop?.published && (
              <div className="flex items-center justify-center gap-1 p-1 bg-[#F5F3ED]/90 backdrop-blur-md rounded-xl border border-[#CAD8CE] w-full max-w-[200px] mx-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveBioTab('links')}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeBioTab === 'links'
                      ? 'bg-[#52796F] text-white shadow-xs'
                      : 'text-[#5C6B64] hover:text-[#28352F]'
                  }`}
                >
                  Links
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBioTab('shop')}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    activeBioTab === 'shop'
                      ? 'bg-[#52796F] text-white shadow-xs'
                      : 'text-[#5C6B64] hover:text-[#28352F]'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Shop</span>
                </button>
              </div>
            )}
            {activeBioTab === 'shop' ? renderShopGrid() : renderActiveLinks()}
            {renderNewsletter()}
            {renderFooter()}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 w-full">
        {renderProfileHeader({ isSplit: false })}
        {renderLeadCapture()}
        {renderScheduleMeeting()}
        {renderHeroVideo()}
        {profile.shop?.published && (
          <div className="flex items-center justify-center gap-1 p-1 bg-[#F5F3ED]/90 backdrop-blur-md rounded-xl border border-[#CAD8CE] w-full max-w-[200px] mx-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveBioTab('links')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                activeBioTab === 'links'
                  ? 'bg-[#52796F] text-white shadow-xs'
                  : 'text-[#5C6B64] hover:text-[#28352F]'
              }`}
            >
              Links
            </button>
            <button
              type="button"
              onClick={() => setActiveBioTab('shop')}
              className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                activeBioTab === 'shop'
                  ? 'bg-[#52796F] text-white shadow-xs'
                  : 'text-[#5C6B64] hover:text-[#28352F]'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Shop</span>
            </button>
          </div>
        )}
        {activeBioTab === 'shop' ? renderShopGrid() : renderActiveLinks()}
        {(profile.widgets?.hasTipJar || profile.widgets?.hasNewsletter) && (
          <div className={`w-full ${
            deviceMode === 'tablet' && profile.widgets?.hasTipJar && profile.widgets?.hasNewsletter
              ? 'grid grid-cols-2 gap-3.5'
              : 'space-y-3'
          }`}>
            {renderTipJar()}
            {renderNewsletter()}
          </div>
        )}
        {renderFooter()}
      </div>
    );
  };

  const currentStickers = profile?.designSettings?.stickers || [];
  const selectedSticker = currentStickers.find((s) => s.id === selectedStickerId);
  const selectedStickerProps = selectedSticker ? getStickerDeviceProps(selectedSticker, deviceMode) : null;

  return (
    <div className="flex flex-col items-center justify-start w-full relative">
      {/* Responsive Device & Zoom Toolbar */}
      <div className="mb-3.5 z-30 flex flex-col gap-2 bg-[#F5F3ED] backdrop-blur-xl p-2 rounded-xl border border-[#CAD8CE] shadow-xs w-full max-w-xl">
        {/* Row 1: 3 Device Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-lg border border-[#CAD8CE]/70 w-full">
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-[#52796F] text-white shadow-xs'
                : 'text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED]'
            }`}
            title="Mobile iPhone View (380px)"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceMode === 'tablet'
                ? 'bg-[#52796F] text-white shadow-xs'
                : 'text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED]'
            }`}
            title="Tablet iPad View (680px - scaled to fit)"
          >
            <Tablet className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('laptop')}
            className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceMode === 'laptop'
                ? 'bg-[#52796F] text-white shadow-xs'
                : 'text-[#5C6B64] hover:text-[#28352F] hover:bg-[#F5F3ED]'
            }`}
            title="Laptop MacBook View (920px - scaled to fit)"
          >
            <Laptop className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Laptop</span>
          </button>
        </div>

        {/* Row 2: Zoom In / Zoom Out Controls, Audience View As & Direct Link */}
        <div className="flex items-center justify-between gap-2 px-0.5">
          {/* Audience Simulation Button */}
          <button
            type="button"
            onClick={() => setShowViewAsModal(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              simulation.location !== 'global' || simulation.platform !== 'all' || simulation.language !== 'en'
                ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                : 'bg-white hover:bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE]'
            }`}
            title="Preview how this profile renders for visitors by Location, Device OS, or Language"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View as...</span>
            {(simulation.location !== 'global' || simulation.platform !== 'all' || simulation.language !== 'en') && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Explicit Zoom Out [-] | Zoom Scale % | Zoom In [+] Controls */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#CAD8CE]">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:bg-[#F5F3ED] text-[#28352F] rounded text-xs transition-colors cursor-pointer disabled:opacity-30"
              title="Zoom Out"
              disabled={zoomScale <= 0.4}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleZoomReset}
              className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#28352F] hover:text-[#52796F] transition-colors"
              title="Click to reset zoom to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:bg-[#F5F3ED] text-[#28352F] rounded text-xs transition-colors cursor-pointer disabled:opacity-30"
              title="Zoom In"
              disabled={zoomScale >= 1.5}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Live Preview in New Tab */}
          {profile?.username && (
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md bg-white hover:bg-[#F5F3ED] text-[#52796F] border border-[#CAD8CE] transition-all shadow-xs"
              title="Open Live Bio Page in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Floating Sticker Action Toolbar - Rendered OUTSIDE the device frame container with ZERO layout shift:
          - Positioned absolutely so opening/closing it NEVER pushes the phone canvas down
          - Ultra-minimal pill design (zero long text, clean icon buttons, all verbose descriptions in tooltips)
          - 100% Horizontal at all times (sticker rotation never rotates this toolbar)
          - Fixed standard size (sticker scale / preview zoom never resizes this toolbar)
          - Fixed stable position (moving/dragging sticker never jitters or moves this toolbar)
      */}
      {onUpdateStickers && selectedSticker && selectedStickerProps && (
        <div className="absolute top-[92px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-[#1F2923] text-white px-2.5 py-1.5 rounded-full shadow-2xl border border-white/20 text-xs animate-fadeIn select-none pointer-events-auto">
          {/* Active Device Mode Badge */}
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wider select-none border border-emerald-500/30 shrink-0"
            title={`Editing layout for ${deviceMode.toUpperCase()} mode`}
          >
            {deviceMode}
          </span>

          {/* Sticker Preview Icon with Tooltip */}
          <span 
            className="text-sm select-none inline-flex items-center cursor-default px-0.5" 
            title={`Selected: ${selectedSticker.name || 'Sticker'}`}
          >
            {selectedSticker.emoji || '✨'}
          </span>

          <div className="w-px h-3.5 bg-white/20 shrink-0" />

          {/* Flip Horizontal */}
          <button
            type="button"
            onClick={(e) => handleFlipSticker(e, selectedSticker.id)}
            className={`p-1 rounded-full transition-all cursor-pointer ${
              selectedStickerProps.flipX ? 'bg-[#52796F] text-amber-300' : 'hover:bg-white/20 text-white'
            }`}
            title={selectedStickerProps.flipX ? 'Flipped Horizontally (Click to unflip)' : 'Flip Horizontally'}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Rotate Step (+45°) */}
          <button
            type="button"
            onClick={(e) => handleRotateStep(e, selectedSticker.id, 45)}
            className="p-1 rounded-full hover:bg-white/20 text-white transition-all cursor-pointer"
            title={`Rotate +45° (Current rotation: ${selectedStickerProps.rotate || 0}°)`}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Compact Scale / Zoom Controls */}
          <div className="flex items-center bg-black/40 rounded-full px-1 py-0.5 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={(e) => handleScaleStep(e, selectedSticker.id, -0.15)}
              disabled={(selectedStickerProps.scale || 1) <= 0.4}
              className="p-0.5 hover:bg-white/20 disabled:opacity-30 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Decrease Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>

            <span 
              className="font-mono text-[10px] font-bold text-white px-1 min-w-[34px] text-center select-none"
              title={`Current Scale: ${Math.round((selectedStickerProps.scale || 1) * 100)}%`}
            >
              {Math.round((selectedStickerProps.scale || 1) * 100)}%
            </span>

            <button
              type="button"
              onClick={(e) => handleScaleStep(e, selectedSticker.id, 0.15)}
              disabled={(selectedStickerProps.scale || 1) >= 3.5}
              className="p-0.5 hover:bg-white/20 disabled:opacity-30 rounded-full text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Increase Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-3.5 bg-white/20 shrink-0" />

          {/* Sync to all devices button */}
          <button
            type="button"
            onClick={(e) => handleSyncStickerToAllDevices(e, selectedSticker.id)}
            className="p-1 rounded-full hover:bg-white/20 text-emerald-300 hover:text-white transition-all cursor-pointer"
            title="Sync this position & scale to all devices (Mobile, Tablet, Laptop)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Delete Sticker */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSticker(selectedSticker.id);
            }}
            className="p-1 rounded-full hover:bg-rose-500/80 text-rose-300 hover:text-white transition-all cursor-pointer"
            title="Delete sticker"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Done / Deselect */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStickerId(null);
            }}
            className="p-1 rounded-full hover:bg-white/20 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Done (Deselect sticker)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Access Gate Indicator & Test Reset */}
      {profile.accessGate?.enabled && profile.accessGate?.type !== 'none' && (
        <div className="mb-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 shadow-xs">
          {isGateUnlocked ? (
            <Unlock className="w-3.5 h-3.5 text-amber-700" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-700" />
          )}
          <span className="font-semibold">Access Gate Active:</span>
          <span className="font-mono text-amber-800 font-bold uppercase">
            {profile.accessGate.type.replace('_', ' ')} {isGateUnlocked ? '(Unlocked)' : '(Locked)'}
          </span>
          {isGateUnlocked && (
            <button
              type="button"
              onClick={() => setIsGateUnlocked(false)}
              className="text-[10px] text-amber-900 underline font-semibold cursor-pointer ml-1 hover:text-black"
            >
              Relock to Test
            </button>
          )}
        </div>
      )}

      {/* Active Audience Simulation Indicator Chip */}
      {(simulation.location !== 'global' || simulation.platform !== 'all' || simulation.language !== 'en') && (
        <div className="mb-3 px-3 py-1 rounded-full bg-[#52796F]/10 border border-[#52796F]/30 text-xs text-[#28352F] flex items-center gap-2 shadow-xs animate-fadeIn">
          <Eye className="w-3.5 h-3.5 text-[#52796F]" />
          <span className="font-semibold">Simulating Visitor:</span>
          <span className="font-mono text-[#52796F] font-bold">
            {simulation.location.toUpperCase()} • {simulation.platform.toUpperCase()} • {simulation.language.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => setSimulation({ location: 'global', platform: 'all', language: 'en' })}
            className="text-[10px] text-[#5C6B64] hover:text-red-500 underline cursor-pointer ml-1"
          >
            Reset
          </button>
        </div>
      )}

      {/* Live Activity Social Proof Ticker */}
      <SocialProofTicker 
        username={profile?.username} 
        enabled={profile?.socialProof?.enabled} 
        initialIntervalMs={profile?.socialProof?.intervalMs} 
      />

      {/* Frame Container Scaled by effectiveScale to fit seamlessly inside Studio column */}
      <div 
        className="w-full flex items-start justify-center overflow-visible"
        style={{ height: getContainerHeight(), minHeight: deviceMode === 'fluid' ? 'auto' : undefined }}
      >
        <div 
          className="transition-transform duration-200 origin-top flex items-center justify-center shrink-0"
          style={{ transform: `scale(${effectiveScale})` }}
        >
        {/* 1. MOBILE HARDWARE FRAME */}
        {deviceMode === 'mobile' && (
          <div 
            className={`phone-frame ${getThemeClass()} ${getActiveThemePreset()?.bg && !getActiveThemePreset()?.bg?.startsWith('bg-[#') ? getActiveThemePreset()?.bg : ''} ${getActiveThemePreset()?.text || ''}`}
            style={getWallpaperStyle()}
          >
            {/* Background Video if configured */}
            {profile?.designSettings?.wallpaper?.type === 'video' && profile.designSettings.wallpaper.videoUrl && (
              <video
                src={profile.designSettings.wallpaper.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
              />
            )}

            {/* Dynamic Island */}
            <div className="phone-notch">
              <div className="phone-camera"></div>
              <div className="phone-speaker"></div>
            </div>

            {/* Share Button */}
            <button 
              onClick={handleCopyShare}
              className="absolute top-2.5 right-3.5 z-40 p-2 rounded-full bg-[#FFFEFA]/90 backdrop-blur-md text-[#28352F] hover:text-[#52796F] hover:bg-white transition-all border border-[#CAD8CE] cursor-pointer shadow-sm"
              title="Share profile"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {copiedLink && (
              <div className="absolute top-11 right-3.5 z-50 px-3 py-1 rounded-sm bg-[#52796F] text-white text-xs font-semibold shadow-md animate-bounce">
                Link Copied!
              </div>
            )}

            {/* Viewport */}
            <div 
              ref={phoneViewportRef}
              className="phone-viewport"
              onClick={handleViewportClick}
              onDragOver={handleCanvasDragOver}
              onDrop={(e) => handleCanvasDrop(e, contentCanvasRef)}
            >
              {/* Relative Content Canvas: stickers placed here scroll WITH content! */}
              <div 
                ref={contentCanvasRef} 
                className="relative w-full min-h-full flex flex-col gap-3.5 pb-6"
                style={{ containerType: 'inline-size' }}
              >
                {/* Placed Stickers inside the scrollable content canvas */}
                {renderStickers(contentCanvasRef, 'CONTENT')}

                {renderProfileContent()}
              </div>
            </div>
          </div>
        )}

        {/* 2. TABLET HARDWARE FRAME */}
        {deviceMode === 'tablet' && (
          <div 
            className={`tablet-frame ${getThemeClass()} ${getActiveThemePreset()?.bg && !getActiveThemePreset()?.bg?.startsWith('bg-[#') ? getActiveThemePreset()?.bg : ''} ${getActiveThemePreset()?.text || ''}`}
            style={getWallpaperStyle()}
          >
            {/* Background Video if configured */}
            {profile?.designSettings?.wallpaper?.type === 'video' && profile.designSettings.wallpaper.videoUrl && (
              <video
                src={profile.designSettings.wallpaper.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
              />
            )}

            {/* Front Camera Dot */}
            <div className="tablet-notch"></div>

            {/* Share Button */}
            <button 
              onClick={handleCopyShare}
              className="absolute top-3.5 right-4 z-40 p-2 rounded-full bg-[#FFFEFA]/90 backdrop-blur-md text-[#28352F] hover:text-[#52796F] hover:bg-white transition-all border border-[#CAD8CE] cursor-pointer shadow-sm"
              title="Share profile"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {copiedLink && (
              <div className="absolute top-12 right-4 z-50 px-3 py-1 rounded-sm bg-[#52796F] text-white text-xs font-semibold shadow-md animate-bounce">
                Link Copied!
              </div>
            )}

            {/* Viewport */}
            <div 
              className="tablet-viewport"
              onClick={handleViewportClick}
              onDragOver={handleCanvasDragOver}
              onDrop={(e) => handleCanvasDrop(e, contentCanvasTabletRef)}
            >
              <div 
                ref={contentCanvasTabletRef} 
                className="relative w-full min-h-full flex flex-col gap-3.5 pb-6"
                style={{ containerType: 'inline-size' }}
              >
                {renderStickers(contentCanvasTabletRef, 'CONTENT')}
                {renderProfileContent()}
              </div>
            </div>
          </div>
        )}

        {/* 3. LAPTOP HARDWARE FRAME (MacBook Pro) */}
        {deviceMode === 'laptop' && (
          <div className="laptop-container">
            {/* Screen Lid */}
            <div 
              className={`laptop-screen ${getThemeClass()} ${getActiveThemePreset()?.bg && !getActiveThemePreset()?.bg?.startsWith('bg-[#') ? getActiveThemePreset()?.bg : ''} ${getActiveThemePreset()?.text || ''}`}
              style={getWallpaperStyle()}
            >
              {/* Background Video if configured */}
              {profile?.designSettings?.wallpaper?.type === 'video' && profile.designSettings.wallpaper.videoUrl && (
                <video
                  src={profile.designSettings.wallpaper.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
                />
              )}

              {/* MacBook Camera Notch */}
              <div className="laptop-notch">
                <div className="laptop-camera-dot"></div>
                <div className="laptop-indicator-dot"></div>
              </div>

              {/* Share Button */}
              <button 
                onClick={handleCopyShare}
                className="absolute top-3 right-4 z-40 p-2 rounded-full bg-[#FFFEFA]/90 backdrop-blur-md text-[#28352F] hover:text-[#52796F] hover:bg-white transition-all border border-[#CAD8CE] cursor-pointer shadow-sm"
                title="Share profile"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {copiedLink && (
                <div className="absolute top-12 right-4 z-50 px-3 py-1 rounded-sm bg-[#52796F] text-white text-xs font-semibold shadow-md animate-bounce">
                  Link Copied!
                </div>
              )}

              {/* Viewport */}
              <div 
                className="laptop-viewport"
                onClick={handleViewportClick}
                onDragOver={handleCanvasDragOver}
                onDrop={(e) => handleCanvasDrop(e, contentCanvasLaptopRef)}
              >
                <div 
                  ref={contentCanvasLaptopRef} 
                  className="relative w-full min-h-full flex flex-col gap-3.5 pb-6"
                  style={{ containerType: 'inline-size' }}
                >
                  {renderStickers(contentCanvasLaptopRef, 'CONTENT')}
                  {renderProfileContent()}
                </div>
              </div>
            </div>

            {/* Aluminum Laptop Base / Hinge with Thumb Notch */}
            <div className="laptop-base">
              <div className="laptop-thumb-notch"></div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal profile={profile} onClose={() => setShowTipModal(false)} />
      )}

      {/* Lead Capture Dialog */}
      {showLeadModal && (
        <LeadCaptureModal
          profile={profile}
          onClose={() => setShowLeadModal(false)}
        />
      )}

      {/* Schedule 1:1 Meeting Modal */}
      {showScheduleModal && (
        <ScheduleMeetingModal
          profile={profile}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* View As Audience Simulation Modal */}
      <ViewAsModal
        isOpen={showViewAsModal}
        onClose={() => setShowViewAsModal(false)}
        simulation={simulation}
        onUpdateSimulation={(key, value) => {
          setSimulation(prev => ({ ...prev, [key]: value }));
          // If platform simulation changes to desktop/tablet, automatically switch deviceMode
          if (key === 'platform') {
            if (value === 'desktop') setDeviceMode('laptop');
            else if (value === 'ios' || value === 'android') setDeviceMode('mobile');
          }
        }}
        onResetSimulation={() => {
          setSimulation({ location: 'global', platform: 'all', language: 'en' });
        }}
      />
    </div>
  );
}
