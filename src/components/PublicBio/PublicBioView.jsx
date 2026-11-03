'use client';

import React, { useState } from 'react';
import { isLinkVisibleInCountry } from '@/lib/geoTargeting';
import { getReadableThemeColors, getGlassButtonColors, getReadableButtonText, getReadableOutlineColor, getThemeCardColor } from '@/lib/theme-contrast';
import Link from 'next/link';
import { 
  InstagramIcon, 
  YoutubeIcon, 
  TwitterIcon, 
  LinkedinIcon,
  GithubIcon, 
  SpotifyIcon, 
  ImdbIcon 
} from '../Common/SocialIcons';
import { 
  ArrowLeft, 
  QrCode, 
  Tablet,
  Laptop,
  CheckCircle2, 
  MapPin, 
  ExternalLink, 
  Send, 
  Coffee, 
  Heart, 
  Sparkles,
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
  PhoneCall,
  Lock,
  Folder,
  ChevronDown,
  ChevronRight
} from '@/components/icons';
import TipModal from '../Modals/TipModal';
import QRCodeModal from '../Modals/QRCodeModal';
import LeadCaptureModal from '../Modals/LeadCaptureModal';
import ScheduleMeetingModal from '../Modals/ScheduleMeetingModal';
import LeadMagnetGateModal from '../Modals/LeadMagnetGateModal';
import StoryBubbleAvatar from './StoryBubbleAvatar';
import EmbedWidget from './EmbedWidget';
import CountdownBadge from './CountdownBadge';
import SocialProofTicker from './SocialProofTicker';
import TrackingPixels from './TrackingPixels';
import AccessGateScreen from '../Common/AccessGateScreen';
import CarouselSlider from '../Common/CarouselSlider';
import StickerBlockLayer, { getBlockStickerPositionStyle } from '../Common/StickerBlockLayer';
import { THEME_PRESETS, CURATED_THEMES, getTitleFontName, getFontStack, loadGoogleFont, linkHighlightClass, bentoWideFlags, hasMediaKitStats, getStickerDeviceProps, getStickerCanvasPositionStyle, getStickerGraphicSizeStyle, isImageUrl, parseTailwindGradient } from '../../constants/app';
import { safeLinkUrl } from '../../lib/safeUrl';

const ICON_MAP = {
  Video, Star, Mail, FileText, Music, ShoppingBag, Zap, Briefcase, BookOpen, Calendar, MessageSquare, TrendingUp, Ticket, Globe,
  Youtube: YoutubeIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  Linkedin: LinkedinIcon,
  Github: GithubIcon,
  Spotify: SpotifyIcon,
  Imdb: ImdbIcon
};

export default function PublicBioView({ profile: initialProfile, onBackToEditor, onIncrementClick }) {
  const [unlockedProfile, setUnlockedProfile] = useState(null);
  const profile = unlockedProfile || initialProfile;
  // Layout follows the visitor's screen: phone, tablet or laptop and larger.
  // Breakpoints match the Studio preview (768px / 1024px).
  const [deviceMode, setDeviceMode] = useState('mobile');

  React.useEffect(() => {
    const detectMode = () => {
      const w = window.innerWidth;
      setDeviceMode(w >= 1024 ? 'laptop' : w >= 768 ? 'tablet' : 'mobile');
    };
    detectMode();
    window.addEventListener('resize', detectMode);
    return () => window.removeEventListener('resize', detectMode);
  }, []);

  // Laptops show the centred column, matching the Studio's default preview.
  const desktopLayout = 'centered';
  const [activeBioTab, setActiveBioTab] = useState('links');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeLeadMagnetLink, setActiveLeadMagnetLink] = useState(null);
  const [collapsedCollections, setCollapsedCollections] = useState({});
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);

  // Lead capture dialog: disabled by default on profile open.
  // Only auto-opens if the creator explicitly chose 'auto' AND visitor is on the public page (not in studio preview).
  React.useEffect(() => {
    if (onBackToEditor) return; // Never auto-popup inside studio preview
    if (!profile?.leadCapture || profile.leadCapture.enabled === false) return;

    const triggerMode = profile.leadCapture.triggerMode || 'button_only';
    if (triggerMode !== 'auto') return;

    const dismissKey = `tb_lead_dismissed_${profile.username || 'preview'}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(dismissKey)) {
      return;
    }

    const delayMs = Math.max((profile.leadCapture.autoOpenDelaySeconds || 4) * 1000, 2500);
    const timer = setTimeout(() => {
      setShowLeadModal(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [profile?.leadCapture, profile?.username, onBackToEditor]);

  const getIcon = (iconName) => {
    if (!iconName || iconName === 'link' || iconName === 'external') return null;
    const IconComponent = ICON_MAP[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4 shrink-0" /> : null;
  };

  // Automatically record view telemetry on standalone public load via edge beacon
  React.useEffect(() => {
    if (!onBackToEditor && profile?.username) {
      const startEdge = typeof performance !== 'undefined' ? performance.now() : 0;
      const payload = JSON.stringify({
        target_id: profile.username,
        event_type: 'profile_view',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        latency_ms: Math.round(startEdge),
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/v1/track', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/v1/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch((err) => console.error('View tracking error:', err));
      }
    }
  }, [profile?.username, onBackToEditor]);

  // Load the page font and the optional title font from Google Fonts.
  React.useEffect(() => {
    loadGoogleFont(profile?.font);
    loadGoogleFont(getTitleFontName(profile?.alternativeTitleFont));
  }, [profile?.font, profile?.alternativeTitleFont]);

  const handleLinkClick = (link) => {
    // If it's a locked lead magnet, trigger unlock modal
    if (link.leadMagnet?.enabled) {
      setActiveLeadMagnetLink(link);
      return;
    }

    if (onIncrementClick) onIncrementClick(link.id);

    if (profile?.username && link.id) {
      const clickPayload = JSON.stringify({
        target_id: profile.username,
        event_type: 'link_click',
        link_id: link.id,
        destination_url: link.url || '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/v1/track', new Blob([clickPayload], { type: 'application/json' }));
      } else {
        fetch('/api/v1/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: clickPayload,
          keepalive: true,
        }).catch((err) => console.error('Click tracking error:', err));
      }
    }

    const destination = safeLinkUrl(link.url);
    if (destination !== '#') {
      window.open(destination, '_blank', 'noopener,noreferrer');
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

  const getActiveThemePreset = () => {
    return (
      THEME_PRESETS.find((p) => p.id === profile?.theme) ||
      CURATED_THEMES.find((t) => t.id === profile?.theme) ||
      null
    );
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
          backgroundColor: '#FFFFFF',
          backgroundImage: 'radial-gradient(#DCDCDC 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        };
      }
      if (wp.type === 'gradient' && wp.gradient) {
        return { background: parseTailwindGradient(wp.gradient) };
      }
      if (wp.type === 'fill' && wp.value && wp.value !== '#FFFFFF') {
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
    const cardColor = getThemeCardColor(preset, readableColors);
    if (cardColor) {
      cardStyle.backgroundColor = cardColor;
      if (cardColor.startsWith('rgba')) {
        cardStyle.backdropFilter = 'blur(16px)';
        cardStyle.WebkitBackdropFilter = 'blur(16px)';
      }
    }

    if (!cardStyle.backgroundColor) {
      cardStyle.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#F8F8F9';
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
        cardStyle.borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : '#DCDCDC';
      }
    } else {
      cardStyle.borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : '#DCDCDC';
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
      cardStyle.boxShadow = `3px 3px 0px ${preset?.accent || (isDark ? '#FFFFFF' : '#333333')}`;
    }

    // Icon Container Box Style
    const iconBoxStyle = {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
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
      accentColor: readableColors.accent,
      readableColors,
      primaryColor: preset?.primary || '#16A34A',
    };
  };

  // Dynamic Button Custom Styling based on Studio designSettings
  const getButtonCustomStyle = () => {
    const ds = profile?.designSettings;
    const preset = getActiveThemePreset();
    const themeStyles = getThemeStyles();
    const style = {};

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

    const btnColor = ds?.buttonColor || preset?.button || preset?.primary || '#16A34A';
    // Keep the chosen label colour when it reads on the fill; otherwise use one that does.
    const textColor = getReadableButtonText(btnColor, ds?.buttonTextColor || preset?.buttonText, preset?.buttonText);
    const btnStyle = ds?.buttonStyle || 'solid';
    style['--link-fx-color'] = btnColor;

    if (btnStyle === 'solid') {
      style.backgroundColor = btnColor;
      style.color = textColor;
      style.border = '1px solid transparent';
    } else if (btnStyle === 'glass') {
      const glass = getGlassButtonColors(preset, ds?.wallpaper, themeStyles.readableColors);
      style.backgroundColor = glass.background;
      style.backdropFilter = 'blur(16px)';
      style.WebkitBackdropFilter = 'blur(16px)';
      style.color = glass.color;
      style.border = glass.border;
    } else if (btnStyle === 'outline') {
      style.backgroundColor = 'transparent';
      style.color = getReadableOutlineColor(btnColor, preset, ds?.wallpaper, themeStyles.titleColor);
      style.borderColor = btnColor;
      style.borderWidth = '2px';
      style.borderStyle = 'solid';
    }

    if (btnStyle !== 'outline') {
      const shadow = ds?.buttonShadow || 'soft';
      if (shadow === 'none') {
        style.boxShadow = 'none';
      } else if (shadow === 'soft') {
        style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.08)';
      } else if (shadow === 'hard') {
        style.boxShadow = '0 8px 22px rgba(0, 0, 0, 0.2)';
      } else if (shadow === 'offset') {
        style.boxShadow = `3px 3px 0px ${preset?.accent || '#333333'}`;
      }
    } else {
      style.boxShadow = 'none';
    }

    return style;
  };

  const themeStyles = getThemeStyles();
  const btnCustomStyle = getButtonCustomStyle();
  // The floating "Connect" button wears the theme's button colours; outline
  // buttons have no fill, so it uses the title colour as a solid fill instead.
  const floatingCtaStyle = btnCustomStyle.backgroundColor && btnCustomStyle.backgroundColor !== 'transparent'
    ? { backgroundColor: btnCustomStyle.backgroundColor, color: btnCustomStyle.color }
    : { backgroundColor: themeStyles.titleColor, color: themeStyles.isDark ? '#111827' : '#ffffff' };

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

  // Page font for everything; the title uses the alternative title font when one is set.
  const pageFontStyle = profile?.font ? { '--profile-font': getFontStack(profile.font) } : {};
  const titleFontFamily = getFontStack(getTitleFontName(profile?.alternativeTitleFont) || profile?.font);

  /* ========================================================
     MODULAR COMPONENT RENDERERS (Clean, Consistent & Responsive)
     ======================================================== */

  // Helper to render social badges row
  const renderSocialBadges = () => {
    if (!profile.socials) return null;
    const themeStyles = getThemeStyles();
    return (
      <div className={`flex items-center justify-center ${deviceMode === 'mobile' ? 'gap-1.5' : 'gap-2'} flex-wrap`}>
        {profile.socials.instagram && (
          <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className={`${deviceMode === 'mobile' ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} hover:scale-105 transition-all border shadow-2xs`} title="Instagram">
            <InstagramIcon className={`${deviceMode === 'mobile' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.youtube && (
          <a href={`https://youtube.com/${profile.socials.youtube}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className={`${deviceMode === 'mobile' ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} hover:scale-105 transition-all border shadow-2xs`} title="YouTube">
            <YoutubeIcon className={`${deviceMode === 'mobile' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.twitter && (
          <a href={`https://twitter.com/${profile.socials.twitter}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className={`${deviceMode === 'mobile' ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} hover:scale-105 transition-all border shadow-2xs`} title="Twitter / X">
            <TwitterIcon className={`${deviceMode === 'mobile' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.linkedin && (
          <a href={`https://linkedin.com/in/${profile.socials.linkedin}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className={`${deviceMode === 'mobile' ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} hover:scale-105 transition-all border shadow-2xs`} title="LinkedIn">
            <LinkedinIcon className={`${deviceMode === 'mobile' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.github && (
          <a href={`https://github.com/${profile.socials.github}`} target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className={`${deviceMode === 'mobile' ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} hover:scale-105 transition-all border shadow-2xs`} title="GitHub">
            <GithubIcon className={`${deviceMode === 'mobile' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: themeStyles.titleColor }} />
          </a>
        )}
        {profile.socials.spotify && (
          <a href="https://spotify.com" target="_blank" rel="noreferrer" style={themeStyles.iconBoxStyle} className={`${deviceMode === 'mobile' ? 'p-1.5 rounded-lg' : 'p-2 sm:p-2.5 rounded-xl'} hover:scale-105 transition-all border shadow-2xs`} title="Spotify">
            <SpotifyIcon className={`${deviceMode === 'mobile' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} style={{ color: themeStyles.accentColor }} />
          </a>
        )}
      </div>
    );
  };

  // Section-anchored stickers rendering (HEADER vs CONTENT)
  const renderStickersSection = (targetMode, anchorFilter = 'HEADER', blockRects = null) => {
    // Resolve the anchor the same way the editor does (per-device placement
    // first); profiles saved before the fix lost the top-level anchorType.
    const stickersList = (profile?.designSettings?.stickers || []).filter((stk) => (
      getStickerDeviceProps(stk, targetMode, desktopLayout).anchorType === anchorFilter
    ));
    if (!stickersList.length) return null;

    return (
      <>
        {stickersList.map((stk) => {
          const p = getStickerDeviceProps(stk, targetMode, desktopLayout);
          return (
            <div
              key={stk.id}
              className="absolute z-30 pointer-events-none select-none"
              style={{
                ...(getBlockStickerPositionStyle(p, blockRects) || getStickerCanvasPositionStyle(p)),
                transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotate}deg)`,
              }}
            >
              <div
                className="p-1 inline-flex items-center justify-center"
                style={{
                  transform: p.flipX ? 'scaleX(-1)' : 'none',
                }}
              >
                {isImageUrl(stk.src || stk.imageUrl) ? (
                  <img
                    src={stk.src || stk.imageUrl}
                    alt={stk.name || 'Sticker'}
                    className="object-contain drop-shadow-md"
                    style={getStickerGraphicSizeStyle(targetMode, 'image')}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'inline-block';
                      }
                    }}
                  />
                ) : null}
                <span 
                  className="filter drop-shadow-md select-none pointer-events-none"
                  style={{ ...getStickerGraphicSizeStyle(targetMode, 'emoji'), display: isImageUrl(stk.src || stk.imageUrl) ? 'none' : 'inline-block' }}
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

  // 1. Creator Identity & Header (Supports Classic, Banner, Hero layouts)
  const renderProfileHeader = ({ isSplit = false } = {}) => {
    const layoutMode = profile?.headerLayout || 'classic';
    // This mobile renderer can be shown in a wide browser. Keep its geometry
    // tied to the selected device mode, not the browser's `sm:` breakpoint.
    const isMobileLayout = deviceMode === 'mobile';
    const hasCover = Boolean(profile?.coverImage && profile.coverImage.trim());
    const socialsPos = profile?.socialsPosition || 'top';
    const themeStyles = getThemeStyles();

    const avatarUrl = profile?.avatar && typeof profile.avatar === 'string' && profile.avatar.trim() !== ''
      ? profile.avatar.trim()
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.title || profile?.name || 'Creator')}&background=16A34A&color=FFFFFF&bold=true&size=256`;

    return (
      <div 
        style={isSplit ? themeStyles.cardStyle : undefined}
        className={`w-full ${
          isSplit ? 'p-6 sm:p-7 border' : ''
        }`}
      >
        <div data-anchor-section="PROFILE_HEADER" className="relative flex flex-col items-center text-center w-full overflow-visible">
        {renderStickersSection(isMobileLayout ? 'mobile' : deviceMode, 'PROFILE_HEADER')}

        {/* Visual Identity & Avatar Container (Constant Height Header Anchor) */}
        <div 
          data-anchor-section="HEADER"
          className="relative w-full flex flex-col items-center overflow-visible"
        >
          {renderStickersSection(isMobileLayout ? 'mobile' : deviceMode, 'HEADER')}
          {/* Banner Cover Image (Banner Mode) */}
          {layoutMode === 'banner' && (
            <div className={`w-full ${isMobileLayout ? 'h-20' : deviceMode === 'tablet' ? 'h-28' : 'h-32'} rounded-t-xl relative overflow-hidden bg-gradient-to-r from-ink-900 via-brand-500 to-brand-100`}>
            {hasCover ? (
              <img 
                src={profile.coverImage} 
                alt="Profile Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full opacity-30 bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:16px_16px]" />
            )}
          </div>
        )}

          <div className={`w-full flex flex-col items-center ${
            layoutMode === 'banner'
              ? isMobileLayout ? '-mt-8 px-3' : '-mt-12 sm:-mt-14 px-5'
              : isSplit ? 'p-1' : isMobileLayout ? 'p-1' : 'p-2'
          }`}>
            {/* Avatar (Hero Portrait vs Classic / Banner) */}
            {layoutMode === 'hero' ? (
              <div className="w-full max-w-[280px] aspect-[4/5] rounded-3xl overflow-hidden border-4 border-white shadow-lg relative group mb-2 bg-surface-2">
                <img 
                  src={avatarUrl} 
                  alt={profile?.name || 'Creator'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {profile.verified && (
                  <div className="absolute bottom-3 right-3 bg-brand-500 text-white rounded-full p-1.5 shadow-md border-2 border-white" title="Verified Profile">
                    <CheckCircle2 className="w-4 h-4 fill-brand-500 text-white" />
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
                  sizeClasses={isMobileLayout ? 'w-20 h-20' : 'w-24 h-24 sm:w-28 sm:h-28'}
                />
                {profile.verified && (
                  <div className="absolute bottom-0 right-0 bg-brand-500 text-white rounded-full p-1 shadow-sm border-2 border-white" title="Verified Profile">
                    <CheckCircle2 className="w-3.5 h-3.5 fill-brand-500 text-white" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`w-full flex flex-col items-center ${
          // Vertical padding only: the stats box below must line up with the cards.
          layoutMode === 'banner' ? 'pb-2' : isSplit ? 'py-1' : isMobileLayout ? 'py-1' : 'py-2'
        }`}>

          {profile?.titleLogo?.enabled && profile?.titleLogo?.url ? (
            <div className="flex items-center justify-center mt-3 max-h-16">
              <img 
                src={profile.titleLogo.url} 
                alt={profile.titleLogo.altText || profile?.name || profile?.title || 'Brand Logo'} 
                className="max-h-14 max-w-[240px] object-contain drop-shadow-sm" 
              />
            </div>
          ) : (
            <h1 
              style={{
                color: themeStyles.titleColor,
                ...(titleFontFamily ? { fontFamily: titleFontFamily } : {})
              }} 
              className={`${isMobileLayout ? 'text-base mt-2' : 'text-xl sm:text-2xl lg:text-3xl mt-3'} font-bold tracking-tight flex items-center justify-center gap-1.5`}
            >
              {profile?.name || profile?.title || profile?.username || 'Creator'}
            </h1>
          )}

          {profile.location && (
            <p 
              style={{ color: themeStyles.bioColor }}
              className={`${isMobileLayout ? 'text-[11px] mt-0.5' : 'text-xs sm:text-sm mt-1'} flex items-center justify-center gap-1 font-medium`}
            >
              <MapPin className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} /> {profile.location}
            </p>
          )}

          <p 
            style={{ color: themeStyles.bioColor }}
            className={`${isMobileLayout ? 'text-[12px] mt-1.5 max-w-sm' : 'text-xs sm:text-sm mt-2.5 max-w-lg'} leading-relaxed font-normal mx-auto opacity-90`}
          >
            {profile.bio}
          </p>

          {/* Social Badges Row if positioned at TOP */}
          {socialsPos === 'top' && (
            <div className={isMobileLayout ? 'mt-2.5' : 'mt-3.5'}>
              {renderSocialBadges()}
            </div>
          )}

          {/* Media Kit Stats Bar */}
          {hasMediaKitStats(profile.widgets?.mediaKitStats) && (
            <div 
              style={themeStyles.cardStyle}
              className={`${isMobileLayout ? 'phone-stats-card w-full mt-3 p-3 border divide-x divide-white/10' : 'p-3.5 sm:p-4 mt-4 rounded-2xl grid grid-cols-3 gap-2 text-center w-full border divide-x divide-white/10'}`}
            >
              <div className="px-1">
                <p style={{ color: themeStyles.mutedColor }} className={`${isMobileLayout ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'} uppercase font-bold tracking-wider`}>Followers</p>
                <p style={{ color: themeStyles.titleColor }} className={`${isMobileLayout ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-extrabold mt-0.5`}>{profile.widgets.mediaKitStats.followers}</p>
              </div>
              <div className="px-1">
                <p style={{ color: themeStyles.mutedColor }} className={`${isMobileLayout ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'} uppercase font-bold tracking-wider`}>Engagement</p>
                <p style={{ color: themeStyles.accentColor }} className={`${isMobileLayout ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-extrabold mt-0.5`}>{profile.widgets.mediaKitStats.engagement}</p>
              </div>
              <div className="px-1">
                <p style={{ color: themeStyles.mutedColor }} className={`${isMobileLayout ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'} uppercase font-bold tracking-wider`}>Views</p>
                <p style={{ color: themeStyles.titleColor }} className={`${isMobileLayout ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-extrabold mt-0.5`}>{profile.widgets.mediaKitStats.monthlyViews}</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    );
  };

  // 2. Lead Capture Contact Action Card
  const renderLeadCapture = () => {
    if (profile.leadCapture?.enabled === false) return null;
    const btnCustomStyle = getButtonCustomStyle();
    const themeStyles = getThemeStyles();
    return (
      <div data-sticker-block="lead-capture" 
        onClick={() => setShowLeadModal(true)}
        style={themeStyles.cardStyle}
        className="p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full transition-all cursor-pointer group hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3.5 text-left min-w-0">
          <div 
            style={themeStyles.iconBoxStyle}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform"
          >
            <PhoneCall className="w-5 h-5" style={{ color: themeStyles.accentColor }} />
          </div>
          <div className="min-w-0">
            <h3 style={{ color: themeStyles.titleColor }} className="text-sm sm:text-base font-bold tracking-tight truncate">
              {profile.leadCapture?.title || "Let's Connect"}
            </h3>
            <p style={{ color: themeStyles.bioColor }} className="text-xs mt-0.5 line-clamp-1 opacity-85">
              {profile.leadCapture?.subtitle || "Drop your contact info to get in touch directly"}
            </p>
          </div>
        </div>
        <button
          id="lead-capture-trigger-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowLeadModal(true);
          }}
          style={btnCustomStyle}
          className="w-full sm:w-auto px-5 py-2.5 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {profile.leadCapture?.buttonText || "Exchange Contact"}
        </button>
      </div>
    );
  };

  // 3. Schedule 1:1 Consultation / Meeting Card
  const renderScheduleMeeting = () => {
    if (profile.scheduleMeeting?.enabled === false) return null;
    const btnCustomStyle = getButtonCustomStyle();
    const themeStyles = getThemeStyles();
    return (
      <div data-sticker-block="schedule-meeting" 
        style={themeStyles.cardStyle}
        className="p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full transition-all hover:scale-[1.01]"
      >
        <div className="flex items-center gap-3.5 text-left min-w-0">
          <div 
            style={themeStyles.iconBoxStyle}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border"
          >
            <Calendar className="w-5 h-5" style={{ color: themeStyles.titleColor }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 style={{ color: themeStyles.titleColor }} className="text-sm sm:text-base font-bold tracking-tight truncate">
                {profile.scheduleMeeting?.title || "Book a 1:1 Consultation"}
              </h3>
              <span 
                style={{
                  backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
                  color: themeStyles.titleColor,
                  borderColor: themeStyles.cardStyle.borderColor,
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              >
                {profile.scheduleMeeting?.price || "Free"}
              </span>
            </div>
            <p style={{ color: themeStyles.bioColor }} className="text-xs mt-0.5 line-clamp-1 opacity-85">
              {profile.scheduleMeeting?.subtitle || `${profile.scheduleMeeting?.durationMinutes || 30}m video call • Available this week`}
            </p>
          </div>
        </div>
        <button
          id="public-schedule-meeting-btn"
          onClick={() => setShowScheduleModal(true)}
          style={btnCustomStyle}
          className="w-full sm:w-auto px-5 py-2.5 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Video className="w-4 h-4" />
          {profile.scheduleMeeting?.buttonText || "Schedule Call"}
        </button>
      </div>
    );
  };

  // 4. Showreel / Hero Video Card
  
  const renderLinkThumbnail = (link) => {
    if (link.thumbnailType === 'none') return null;
    if (link.thumbnailType === 'image' && link.thumbnail) {
      return (
        <img
          src={link.thumbnail}
          alt=""
          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-line"
        />
      );
    }
    if (link.thumbnailType === 'icon' && link.thumbnail && !link.thumbnail.startsWith('http') && !link.thumbnail.startsWith('data:')) {
      return <span className="text-2xl shrink-0 leading-none">{link.thumbnail}</span>;
    }
    if (link.thumbnailIcon) {
      const IconComp = ICON_MAP[link.thumbnailIcon];
      if (IconComp) {
        return (
          <div className="p-2.5 rounded-xl bg-surface-2 border border-line text-brand-500 shrink-0">
            <IconComp className="w-5 h-5" />
          </div>
        );
      }
    }
    if (link.leadMagnet?.enabled) {
      return <Lock className="w-4 h-4 text-brand-500" />;
    }
    const fallbackIcon = getIcon(link.icon);
    return fallbackIcon ? (
      <div className="p-2.5 rounded-xl bg-surface-2 border border-line text-brand-500 shrink-0">
        {fallbackIcon}
      </div>
    ) : null;
  };

  const renderHeroVideo = () => {
    if (!profile.heroVideo) return null;
    return (
      <div data-sticker-block="hero-video" className="phone-video-card w-full">
        <iframe 
          src={profile.heroVideo} 
          title="Showreel Video Player" 
          allowFullScreen
        ></iframe>
      </div>
    );
  };

  // Helper to render a single link card in stack/list mode
  const renderStackCard = (link) => {
    const iconElement = link.leadMagnet?.enabled ? <Lock size={16} className="text-brand-500" /> : getIcon(link.icon);
    const btnCustomStyle = getButtonCustomStyle();
    const isSolid = (profile?.designSettings?.buttonStyle || 'solid') === 'solid';
    const textColor = btnCustomStyle.color || '#333333';

    return (
      <div data-sticker-block={`link:${link.id}`}
        key={link.id}
        style={btnCustomStyle}
        className={`phone-stack-card ${getStackShapeClass()} ${linkHighlightClass(link)} w-full flex flex-col text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] p-3.5`}
      >
        <div 
          onClick={() => handleLinkClick(link)}
          className="w-full flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            {iconElement && (
              <div 
                className="p-2.5 rounded-xl shrink-0"
                style={{
                  backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.2)' : '#F8F8F9',
                  color: isSolid ? '#FFFFFF' : '#16A34A',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                {iconElement}
              </div>
            )}
            <div className="min-w-0">
              <span 
                className="font-bold text-sm sm:text-base truncate block"
                style={{ color: textColor }}
              >
                {link.title}
              </span>
              {link.leadMagnet?.enabled ? (
                <span className="text-[10px] font-medium" style={{ color: textColor, opacity: 0.8 }}>
                  🎁 {link.leadMagnet.previewText || 'Unlock Resource'}
                </span>
              ) : link.subtitle ? (
                <span className="text-[10px] font-medium truncate block" style={{ color: textColor, opacity: 0.8 }}>
                  {link.subtitle}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {link.schedule?.enabled && (
              <CountdownBadge startsAt={link.schedule.startsAt} expiresAt={link.schedule.expiresAt} />
            )}
            {link.badge && (
              <span 
                className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase shadow-xs"
                style={{
                  backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.25)' : '#DCDCDC',
                  color: textColor
                }}
              >
                {link.badge}
              </span>
            )}
            <ExternalLink className="w-4 h-4" style={{ color: textColor, opacity: 0.8 }} />
          </div>
        </div>

        {link.embed?.enabled && (
          <EmbedWidget embed={link.embed} title={link.title} />
        )}
      </div>
    );
  };

  // Helper to render a single link card in bento/grid mode
  // A multi-line card with "pill" corners would turn into an oval; cards keep
  // a generous radius instead, single-line buttons stay pills.
  const bentoCardStyle = (style) => (style.borderRadius === '9999px' ? { ...style, borderRadius: '24px' } : style);

  const renderBentoCard = (link, spanTwo = false, isCarousel = false) => {
    const iconElement = link.leadMagnet?.enabled ? <Lock size={16} className="text-brand-500" /> : getIcon(link.icon);
    const btnCustomStyle = getButtonCustomStyle();
    const isSolid = (profile?.designSettings?.buttonStyle || 'solid') === 'solid';
    const textColor = btnCustomStyle.color || '#333333';

    return (
      <div data-sticker-block={`link:${link.id}`}
        key={link.id}
        style={bentoCardStyle(btnCustomStyle)}
        className={`phone-bento-card ${getBentoShapeClass()} ${linkHighlightClass(link)} ${
          isCarousel ? '' : spanTwo ? 'col-span-2' : 'col-span-1'
        } w-full text-left relative flex flex-col justify-between transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] p-4`}
      >
        <div 
          onClick={() => handleLinkClick(link)}
          className="w-full cursor-pointer"
        >
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
            {link.schedule?.enabled && (
              <CountdownBadge startsAt={link.schedule.startsAt} expiresAt={link.schedule.expiresAt} />
            )}
            {link.badge && (
              <span 
                className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-xs"
                style={{
                  backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.25)' : '#DCDCDC',
                  color: textColor
                }}
              >
                {link.badge}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-3 w-full">
            {iconElement ? (
              <div
                className="p-2.5 rounded-xl"
                style={{
                  backgroundColor: isSolid ? 'rgba(255, 255, 255, 0.2)' : '#F8F8F9',
                  color: textColor,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                {iconElement}
              </div>
            ) : (
              <div />
            )}
            <ExternalLink className="w-3.5 h-3.5 ml-auto" style={{ color: textColor, opacity: 0.8 }} />
          </div>

        {/* Text uses the button's own label colour so it reads on any fill.
            Click counts are the creator's analytics, never shown to visitors. */}
        <div>
          <h3 className="text-sm sm:text-base font-bold line-clamp-2 leading-tight" style={{ color: textColor }}>
            {link.title}
          </h3>
          {link.leadMagnet?.enabled ? (
            <p className="text-[10px] sm:text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: textColor, opacity: 0.8 }}>
              <span>🎁</span> {link.leadMagnet.previewText || 'Unlock Download'}
            </p>
          ) : link.subtitle ? (
            <p className="text-[10px] sm:text-xs mt-1 truncate" style={{ color: textColor, opacity: 0.8 }}>
              {link.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {link.embed?.enabled && (
        <EmbedWidget embed={link.embed} title={link.title} />
      )}
    </div>
  );
};

  // Helper to render links grouped into a specific Collection View Mode (List, Grid, Carousel)
  const renderCollectionBlock = (collection, collectionLinks) => {
    if (!collectionLinks.length) return null;
    const viewMode = collection.viewMode || 'list';

    // 1. CAROUSEL SLIDER VIEW MODE (Horizontal Scroll Slider with Navigation)
    if (viewMode === 'carousel') {
      return (
        <div data-sticker-block={`collection:${collection.id}`} key={collection.id} className="w-full pt-1 min-w-0">
          <CarouselSlider
            collection={collection}
            links={collectionLinks}
            onLinkClick={handleLinkClick}
            buttonShapeClass={getBentoShapeClass()}
          />
        </div>
      );
    }

    // 2. 2-COLUMN GRID (Bento Style) VIEW MODE
    if (viewMode === 'grid') {
      return (
        <div data-sticker-block={`collection:${collection.id}`} key={collection.id} className="w-full space-y-3 pt-2 min-w-0">
          <div className="w-full flex items-center justify-between px-2 py-1 text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-500">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <span className="font-sans font-bold text-xs sm:text-sm text-ink-700">
                {collection.title}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-brand-50 text-brand-500">
                {collectionLinks.length}
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-ink-500 bg-surface-2 px-2 py-0.5 rounded border border-line">
              2-Grid
            </span>
          </div>
          <div className="phone-bento-grid w-full">
            {collectionLinks.map(link => renderBentoCard(link, false, false))}
          </div>
        </div>
      );
    }

    // 2. SHOWCASE (Featured Hero Card + Stack) VIEW MODE
    if (viewMode === 'showcase') {
      const [featuredLink, ...remainingLinks] = collectionLinks;
      return (
        <div data-sticker-block={`collection:${collection.id}`} key={collection.id} className="w-full space-y-3 pt-2 min-w-0">
          <div className="w-full flex items-center justify-between px-2 py-1 text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-500">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <span className="font-sans font-bold text-xs sm:text-sm text-ink-700">
                {collection.title}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-brand-50 text-brand-500">
                {collectionLinks.length}
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-ink-500 bg-surface-2 px-2 py-0.5 rounded border border-line">
              Showcase
            </span>
          </div>
          {featuredLink && renderBentoCard(featuredLink, true, false)}
          {remainingLinks.length > 0 && (
            <div className="space-y-3 w-full">
              {remainingLinks.map(link => renderStackCard(link))}
            </div>
          )}
        </div>
      );
    }

    // 3. 2-COLUMN GRID (Bento Style) VIEW MODE
    if (viewMode === 'grid') {
      return (
        <div data-sticker-block={`collection:${collection.id}`} key={collection.id} className="w-full space-y-3 pt-2 min-w-0">
          <div className="w-full flex items-center justify-between px-2 py-1 text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-500">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <span className="font-sans font-bold text-xs sm:text-sm text-ink-700">
                {collection.title}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-brand-50 text-brand-500">
                {collectionLinks.length}
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-ink-500 bg-surface-2 px-2 py-0.5 rounded border border-line">
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
      <div data-sticker-block={`collection:${collection.id}`} key={collection.id} className="w-full space-y-3 pt-2 min-w-0">
        <div className="w-full flex items-center justify-between px-2 py-1 text-left">
          <div className="flex items-center gap-2">
            <div style={themeStyles.iconBoxStyle} className="w-6 h-6 rounded-lg flex items-center justify-center border">
              <Folder className="w-3.5 h-3.5" style={{ color: themeStyles.accentColor }} />
            </div>
            <span style={{ color: themeStyles.titleColor }} className="font-sans font-bold text-xs sm:text-sm">
              {collection.title}
            </span>
            <span 
              style={{
                backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
                color: themeStyles.accentColor,
              }}
              className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold"
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
            className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border"
          >
            List
          </span>
        </div>
        <div className="space-y-3 w-full">
          {collectionLinks.map(link => renderStackCard(link))}
        </div>
      </div>
    );
  };

  // 5. Links Section (Collections + Ungrouped Links)
  
  const renderShopGrid = () => {
    const products = profile.shop?.products || [];
    const themeStyles = getThemeStyles();
    if (products.length === 0) {
      return (
        <div data-sticker-block="shop" 
          style={themeStyles.cardStyle}
          className="p-8 text-center border text-sm w-full"
        >
          <ShoppingBag className="w-10 h-10 mx-auto mb-2" style={{ color: themeStyles.accentColor }} />
          <p style={{ color: themeStyles.titleColor }} className="font-bold">No products published yet</p>
          <p style={{ color: themeStyles.bioColor }} className="text-xs mt-0.5 opacity-80">Check back soon for new drops &amp; releases!</p>
        </div>
      );
    }
    return (
      <div data-sticker-block="shop" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {products.map((prod) => (
          <a
            key={prod.id}
            href={prod.url}
            target="_blank"
            rel="noreferrer"
            style={themeStyles.cardStyle}
            className="p-3.5 border shadow-sm flex flex-col justify-between gap-3 group transition-all text-left hover:scale-[1.01]"
          >
            {prod.image ? (
              <img src={prod.image} alt={prod.title} className="w-full h-36 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div 
                style={themeStyles.iconBoxStyle}
                className="w-full h-36 rounded-xl flex items-center justify-center border"
              >
                <ShoppingBag className="w-8 h-8" style={{ color: themeStyles.accentColor }} />
              </div>
            )}
            <div className="min-w-0">
              <h4 style={{ color: themeStyles.titleColor }} className="text-sm font-bold line-clamp-2 leading-tight">
                {prod.title}
              </h4>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <span className="font-mono font-bold text-sm" style={{ color: themeStyles.accentColor }}>
                  {prod.currency === 'USD' ? '$' : prod.currency === 'EUR' ? '€' : prod.currency === 'GBP' ? '£' : prod.currency === 'INR' ? '₹' : ''}{prod.price}
                </span>
                <span className="text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: themeStyles.accentColor }}>
                  <span>View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    );
  };

  const renderLinksSection = () => {
    const nowTime = new Date().getTime();
    const activeLinks = (profile.links || []).filter((link) => {
      if (link.active === false || link.disabled || link.isArchived) return false;
      if (link.schedule?.enabled) {
        if (link.schedule.startsAt && nowTime < new Date(link.schedule.startsAt).getTime()) return false;
        if (link.schedule.expiresAt && nowTime > new Date(link.schedule.expiresAt).getTime()) return false;
      }
      return isLinkVisibleInCountry(link, profile.visitorCountry);
    });

    const collections = (profile.collections || []).filter(c => c.active !== false);

    // If there are collections configured, separate links into collections and ungrouped
    if (collections.length > 0) {
      const ungroupedLinks = activeLinks.filter(l => !l.collectionId);

      return (
        <div className="space-y-4 w-full">
          {/* Render Collections */}
          {collections.map(col => {
            const colLinks = activeLinks.filter(l => l.collectionId === col.id);
            return renderCollectionBlock(col, colLinks);
          })}

          {/* Render Remaining Ungrouped Links */}
          {ungroupedLinks.length > 0 && (
            <div className="space-y-3 pt-1 w-full">
              {profile.layout === 'bento' ? (
                <div className={`grid gap-3.5 w-full ${
                  ungroupedLinks.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                }`}>
                  {ungroupedLinks.map((link, idx) => {
                    const isLarge = bentoWideFlags(ungroupedLinks)[idx];
                    return renderBentoCard(link, isLarge);
                  })}
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  {ungroupedLinks.map(link => renderStackCard(link))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Default: Ungrouped layout (Bento vs Stack)
    if (profile.layout !== 'bento') {
      return (
        <div className="space-y-3 w-full">
          {activeLinks.map(link => renderStackCard(link))}
        </div>
      );
    }

    const linksCount = activeLinks.length;
    return (
      <div className={`grid gap-3.5 w-full ${
        linksCount === 1 ? 'grid-cols-1' : 'grid-cols-2'
      }`}>
        {activeLinks.map((link, idx) => {
          const isLarge = bentoWideFlags(activeLinks)[idx];
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
      <div data-sticker-block="tip-jar" 
        style={themeStyles.cardStyle}
        className="p-4 sm:p-5 border flex flex-col gap-3 text-center w-full"
      >
        <p style={{ color: themeStyles.titleColor }} className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
          <Coffee className="w-4 h-4" style={{ color: themeStyles.accentColor }} />
          {profile.widgets.tipJarTitle || 'Support My Content'}
        </p>
        <button 
          onClick={() => setShowTipModal(true)}
          style={btnCustomStyle}
          className="w-full py-2.5 sm:py-3 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Heart className="w-4 h-4" /> Send $5 Tip with Confetti ✨
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
      <div data-sticker-block="newsletter" 
        style={themeStyles.cardStyle}
        className="p-4 sm:p-5 border flex flex-col gap-3 text-center w-full"
      >
        <h4 style={{ color: themeStyles.titleColor }} className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: themeStyles.accentColor }} />
          {profile.widgets.newsletterTitle || 'Subscribe to Newsletter'}
        </h4>
        {newsletterSuccess ? (
          <div 
            style={{
              backgroundColor: themeStyles.iconBoxStyle.backgroundColor,
              color: themeStyles.accentColor,
              borderColor: themeStyles.cardStyle.borderColor,
            }}
            className="p-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Subscribed successfully!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex gap-2 mt-1">
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
              className="flex-1 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all"
            />
            <button 
              type="submit" 
              style={btnCustomStyle}
              className="px-4 py-2.5 font-semibold text-xs shrink-0 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    );
  };

  // 8. Footer Branding & FTC Compliance Disclosure
  const renderFooter = () => (
    <div className="pt-3 text-center border-t border-line/70 w-full flex flex-col items-center">
      {/* Bottom Social Badges if positioned at bottom */}
      {profile?.socialsPosition === 'bottom' && (
        <div className="mb-3.5">
          {renderSocialBadges()}
        </div>
      )}

      {profile.compliance?.affiliateDisclosure && (
        <div 
          className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] text-zinc-300 backdrop-blur-md max-w-sm text-center shadow-xs cursor-help"
          title={profile.compliance.disclosureText || 'This page contains affiliate links.'}
        >
          <span className="text-amber-400">🏷️</span>
          <span>Contains Affiliate Links</span>
        </div>
      )}
      {!profile?.designSettings?.hideFooter && (
        <p style={{ color: themeStyles.mutedColor }} className="text-[11px] font-mono tracking-wider uppercase font-bold">
          Powered by TreeInBio
        </p>
      )}
    </div>
  );

  /* ========================================================
     RESPONSIVE CONTAINER WRAPPERS (Mobile, Tablet, Laptop, Full)
     ======================================================== */


  return (
    <div 
      className={`min-h-screen w-full flex flex-col items-center justify-start profile-typography relative`}
      style={{ ...getWallpaperStyle(), ...pageFontStyle, color: themeStyles.bioColor }}
    >
      {/* Background Video if configured */}
      {profile?.designSettings?.wallpaper?.type === 'video' && profile.designSettings.wallpaper.videoUrl && (
        <video
          src={profile.designSettings.wallpaper.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
        />
      )}
      {/* 1-Click Ad Tracking Pixels (Meta, GA4, TikTok, Pinterest) */}
      <TrackingPixels trackingPixels={profile.trackingPixels} />

      {/* Live Activity Social Proof Ticker */}
      <SocialProofTicker 
        username={profile.username} 
        enabled={profile.socialProof?.enabled} 
        initialIntervalMs={profile.socialProof?.intervalMs} 
      />

      {/* Floating actions: back to the editor (Studio preview) and share */}
      {onBackToEditor && (
        <button
          type="button"
          onClick={onBackToEditor}
          className="fixed left-[16px] top-[16px] z-50 flex h-[36px] items-center gap-[6px] rounded-[50px] bg-black px-[14px] text-[12px] font-medium text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:bg-[#1A1A1A]"
        >
          <ArrowLeft className="h-[14px] w-[14px]" /> Back to editor
        </button>
      )}
      <button
        type="button"
        onClick={() => setShowQrModal(true)}
        aria-label="Share this page"
        title="Share"
        className="fixed right-[16px] top-[16px] z-50 flex h-[40px] w-[40px] items-center justify-center rounded-full border-[0.5px] border-white/60 bg-white/85 text-[#1A1A1A] shadow-[0_6px_20px_rgba(0,0,0,0.15)] backdrop-blur-md transition-transform hover:scale-105"
      >
        <QrCode className="h-[18px] w-[18px]" />
      </button>

      {/* Main Bio Container: Adapts Dynamically to Active Device Mode & Zoom Scale */}
      <main className="w-full flex-1 flex flex-col items-center justify-start overflow-x-auto pt-6 pb-24 sm:pt-8 sm:pb-24 px-2 sm:px-4">
        {/* Profile Access Gate Check (Passcode or 18+ Sensitive Shield) */}
        {!onBackToEditor && profile.accessGate?.enabled && profile.accessGate?.type !== 'none' && !isGateUnlocked ? (
          <div className="w-full max-w-md mx-auto my-auto">
            <AccessGateScreen 
              accessGate={profile.accessGate} 
              profileTitle={profile.name || profile.title || profile.username}
              onUnlock={(nextProfile) => {
                if (nextProfile) setUnlockedProfile(nextProfile);
                setIsGateUnlocked(true);
              }}
              username={profile.username}
            />
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-start"
            style={{
              width: deviceMode === 'mobile' ? '410px' : deviceMode === 'tablet' ? '768px' : '1024px',
              maxWidth: '100%',
            }}
          >
            {/* A. MOBILE VIEW (Centered phone bio stream matching Studio preview) */}
            {deviceMode === 'mobile' && (
              <div className="w-full max-w-[420px] mx-auto transition-all duration-300">
                <div className="relative w-full flex flex-col gap-3.5 pb-8" style={{ containerType: 'inline-size' }}>
                  {/* Floating Stickers Overlay for CONTENT section */}
                  <StickerBlockLayer>{(rects) => renderStickersSection('mobile', 'CONTENT', rects)}</StickerBlockLayer>
                  {renderProfileHeader({ isSplit: false })}
                  {renderLeadCapture()}
                  {renderScheduleMeeting()}
                  {renderHeroVideo()}
          
                  {profile.shop?.published && (
                    <div className="flex items-center justify-center gap-1 p-1 bg-surface-2/90 backdrop-blur-md rounded-2xl border border-line w-full max-w-[240px] mx-auto shadow-xs mb-1">
                      <button
                        type="button"
                        onClick={() => setActiveBioTab('links')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                          activeBioTab === 'links'
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-ink-500 hover:text-ink-700'
                        }`}
                      >
                        Links
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveBioTab('shop')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          activeBioTab === 'shop'
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-ink-500 hover:text-ink-700'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Shop</span>
                      </button>
                    </div>
                  )}
                  {activeBioTab === 'shop' ? renderShopGrid() : renderLinksSection()}

                  {(profile.widgets?.hasTipJar || profile.widgets?.hasNewsletter) && (
                    <div className="space-y-3 w-full">
                      {renderTipJar()}
                      {renderNewsletter()}
                    </div>
                  )}
                  {renderFooter()}
                </div>
              </div>
            )}

            {/* B. TABLET VIEW (768px iPad layout) */}
            {deviceMode === 'tablet' && (
              <div className="w-full max-w-[580px] mx-auto transition-all duration-300">
                <div className="relative w-full flex flex-col gap-3.5 pb-8" style={{ containerType: 'inline-size' }}>
                  {/* Floating Stickers Overlay for CONTENT section */}
                  <StickerBlockLayer>{(rects) => renderStickersSection('tablet', 'CONTENT', rects)}</StickerBlockLayer>
                  {renderProfileHeader({ isSplit: false })}
                  {renderLeadCapture()}
                  {renderScheduleMeeting()}
                  {renderHeroVideo()}
                  {profile.shop?.published && (
                    <div className="flex items-center justify-center gap-1 p-1 bg-surface-2/90 backdrop-blur-md rounded-2xl border border-line w-full max-w-[240px] mx-auto shadow-xs mb-1">
                      <button
                        type="button"
                        onClick={() => setActiveBioTab('links')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                          activeBioTab === 'links'
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-ink-500 hover:text-ink-700'
                        }`}
                      >
                        Links
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveBioTab('shop')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          activeBioTab === 'shop'
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-ink-500 hover:text-ink-700'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Shop</span>
                      </button>
                    </div>
                  )}
                  {activeBioTab === 'shop' ? renderShopGrid() : renderLinksSection()}
                  {(profile.widgets?.hasTipJar || profile.widgets?.hasNewsletter) && (
                    <div className={`w-full ${
                      profile.widgets?.hasTipJar && profile.widgets?.hasNewsletter 
                        ? 'grid grid-cols-2 gap-4' 
                        : 'space-y-3'
                    }`}>
                      {renderTipJar()}
                      {renderNewsletter()}
                    </div>
                  )}
                  {renderFooter()}
                </div>
              </div>
            )}

            {/* C. LAPTOP VIEW (1024px MacBook Desktop Layout) */}
            {deviceMode === 'laptop' && (
                <div className="w-full transition-all duration-300 relative" style={{ containerType: 'inline-size' }}>
                {/* Floating Stickers Overlay for CONTENT section */}
                <StickerBlockLayer>{(rects) => renderStickersSection('laptop', 'CONTENT', rects)}</StickerBlockLayer>

                {desktopLayout === 'split' ? (
                  /* 2-Column Split Bento Layout: Creator Profile on Left, Actions & Links on Right */
                  <div className="grid grid-cols-12 gap-6 items-start w-full">
                    {/* Left Column (Sticky Creator Identity & Tip Jar) */}
                    <div className="col-span-5 space-y-4 w-full">
                      {renderProfileHeader({ isSplit: true })}
                      {renderTipJar()}
                    </div>

                    {/* Right Column (Action Feed, Meetings, Videos, Bento Links) */}
                    <div className="col-span-7 space-y-4 w-full">
                      <div style={themeStyles.cardStyle} className="p-6 sm:p-7 border space-y-4 w-full">
                        {renderLeadCapture()}
                        {renderScheduleMeeting()}
                        {renderHeroVideo()}
                        {profile.shop?.published && (
                          <div className="flex items-center justify-center gap-1 p-1 bg-surface-2/90 backdrop-blur-md rounded-2xl border border-line w-full max-w-[240px] mx-auto shadow-xs mb-1">
                            <button
                              type="button"
                              onClick={() => setActiveBioTab('links')}
                              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                activeBioTab === 'links'
                                  ? 'bg-brand-500 text-white shadow-xs'
                                  : 'text-ink-500 hover:text-ink-700'
                              }`}
                            >
                              Links
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveBioTab('shop')}
                              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                activeBioTab === 'shop'
                                  ? 'bg-brand-500 text-white shadow-xs'
                                  : 'text-ink-500 hover:text-ink-700'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Shop</span>
                            </button>
                          </div>
                        )}
                        {activeBioTab === 'shop' ? renderShopGrid() : renderLinksSection()}
                        {renderNewsletter()}
                        {renderFooter()}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Focused Centered Stream Layout: Clean Bio Stream Matching Preview */
                  <div className="w-full max-w-[580px] mx-auto transition-all duration-300">
                    <div className="relative w-full flex flex-col gap-3.5 pb-8" style={{ containerType: 'inline-size' }}>
                      {renderProfileHeader({ isSplit: false })}
                      {renderLeadCapture()}
                      {renderScheduleMeeting()}
                      {renderHeroVideo()}
                      {profile.shop?.published && (
                        <div className="flex items-center justify-center gap-1 p-1 bg-surface-2/90 backdrop-blur-md rounded-2xl border border-line w-full max-w-[240px] mx-auto shadow-xs mb-1">
                          <button
                            type="button"
                            onClick={() => setActiveBioTab('links')}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                              activeBioTab === 'links'
                                ? 'bg-brand-500 text-white shadow-xs'
                                : 'text-ink-500 hover:text-ink-700'
                            }`}
                          >
                            Links
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveBioTab('shop')}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              activeBioTab === 'shop'
                                ? 'bg-brand-500 text-white shadow-xs'
                                : 'text-ink-500 hover:text-ink-700'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Shop</span>
                          </button>
                        </div>
                      )}
                      {activeBioTab === 'shop' ? renderShopGrid() : renderLinksSection()}
                      {(profile.widgets?.hasTipJar || profile.widgets?.hasNewsletter) && (
                        <div className="space-y-3 w-full">
                          {renderTipJar()}
                          {renderNewsletter()}
                        </div>
                      )}
                      {renderFooter()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Lead / Contact CTA Button */}
      {profile.leadCapture?.enabled !== false && profile.leadCapture?.triggerMode !== 'auto' && (
        <button
          id="floating-lead-trigger-btn"
          onClick={() => setShowLeadModal(true)}
          style={floatingCtaStyle}
          // Icon-only on phones so it does not cover the cards while scrolling.
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 h-[46px] w-[46px] sm:h-auto sm:w-auto justify-center sm:px-4 sm:py-2.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-md"
          title={profile.leadCapture?.buttonText || "Exchange Contact"}
          aria-label={profile.leadCapture?.buttonText || "Exchange Contact"}
        >
          <PhoneCall className="w-4 h-4" />
          <span className="hidden sm:inline">{profile.leadCapture?.buttonText || "Connect"}</span>
        </button>
      )}

      {/* Modals */}
      {showTipModal && (
        <TipModal profile={profile} onClose={() => setShowTipModal(false)} />
      )}

      {showQrModal && (
        <QRCodeModal profile={profile} onClose={() => setShowQrModal(false)} />
      )}

      {showLeadModal && (
        <LeadCaptureModal
          profile={profile}
          onClose={() => setShowLeadModal(false)}
        />
      )}

      {showScheduleModal && (
        <ScheduleMeetingModal
          profile={profile}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* Gated Lead Magnet Lock-to-Unlock Modal */}
      {activeLeadMagnetLink && (
        <LeadMagnetGateModal
          isOpen={Boolean(activeLeadMagnetLink)}
          onClose={() => setActiveLeadMagnetLink(null)}
          link={activeLeadMagnetLink}
          creatorUsername={profile.username}
          onUnlocked={(linkId) => {
            if (onIncrementClick) onIncrementClick(linkId);
          }}
        />
      )}
    </div>
  );
}
