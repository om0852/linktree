'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import AtelierSidebar from '../components/Atelier/AtelierSidebar';
import AtelierHeader from '../components/Atelier/AtelierHeader';
import LeadCaptureModal from '../components/Modals/LeadCaptureModal';
import ScheduleMeetingModal from '../components/Modals/ScheduleMeetingModal';
import TipModal from '../components/Modals/TipModal';
import AIOptimizerModal from '../components/Modals/AIOptimizerModal';
import CustomDomainModal from '../components/Modals/CustomDomainModal';
import QRCodeModal from '../components/Modals/QRCodeModal';
import ExportImportModal from '../components/Modals/ExportImportModal';
import AuthModal from '../components/Auth/AuthModal';
import LinkMarketplaceModal from '../components/Modals/LinkMarketplaceModal';
import ThumbnailPopover from '../components/Modals/ThumbnailPopover';
import TitleFontModal from '../components/Modals/TitleFontModal';
import AddProductModal from '../components/Modals/AddProductModal';
import UnsavedChangesBar from '../components/Common/UnsavedChangesBar';
import PhoneMockup from '../components/Preview/PhoneMockup';
import { getReadableThemeColors } from '@/lib/theme-contrast';
import { 
  DEFAULT_EMPTY_PROFILE, 
  THEME_PRESETS, 
  AVATAR_SHAPES,
  CURATED_THEMES,
  STICKER_PACKS,
  GOOGLE_FONTS_LIST,
  getTitleFontName,
  getStickerDeviceProps
} from '../constants/app';
import { calculateCTRScore, PERSONA_RECOMMENDATIONS, PERSONA_TAGLINES } from '../utils/aiScoring';
import { 
  Button, 
  Input, 
  Label, 
  Badge, 
  TabButton, 
  IconButton, 
  Select,
  Switch,
  Card, 
  CardHeader, 
  CardTitle 
} from '../components/ui';
import { 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  ChevronDown,
  GripVertical,
  BarChart3,
  Smartphone,
  Tablet,
  Monitor,
  Share2,
  Calendar,
  Contact,
  Coffee,
  Heart,
  Sliders,
  QrCode,
  Download,
  Upload,
  Globe,
  Loader2,
  Zap,
  Lock,
  Clock,
  Video,
  Music,
  Radio,
  TrendingUp,
  Tag,
  X,
  Folder,
  LayoutGrid,
  List,
  ChevronRight,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Dices,
  Layers,
  Store,
  Compass,
  ImagePlus,
  MoreVertical,
  ShoppingBag,
  Eye,
  EyeOff,
  Palette,
  Type,
  Image as ImageIcon,
  ChevronLeft,
  Paintbrush,
  Smile
} from 'lucide-react';
import PaletteSuggester from '../components/Builder/PaletteSuggester';
import { detectEmbed } from '../utils/embedDetector';

const ICON_LIST = [
  { id: 'movie', label: 'Movie', symbol: 'movie' },
  { id: 'star', label: 'Star / Film', symbol: 'star' },
  { id: 'business_center', label: 'Agency', symbol: 'business_center' },
  { id: 'podcasts', label: 'Podcast', symbol: 'podcasts' },
  { id: 'celebration', label: 'Tip / Confetti', symbol: 'celebration' },
  { id: 'music_note', label: 'Music', symbol: 'music_note' },
  { id: 'shopping_bag', label: 'Shop', symbol: 'shopping_bag' },
  { id: 'mail', label: 'Mail', symbol: 'mail' },
  { id: 'link', label: 'Link', symbol: 'link' },
];

export default function AtelierStudioPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [activeTab, setActiveTab] = useState('links'); // 'links', 'style', 'widgets'
  const [deviceMode, setDeviceMode] = useState('mobile'); // 'mobile', 'tablet', 'desktop'
  const [rankerDismissed, setRankerDismissed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [copiedBioUrl, setCopiedBioUrl] = useState(false);

  // Modals state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showAIOptimizer, setShowAIOptimizer] = useState(false);
  const [showCustomDomain, setShowCustomDomain] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [activeThumbnailLink, setActiveThumbnailLink] = useState(null);
  const [showTitleFontModal, setShowTitleFontModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [activeLinkMenuId, setActiveLinkMenuId] = useState(null);

  // Content Sub-tabs: Links | Shop
  const [contentSubTab, setContentSubTab] = useState('links'); // 'links' | 'shop'
  const [isShopTransitioning, setIsShopTransitioning] = useState(false);

  // Design Tab Drill-Down Navigation Engine: 'root' | 'theme' | 'wallpaper' | 'buttons' | 'text' | 'colors' | 'stickers' | 'footer'
  const [designSubMenu, setDesignSubMenu] = useState('root');

  // Phase 1: Inline Title Editing & Link Archive state
  const [linkFilterTab, setLinkFilterTab] = useState('active'); // 'active' | 'archived'
  const [inlineEditingLinkId, setInlineEditingLinkId] = useState(null);
  const [inlineTitleDraft, setInlineTitleDraft] = useState('');

  // Phase 2: Unsaved changes bar & Undo/Redo history stack
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRedoingRef = useRef(false);

  // Link addition & editing state
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [openLinkAccordion, setOpenLinkAccordion] = useState(null); // 'magnet' | 'embed' | 'schedule' | null
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    badge: '',
    icon: 'link',
    size: 'large',
    subtitle: '',
    leadMagnet: {
      enabled: false,
      assetUrl: '',
      assetType: 'pdf',
      previewText: 'Free Download',
      requireEmail: true,
      requireWhatsApp: false,
      marketingPlatform: 'none',
      marketingListId: '',
    },
    embed: {
      enabled: false,
      platform: 'none',
      embedId: '',
    },
    schedule: {
      enabled: false,
      startsAt: '',
      expiresAt: '',
    },
    geoTargeting: {
      enabled: false,
      mode: 'include',
      countries: [],
    },
    collectionId: '',
  });

  // Collection addition & modal state
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    title: '',
    viewMode: 'list', // 'list' | 'grid' | 'carousel'
  });

  // MongoDB persistence states
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initialize session & profile on mount
  useEffect(() => {
    async function initSessionAndProfile() {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          setAuthUser(authData.user);
          if (authData.profile) {
            setCurrentProfile(authData.profile);
            setSavedSnapshot(JSON.stringify(authData.profile));
            setHistory([authData.profile]);
            setHistoryIndex(0);
            return;
          }
        }

        const profileRes = await fetch('/api/profile');
        const profileData = await profileRes.json();
        if (profileData.success && profileData.profile) {
          setCurrentProfile(profileData.profile);
          setSavedSnapshot(JSON.stringify(profileData.profile));
          setHistory([profileData.profile]);
          setHistoryIndex(0);
        } else {
          setSavedSnapshot(JSON.stringify(DEFAULT_EMPTY_PROFILE));
          setHistory([DEFAULT_EMPTY_PROFILE]);
          setHistoryIndex(0);
        }
      } catch (err) {
        console.error('Failed to initialize session and profile:', err);
      }
    }
    initSessionAndProfile();
  }, []);

  // Close 3-dot context menu when clicking outside
  useEffect(() => {
    if (!activeLinkMenuId) return;
    const handleClickOutside = () => setActiveLinkMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeLinkMenuId]);

  // IsDirty calculation comparing against last saved snapshot
  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(currentProfile) !== savedSnapshot;
  }, [currentProfile, savedSnapshot]);

  // Keep Undo/Redo history stack in sync with edits
  useEffect(() => {
    if (!currentProfile) return;
    if (isUndoingRedoingRef.current) {
      isUndoingRedoingRef.current = false;
      return;
    }
    if (history.length === 0) {
      setHistory([currentProfile]);
      setHistoryIndex(0);
      return;
    }
    const currentStr = JSON.stringify(currentProfile);
    const headStr = JSON.stringify(history[historyIndex]);
    if (currentStr !== headStr) {
      const timer = setTimeout(() => {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIndex + 1);
          return [...sliced, currentProfile];
        });
        setHistoryIndex((prev) => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentProfile, historyIndex]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      isUndoingRedoingRef.current = true;
      setHistoryIndex(targetIdx);
      setCurrentProfile(history[targetIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      isUndoingRedoingRef.current = true;
      setHistoryIndex(targetIdx);
      setCurrentProfile(history[targetIdx]);
    }
  };

  const handleDiscardChanges = () => {
    if (savedSnapshot) {
      try {
        const parsed = JSON.parse(savedSnapshot);
        isUndoingRedoingRef.current = true;
        setCurrentProfile(parsed);
        setHistory([parsed]);
        setHistoryIndex(0);
        setToastMessage({
          type: 'info',
          text: 'All unsaved changes were discarded.',
        });
        setTimeout(() => setToastMessage(null), 3000);
      } catch (e) {
        console.error('Discard error:', e);
      }
    }
  };

  // Browser navigation exit guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to exit?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // CTR calculations
  const ctrData = useMemo(() => {
    return calculateCTRScore(currentProfile);
  }, [currentProfile]);

  // Save profile to TreeInBio Cloud
  const handleSaveProfile = async () => {
    if (!authUser) {
      setToastMessage({
        type: 'info',
        text: 'Please sign in or create an account to publish your bio to MongoDB.',
      });
      setAuthModalMode('login');
      setShowAuthModal(true);
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProfile),
      });
      const data = await res.json();

      if (data.success) {
        setIsSaved(true);
        if (data.profile) {
          setCurrentProfile(data.profile);
          setSavedSnapshot(JSON.stringify(data.profile));
        } else {
          setSavedSnapshot(JSON.stringify(currentProfile));
        }
        setToastMessage({
          type: 'success',
          text: `Published successfully! Changes are live at /${data.profile?.username || currentProfile.username}`,
          url: `/${data.profile?.username || currentProfile.username}`,
        });
        setTimeout(() => setIsSaved(false), 3000);
        setTimeout(() => setToastMessage(null), 6000);
      } else {
        setToastMessage({
          type: 'error',
          text: data.error || 'Failed to save profile. Please check required fields.',
        });
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setToastMessage({
        type: 'error',
        text: 'Network error connecting to server while saving profile.',
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Phase 1: Marketplace Add Link handler
  const handleMarketplaceAddLink = (itemOrParams) => {
    setShowMarketplace(false);
    setActiveTab('links');

    if (!itemOrParams) return;

    const item = itemOrParams;
    const itemId = item.id || '';
    const itemType = item.type || item.defaultData?.type || '';

    // 1. Standard Link: open clean Add Link form
    if (itemId === 'link') {
      setIsAddingLink(true);
      setEditingLinkId(null);
      setLinkForm({
        title: '',
        url: '',
        badge: '',
        icon: 'link',
        size: 'large',
        subtitle: '',
        collectionId: '',
      });
      setToastMessage({ type: 'success', text: 'Enter your link details below!' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 2. Collection Folder
    if (item.isCollection || itemId === 'collection' || itemType === 'collection') {
      setIsAddingCollection(true);
      setEditingCollectionId(null);
      setCollectionForm({
        title: item.defaultData?.title || (item.title !== 'Collection (Folder)' ? item.title : '') || '',
        viewMode: 'list',
      });
      setToastMessage({ type: 'success', text: 'Create your new collection folder!' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 3. Product / Commerce
    if (itemId === 'product' || itemId === 'amaze' || itemType === 'product') {
      setShowAddProductModal(true);
      return;
    }

    // 4. Contact / Lead Exchange
    if (itemId === 'lead_exchange' || itemId === 'contact_form' || itemType === 'lead-capture') {
      setCurrentProfile(prev => ({
        ...prev,
        leadCapture: {
          ...(prev.leadCapture || {}),
          enabled: true,
          title: item.defaultData?.title || item.title || "Let's Connect",
          subtitle: item.subtitle || "Drop your contact info to get in touch directly",
          buttonText: "Exchange Contact",
        }
      }));
      setShowLeadModal(true);
      setToastMessage({ type: 'success', text: 'Lead Capture & Contact Form enabled on your bio!' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 5. Calendar / 1:1 Consultation
    if (itemId === 'calendar_booking' || itemId === 'coaching' || itemType === 'schedule') {
      setCurrentProfile(prev => ({
        ...prev,
        scheduleMeeting: {
          ...(prev.scheduleMeeting || {}),
          enabled: true,
          title: item.defaultData?.title || item.title || 'Book 1:1 Consultation',
        }
      }));
      setShowMeetingModal(true);
      setToastMessage({ type: 'success', text: 'Configuring 1:1 Calendar Bookings!' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 6. Newsletter Subscription
    if (itemId === 'newsletter_signup' || itemId === 'newsletter') {
      setCurrentProfile(prev => ({
        ...prev,
        widgets: {
          ...(prev.widgets || {}),
          hasNewsletter: true,
          newsletterTitle: item.defaultData?.title || 'Subscribe to direct updates',
        }
      }));
      setToastMessage({ type: 'success', text: 'Newsletter widget enabled on your bio!' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 7. Tip Jar
    if (itemId === 'tip_jar' || itemType === 'tip') {
      setShowTipModal(true);
      return;
    }

    // 8. General Link, Embed, Social, or Lead Magnet Block
    const title = item.defaultData?.title || item.title || 'New Link';
    const url = item.defaultData?.url || item.url || 'https://';
    const badge = item.defaultData?.badge || item.badge || '';

    let iconKey = 'link';
    if (itemId === 'instagram' || itemId.includes('instagram')) iconKey = 'link';
    else if (itemId === 'youtube' || itemId.includes('youtube')) iconKey = 'movie';
    else if (itemId === 'spotify_track' || itemId === 'podcast') iconKey = 'music_note';
    else if (itemId === 'lead_magnet_pdf') iconKey = 'star';
    else if (itemId === 'text_header') iconKey = 'link';
    else if (typeof item.icon === 'string') iconKey = item.icon.toLowerCase();
    else if (item.defaultData?.icon) iconKey = item.defaultData.icon.toLowerCase();

    const newLink = {
      id: `link-${Date.now()}`,
      title: title.slice(0, 35),
      url: url,
      badge: badge,
      icon: iconKey,
      size: item.defaultData?.size || item.size || 'large',
      clicks: 0,
      disabled: false,
      isArchived: false,
      collectionId: item.collectionId || '',
      leadMagnet: item.defaultData?.leadMagnet || null,
      embed: item.defaultData?.embed || null,
    };

    setCurrentProfile(prev => ({
      ...prev,
      links: [newLink, ...(prev.links || [])]
    }));

    setToastMessage({
      type: 'success',
      text: `Added "${newLink.title}" to your bio links!`,
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Phase 1: Inline Title Editing handlers
  const handleStartInlineEdit = (link) => {
    setInlineEditingLinkId(link.id);
    setInlineTitleDraft(link.title || '');
  };

  const handleSaveInlineTitle = (linkId) => {
    const cleanTitle = inlineTitleDraft.trim();
    if (!cleanTitle) return;
    setCurrentProfile(prev => ({
      ...prev,
      links: (prev.links || []).map(l => l.id === linkId ? { ...l, title: cleanTitle.slice(0, 35) } : l)
    }));
    setInlineEditingLinkId(null);
    setInlineTitleDraft('');
  };

  const handleCancelInlineTitle = () => {
    setInlineEditingLinkId(null);
    setInlineTitleDraft('');
  };

  // Phase 1: Archive & Restore system handlers
  const handleArchiveLink = (linkId) => {
    setCurrentProfile(prev => ({
      ...prev,
      links: (prev.links || []).map(l => l.id === linkId ? { ...l, isArchived: true } : l)
    }));
    setToastMessage({
      type: 'info',
      text: 'Link archived. Historical click counts are safely preserved.',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRestoreLink = (linkId) => {
    setCurrentProfile(prev => ({
      ...prev,
      links: (prev.links || []).map(l => l.id === linkId ? { ...l, isArchived: false } : l)
    }));
    setToastMessage({
      type: 'success',
      text: 'Link restored to active profile!',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePermanentDeleteLink = (linkId) => {
    if (confirm('Permanently delete this archived link? This action cannot be undone.')) {
      setCurrentProfile(prev => ({
        ...prev,
        links: (prev.links || []).filter(l => l.id !== linkId)
      }));
      setToastMessage({
        type: 'info',
        text: 'Archived link permanently deleted.',
      });
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Phase 2: Theme Shuffle and Theme Preset handlers
  const handleThemeShuffle = () => {
    const otherPresets = THEME_PRESETS.filter(p => p.id !== currentProfile.theme);
    const picked = otherPresets[Math.floor(Math.random() * otherPresets.length)] || THEME_PRESETS[0];
    handleApplyThemePreset(picked);
    setToastMessage({
      type: 'success',
      text: `🎲 Theme Shuffled to "${picked.name}"!`,
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyThemePreset = (preset) => {
    const isGradient = preset.bg?.includes('gradient');
    const wallpaperVal = preset.bg?.startsWith('bg-[#') 
      ? preset.bg.slice(4, -1) 
      : (preset.bg?.startsWith('bg-') ? preset.bg : '#FFFEFA');
    const wallpaper = {
      type: isGradient ? 'gradient' : 'fill',
      value: isGradient ? '' : wallpaperVal,
      gradient: isGradient ? preset.bg.replace(/^bg-/, '') : '',
    };
    const readableColors = getReadableThemeColors(preset, wallpaper);

    setCurrentProfile(prev => ({
      ...prev,
      theme: preset.id,
      buttonShape: preset.buttonShape || prev.buttonShape || 'rounded',
      font: preset.font || prev.font || 'Plus Jakarta Sans',
      headerLayout: preset.headerLayout || prev.headerLayout || 'classic',
      avatarShape: preset.avatarShape || prev.avatarShape || 'circle',
      designSettings: {
        ...(prev.designSettings || {}),
        wallpaper,
        buttonColor: preset.primary || '#52796F',
        buttonTextColor: '#FFFFFF',
        buttonStyle: preset.cardBg?.includes('/10') || preset.cardBg?.includes('/20') || preset.id === 'dark-glass' 
          ? 'glass' 
          : (prev.designSettings?.buttonStyle || 'solid'),
        buttonRoundness: prev.designSettings?.buttonRoundness || 'rounded',
        customColors: {
          ...(prev.designSettings?.customColors || {}),
          title: readableColors.title,
          pageText: readableColors.body,
        },
      },
    }));
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      setCurrentProfile(DEFAULT_EMPTY_PROFILE);
      setToastMessage({
        type: 'success',
        text: 'You have been signed out.',
      });
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 1-Click Layout & Theme Optimization
  const handleAutoOptimize = () => {
    const recs = PERSONA_RECOMMENDATIONS[currentProfile.niche] || PERSONA_RECOMMENDATIONS.influencer;
    
    setCurrentProfile((prev) => {
      const optimizedLinks = (prev.links || []).map((link, idx) => {
        if (!link.badge) {
          const badge = recs.key_badges[idx % recs.key_badges.length];
          return { ...link, badge, size: idx === 0 ? 'large' : link.size };
        }
        return link;
      });

      return {
        ...prev,
        theme: 'atelier',
        layout: recs.recommended_layout || 'bento',
        links: optimizedLinks,
        widgets: {
          ...prev.widgets,
          hasNewsletter: true,
          hasTipJar: true,
          mediaKitStats: prev.widgets?.mediaKitStats || {
            followers: '0',
            engagement: '0%',
            monthlyViews: '0',
          },
        },
      };
    });

    setToastMessage({
      type: 'success',
      text: 'Bio Optimization Applied: Theme and layout updated!',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Copy Bio URL
  const handleCopyBioUrl = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/${currentProfile.username}` : `treeinbio.me/${currentProfile.username}`;
    navigator.clipboard.writeText(url);
    setCopiedBioUrl(true);
    setTimeout(() => setCopiedBioUrl(false), 2500);
  };

  // Link Toggle Enabled
  const handleToggleLink = (linkId) => {
    setCurrentProfile((prev) => ({
      ...prev,
      links: (prev.links || []).map((l) =>
        l.id === linkId ? { ...l, disabled: !l.disabled } : l
      ),
    }));
  };

  // Delete Link
  const handleDeleteLink = (linkId) => {
    setCurrentProfile((prev) => ({
      ...prev,
      links: (prev.links || []).filter((l) => l.id !== linkId),
    }));
  };

  // Move Link Up/Down
  const handleMoveLink = (index, direction) => {
    const links = [...(currentProfile.links || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const [moved] = links.splice(index, 1);
    links.splice(targetIdx, 0, moved);
    setCurrentProfile((prev) => ({ ...prev, links }));
  };

  // Add / Save Link Form
  const handleSaveLinkForm = (e) => {
    e.preventDefault();
    if (!linkForm.title.trim()) return;

    if (editingLinkId) {
      setCurrentProfile((prev) => ({
        ...prev,
        links: (prev.links || []).map((l) =>
          l.id === editingLinkId ? { ...l, ...linkForm } : l
        ),
      }));
      setEditingLinkId(null);
    } else {
      const newLinkObj = {
        id: `link_${Date.now()}`,
        ...linkForm,
        url: linkForm.url || '#',
        clicks: 0,
        disabled: false,
      };
      setCurrentProfile((prev) => ({
        ...prev,
        links: [newLinkObj, ...(prev.links || [])],
      }));
      setIsAddingLink(false);
    }

    setOpenLinkAccordion(null);
    setLinkForm({
      title: '',
      url: '',
      badge: '',
      icon: 'link',
      size: 'large',
      subtitle: '',
      leadMagnet: {
        enabled: false,
        assetUrl: '',
        assetType: 'pdf',
        previewText: 'Free Download',
        requireEmail: true,
        requireWhatsApp: false,
        marketingPlatform: 'none',
        marketingListId: '',
      },
      embed: {
        enabled: false,
        platform: 'none',
        embedId: '',
      },
      schedule: {
        enabled: false,
        startsAt: '',
        expiresAt: '',
      },
      geoTargeting: {
        enabled: false,
        mode: 'include',
        countries: [],
      },
      collectionId: '',
    });
  };

  // Start Editing Link
  const handleStartEditLink = (link) => {
    setEditingLinkId(link.id);
    setIsAddingLink(false);
    setOpenLinkAccordion(
      link.geoTargeting?.enabled ? 'geo' : link.leadMagnet?.enabled ? 'magnet' : link.embed?.enabled ? 'embed' : link.schedule?.enabled ? 'schedule' : null
    );
    setLinkForm({
      title: link.title || '',
      url: link.url || '',
      badge: link.badge || '',
      icon: link.icon || 'link',
      size: link.size || 'large',
      subtitle: link.subtitle || '',
      leadMagnet: link.leadMagnet || {
        enabled: false,
        assetUrl: '',
        assetType: 'pdf',
        previewText: 'Free Download',
        requireEmail: true,
        requireWhatsApp: false,
        marketingPlatform: 'none',
        marketingListId: '',
      },
      embed: link.embed || {
        enabled: false,
        platform: 'none',
        embedId: '',
      },
      schedule: link.schedule || {
        enabled: false,
        startsAt: '',
        expiresAt: '',
      },
      geoTargeting: link.geoTargeting || {
        enabled: false,
        mode: 'include',
        countries: [],
      },
      collectionId: link.collectionId || '',
    });
  };

  // Collection CRUD Handlers
  const handleSaveCollection = (e) => {
    e.preventDefault();
    if (!collectionForm.title.trim()) return;

    if (editingCollectionId) {
      setCurrentProfile((prev) => ({
        ...prev,
        collections: (prev.collections || []).map((c) =>
          c.id === editingCollectionId
            ? { ...c, title: collectionForm.title.trim(), viewMode: collectionForm.viewMode, type: collectionForm.type || c.type || 'custom' }
            : c
        ),
      }));
      setEditingCollectionId(null);
    } else {
      const newCollection = {
        id: `col_${Date.now()}`,
        title: collectionForm.title.trim(),
        viewMode: collectionForm.viewMode || 'list',
        type: collectionForm.type || 'custom',
        active: true,
      };
      setCurrentProfile((prev) => ({
        ...prev,
        collections: [...(prev.collections || []), newCollection],
      }));
      setIsAddingCollection(false);
    }

    setCollectionForm({ title: '', viewMode: 'list', type: 'custom' });
  };

  const handleDeleteCollection = (collectionId) => {
    setCurrentProfile((prev) => ({
      ...prev,
      collections: (prev.collections || []).filter((c) => c.id !== collectionId),
      // Unlink links in this deleted collection
      links: (prev.links || []).map((l) =>
        l.collectionId === collectionId ? { ...l, collectionId: '' } : l
      ),
    }));
  };

  const handleUpdateCollectionViewMode = (collectionId, viewMode) => {
    setCurrentProfile((prev) => ({
      ...prev,
      collections: (prev.collections || []).map((c) =>
        c.id === collectionId ? { ...c, viewMode } : c
      ),
    }));
  };

  const handleAssignLinkToCollection = (linkId, collectionId) => {
    setCurrentProfile((prev) => ({
      ...prev,
      links: (prev.links || []).map((l) =>
        l.id === linkId ? { ...l, collectionId } : l
      ),
    }));
  };

  // Handle Thumbnail Update from ThumbnailPopover
  const handleUpdateThumbnail = (linkId, { thumbnail, thumbnailType, thumbnailIcon }) => {
    setCurrentProfile((prev) => ({
      ...prev,
      links: (prev.links || []).map((l) =>
        l.id === linkId
          ? {
              ...l,
              thumbnail,
              thumbnailType,
              thumbnailIcon,
            }
          : l
      ),
    }));
  };

  // Handle Switch to Shop / Links sub-tab with skeleton animation
  const handleContentSubTabSwitch = (tab) => {
    if (tab === contentSubTab) return;
    if (tab === 'shop') {
      setIsShopTransitioning(true);
      setContentSubTab('shop');
      setTimeout(() => setIsShopTransitioning(false), 350);
    } else {
      setContentSubTab('links');
    }
  };

  // Add Product to Shop
  const handleAddProduct = (newProduct) => {
    setCurrentProfile((prev) => {
      const currentShop = prev.shop || { enabled: true, published: false, collections: [], products: [] };
      return {
        ...prev,
        shop: {
          ...currentShop,
          enabled: true,
          products: [newProduct, ...(currentShop.products || [])],
        },
      };
    });
    setToastMessage({
      type: 'success',
      text: `Added "${newProduct.title}" to your Shop!`,
    });
  };

  // Delete Product from Shop
  const handleDeleteProduct = (productId) => {
    setCurrentProfile((prev) => {
      const currentShop = prev.shop || {};
      return {
        ...prev,
        shop: {
          ...currentShop,
          products: (currentShop.products || []).filter((p) => p.id !== productId),
        },
      };
    });
  };

  // Toggle Publish Shop Banner
  const handleTogglePublishShop = () => {
    setCurrentProfile((prev) => {
      const currentShop = prev.shop || { enabled: true, published: false, collections: [], products: [] };
      const nextPublished = !currentShop.published;
      return {
        ...prev,
        shop: {
          ...currentShop,
          enabled: true,
          published: nextPublished,
        },
      };
    });
  };

  // Toggle or Update Alternative Title Font
  const handleSelectAlternativeTitleFont = (fontName) => {
    setCurrentProfile((prev) => {
      const isObj = typeof prev.alternativeTitleFont === 'object' && prev.alternativeTitleFont !== null;
      return {
        ...prev,
        alternativeTitleFont: isObj
          ? { enabled: Boolean(fontName), font: fontName || 'DM Sans' }
          : (fontName || ''),
      };
    });
  };

  // Handle Mockup Click
  const handleMockupLinkClick = (linkOrId) => {
    const linkId = typeof linkOrId === 'object' && linkOrId !== null ? linkOrId.id : linkOrId;
    const targetLink = (currentProfile.links || []).find((l) => l.id === linkId) || (typeof linkOrId === 'object' ? linkOrId : null);
    if (targetLink?.url && targetLink.url !== '#') {
      window.open(targetLink.url, '_blank', 'noopener,noreferrer');
    }
    // Increment clicks
    if (linkId) {
      setCurrentProfile((prev) => ({
        ...prev,
        links: (prev.links || []).map((l) =>
          l.id === linkId ? { ...l, clicks: (l.clicks || 0) + 1 } : l
        ),
      }));
    }
  };

  const activeLinks = (currentProfile.links || []).filter((l) => !l.disabled);

  return (
    <div className="bg-[#FFFEFA] text-[#28352F] antialiased selection:bg-[#CAD8CE] selection:text-[#28352F] min-h-screen">
      {/* High-Visibility Modern Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full animate-fadeIn shadow-2xl transition-all">
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm font-medium ${
            toastMessage.type === 'success'
              ? 'bg-[#28352F] border-[#52796F] text-[#FFFEFA]'
              : toastMessage.type === 'info'
              ? 'bg-[#28352F] border-[#CAD8CE] text-white'
              : 'bg-rose-950 border-rose-500 text-rose-100'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'info' ? (
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="leading-snug">{toastMessage.text}</p>
              {toastMessage.url && (
                <a
                  href={toastMessage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline mt-1.5 font-mono text-xs"
                >
                  <span>Open Live Bio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-white p-1 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Atelier Left Navigation Sidebar */}
      <AtelierSidebar
        mobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenConfig={() => setShowAIOptimizer(true)}
      />

      {/* Main Content Workspace Container */}
      <div className="lg:pl-64 min-h-screen bg-[#FFFEFA] flex flex-col">
        {/* TreeInBio Top Header */}
        <AtelierHeader
          currentProfile={currentProfile}
          onSaveProfile={handleSaveProfile}
          isSaving={isSaving}
          isSaved={isSaved}
          authUser={authUser}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setShowAuthModal(true);
          }}
          onLogout={handleLogout}
          onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onProfileSwitched={(newProfile) => {
            if (newProfile) {
              setCurrentProfile(newProfile);
              setSavedSnapshot(JSON.stringify(newProfile));
              setHistory([newProfile]);
              setHistoryIndex(0);
              setInlineEditingLinkId(null);
              setEditingLinkId(null);
              setIsAddingLink(false);
              setEditingCollectionId(null);
              setIsAddingCollection(false);
              setActiveThumbnailLink(null);
              setActiveLinkMenuId(null);
              setToastMessage({
                type: 'success',
                text: `Switched workspace to @${newProfile.username}`,
              });
              setTimeout(() => setToastMessage(null), 3000);
            }
          }}
        />

        {/* Main Studio Viewport */}
        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-[1440px] mx-auto w-full flex flex-col gap-6">
          {/* Top Bio Optimization Insights Banner */}
          {!rankerDismissed && (
            <div className="bg-[#F5F3ED] border border-[#CAD8CE]/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-44 h-44 bg-[#CAD8CE]/30 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5 text-[#52796F]" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#52796F] uppercase tracking-wider font-mono">
                      Bio Optimization Insights
                    </span>
                    <Badge variant="mint" size="xs">
                      PERFORMANCE TIP
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-[#28352F] flex items-center gap-2 flex-wrap">
                    <span>Engagement Score:</span>
                    <span className="font-bold text-[#28352F] font-mono">{ctrData.score}%</span>
                    <span className="text-[#5C6B64] font-mono">→ 89.5% target</span>
                    <Badge variant="sage" size="xs">
                      +{Math.max(0, (89.5 - ctrData.score)).toFixed(1)}% Boost Opportunity
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRankerDismissed(true)}
                  className="font-mono text-xs"
                >
                  Dismiss
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Zap}
                  onClick={handleAutoOptimize}
                >
                  Optimize Layout &amp; Theme
                </Button>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-col gap-3 pb-1">
            {/* Row 1: Tab Switchers Segmented Group & URL Shortcut */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center p-1 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl gap-1 shadow-2xs self-start overflow-x-auto max-w-full">
                <TabButton
                  active={activeTab === 'links'}
                  icon={Share2}
                  onClick={() => setActiveTab('links')}
                >
                  Links &amp; Content
                </TabButton>

                <TabButton
                  active={activeTab === 'style'}
                  icon={Sliders}
                  onClick={() => setActiveTab('style')}
                >
                  Theme &amp; Appearance
                </TabButton>

                <TabButton
                  active={activeTab === 'widgets'}
                  icon={GripVertical}
                  onClick={() => setActiveTab('widgets')}
                >
                  Features &amp; Add-ons
                </TabButton>
              </div>

              {/* URL Shortcut Badge */}
              <div className="flex items-center gap-2 bg-[#F5F3ED] border border-[#CAD8CE] px-3.5 py-1.5 rounded-xl shadow-xs self-start sm:self-auto shrink-0 min-h-[38px]">
                <span className="font-mono text-xs text-[#5C6B64]">treeinbio.me/</span>
                <span className="font-mono text-xs sm:text-sm text-[#28352F] font-bold">
                  {currentProfile.username}
                </span>
                <IconButton
                  icon={copiedBioUrl ? Check : Copy}
                  size="sm"
                  onClick={handleCopyBioUrl}
                  title="Copy Bio URL"
                  className={copiedBioUrl ? 'text-emerald-600' : 'text-[#52796F]'}
                />
              </div>
            </div>

            {/* Row 2: Action Buttons for Links & Content (Never overflows screen) */}
            {activeTab === 'links' && (
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setShowMarketplace(true)}
                  className="bg-[#28352F] hover:bg-[#1C2723] text-white shadow-xs ring-1 ring-[#52796F]/30"
                >
                  Add to Bio
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => {
                    setActiveTab('links');
                    setIsAddingLink(true);
                    setEditingLinkId(null);
                    setLinkForm({
                      title: '',
                      url: '',
                      badge: '',
                      icon: 'link',
                      size: 'large',
                      subtitle: '',
                      collectionId: '',
                    });
                  }}
                >
                  Add Link
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Folder}
                  onClick={() => {
                    setActiveTab('links');
                    setIsAddingCollection(true);
                    setEditingCollectionId(null);
                    setCollectionForm({
                      title: '',
                      viewMode: 'list',
                    });
                  }}
                >
                  Add Collection
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={GripVertical}
                  onClick={() => {
                    setActiveTab('links');
                    setIsAddingLink(true);
                    setEditingLinkId(null);
                    setLinkForm({
                      title: 'Featured Bento Showcase',
                      url: 'https://',
                      badge: 'EXCLUSIVE',
                      icon: 'star',
                      size: 'large',
                      subtitle: 'Multi-column media showcase card',
                      collectionId: '',
                    });
                  }}
                >
                  Bento Card
                </Button>
              </div>
            )}
          </div>

          {/* 12-Column Responsive Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Architecture & Parameters */}
            <div className="xl:col-span-7 flex flex-col gap-6">
              {/* Tab 1: Links & Cards */}
              {activeTab === 'links' && (
                <>
                  {/* Inline Link Creator/Editor Form */}
                  {(isAddingLink || editingLinkId) && (
                    <form
                      onSubmit={handleSaveLinkForm}
                      className="bg-[#F5F3ED] border-2 border-[#52796F] rounded-xl p-4 sm:p-5 shadow-md flex flex-col gap-3.5 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#CAD8CE]">
                        <span className="font-sans font-bold text-sm text-[#28352F]">
                          {editingLinkId ? 'Edit Link' : 'Add New Link'}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setIsAddingLink(false);
                            setEditingLinkId(null);
                          }}
                          className="font-mono text-xs"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                        <div>
                          <Label htmlFor="link-form-title" required>Link Title</Label>
                          <Input
                            id="link-form-title"
                            type="text"
                            required
                            placeholder="e.g. My Latest Portfolio"
                            value={linkForm.title}
                            onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="link-form-url">Destination URL</Label>
                          <Input
                            id="link-form-url"
                            type="text"
                            placeholder="https://..."
                            value={linkForm.url}
                            onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                            className="font-mono"
                          />
                        </div>

                        <div>
                          <Label htmlFor="link-form-badge">Badge / Tag</Label>
                          <Input
                            id="link-form-badge"
                            type="text"
                            placeholder="e.g. Featured, New, Portfolio"
                            value={linkForm.badge}
                            onChange={(e) => setLinkForm({ ...linkForm, badge: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="link-form-subtitle">Subtitle / Note</Label>
                          <Input
                            id="link-form-subtitle"
                            type="text"
                            placeholder="e.g. Check out my work"
                            value={linkForm.subtitle}
                            onChange={(e) => setLinkForm({ ...linkForm, subtitle: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="link-form-media-type">Card / Carousel Media Format</Label>
                          <Select
                            id="link-form-media-type"
                            value={linkForm.mediaType || 'standard'}
                            onChange={(e) => setLinkForm({ ...linkForm, mediaType: e.target.value })}
                          >
                            <option value="standard">Standard Bio Card</option>
                            <option value="instagram">📸 Instagram Post / Reel</option>
                            <option value="youtube">▶️ YouTube Video / Playlist</option>
                            <option value="product">🛍️ Amaze Store Product</option>
                          </Select>
                        </div>

                        {linkForm.mediaType === 'product' && (
                          <div>
                            <Label htmlFor="link-form-price">Product Price (USD / Local)</Label>
                            <Input
                              id="link-form-price"
                              type="text"
                              placeholder="e.g. $29.99"
                              value={linkForm.price || ''}
                              onChange={(e) => setLinkForm({ ...linkForm, price: e.target.value })}
                              className="font-mono font-bold"
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="link-form-thumb">Media Thumbnail URL (Optional)</Label>
                          <Input
                            id="link-form-thumb"
                            type="text"
                            placeholder="https://... cover image or video thumb"
                            value={linkForm.thumbnail || ''}
                            onChange={(e) => setLinkForm({ ...linkForm, thumbnail: e.target.value })}
                            className="font-mono"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="link-form-collection">Assign to Collection (Folder)</Label>
                          <Select
                            id="link-form-collection"
                            value={linkForm.collectionId || ''}
                            onChange={(e) => setLinkForm({ ...linkForm, collectionId: e.target.value })}
                          >
                            <option value="">None (Top-Level Link)</option>
                            {(currentProfile.collections || []).map((col) => (
                              <option key={col.id} value={col.id}>
                                📁 {col.title} ({col.viewMode} view)
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      {/* Power Feature Collapsible Accordions (Anti-Bloat Progressive Disclosure) */}
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-[#CAD8CE]/70">
                        {/* 1. Lead Magnet Lock to Unlock Accordion */}
                        <div className="rounded-lg border border-[#CAD8CE] bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'magnet' ? null : 'magnet')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-xs text-[#28352F] hover:bg-[#F5F3ED] transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Lock size={13} className={linkForm.leadMagnet?.enabled ? 'text-amber-600' : 'text-[#5C6B64]'} />
                              <span>Lead Magnet &ldquo;Lock to Unlock&rdquo;</span>
                              {linkForm.leadMagnet?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                                  ACTIVE LOCK
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#5C6B64] font-mono">
                              {openLinkAccordion === 'magnet' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'magnet' && (
                            <div className="p-2.5 bg-[#F5F3ED]/70 border-t border-[#CAD8CE] flex flex-col gap-2 text-xs">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(linkForm.leadMagnet?.enabled)}
                                  onChange={(e) => setLinkForm({
                                    ...linkForm,
                                    leadMagnet: { ...(linkForm.leadMagnet || {}), enabled: e.target.checked }
                                  })}
                                  className="rounded border-[#CAD8CE] text-[#52796F] focus:ring-[#52796F]"
                                />
                                <span className="font-semibold text-[#28352F]">
                                  Require Email or WhatsApp to unlock this download
                                </span>
                              </label>

                              {linkForm.leadMagnet?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#CAD8CE]/50">
                                  <div>
                                    <Label htmlFor="magnet-asset-url" required>Asset Download URL</Label>
                                    <Input
                                      id="magnet-asset-url"
                                      size="sm"
                                      type="text"
                                      placeholder="https://drive.google.com/... or direct PDF link"
                                      value={linkForm.leadMagnet?.assetUrl || ''}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        leadMagnet: { ...(linkForm.leadMagnet || {}), assetUrl: e.target.value }
                                      })}
                                      className="font-mono"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="magnet-asset-type">Resource Type</Label>
                                    <Select
                                      id="magnet-asset-type"
                                      size="sm"
                                      value={linkForm.leadMagnet?.assetType || 'pdf'}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        leadMagnet: { ...(linkForm.leadMagnet || {}), assetType: e.target.value }
                                      })}
                                    >
                                      <option value="pdf">PDF Guide / E-Book</option>
                                      <option value="notion">Notion Template</option>
                                      <option value="preset">Lightroom / Design Preset</option>
                                      <option value="other">Exclusive Digital Asset</option>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="magnet-preview-text">Unlock Badge Text</Label>
                                    <Input
                                      id="magnet-preview-text"
                                      size="sm"
                                      type="text"
                                      placeholder="e.g. Free 2026 Lightroom Preset"
                                      value={linkForm.leadMagnet?.previewText || ''}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        leadMagnet: { ...(linkForm.leadMagnet || {}), previewText: e.target.value }
                                      })}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="magnet-marketing-platform">Auto-Sync Destination</Label>
                                    <Select
                                      id="magnet-marketing-platform"
                                      size="sm"
                                      value={linkForm.leadMagnet?.marketingPlatform || 'none'}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        leadMagnet: { ...(linkForm.leadMagnet || {}), marketingPlatform: e.target.value }
                                      })}
                                    >
                                      <option value="none">Local CRM &amp; Export CSV</option>
                                      <option value="mailchimp">Mailchimp (via Composio)</option>
                                      <option value="convertkit">ConvertKit (via Composio)</option>
                                      <option value="brevo">Brevo (via Composio)</option>
                                    </Select>
                                  </div>

                                  <div className="md:col-span-2 flex items-center gap-4">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={linkForm.leadMagnet?.requireEmail !== false}
                                        onChange={(e) => setLinkForm({
                                          ...linkForm,
                                          leadMagnet: { ...(linkForm.leadMagnet || {}), requireEmail: e.target.checked }
                                        })}
                                        className="rounded border-[#CAD8CE] text-[#52796F]"
                                      />
                                      <span className="text-[11px] text-[#28352F]">Require Email Address</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(linkForm.leadMagnet?.requireWhatsApp)}
                                        onChange={(e) => setLinkForm({
                                          ...linkForm,
                                          leadMagnet: { ...(linkForm.leadMagnet || {}), requireWhatsApp: e.target.checked }
                                        })}
                                        className="rounded border-[#CAD8CE] text-[#52796F]"
                                      />
                                      <span className="text-[11px] text-[#28352F]">Require WhatsApp / Phone</span>
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 2. In-Page Media Player Preview Accordion */}
                        <div className="rounded-lg border border-[#CAD8CE] bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'embed' ? null : 'embed')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-xs text-[#28352F] hover:bg-[#F5F3ED] transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Music size={13} className={linkForm.embed?.enabled ? 'text-emerald-600' : 'text-[#5C6B64]'} />
                              <span>In-Page Media Preview (Zero Tab-Switching)</span>
                              {linkForm.embed?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                                  {linkForm.embed.platform}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#5C6B64] font-mono">
                              {openLinkAccordion === 'embed' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'embed' && (
                            <div className="p-2.5 bg-[#F5F3ED]/70 border-t border-[#CAD8CE] flex flex-col gap-2 text-xs">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(linkForm.embed?.enabled)}
                                    onChange={(e) => setLinkForm({
                                      ...linkForm,
                                      embed: { ...(linkForm.embed || {}), enabled: e.target.checked }
                                    })}
                                    className="rounded border-[#CAD8CE] text-[#52796F]"
                                  />
                                  <span className="font-semibold text-[#28352F]">
                                    Play audio or watch video inline directly on bio
                                  </span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const detected = detectEmbed(linkForm.url);
                                    if (detected.isMedia) {
                                      setLinkForm({
                                        ...linkForm,
                                        embed: {
                                          enabled: true,
                                          platform: detected.platform,
                                          embedId: detected.embedId,
                                        }
                                      });
                                    }
                                  }}
                                  className="text-[10px] font-semibold text-[#52796F] hover:underline flex items-center gap-1"
                                >
                                  <Sparkles size={11} /> Auto-Detect from URL
                                </button>
                              </div>

                              {linkForm.embed?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#CAD8CE]/50">
                                  <div>
                                    <Label htmlFor="embed-platform">Platform</Label>
                                    <Select
                                      id="embed-platform"
                                      size="sm"
                                      value={linkForm.embed?.platform || 'none'}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        embed: { ...(linkForm.embed || {}), platform: e.target.value }
                                      })}
                                    >
                                      <option value="spotify">Spotify Track Preview</option>
                                      <option value="youtube">YouTube Inline Player</option>
                                      <option value="tiktok">TikTok Video Player</option>
                                      <option value="apple_music">Apple Music Preview</option>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label htmlFor="embed-id" required>Track / Video ID</Label>
                                    <Input
                                      id="embed-id"
                                      size="sm"
                                      type="text"
                                      placeholder="e.g. 4cOdK2wGLETKBW3PvgPWqT or dQw4w9WgXcQ"
                                      value={linkForm.embed?.embedId || ''}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        embed: { ...(linkForm.embed || {}), embedId: e.target.value.trim() }
                                      })}
                                      className="font-mono"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3. Time-Sensitive Flash Links Accordion */}
                        <div className="rounded-lg border border-[#CAD8CE] bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'schedule' ? null : 'schedule')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-xs text-[#28352F] hover:bg-[#F5F3ED] transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Clock size={13} className={linkForm.schedule?.enabled ? 'text-blue-600' : 'text-[#5C6B64]'} />
                              <span>Time-Sensitive Flash Link (Countdown Badge)</span>
                              {linkForm.schedule?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                                  SCHEDULED
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#5C6B64] font-mono">
                              {openLinkAccordion === 'schedule' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'schedule' && (
                            <div className="p-3 bg-[#F5F3ED]/70 border-t border-[#CAD8CE] flex flex-col gap-2.5 text-xs">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(linkForm.schedule?.enabled)}
                                  onChange={(e) => setLinkForm({
                                    ...linkForm,
                                    schedule: { ...(linkForm.schedule || {}), enabled: e.target.checked }
                                  })}
                                  className="rounded border-[#CAD8CE] text-[#52796F]"
                                />
                                <span className="font-semibold text-[#28352F]">
                                  Auto-show / auto-hide link with active countdown timer
                                </span>
                              </label>

                              {linkForm.schedule?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-[#CAD8CE]/50">
                                  <div>
                                    <Label htmlFor="schedule-starts">Starts At (Optional)</Label>
                                    <Input
                                      id="schedule-starts"
                                      size="sm"
                                      type="datetime-local"
                                      value={linkForm.schedule?.startsAt ? new Date(linkForm.schedule.startsAt).toISOString().slice(0, 16) : ''}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        schedule: { ...(linkForm.schedule || {}), startsAt: e.target.value }
                                      })}
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="schedule-expires" required>Expires At (Required for countdown)</Label>
                                    <Input
                                      id="schedule-expires"
                                      size="sm"
                                      type="datetime-local"
                                      value={linkForm.schedule?.expiresAt ? new Date(linkForm.schedule.expiresAt).toISOString().slice(0, 16) : ''}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        schedule: { ...(linkForm.schedule || {}), expiresAt: e.target.value }
                                      })}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 4. Country & Geo-Targeting Rules Accordion */}
                        <div className="rounded-lg border border-[#CAD8CE] bg-white overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'geo' ? null : 'geo')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-xs text-[#28352F] hover:bg-[#F5F3ED] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Globe size={13} className={linkForm.geoTargeting?.enabled ? 'text-teal-600' : 'text-[#5C6B64]'} />
                              <span>Country &amp; Geo-Targeting Rules</span>
                              {linkForm.geoTargeting?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-bold uppercase">
                                  {linkForm.geoTargeting.countries?.length || 0} Countries
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#5C6B64] font-mono">
                              {openLinkAccordion === 'geo' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'geo' && (
                            <div className="p-3 bg-[#F5F3ED]/70 border-t border-[#CAD8CE] flex flex-col gap-2.5 text-xs">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(linkForm.geoTargeting?.enabled)}
                                  onChange={(e) => setLinkForm({
                                    ...linkForm,
                                    geoTargeting: { ...(linkForm.geoTargeting || {}), enabled: e.target.checked }
                                  })}
                                  className="rounded border-[#CAD8CE] text-[#52796F]"
                                />
                                <span className="font-semibold text-[#28352F]">
                                  Show or hide this link based on visitor&rsquo;s country
                                </span>
                              </label>

                              {linkForm.geoTargeting?.enabled && (
                                <div className="space-y-3 pt-2 border-t border-[#CAD8CE]/50">
                                  <div>
                                    <Label htmlFor="geo-mode">Targeting Rule</Label>
                                    <Select
                                      id="geo-mode"
                                      size="sm"
                                      value={linkForm.geoTargeting?.mode || 'include'}
                                      onChange={(e) => setLinkForm({
                                        ...linkForm,
                                        geoTargeting: { ...(linkForm.geoTargeting || {}), mode: e.target.value }
                                      })}
                                    >
                                      <option value="include">Show ONLY in selected countries</option>
                                      <option value="exclude">Hide in selected countries (Show everywhere else)</option>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label className="mb-1.5">Select Targeted Countries:</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        { code: 'US', name: 'United States', flag: '🇺🇸' },
                                        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
                                        { code: 'IN', name: 'India', flag: '🇮🇳' },
                                        { code: 'EU', name: 'European Union', flag: '🇪🇺' },
                                        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
                                        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
                                        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
                                        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
                                        { code: 'FR', name: 'France', flag: '🇫🇷' },
                                        { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
                                      ].map((country) => {
                                        const isSelected = (linkForm.geoTargeting?.countries || []).includes(country.code);
                                        return (
                                          <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => {
                                              const current = linkForm.geoTargeting?.countries || [];
                                              const next = isSelected
                                                ? current.filter((c) => c !== country.code)
                                                : [...current, country.code];
                                              setLinkForm({
                                                ...linkForm,
                                                geoTargeting: { ...(linkForm.geoTargeting || {}), countries: next }
                                              });
                                            }}
                                            className={`px-2 py-1.5 rounded-lg border text-left text-xs flex items-center justify-between transition-all cursor-pointer ${
                                              isSelected
                                                ? 'bg-[#52796F] text-white border-[#3D5C54] font-semibold shadow-xs'
                                                : 'bg-white text-[#28352F] border-[#CAD8CE] hover:bg-[#F5F3ED]'
                                            }`}
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span>{country.flag}</span>
                                              <span className="truncate">{country.name}</span>
                                            </span>
                                            {isSelected && <span className="font-bold">✓</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="text-[10px] text-[#5C6B64] mt-1.5">
                                      💡 Test this live by clicking <strong>&ldquo;View as...&rdquo;</strong> in the preview toolbar!
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="link-icon-select" className="mb-0 text-xs font-bold uppercase text-[#5C6B64]">Icon:</Label>
                          <div className="w-36">
                            <Select
                              id="link-icon-select"
                              size="sm"
                              value={linkForm.icon}
                              onChange={(e) => setLinkForm({ ...linkForm, icon: e.target.value })}
                            >
                              {ICON_LIST.map((ic) => (
                                <option key={ic.id} value={ic.symbol}>
                                  {ic.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                        >
                          {editingLinkId ? 'Save Changes' : 'Add Link'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Inline Collection Creator / Editor Form */}
                  {(isAddingCollection || editingCollectionId) && (
                    <form
                      onSubmit={handleSaveCollection}
                      className="bg-[#F5F3ED] border-2 border-[#52796F] rounded-xl p-4 sm:p-5 shadow-md flex flex-col gap-3.5 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#CAD8CE]">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#52796F]" />
                          <span className="font-sans font-bold text-sm text-[#28352F]">
                            {editingCollectionId ? 'Edit Collection' : 'Create New Collection (Folder)'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setIsAddingCollection(false);
                            setEditingCollectionId(null);
                          }}
                          className="font-mono text-xs"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                        <div>
                          <Label htmlFor="col-title-input" required>Collection Name</Label>
                          <Input
                            id="col-title-input"
                            type="text"
                            required
                            placeholder="e.g. My Gear, Portfolio, Best Articles"
                            value={collectionForm.title}
                            onChange={(e) => setCollectionForm({ ...collectionForm, title: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="col-layout-select" required>Display Layout Mode</Label>
                          <Select
                            id="col-layout-select"
                            value={collectionForm.viewMode}
                            onChange={(e) => setCollectionForm({ ...collectionForm, viewMode: e.target.value })}
                          >
                            <option value="list">Vertical List (Stacked Cards)</option>
                            <option value="grid">2-Column Grid (Bento Style)</option>
                            <option value="carousel">Horizontal Carousel (Swipeable Slider)</option>
                          </Select>
                        </div>

                        {/* Quick One-Click Carousel Presets */}
                        <div className="md:col-span-2 flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] text-[#5C6B64] font-medium mr-1">Quick Carousel Presets:</span>
                          <button
                            type="button"
                            onClick={() => setCollectionForm({
                              title: 'Instagram Posts & Reels',
                              viewMode: 'carousel',
                              type: 'instagram'
                            })}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                          >
                            📸 Instagram Reels Carousel
                          </button>
                          <button
                            type="button"
                            onClick={() => setCollectionForm({
                              title: 'YouTube Videos & Playlists',
                              viewMode: 'carousel',
                              type: 'youtube'
                            })}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                          >
                            ▶️ YouTube Videos Carousel
                          </button>
                          <button
                            type="button"
                            onClick={() => setCollectionForm({
                              title: 'Amaze Store Products',
                              viewMode: 'carousel',
                              type: 'products'
                            })}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                          >
                            🛍️ Amaze Store Carousel
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#5C6B64]">
                          Group related links together on your profile with a custom view mode.
                        </span>
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                        >
                          {editingCollectionId ? 'Save Collection' : 'Create Collection'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Collections Management Banner if any exist */}
                  {(currentProfile.collections || []).length > 0 && (
                    <div className="bg-white border border-[#CAD8CE]/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#E0DCD3]/80">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-[#52796F]" />
                          <h3 className="font-sans font-bold text-sm text-[#28352F]">Active Collections</h3>
                          <Badge variant="sage" size="xs">
                            {(currentProfile.collections || []).length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={Plus}
                          onClick={() => {
                            setIsAddingCollection(true);
                            setEditingCollectionId(null);
                            setCollectionForm({ title: '', viewMode: 'list' });
                          }}
                          className="text-[#52796F]"
                        >
                          New Collection
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(currentProfile.collections || []).map((col) => {
                          const linksInCol = (currentProfile.links || []).filter(l => l.collectionId === col.id);
                          return (
                            <div
                              key={col.id}
                              className="p-3 rounded-xl bg-[#F5F3ED]/80 border border-[#CAD8CE] flex flex-col justify-between gap-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shrink-0 font-bold">
                                    <Folder className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-xs sm:text-sm text-[#28352F] block truncate">
                                      {col.title}
                                    </span>
                                    <span className="text-[10px] text-[#5C6B64] font-mono">
                                      {linksInCol.length} link{linksInCol.length === 1 ? '' : 's'} assigned
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-[#5C6B64]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCollectionId(col.id);
                                      setCollectionForm({
                                        title: col.title,
                                        viewMode: col.viewMode || 'list',
                                      });
                                      setIsAddingCollection(false);
                                    }}
                                    className="p-1 hover:text-[#28352F] hover:bg-white rounded transition-colors"
                                    title="Edit Collection"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCollection(col.id)}
                                    className="p-1 hover:text-red-500 hover:bg-white rounded transition-colors"
                                    title="Delete Collection"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* View Mode Switcher Pills */}
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#CAD8CE]/50">
                                <span className="text-[10px] text-[#5C6B64] font-medium mr-1">View:</span>
                                {[
                                  { id: 'list', label: 'List' },
                                  { id: 'grid', label: 'Grid' },
                                  { id: 'carousel', label: 'Carousel' },
                                ].map((mode) => (
                                  <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => handleUpdateCollectionViewMode(col.id, mode.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                      (col.viewMode || 'list') === mode.id
                                        ? 'bg-[#52796F] text-white shadow-xs'
                                        : 'bg-white text-[#5C6B64] border border-[#CAD8CE] hover:text-[#28352F]'
                                    }`}
                                  >
                                    {mode.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Links & Content Section */}
                  <div className="bg-white border border-[#CAD8CE]/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
                    {/* Content Sub-Tabs: Links | Shop */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#E0DCD3]/80 flex-wrap gap-3">
                      <div className="inline-flex items-center p-1 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl gap-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleContentSubTabSwitch('links')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            contentSubTab === 'links'
                              ? 'bg-[#52796F] text-white shadow-xs'
                              : 'text-[#5C6B64] hover:text-[#28352F]'
                          }`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Links &amp; Content</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContentSubTabSwitch('shop')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            contentSubTab === 'shop'
                              ? 'bg-[#52796F] text-white shadow-xs'
                              : 'text-[#5C6B64] hover:text-[#28352F]'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Shop</span>
                          {(currentProfile.shop?.products || []).length > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              contentSubTab === 'shop' ? 'bg-white/20 text-white' : 'bg-[#CAD8CE] text-[#28352F]'
                            }`}>
                              {(currentProfile.shop?.products || []).length}
                            </span>
                          )}
                        </button>
                      </div>

                      {contentSubTab === 'links' ? (
                        <div className="inline-flex items-center p-0.5 bg-[#F5F3ED] border border-[#CAD8CE] rounded-lg text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setLinkFilterTab('active')}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                              linkFilterTab === 'active'
                                ? 'bg-[#52796F] text-white shadow-xs'
                                : 'text-[#5C6B64] hover:text-[#28352F]'
                            }`}
                          >
                            <span>Active Links</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              linkFilterTab === 'active' ? 'bg-white/20 text-white' : 'bg-[#CAD8CE]/50 text-[#28352F]'
                            }`}>
                              {(currentProfile.links || []).filter(l => !l.isArchived).length}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLinkFilterTab('archived')}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                              linkFilterTab === 'archived'
                                ? 'bg-[#52796F] text-white shadow-xs'
                                : 'text-[#5C6B64] hover:text-[#28352F]'
                            }`}
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archived</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              linkFilterTab === 'archived' ? 'bg-white/20 text-white' : 'bg-[#CAD8CE]/50 text-[#28352F]'
                            }`}>
                              {(currentProfile.links || []).filter(l => l.isArchived).length}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="xs"
                          leftIcon={Plus}
                          onClick={() => setShowAddProductModal(true)}
                          className="bg-[#52796F] text-white"
                        >
                          Add Product
                        </Button>
                      )}
                    </div>

                    {/* Active Links List */}
                    {linkFilterTab === 'active' && (
                      <div className="flex flex-col gap-2.5">
                        {/* Interactive Lead Capture & Contact Form Builder Card */}
                        {currentProfile.leadCapture?.enabled !== false && (
                          <div className="p-3.5 sm:p-4 rounded-xl bg-[#E8EFEA]/60 border border-[#52796F]/40 hover:border-[#52796F] flex items-center justify-between gap-3 shadow-xs transition-all">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-[#52796F] text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Contact className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-xs sm:text-sm text-[#28352F] truncate">
                                    {currentProfile.leadCapture?.title || "Let's Connect"}
                                  </h4>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CAD8CE] text-[#28352F]">
                                    Lead Capture Form
                                  </span>
                                  {currentProfile.leadCapture?.syncToGoogleContacts !== false && (
                                    <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" /> CRM Synced
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#5C6B64] truncate mt-0.5">
                                  {currentProfile.leadCapture?.subtitle || "Captures visitor contact info and automatically syncs to leads"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowLeadModal(true)}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F5F3ED] border border-[#CAD8CE] text-xs font-semibold text-[#28352F] flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Preview and test contact form"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#52796F]" />
                                <span className="hidden sm:inline">Preview Form</span>
                              </button>
                              <Link
                                href="/leads"
                                className="px-2.5 py-1.5 rounded-lg bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="View captured leads in CRM"
                              >
                                <span>Leads</span>
                              </Link>
                              <Switch
                                checked={currentProfile.leadCapture?.enabled !== false}
                                onChange={(e) => setCurrentProfile(prev => ({
                                  ...prev,
                                  leadCapture: {
                                    ...(prev.leadCapture || {}),
                                    enabled: e.target.checked
                                  }
                                }))}
                              />
                            </div>
                          </div>
                        )}

                        {(currentProfile.links || []).filter(l => !l.isArchived).length === 0 ? (
                          <div className="p-8 text-center border-2 border-dashed border-[#CAD8CE] rounded-xl flex flex-col items-center justify-center gap-2 text-[#5C6B64]">
                            <Plus className="w-8 h-8 text-[#52796F]/60" />
                            <p className="text-sm font-semibold text-[#28352F]">No active links yet</p>
                            <p className="text-xs">Click &ldquo;+ Add to Bio&rdquo; or &ldquo;Add Link&rdquo; above to get started.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={Plus}
                              onClick={() => setShowMarketplace(true)}
                              className="mt-2"
                            >
                              Open App Marketplace
                            </Button>
                          </div>
                        ) : (
                          (currentProfile.links || []).filter(l => !l.isArchived).map((link, idx) => {
                            const iconSymbol = link.icon || 'link';
                            const isEditingTitle = inlineEditingLinkId === link.id;

                            return (
                              <div
                                key={link.id || idx}
                                className={`p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 transition-all group shadow-xs ${
                                  link.disabled
                                    ? 'bg-stone-50 border border-stone-200 opacity-60'
                                    : idx === 0
                                    ? 'bg-[#F5F3ED] border border-[#52796F]/40 hover:border-[#52796F]'
                                    : 'bg-white border border-[#CAD8CE]/80 hover:border-[#52796F]'
                                }`}
                              >
                                {/* Left: Move Arrows + Icon + Inline Title & Details */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="flex flex-col text-[#5C6B64] group-hover:text-[#28352F] shrink-0">
                                    <button
                                      onClick={() => handleMoveLink(idx, 'up')}
                                      disabled={idx === 0}
                                      className="hover:text-[#52796F] disabled:opacity-20 cursor-pointer p-0.5"
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => handleMoveLink(idx, 'down')}
                                      disabled={idx === (currentProfile.links || []).filter(l => !l.isArchived).length - 1}
                                      className="hover:text-[#52796F] disabled:opacity-20 cursor-pointer p-0.5"
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveThumbnailLink(link);
                                      setShowThumbnailModal(true);
                                    }}
                                    className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 font-bold relative group/thumb cursor-pointer transition-all overflow-hidden ${
                                      idx === 0 ? 'bg-white border-[#CAD8CE] text-[#52796F]' : 'bg-[#F5F3ED] border-[#CAD8CE] text-[#52796F]'
                                    }`}
                                    title="Click to add or customize thumbnail"
                                  >
                                    {link.thumbnailType === 'image' && link.thumbnail ? (
                                      <img src={link.thumbnail} alt="" className="w-full h-full object-cover rounded-lg" />
                                    ) : link.thumbnailType === 'icon' && link.thumbnail && !link.thumbnail.startsWith('http') && !link.thumbnail.startsWith('data:') ? (
                                      <span className="text-xl">{link.thumbnail}</span>
                                    ) : (
                                      <span className="material-symbols-outlined text-lg group-hover/thumb:hidden">
                                        {iconSymbol}
                                      </span>
                                    )}
                                    <div className="absolute inset-0 bg-[#52796F] text-white opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                      <ImagePlus className="w-4 h-4" />
                                    </div>
                                  </button>

                                  <div className="flex flex-col min-w-0 flex-1">
                                    {isEditingTitle ? (
                                      /* Phase 1: Inline Title Editing Form with Character Limit Countdown */
                                      <div className="flex items-center gap-2 w-full max-w-md animate-fadeIn">
                                        <div className="relative flex-1">
                                          <input
                                            type="text"
                                            maxLength={35}
                                            autoFocus
                                            value={inlineTitleDraft}
                                            onChange={(e) => setInlineTitleDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveInlineTitle(link.id);
                                              if (e.key === 'Escape') handleCancelInlineTitle();
                                            }}
                                            className="w-full px-2.5 py-1 text-sm font-bold text-[#28352F] bg-white border-2 border-[#52796F] rounded-lg focus:outline-none pr-14 shadow-inner"
                                            placeholder="Link title (max 35 chars)"
                                          />
                                          <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold ${
                                            inlineTitleDraft.length >= 35
                                              ? 'text-red-500 font-extrabold'
                                              : inlineTitleDraft.length > 25
                                              ? 'text-amber-600'
                                              : 'text-[#5C6B64]'
                                          }`}>
                                            {inlineTitleDraft.length}/35
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveInlineTitle(link.id)}
                                          className="p-1 rounded-md bg-[#52796F] text-white hover:bg-[#3D5C54] transition-colors"
                                          title="Save title"
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleCancelInlineTitle}
                                          className="p-1 rounded-md bg-[#CAD8CE] text-[#28352F] hover:bg-stone-300 transition-colors"
                                          title="Cancel"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span 
                                          onDoubleClick={() => handleStartInlineEdit(link)}
                                          className="text-sm font-bold text-[#28352F] truncate max-w-[200px] sm:max-w-[280px] hover:text-[#52796F] cursor-pointer"
                                          title="Double click or click pencil to edit title inline"
                                        >
                                          {link.title}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleStartInlineEdit(link)}
                                          className="opacity-0 group-hover:opacity-100 text-[#5C6B64] hover:text-[#52796F] transition-opacity p-0.5"
                                          title="Edit Title Inline"
                                        >
                                          <Edit3 size={12} />
                                        </button>
                                        {link.badge && (
                                          <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md ${
                                            idx === 0
                                              ? 'bg-[#CAD8CE] text-[#28352F]'
                                              : 'bg-[#F5F3ED] border border-[#CAD8CE] text-[#5C6B64]'
                                          }`}>
                                            {link.badge}
                                          </span>
                                        )}
                                        {link.geoTargeting?.enabled && (
                                          <span 
                                            className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-teal-50 border border-teal-300 text-teal-800 flex items-center gap-1"
                                            title={`Geo-Targeted: ${(link.geoTargeting.countries || []).join(', ') || 'Configured'}`}
                                          >
                                            <span>🌍</span>
                                            <span>{(link.geoTargeting.countries || []).join(', ') || 'Geo'}</span>
                                          </span>
                                        )}
                                        {(currentProfile.collections || []).length > 0 && (
                                          <select
                                            value={link.collectionId || ''}
                                            onChange={(e) => handleAssignLinkToCollection(link.id, e.target.value)}
                                            className="text-[10px] font-bold bg-[#F5F3ED] hover:bg-[#EAE7DE] border border-[#CAD8CE] rounded px-1.5 py-0.5 text-[#52796F] cursor-pointer transition-colors focus:outline-none focus:border-[#52796F]"
                                            title="Assign or reassign link to a collection"
                                          >
                                            <option value="">📁 No Collection</option>
                                            {(currentProfile.collections || []).map((c) => (
                                              <option key={c.id} value={c.id}>
                                                📁 {c.title} ({c.viewMode || 'list'})
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    )}
                                    <span className="text-xs font-mono text-[#5C6B64] truncate">
                                      {link.subtitle || link.url || 'No URL destination'} • {link.clicks || 0} clicks
                                    </span>
                                  </div>
                                </div>

                                {/* Right: Real Clicks + Switch + Action Buttons (Edit, Archive, Delete) */}
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                  <div className="flex flex-col items-end leading-tight hidden xs:flex">
                                    <span className="text-sm font-bold font-mono text-[#52796F]">
                                      {link.clicks || 0} clicks
                                    </span>
                                    <span className="text-[0.65rem] font-mono text-[#5C6B64]">
                                      {link.clicks > 0 ? 'Active Traffic' : 'Ready for clicks'}
                                    </span>
                                  </div>

                                  {/* Active Toggle Switch */}
                                  <Switch
                                    checked={!link.disabled}
                                    onChange={() => handleToggleLink(link.id)}
                                  />

                                  {/* Quick Tune Settings */}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLink(link)}
                                    className="p-1.5 hover:text-[#28352F] hover:bg-[#F5F3ED] rounded-lg cursor-pointer transition-colors text-[#5C6B64]"
                                    title="Edit Link Settings"
                                  >
                                    <span className="material-symbols-outlined text-base">tune</span>
                                  </button>

                                  {/* Floating 3-Dot Context Menu (⋮) */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveLinkMenuId(activeLinkMenuId === link.id ? null : link.id);
                                      }}
                                      className="p-1.5 hover:text-[#28352F] hover:bg-[#F5F3ED] rounded-lg cursor-pointer transition-colors text-[#5C6B64]"
                                      title="More block actions"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {activeLinkMenuId === link.id && (
                                      <div 
                                        className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-[#CAD8CE] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* 1. Edit title inline */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveLinkMenuId(null);
                                            handleStartInlineEdit(link);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#28352F] hover:bg-[#F5F3ED] flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-[#52796F]" />
                                          <span>Edit Title (X/35)</span>
                                        </button>

                                        {/* 2. Move to collection */}
                                        <div className="px-3.5 py-1.5 border-t border-b border-[#CAD8CE]/40 my-1 bg-[#F5F3ED]/40">
                                          <label className="block text-[10px] font-bold text-[#5C6B64] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <Folder className="w-3 h-3 text-[#52796F]" /> Move to Collection
                                          </label>
                                          <select
                                            value={link.collectionId || ''}
                                            onChange={(e) => {
                                              handleAssignLinkToCollection(link.id, e.target.value);
                                              setActiveLinkMenuId(null);
                                            }}
                                            className="w-full text-[11px] font-bold bg-white border border-[#CAD8CE] rounded-lg px-2 py-1 text-[#28352F] focus:outline-none focus:border-[#52796F]"
                                          >
                                            <option value="">📁 Root (No Collection)</option>
                                            {(currentProfile.collections || []).map((c) => (
                                              <option key={c.id} value={c.id}>
                                                📁 {c.title}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        {/* 3. Hide / Unhide */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleToggleLink(link.id);
                                            setActiveLinkMenuId(null);
                                          }}
                                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#28352F] hover:bg-[#F5F3ED] flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                          {link.disabled ? (
                                            <>
                                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>Unhide Block</span>
                                            </>
                                          ) : (
                                            <>
                                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                              <span>Hide Block</span>
                                            </>
                                          )}
                                        </button>

                                        {/* 4. Delete / Archive */}
                                        <div className="border-t border-[#CAD8CE]/60 my-1 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleArchiveLink(link.id);
                                              setActiveLinkMenuId(null);
                                            }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                          >
                                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Archive (Keep Clicks)</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeleteLink(link.id);
                                              setActiveLinkMenuId(null);
                                            }}
                                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete Permanently</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Phase 1: Archived Links View */}
                    {linkFilterTab === 'archived' && (
                      <div className="flex flex-col gap-2.5">
                        {(currentProfile.links || []).filter(l => l.isArchived).length === 0 ? (
                          <div className="p-8 text-center border-2 border-dashed border-[#CAD8CE] rounded-xl flex flex-col items-center justify-center gap-2 text-[#5C6B64]">
                            <Archive className="w-8 h-8 text-[#5C6B64]/50" />
                            <p className="text-sm font-semibold text-[#28352F]">No archived links</p>
                            <p className="text-xs max-w-sm">
                              Archiving a link hides it from your public bio without losing its historical click metrics and traffic stats.
                            </p>
                          </div>
                        ) : (
                          (currentProfile.links || []).filter(l => l.isArchived).map((link) => (
                            <div
                              key={link.id}
                              className="p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 bg-stone-50 border border-stone-200 shadow-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-stone-200/80 border border-stone-300 flex items-center justify-center shrink-0 text-stone-500">
                                  <Archive className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-stone-700 truncate line-through">
                                      {link.title}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                                      ARCHIVED
                                    </span>
                                  </div>
                                  <span className="text-xs font-mono text-stone-500 truncate">
                                    {link.url} • <strong className="text-stone-700">{link.clicks || 0} historical clicks preserved</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRestoreLink(link.id)}
                                  className="px-3 py-1.5 rounded-lg bg-[#52796F] hover:bg-[#3D5C54] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                  title="Restore Link to Active Bio"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePermanentDeleteLink(link.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Permanently Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* SUB-TAB 2: SHOP SUB-SYSTEM */}
                    {contentSubTab === 'shop' && (
                      <div className="flex flex-col gap-4">
                        {/* Publish your Shop Visibility Banner */}
                        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                          currentProfile.shop?.published
                            ? 'bg-emerald-50/80 border-emerald-300'
                            : 'bg-[#F5F3ED] border-[#CAD8CE]'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              currentProfile.shop?.published ? 'bg-[#52796F] text-white shadow-sm' : 'bg-[#CAD8CE] text-[#5C6B64]'
                            }`}>
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#28352F]">Publish your Shop</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  currentProfile.shop?.published
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-stone-200 text-stone-600'
                                }`}>
                                  {currentProfile.shop?.published ? 'Live on Bio' : 'Hidden'}
                                </span>
                              </div>
                              <p className="text-xs text-[#5C6B64] mt-0.5">
                                Display a dedicated storefront tab on your live TreeInBio page.
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={Boolean(currentProfile.shop?.published)}
                            onChange={handleTogglePublishShop}
                          />
                        </div>

                        {/* Top Store Action */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#28352F] uppercase tracking-wider">
                            Products ({(currentProfile.shop?.products || []).length})
                          </span>
                          <Button
                            variant="primary"
                            size="xs"
                            leftIcon={Plus}
                            onClick={() => setShowAddProductModal(true)}
                            className="bg-[#52796F] text-white"
                          >
                            Add Product
                          </Button>
                        </div>

                        {/* 2x3 Skeleton Loaders during sub-tab transition */}
                        {isShopTransitioning ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map((sk) => (
                              <div key={sk} className="h-44 rounded-xl bg-stone-100 border border-stone-200 p-3 flex flex-col justify-between">
                                <div className="w-full h-24 bg-stone-200 rounded-lg" />
                                <div className="space-y-1.5 mt-2">
                                  <div className="w-3/4 h-3 bg-stone-200 rounded" />
                                  <div className="w-1/2 h-2.5 bg-stone-200 rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (currentProfile.shop?.products || []).length === 0 ? (
                          <div className="p-10 text-center border-2 border-dashed border-[#CAD8CE] rounded-xl flex flex-col items-center justify-center gap-3 text-[#5C6B64]">
                            <div className="w-12 h-12 rounded-full bg-[#F5F3ED] flex items-center justify-center text-[#52796F]">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#28352F]">Your Shop is Empty</p>
                              <p className="text-xs max-w-sm mt-1">
                                Sell digital downloads, merchandise, courses, or paste external store links with 1-click automatic metadata fetching.
                              </p>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={Plus}
                              onClick={() => setShowAddProductModal(true)}
                              className="mt-1 bg-[#52796F] text-white"
                            >
                              Add Your First Product
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {(currentProfile.shop?.products || []).map((product) => (
                              <div
                                key={product.id}
                                className="p-3 rounded-xl border border-[#CAD8CE] bg-[#F5F3ED]/40 hover:bg-[#F5F3ED] hover:border-[#52796F]/50 transition-all flex flex-col justify-between gap-3 group shadow-xs"
                              >
                                <div>
                                  {product.image ? (
                                    <div className="w-full h-28 rounded-lg overflow-hidden bg-stone-100 mb-2.5">
                                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-28 rounded-lg bg-[#CAD8CE]/40 flex items-center justify-center text-[#52796F] mb-2.5">
                                      <ShoppingBag className="w-8 h-8" />
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-xs sm:text-sm text-[#28352F] line-clamp-2 leading-tight">
                                      {product.title}
                                    </h4>
                                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                                      {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : product.currency === 'INR' ? '₹' : ''}
                                      {product.price}
                                    </span>
                                  </div>
                                  {product.description && (
                                    <p className="text-xs text-[#5C6B64] line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  )}
                                  {product.collection && (
                                    <span className="text-[10px] text-[#5C6B64] font-medium block mt-1">
                                      📁 {product.collection}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-[#CAD8CE]/50 text-xs">
                                  <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-[#52796F] hover:underline flex items-center gap-1 font-semibold truncate max-w-[140px]"
                                  >
                                    <span>Store Link</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tab 2: Style & Platinum Editor */}
              {activeTab === 'style' && (
                <>
                  <div className="bg-white border border-[#CAD8CE]/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E0DCD3] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-[#52796F]" />
                      <h3 className="font-sans font-bold text-base text-[#28352F]">
                        Persona Brand &amp; Typography Identity
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={Dices}
                        onClick={handleThemeShuffle}
                        className="bg-[#F5F3ED] hover:bg-[#CAD8CE]/50 text-[#28352F] font-bold shadow-2xs border-[#CAD8CE]"
                      >
                        🎲 Theme Shuffle
                      </Button>
                      <Badge variant="sage" size="xs">Editorial Grade</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4 text-xs sm:text-sm">
                    <div>
                      <Label htmlFor="creator-name-input">Creator Name</Label>
                      <Input
                        id="creator-name-input"
                        type="text"
                        value={currentProfile.name || ''}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
                        placeholder="Your full name or alias"
                      />
                    </div>

                    <div>
                      <Label htmlFor="username-input">Username / URL Handle</Label>
                      <Input
                        id="username-input"
                        type="text"
                        value={currentProfile.username || ''}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, username: e.target.value })}
                        placeholder="username"
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-[#52796F]" />
                            <span className="font-bold text-xs sm:text-sm text-[#28352F]">
                              Alternative Title Font
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.2 rounded">
                              48 Free Fonts
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setShowTitleFontModal(true)}
                            className="text-xs font-semibold bg-white border-[#CAD8CE] text-[#52796F] hover:border-[#52796F]"
                          >
                            {getTitleFontName(currentProfile.alternativeTitleFont) ? getTitleFontName(currentProfile.alternativeTitleFont) : 'Choose Font'}
                          </Button>
                        </div>
                        {getTitleFontName(currentProfile.alternativeTitleFont) && (
                          <div className="flex items-center justify-between pt-2 border-t border-[#CAD8CE]/60 text-xs">
                            <span className="text-stone-600 font-medium truncate" style={{ fontFamily: getTitleFontName(currentProfile.alternativeTitleFont) }}>
                              Active: {getTitleFontName(currentProfile.alternativeTitleFont)} (Preview Style)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectAlternativeTitleFont('')}
                              className="text-rose-500 hover:underline text-[11px]"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phase 2: Brand Logo Title Option */}
                    <div className="md:col-span-2 p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-[#52796F]" />
                          <span className="font-bold text-xs sm:text-sm text-[#28352F]">
                            Brand Logo Title
                          </span>
                          <span className="text-[10px] text-[#5C6B64]">
                            (Display brand logo image instead of text name)
                          </span>
                        </div>
                        <Switch
                          checked={Boolean(currentProfile.titleLogo?.enabled)}
                          onChange={(e) => setCurrentProfile({
                            ...currentProfile,
                            titleLogo: {
                              ...(currentProfile.titleLogo || {}),
                              enabled: e.target.checked,
                            }
                          })}
                        />
                      </div>

                      {currentProfile.titleLogo?.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#CAD8CE]/60">
                          <div>
                            <Label htmlFor="title-logo-url" required>Logo Image URL (PNG / SVG with transparent background)</Label>
                            <Input
                              id="title-logo-url"
                              type="text"
                              placeholder="https://... brand-logo.png"
                              value={currentProfile.titleLogo?.url || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                titleLogo: {
                                  ...(currentProfile.titleLogo || {}),
                                  url: e.target.value,
                                }
                              })}
                              className="font-mono text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor="title-logo-alt">Logo Alt Text / Brand Name</Label>
                            <Input
                              id="title-logo-alt"
                              type="text"
                              placeholder="e.g. Acme Studio Logo"
                              value={currentProfile.titleLogo?.altText || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                titleLogo: {
                                  ...(currentProfile.titleLogo || {}),
                                  altText: e.target.value,
                                }
                              })}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label htmlFor="bio-input" className="mb-0">Bio &amp; Subtitle</Label>
                        <button
                          type="button"
                          onClick={() => {
                            const recs = PERSONA_TAGLINES[currentProfile.niche] || [
                              'Film & Theatre Actress • SAG-AFTRA • WME Literary & Theatrical'
                            ];
                            const randomBio = recs[Math.floor(Math.random() * recs.length)];
                            setCurrentProfile({ ...currentProfile, bio: randomBio });
                          }}
                          className="text-xs font-mono text-[#52796F] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Suggest Bio</span>
                        </button>
                      </div>
                      <textarea
                        id="bio-input"
                        rows={3}
                        value={currentProfile.bio || ''}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, bio: e.target.value })}
                        placeholder="Tell visitors about yourself..."
                        className="w-full px-3.5 py-2.5 bg-white border border-[#CAD8CE] rounded-lg text-sm text-[#28352F] placeholder-[#5C6B64]/60 focus:outline-none focus:border-[#52796F] focus:ring-2 focus:ring-[#52796F]/15 transition-all shadow-xs leading-relaxed"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="avatar-url-input">Avatar Photo URL</Label>
                      <Input
                        id="avatar-url-input"
                        type="text"
                        value={currentProfile.avatar || ''}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, avatar: e.target.value })}
                        placeholder="https://... or upload photo"
                        className="font-mono"
                      />
                    </div>

                    {/* Phase 2: Avatar Masks (Cutout & Shapes) */}
                    <div className="md:col-span-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Label className="mb-0 font-bold text-xs uppercase text-[#5C6B64]">
                          Avatar Mask Shape (Geometry &amp; Cutout)
                        </Label>
                        <span className="text-[11px] font-mono text-[#52796F] font-semibold">
                          Active: {currentProfile.avatarShape || 'circle'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {AVATAR_SHAPES.map((shape) => {
                          const isSelected = (currentProfile.avatarShape || 'circle') === shape.id;
                          return (
                            <button
                              key={shape.id}
                              type="button"
                              onClick={() => setCurrentProfile({ ...currentProfile, avatarShape: shape.id })}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                                  : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-white hover:border-[#52796F]'
                              }`}
                            >
                              {/* Shape Icon Miniature Silhouette */}
                              <div className={`w-7 h-7 border-2 ${isSelected ? 'border-white bg-white/20' : 'border-[#52796F] bg-white'} ${
                                shape.id === 'circle' ? 'rounded-full' :
                                shape.id === 'rounded' ? 'rounded-lg' :
                                shape.id === 'squircle' ? 'rounded-[30%]' :
                                shape.id === 'arch' ? 'rounded-t-full rounded-b-xs' :
                                shape.id === 'hexagon' ? '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]' :
                                shape.id === 'diamond' ? 'rotate-45 scale-75 rounded-xs' :
                                'border-dashed rounded-none'
                              }`} />
                              <span className="text-[10px] font-bold truncate max-w-full">{shape.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Header Layout Mode Selector */}
                    <div>
                      <Label htmlFor="header-layout-select">Header Layout Mode</Label>
                      <Select
                        id="header-layout-select"
                        value={currentProfile.headerLayout || 'classic'}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, headerLayout: e.target.value })}
                      >
                        <option value="classic">Classic (Centered Circular Avatar)</option>
                        <option value="banner">Banner Cover (Top Header Banner + Avatar)</option>
                        <option value="hero">Hero Portrait (Large 4:5 Editorial Showcase)</option>
                      </Select>
                    </div>

                    {/* Social Icons Placement Selector */}
                    <div>
                      <Label htmlFor="socials-position-select">Social Icons Placement</Label>
                      <Select
                        id="socials-position-select"
                        value={currentProfile.socialsPosition || 'top'}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, socialsPosition: e.target.value })}
                      >
                        <option value="top">Top (Directly Below Bio &amp; Header)</option>
                        <option value="bottom">Bottom (Above Page Footer)</option>
                      </Select>
                    </div>

                    {/* Banner Cover Image Input (Visible if Banner Mode selected) */}
                    {currentProfile.headerLayout === 'banner' && (
                      <div className="md:col-span-2 animate-fadeIn">
                        <Label htmlFor="cover-image-input">Cover Banner Image URL</Label>
                        <Input
                          id="cover-image-input"
                          type="text"
                          value={currentProfile.coverImage || ''}
                          onChange={(e) => setCurrentProfile({ ...currentProfile, coverImage: e.target.value })}
                          placeholder="https://... (1200x400 landscape banner recommended)"
                          className="font-mono"
                        />
                        <p className="text-[11px] text-[#5C6B64] mt-1">
                          Displays a panoramic cover banner behind your avatar at the very top of your profile.
                        </p>
                      </div>
                    )}

                    {/* AI Palette Suggester Component (Auto-detects from avatar) */}
                    <div className="md:col-span-2">
                      <PaletteSuggester 
                        avatarUrl={currentProfile.avatar} 
                        currentTheme={currentProfile.theme} 
                        onSelectTheme={(themeId) => setCurrentProfile({ ...currentProfile, theme: themeId })} 
                      />
                    </div>

                    <div>
                      <Label htmlFor="border-geometry-select">Button Border Geometry</Label>
                      <Select
                        id="border-geometry-select"
                        value={currentProfile.buttonShape || 'rounded'}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, buttonShape: e.target.value })}
                      >
                        <option value="sharp">Sharp Edges (Editorial Luxury)</option>
                        <option value="rounded">Soft Rounded (Atelier Default)</option>
                        <option value="pill">Pill Shaped (Organic)</option>
                        <option value="brutalism">Neo-Brutalism (Bold Border)</option>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="typography-select">Headline Typography</Label>
                      <Select
                        id="typography-select"
                        value={currentProfile.font || 'Playfair Display'}
                        onChange={(e) => setCurrentProfile({ ...currentProfile, font: e.target.value })}
                      >
                        <option value="Playfair Display">Playfair Display (Haute Couture Serif)</option>
                        <option value="DM Sans">DM Sans (Clean Modern Geometric)</option>
                        <option value="Plus Jakarta Sans">Plus Jakarta Sans (Sleek Tech)</option>
                        <option value="Space Grotesk">Space Grotesk (Editorial Brutalist)</option>
                      </Select>
                    </div>

                    {/* Phase 2: Expanded Theme Preset Library (18 Presets) */}
                    <div className="md:col-span-2 pt-4 border-t border-[#CAD8CE] flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#52796F] text-lg">palette</span>
                          <h4 className="font-bold text-xs sm:text-sm text-[#28352F]">
                            Curated Theme Presets Library
                          </h4>
                          <Badge variant="mint" size="xs">18 Presets</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={Dices}
                          onClick={handleThemeShuffle}
                          className="text-xs font-bold text-[#52796F]"
                        >
                          🎲 Shuffle Random
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {THEME_PRESETS.map((preset) => {
                          const isSelected = currentProfile.theme === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleApplyThemePreset(preset)}
                              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-2 border-[#52796F] bg-white ring-2 ring-[#52796F]/20 shadow-md'
                                  : 'border-[#CAD8CE] bg-[#F5F3ED] hover:bg-white hover:border-[#52796F]/50'
                              }`}
                            >
                              {/* Color Swatch Trio */}
                              <div className="flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.bg }} />
                                <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.primary }} />
                                <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.accent }} />
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#28352F] block truncate">{preset.name}</span>
                                  {isSelected && <span className="text-[10px] text-emerald-600 font-bold">✓</span>}
                                </div>
                                <span className="text-[9px] text-[#5C6B64] font-medium block truncate">{preset.tag}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Story Bubble Greeting Video Section */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex flex-col gap-3 mt-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0">
                            <Video className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#28352F]">
                              Instagram/TikTok Story Bubble Avatar
                            </h4>
                            <p className="text-xs text-[#5C6B64]">
                              Pulsing gradient ring opening vertical video greeting when clicked
                            </p>
                          </div>
                        </div>

                        <Switch
                          checked={Boolean(currentProfile.storyBubble?.enabled)}
                          onChange={(e) => setCurrentProfile({
                            ...currentProfile,
                            storyBubble: {
                              ...(currentProfile.storyBubble || {}),
                              enabled: e.target.checked
                            }
                          })}
                        />
                      </div>

                      {currentProfile.storyBubble?.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#CAD8CE]/70 text-xs sm:text-sm">
                          <div>
                            <Label htmlFor="story-video-url" required>Greeting Video URL (MP4 / WebM)</Label>
                            <Input
                              id="story-video-url"
                              type="text"
                              placeholder="https://... vertical 9:16 video URL"
                              value={currentProfile.storyBubble?.videoUrl || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                storyBubble: {
                                  ...(currentProfile.storyBubble || {}),
                                  videoUrl: e.target.value
                                }
                              })}
                              className="font-mono"
                            />
                          </div>
                          <div>
                            <Label htmlFor="story-caption">Story Greeting Caption (Optional)</Label>
                            <Input
                              id="story-caption"
                              type="text"
                              placeholder="e.g. Welcome! Tap below to explore my links"
                              value={currentProfile.storyBubble?.caption || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                storyBubble: {
                                  ...(currentProfile.storyBubble || {}),
                                  caption: e.target.value
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Design Tab: Drill-Down Slide Navigation Engine */}
                <div className="bg-white border border-[#CAD8CE]/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
                  {/* Header: Back navigation when in sub-menu or Root title */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E0DCD3]/80">
                    <div className="flex items-center gap-2">
                      {designSubMenu !== 'root' ? (
                        <button
                          type="button"
                          onClick={() => setDesignSubMenu('root')}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#52796F] hover:text-[#3D5C54] px-2 py-1 rounded-lg hover:bg-[#F5F3ED] transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Design</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5 text-[#52796F]" />
                          <h3 className="font-sans font-bold text-base text-[#28352F]">
                            Design &amp; Studio Customization
                          </h3>
                        </div>
                      )}
                      {designSubMenu !== 'root' && (
                        <span className="text-sm font-bold text-[#28352F] capitalize">
                          / {designSubMenu}
                        </span>
                      )}
                    </div>

                    {designSubMenu === 'theme' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={Dices}
                        onClick={handleThemeShuffle}
                        className="text-xs font-bold text-[#52796F]"
                      >
                        🎲 Shuffle Random
                      </Button>
                    )}
                  </div>

                  {/* ROOT MENU: 7 Sub-Menu Category Tiles */}
                  {designSubMenu === 'root' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          id: 'theme',
                          title: 'Themes',
                          desc: 'Customizable presets & curated creator themes (Ariana, Olivia, Billie)',
                          icon: Palette,
                          badge: currentProfile.theme || 'atelier',
                        },
                        {
                          id: 'wallpaper',
                          title: 'Wallpaper',
                          desc: 'Fill color, gradient, blur backdrop, pattern, image, or video',
                          icon: ImageIcon,
                          badge: currentProfile.designSettings?.wallpaper?.type || 'Fill',
                        },
                        {
                          id: 'buttons',
                          title: 'Buttons',
                          desc: 'Solid, glass, or outline styles, corner radius, drop shadows, and color',
                          icon: Layers,
                          badge: `${currentProfile.designSettings?.buttonStyle || 'Solid'} • ${currentProfile.designSettings?.buttonRoundness || 'Full'}`,
                        },
                        {
                          id: 'text',
                          title: 'Text & Typography',
                          desc: 'Headline typography and expressive alternative title fonts',
                          icon: Type,
                          badge: currentProfile.font || 'Playfair Display',
                        },
                        {
                          id: 'colors',
                          title: 'Colors',
                          desc: 'Centralized 6-hex studio palette for surface, primary, border, and text',
                          icon: Paintbrush,
                          badge: '6 Hex Values',
                        },
                        {
                          id: 'stickers',
                          title: 'Stickers',
                          desc: 'Sorta Spooky, Like & Subscribe, Pointers, and Cause sticker packs',
                          icon: Smile,
                          badge: `${(currentProfile.designSettings?.stickers || []).length} Placed`,
                        },
                        {
                          id: 'footer',
                          title: 'Footer',
                          desc: 'Control visibility of TreeInBio footer branding on your public page',
                          icon: Sliders,
                          badge: currentProfile.designSettings?.hideFooter ? 'Hidden' : 'Visible',
                        },
                      ].map((cat) => {
                        const IconComp = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setDesignSubMenu(cat.id)}
                            className="p-4 rounded-xl border border-[#CAD8CE] bg-[#F5F3ED]/60 hover:bg-[#F5F3ED] hover:border-[#52796F] text-left flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-white border border-[#CAD8CE] flex items-center justify-center text-[#52796F] group-hover:scale-105 transition-transform shrink-0">
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-[#28352F] group-hover:text-[#52796F] transition-colors truncate">
                                  {cat.title}
                                </h4>
                                <p className="text-xs text-[#5C6B64] line-clamp-1 mt-0.5">
                                  {cat.desc}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-[#CAD8CE] text-[#52796F] capitalize">
                                {cat.badge}
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#5C6B64] group-hover:text-[#52796F] transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* SUB-MENU 1: THEMES */}
                  {designSubMenu === 'theme' && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Section A: Customizable Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C6B64]">
                            Customizable Theme Presets (18)
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                          {THEME_PRESETS.map((preset) => {
                            const isSelected = currentProfile.theme === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyThemePreset(preset)}
                                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-2 border-[#52796F] bg-white ring-2 ring-[#52796F]/20 shadow-md'
                                    : 'border-[#CAD8CE] bg-[#F5F3ED] hover:bg-white hover:border-[#52796F]/50'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.bg }} />
                                  <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.primary }} />
                                  <span className="w-4 h-4 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: preset.accent }} />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#28352F] block truncate">{preset.name}</span>
                                    {isSelected && <span className="text-[10px] text-emerald-600 font-bold">✓</span>}
                                  </div>
                                  <span className="text-[9px] text-[#5C6B64] font-medium block truncate">{preset.tag}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section B: Curated Creator Themes */}
                      <div className="pt-4 border-t border-[#CAD8CE]">
                        <div className="flex items-center justify-between mb-2.5">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#5C6B64] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Curated Creator Themes (100% Free)</span>
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {CURATED_THEMES.map((theme) => {
                            const isSelected = currentProfile.theme === theme.id;
                            return (
                              <button
                                key={theme.id}
                                type="button"
                                onClick={() => handleApplyThemePreset(theme)}
                                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-2 border-[#52796F] bg-white ring-2 ring-[#52796F]/20 shadow-md'
                                    : 'border-[#CAD8CE] bg-[#F5F3ED] hover:bg-white hover:border-[#52796F]/50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#CAD8CE]/50 text-[#28352F]">
                                    {theme.creator}
                                  </span>
                                  {isSelected && <span className="text-xs text-emerald-600 font-bold">✓ Active</span>}
                                </div>
                                <div>
                                  <h5 className="font-bold text-xs text-[#28352F]">{theme.name}</h5>
                                  <span className="text-[10px] text-[#5C6B64]">{theme.tag}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md border border-black/10" style={{ backgroundColor: theme.primary }} />
                                  <span className="w-5 h-5 rounded-md border border-black/10" style={{ backgroundColor: theme.accent }} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-MENU 2: WALLPAPER */}
                  {designSubMenu === 'wallpaper' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <Label className="mb-2 block">Choose Wallpaper Type (3x2 Grid)</Label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {['fill', 'gradient', 'blur', 'pattern', 'image', 'video'].map((wType) => {
                            const isSelected = (currentProfile.designSettings?.wallpaper?.type || 'fill') === wType;
                            return (
                              <button
                                key={wType}
                                type="button"
                                onClick={() => {
                                  setCurrentProfile((prev) => ({
                                    ...prev,
                                    designSettings: {
                                      ...(prev.designSettings || {}),
                                      wallpaper: {
                                        ...(prev.designSettings?.wallpaper || {}),
                                        type: wType,
                                      },
                                    },
                                  }));
                                }}
                                className={`p-3 rounded-xl border text-center capitalize text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                                    : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-white'
                                }`}
                              >
                                {wType}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dynamic Input based on active wallpaper type */}
                      {(currentProfile.designSettings?.wallpaper?.type || 'fill') === 'fill' && (
                        <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
                          <Label htmlFor="wallpaper-fill">Fill Background Color</Label>
                          <div className="flex items-center gap-3">
                            <input
                              id="wallpaper-fill"
                              type="color"
                              value={currentProfile.designSettings?.wallpaper?.value || '#FFFEFA'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProfile((prev) => ({
                                  ...prev,
                                  designSettings: {
                                    ...(prev.designSettings || {}),
                                    wallpaper: {
                                      ...(prev.designSettings?.wallpaper || {}),
                                      type: 'fill',
                                      value: val,
                                    },
                                  },
                                }));
                              }}
                              className="w-10 h-10 rounded-lg cursor-pointer border border-[#CAD8CE]"
                            />
                            <input
                              type="text"
                              value={currentProfile.designSettings?.wallpaper?.value || '#FFFEFA'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProfile((prev) => ({
                                  ...prev,
                                  designSettings: {
                                    ...(prev.designSettings || {}),
                                    wallpaper: {
                                      ...(prev.designSettings?.wallpaper || {}),
                                      type: 'fill',
                                      value: val,
                                    },
                                  },
                                }));
                              }}
                              className="font-mono text-xs px-3 py-2 bg-white border border-[#CAD8CE] rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      {(currentProfile.designSettings?.wallpaper?.type === 'gradient') && (
                        <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
                          <Label htmlFor="wallpaper-gradient">CSS Gradient String</Label>
                          <Input
                            id="wallpaper-gradient"
                            type="text"
                            placeholder="linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
                            value={currentProfile.designSettings?.wallpaper?.gradient || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCurrentProfile((prev) => ({
                                ...prev,
                                designSettings: {
                                  ...(prev.designSettings || {}),
                                  wallpaper: {
                                    ...(prev.designSettings?.wallpaper || {}),
                                    gradient: val,
                                  },
                                },
                              }));
                            }}
                            className="font-mono text-xs"
                          />
                        </div>
                      )}

                      {(currentProfile.designSettings?.wallpaper?.type === 'blur' || currentProfile.designSettings?.wallpaper?.type === 'image') && (
                        <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
                          <Label htmlFor="wallpaper-image">Background Image URL</Label>
                          <Input
                            id="wallpaper-image"
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={currentProfile.designSettings?.wallpaper?.imageUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCurrentProfile((prev) => ({
                                ...prev,
                                designSettings: {
                                  ...(prev.designSettings || {}),
                                  wallpaper: {
                                    ...(prev.designSettings?.wallpaper || {}),
                                    imageUrl: val,
                                    blurImage: val,
                                  },
                                },
                              }));
                            }}
                            className="font-mono text-xs"
                          />
                        </div>
                      )}

                      {(currentProfile.designSettings?.wallpaper?.type === 'video') && (
                        <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
                          <Label htmlFor="wallpaper-video">Background Video URL (MP4 / WebM)</Label>
                          <Input
                            id="wallpaper-video"
                            type="url"
                            placeholder="https://... background-video.mp4"
                            value={currentProfile.designSettings?.wallpaper?.videoUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCurrentProfile((prev) => ({
                                ...prev,
                                designSettings: {
                                  ...(prev.designSettings || {}),
                                  wallpaper: {
                                    ...(prev.designSettings?.wallpaper || {}),
                                    videoUrl: val,
                                  },
                                },
                              }));
                            }}
                            className="font-mono text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-MENU 3: BUTTONS */}
                  {designSubMenu === 'buttons' && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Button Style: Solid | Glass | Outline */}
                      <div>
                        <Label className="mb-1.5 block">Button Fill Style</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['solid', 'glass', 'outline'].map((st) => {
                            const isSelected = (currentProfile.designSettings?.buttonStyle || 'solid') === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  setCurrentProfile((prev) => ({
                                    ...prev,
                                    designSettings: {
                                      ...(prev.designSettings || {}),
                                      buttonStyle: st,
                                    },
                                  }));
                                }}
                                className={`p-3 rounded-xl border capitalize text-xs font-bold transition-all ${
                                  isSelected
                                    ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                                    : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-white'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4 Corner Roundness Buttons */}
                      <div>
                        <Label className="mb-1.5 block">Corner Roundness</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'sharp', label: 'Sharp (0px)' },
                            { id: 'slight', label: 'Slight (8px)' },
                            { id: 'rounded', label: 'Rounded (16px)' },
                            { id: 'full', label: 'Full Pill' },
                          ].map((rnd) => {
                            const isSelected = (currentProfile.designSettings?.buttonRoundness || 'full') === rnd.id;
                            return (
                              <button
                                key={rnd.id}
                                type="button"
                                onClick={() => {
                                  setCurrentProfile((prev) => ({
                                    ...prev,
                                    designSettings: {
                                      ...(prev.designSettings || {}),
                                      buttonRoundness: rnd.id,
                                    },
                                  }));
                                }}
                                className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                                    : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-white'
                                }`}
                              >
                                {rnd.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4 Drop Shadows - Auto-hides if style === 'outline' */}
                      {(currentProfile.designSettings?.buttonStyle !== 'outline') && (
                        <div className="animate-fadeIn">
                          <Label className="mb-1.5 block">Drop Shadow Elevation</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { id: 'none', label: 'None' },
                              { id: 'soft', label: 'Soft Shadow' },
                              { id: 'hard', label: 'Hard Shadow' },
                              { id: 'offset', label: 'Offset 3D' },
                            ].map((shd) => {
                              const isSelected = (currentProfile.designSettings?.buttonShadow || 'soft') === shd.id;
                              return (
                                <button
                                  key={shd.id}
                                  type="button"
                                  onClick={() => {
                                    setCurrentProfile((prev) => ({
                                      ...prev,
                                      designSettings: {
                                        ...(prev.designSettings || {}),
                                        buttonShadow: shd.id,
                                      },
                                    }));
                                  }}
                                  className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-[#52796F] text-white border-[#3D5C54] shadow-xs'
                                      : 'bg-[#F5F3ED] text-[#28352F] border-[#CAD8CE] hover:bg-white'
                                  }`}
                                >
                                  {shd.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Color Pickers */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#CAD8CE]">
                        <div>
                          <Label htmlFor="btn-bg-color">Button Background Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              id="btn-bg-color"
                              type="color"
                              value={currentProfile.designSettings?.buttonColor || '#52796F'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProfile((prev) => ({
                                  ...prev,
                                  designSettings: {
                                    ...(prev.designSettings || {}),
                                    buttonColor: val,
                                  },
                                }));
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-[#CAD8CE]"
                            />
                            <input
                              type="text"
                              value={currentProfile.designSettings?.buttonColor || '#52796F'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProfile((prev) => ({
                                  ...prev,
                                  designSettings: {
                                    ...(prev.designSettings || {}),
                                    buttonColor: val,
                                  },
                                }));
                              }}
                              className="font-mono text-xs px-2.5 py-1.5 bg-white border border-[#CAD8CE] rounded-lg w-full"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="btn-text-color">Button Text Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              id="btn-text-color"
                              type="color"
                              value={currentProfile.designSettings?.buttonTextColor || '#FFFFFF'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProfile((prev) => ({
                                  ...prev,
                                  designSettings: {
                                    ...(prev.designSettings || {}),
                                    buttonTextColor: val,
                                  },
                                }));
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-[#CAD8CE]"
                            />
                            <input
                              type="text"
                              value={currentProfile.designSettings?.buttonTextColor || '#FFFFFF'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentProfile((prev) => ({
                                  ...prev,
                                  designSettings: {
                                    ...(prev.designSettings || {}),
                                    buttonTextColor: val,
                                  },
                                }));
                              }}
                              className="font-mono text-xs px-2.5 py-1.5 bg-white border border-[#CAD8CE] rounded-lg w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-MENU 4: TEXT */}
                  {designSubMenu === 'text' && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Active Pairing Summary */}
                      <div className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B64]">Active Font Pairing</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-[#28352F]">{currentProfile.font || 'Playfair Display'} (Headline)</span>
                          <span className="text-xs text-stone-500 font-mono">+ {getTitleFontName(currentProfile.alternativeTitleFont) || 'Default Serif'}</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="typography-select-sub">Headline Typography</Label>
                        <Select
                          id="typography-select-sub"
                          value={currentProfile.font || 'Playfair Display'}
                          onChange={(e) => setCurrentProfile({ ...currentProfile, font: e.target.value })}
                        >
                          <option value="Playfair Display">Playfair Display (Haute Couture Serif)</option>
                          <option value="DM Sans">DM Sans (Clean Modern Geometric)</option>
                          <option value="Plus Jakarta Sans">Plus Jakarta Sans (Sleek Tech)</option>
                          <option value="Space Grotesk">Space Grotesk (Editorial Brutalist)</option>
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-1.5 block">Alternative Title Font (48 Google Fonts)</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTitleFontModal(true)}
                          className="w-full text-xs font-semibold bg-white border-[#CAD8CE] text-[#52796F] hover:border-[#52796F]"
                        >
                          {getTitleFontName(currentProfile.alternativeTitleFont) ? `Font: ${getTitleFontName(currentProfile.alternativeTitleFont)}` : 'Browse 48 Expressive Fonts'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* SUB-MENU 5: COLORS */}
                  {designSubMenu === 'colors' && (
                    <div className="space-y-4 animate-fadeIn">
                      <Label className="block">Centralized 6-Hex Studio Palette</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'Surface', hex: '#FFFEFA' },
                          { label: 'Primary', hex: currentProfile.designSettings?.buttonColor || '#52796F' },
                          { label: 'Card Background', hex: '#F5F3ED' },
                          { label: 'Text Body', hex: '#28352F' },
                          { label: 'Border', hex: '#CAD8CE' },
                          { label: 'Accent', hex: '#38BDF8' },
                        ].map((cItem, cIdx) => (
                          <div key={cIdx} className="p-3 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B64]">{cItem.label}</span>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-[#28352F]">{cItem.hex}</span>
                              <span className="w-5 h-5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: cItem.hex }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-MENU 6: STICKERS */}
                  {designSubMenu === 'stickers' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C6B64]">
                            Interactive Sticker Packs (Drag & Drop onto Preview)
                          </h4>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Drag any sticker and drop directly on the preview to position it, or click to add.
                          </p>
                        </div>
                        {(currentProfile.designSettings?.stickers || []).length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentProfile((prev) => ({
                                ...prev,
                                designSettings: {
                                  ...(prev.designSettings || {}),
                                  stickers: [],
                                },
                              }));
                            }}
                            className="text-xs text-rose-500 hover:underline font-semibold"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {STICKER_PACKS.map((pack) => (
                        <div key={pack.id} className="p-3.5 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#28352F]">{pack.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#CAD8CE] text-[#52796F]">
                              {pack.tag}
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {pack.stickers.map((stk) => (
                              <button
                                key={stk.id}
                                type="button"
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({ emoji: stk.emoji, name: stk.name }));
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                onClick={() => {
                                  const startX = 20 + Math.floor(Math.random() * 60);
                                  const startY = 20 + Math.floor(Math.random() * 60);
                                  const startRotate = Math.floor(Math.random() * 20) - 10;
                                  const baseSticker = {
                                    id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                                    emoji: stk.emoji,
                                    src: '',
                                    name: stk.name,
                                    x: startX,
                                    y: startY,
                                    scale: 1,
                                    rotate: startRotate,
                                    flipX: false,
                                    flipHorizontal: false,
                                  };
                                  const newSticker = {
                                    ...baseSticker,
                                    devices: {
                                      mobile: { x: startX, y: startY, scale: 1, rotate: startRotate, flipX: false },
                                      tablet: getStickerDeviceProps(baseSticker, 'tablet'),
                                      laptop: getStickerDeviceProps(baseSticker, 'laptop', 'split'),
                                    },
                                  };
                                  setCurrentProfile((prev) => ({
                                    ...prev,
                                    designSettings: {
                                      ...(prev.designSettings || {}),
                                      stickers: [...(prev.designSettings?.stickers || []), newSticker],
                                    },
                                  }));
                                }}
                                className="text-2xl p-2.5 rounded-xl bg-white border border-[#CAD8CE] hover:border-[#52796F] hover:scale-110 transition-all flex items-center justify-center cursor-grab active:cursor-grabbing shadow-2xs select-none"
                                title={`Drag or click to place ${stk.name}`}
                              >
                                {stk.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SUB-MENU 7: FOOTER */}
                  {designSubMenu === 'footer' && (
                    <div className="p-4 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-between gap-4 animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#28352F]">Hide Linktree Footer Branding</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Free For All
                          </span>
                        </div>
                        <p className="text-xs text-[#5C6B64] mt-0.5">
                          Remove &ldquo;Powered by TreeInBio&rdquo; from the bottom of your live profile.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(currentProfile.designSettings?.hideFooter)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setCurrentProfile((prev) => ({
                            ...prev,
                            designSettings: {
                              ...(prev.designSettings || {}),
                              hideFooter: val,
                            },
                          }));
                        }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

              {/* Tab 3: Widgets & Bounties */}
              {activeTab === 'widgets' && (
                <div className="bg-white border border-[#CAD8CE]/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E0DCD3]/80">
                    <h3 className="font-sans font-bold text-base text-[#28352F]">
                      Interactive Bio Widgets &amp; Monetization Bounties
                    </h3>
                    <span className="font-mono text-xs text-[#52796F]">Zero Platform Fee</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Lead Capture Dialog Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white text-[#52796F] border border-[#CAD8CE] flex items-center justify-center shrink-0">
                            <Contact className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#28352F]">
                              Interactive Lead Capture &amp; Contact Sync
                            </h4>
                            <p className="text-xs font-mono text-[#5C6B64]">
                              Shows &apos;Connect&apos; button with validated form &amp; Google Contacts sync
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowLeadModal(true)}
                          className="px-3.5 py-2 bg-white hover:bg-[#F5F3ED] border border-[#CAD8CE] text-xs sm:text-sm font-semibold rounded-lg cursor-pointer min-h-[36px] transition-colors shrink-0"
                        >
                          Preview Form
                        </button>
                      </div>

                      {/* User Auto-Sync Option */}
                      <div className="pt-2.5 border-t border-[#CAD8CE]/70 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="font-semibold text-[#28352F]">Auto-Sync contacts to Google &amp; Gmail</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            currentProfile.leadCapture?.syncToGoogleContacts !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}>
                            {currentProfile.leadCapture?.syncToGoogleContacts !== false ? 'ON' : 'OFF'}
                          </span>
                        </div>
                        <Switch
                          checked={currentProfile.leadCapture?.syncToGoogleContacts !== false}
                          onChange={(e) => setCurrentProfile({
                            ...currentProfile,
                            leadCapture: {
                              ...(currentProfile.leadCapture || {}),
                              syncToGoogleContacts: e.target.checked,
                            },
                          })}
                        />
                      </div>
                    </div>

                    {/* Bookings & 1:1 Meetings Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white text-[#52796F] border border-[#CAD8CE] flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#28352F]">
                            1:1 Consultation &amp; Google Meet Scheduling
                          </h4>
                          <p className="text-xs font-mono text-[#5C6B64]">
                            Direct slot booking with Google Calendar availability
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMeetingModal(true)}
                        className="px-3.5 py-2 bg-white hover:bg-[#F5F3ED] border border-[#CAD8CE] text-xs sm:text-sm font-semibold rounded-lg cursor-pointer min-h-[36px] transition-colors shrink-0"
                      >
                        Preview Calendar
                      </button>
                    </div>

                    {/* Creator Tip Jar Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white text-[#52796F] border border-[#CAD8CE] flex items-center justify-center shrink-0">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#28352F]">
                            Stripe Direct Tip Jar with Champagne Confetti
                          </h4>
                          <p className="text-xs font-mono text-[#5C6B64]">
                            $5, $15, $50 fan support with custom notes &amp; confetti
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTipModal(true)}
                        className="px-3.5 py-2 bg-[#52796F] hover:bg-[#3D5C54] text-white text-xs sm:text-sm font-semibold rounded-lg cursor-pointer min-h-[36px] transition-colors shrink-0"
                      >
                        Test Tip Jar
                      </button>
                    </div>

                    {/* Live Social Proof Ticker Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white text-amber-600 border border-[#CAD8CE] flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#28352F]">
                              Live Social Proof Activity Ticker
                            </h4>
                            <p className="text-xs font-mono text-[#5C6B64]">
                              Subtle floating notifications (&ldquo;Sarah from London just downloaded...&rdquo;)
                            </p>
                          </div>
                        </div>

                        <Switch
                          checked={Boolean(currentProfile.socialProof?.enabled)}
                          onChange={(e) => setCurrentProfile({
                            ...currentProfile,
                            socialProof: {
                              ...(currentProfile.socialProof || {}),
                              enabled: e.target.checked
                            }
                          })}
                        />
                      </div>

                      {currentProfile.socialProof?.enabled && (
                        <div className="pt-2.5 border-t border-[#CAD8CE]/60 flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-xs text-[#5C6B64]">Notification Cycle Interval:</span>
                          <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
                            <div className="w-20">
                              <Input
                                size="sm"
                                type="number"
                                min={3}
                                max={30}
                                value={Math.round((currentProfile.socialProof?.intervalMs || 8000) / 1000)}
                                onChange={(e) => setCurrentProfile({
                                  ...currentProfile,
                                  socialProof: {
                                    ...(currentProfile.socialProof || {}),
                                    intervalMs: Math.max(3000, Number(e.target.value) * 1000)
                                  }
                                })}
                                className="text-center font-bold"
                              />
                            </div>
                            <span className="text-slate-500 font-sans">seconds</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 1-Click Tracking Pixels Hub Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white text-indigo-600 border border-[#CAD8CE] flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#28352F]">
                            1-Click Tracking Pixel Hub (Retargeting)
                          </h4>
                          <p className="text-xs font-mono text-[#5C6B64]">
                            Zero coding: Paste pixel IDs to retarget visitors on Meta, TikTok, Google &amp; Pinterest
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#CAD8CE]/70 text-xs sm:text-sm">
                        <div>
                          <Label htmlFor="pixel-meta">Meta (Facebook) Pixel ID</Label>
                          <Input
                            id="pixel-meta"
                            size="sm"
                            type="text"
                            placeholder="e.g. 123456789012345"
                            value={currentProfile.trackingPixels?.metaPixelId || ''}
                            onChange={(e) => setCurrentProfile({
                              ...currentProfile,
                              trackingPixels: {
                                ...(currentProfile.trackingPixels || {}),
                                metaPixelId: e.target.value.trim()
                              }
                            })}
                            className="font-mono"
                          />
                        </div>

                        <div>
                          <Label htmlFor="pixel-ga4">Google Analytics (GA4) ID</Label>
                          <Input
                            id="pixel-ga4"
                            size="sm"
                            type="text"
                            placeholder="e.g. G-XXXXXXXXXX"
                            value={currentProfile.trackingPixels?.ga4MeasurementId || ''}
                            onChange={(e) => setCurrentProfile({
                              ...currentProfile,
                              trackingPixels: {
                                ...(currentProfile.trackingPixels || {}),
                                ga4MeasurementId: e.target.value.trim()
                              }
                            })}
                            className="font-mono"
                          />
                        </div>

                        <div>
                          <Label htmlFor="pixel-tiktok">TikTok Pixel ID</Label>
                          <Input
                            id="pixel-tiktok"
                            size="sm"
                            type="text"
                            placeholder="e.g. CXXXXXXXXXXXXXXXXX"
                            value={currentProfile.trackingPixels?.tiktokPixelId || ''}
                            onChange={(e) => setCurrentProfile({
                              ...currentProfile,
                              trackingPixels: {
                                ...(currentProfile.trackingPixels || {}),
                                tiktokPixelId: e.target.value.trim()
                              }
                            })}
                            className="font-mono"
                          />
                        </div>

                        <div>
                          <Label htmlFor="pixel-pinterest">Pinterest Tag ID</Label>
                          <Input
                            id="pixel-pinterest"
                            size="sm"
                            type="text"
                            placeholder="e.g. 26XXXXXXXXXXXXX"
                            value={currentProfile.trackingPixels?.pinterestTagId || ''}
                            onChange={(e) => setCurrentProfile({
                              ...currentProfile,
                              trackingPixels: {
                                ...(currentProfile.trackingPixels || {}),
                                pinterestTagId: e.target.value.trim()
                              }
                            })}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FTC Affiliate Auto-Disclosure Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white text-emerald-700 border border-[#CAD8CE] flex items-center justify-center shrink-0">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#28352F]">
                              FTC Affiliate Auto-Disclosure
                            </h4>
                            <p className="text-xs font-mono text-[#5C6B64]">
                              1-toggle compliance badge keeping your bio compliant with international advertising laws
                            </p>
                          </div>
                        </div>

                        <Switch
                          checked={Boolean(currentProfile.compliance?.affiliateDisclosure)}
                          onChange={(e) => setCurrentProfile({
                            ...currentProfile,
                            compliance: {
                              ...(currentProfile.compliance || {}),
                              affiliateDisclosure: e.target.checked
                            }
                          })}
                        />
                      </div>

                      {currentProfile.compliance?.affiliateDisclosure && (
                        <div className="pt-3 border-t border-[#CAD8CE]/70 text-xs sm:text-sm">
                          <Label htmlFor="affiliate-disclosure-note">Custom Legal Disclosure Note</Label>
                          <Input
                            id="affiliate-disclosure-note"
                            size="sm"
                            type="text"
                            value={currentProfile.compliance?.disclosureText || ''}
                            onChange={(e) => setCurrentProfile({
                              ...currentProfile,
                              compliance: {
                                ...(currentProfile.compliance || {}),
                                disclosureText: e.target.value
                              }
                            })}
                            placeholder="This page contains affiliate links. I may earn a commission at no extra cost to you."
                          />
                        </div>
                      )}
                    </div>

                    {/* Profile Access Gate & Sensitive Content Notice Widget */}
                    <div className="p-3.5 sm:p-4 bg-[#F5F3ED] border border-[#CAD8CE] rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white text-[#52796F] border border-[#CAD8CE] flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-[#52796F]" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#28352F]">
                              Profile Access Gate (Passcode / 18+ Notice)
                            </h4>
                            <p className="text-xs font-mono text-[#5C6B64]">
                              Restrict profile viewing behind a passcode or require age / content confirmation
                            </p>
                          </div>
                        </div>

                        <Switch
                          checked={Boolean(currentProfile.accessGate?.enabled)}
                          onChange={(e) => setCurrentProfile({
                            ...currentProfile,
                            accessGate: {
                              ...(currentProfile.accessGate || {}),
                              enabled: e.target.checked,
                              type: currentProfile.accessGate?.type === 'none' ? 'passcode' : (currentProfile.accessGate?.type || 'passcode'),
                            }
                          })}
                        />
                      </div>

                      {currentProfile.accessGate?.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-[#CAD8CE]/70 text-xs sm:text-sm">
                          <div>
                            <Label htmlFor="gate-type-select">Gate Enforcement Type</Label>
                            <Select
                              id="gate-type-select"
                              size="sm"
                              value={currentProfile.accessGate?.type || 'passcode'}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                accessGate: {
                                  ...(currentProfile.accessGate || {}),
                                  type: e.target.value,
                                }
                              })}
                            >
                              <option value="passcode">Passcode Lock (PIN / Password Required)</option>
                              <option value="age_18">18+ Age Gate (Adult Content Confirmation)</option>
                              <option value="sensitive">Sensitive Content Warning (Click to Continue)</option>
                            </Select>
                          </div>

                          {currentProfile.accessGate?.type === 'passcode' && (
                            <div>
                              <Label htmlFor="gate-passcode" required>Profile Passcode</Label>
                              <Input
                                id="gate-passcode"
                                size="sm"
                                type="text"
                                placeholder="e.g. VIP2026 or 1234"
                                value={currentProfile.accessGate?.passcode || ''}
                                onChange={(e) => setCurrentProfile({
                                  ...currentProfile,
                                  accessGate: {
                                    ...(currentProfile.accessGate || {}),
                                    passcode: e.target.value,
                                  }
                                })}
                                className="font-mono font-bold"
                              />
                            </div>
                          )}

                          <div>
                            <Label htmlFor="gate-title">Gate Headline</Label>
                            <Input
                              id="gate-title"
                              size="sm"
                              type="text"
                              placeholder="e.g. Restricted VIP Profile"
                              value={currentProfile.accessGate?.title || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                accessGate: {
                                  ...(currentProfile.accessGate || {}),
                                  title: e.target.value,
                                }
                              })}
                            />
                          </div>

                          <div>
                            <Label htmlFor="gate-desc">Gate Instructions / Warning</Label>
                            <Input
                              id="gate-desc"
                              size="sm"
                              type="text"
                              placeholder="e.g. Enter your passcode to view exclusive content."
                              value={currentProfile.accessGate?.description || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                accessGate: {
                                  ...(currentProfile.accessGate || {}),
                                  description: e.target.value,
                                }
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Live Bio Preview */}
            <div className="xl:col-span-5 flex flex-col gap-2">
              <div className="bg-white border border-[#CAD8CE]/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col items-center">
                <PhoneMockup
                  profile={currentProfile}
                  onIncrementClick={handleMockupLinkClick}
                  onUpdateStickers={(newStickers) => {
                    setCurrentProfile((prev) => ({
                      ...prev,
                      designSettings: {
                        ...(prev.designSettings || {}),
                        stickers: newStickers,
                      },
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Interactive Global Modals */}

      {showLeadModal && (
        <LeadCaptureModal
          profile={currentProfile}
          onClose={() => setShowLeadModal(false)}
          onLeadSubmitted={() => {
            setToastMessage({
              type: 'success',
              text: 'Lead successfully captured and saved to contacts!',
            });
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {showMeetingModal && (
        <ScheduleMeetingModal
          profile={currentProfile}
          onClose={() => setShowMeetingModal(false)}
          onMeetingBooked={() => {
            setToastMessage({
              type: 'success',
              text: 'Meeting confirmed! Google Meet link generated and saved.',
            });
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {showTipModal && (
        <TipModal
          profile={currentProfile}
          onClose={() => setShowTipModal(false)}
        />
      )}

      {showAIOptimizer && (
        <AIOptimizerModal
          profile={currentProfile}
          ctrData={ctrData}
          onClose={() => setShowAIOptimizer(false)}
          onApplyBio={(bio) => setCurrentProfile({ ...currentProfile, bio })}
          onAutoOptimize={handleAutoOptimize}
        />
      )}

      {showCustomDomain && (
        <CustomDomainModal
          profile={currentProfile}
          onClose={() => setShowCustomDomain(false)}
        />
      )}

      {showQRCode && (
        <QRCodeModal
          profile={currentProfile}
          onClose={() => setShowQRCode(false)}
        />
      )}

      {showExportImport && (
        <ExportImportModal
          profile={currentProfile}
          onImportProfile={(p) => setCurrentProfile(p)}
          onClose={() => setShowExportImport(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          mode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(user, profile) => {
            setAuthUser(user);
            if (profile) setCurrentProfile(profile);
            setShowAuthModal(false);
            setToastMessage({
              type: 'success',
              text: `Welcome, @${user.username}! Signed in successfully.`,
            });
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* Phase 1: Link Marketplace Modal */}
      <LinkMarketplaceModal
        isOpen={showMarketplace}
        onClose={() => setShowMarketplace(false)}
        onSelectApp={handleMarketplaceAddLink}
        onAddLink={handleMarketplaceAddLink}
        onCreateCollection={() => {
          setActiveTab('links');
          setIsAddingCollection(true);
          setEditingCollectionId(null);
          setCollectionForm({
            title: '',
            viewMode: 'list',
          });
        }}
      />

      {/* Thumbnail Selector Popover */}
      <ThumbnailPopover
        isOpen={showThumbnailModal}
        onClose={() => {
          setShowThumbnailModal(false);
          setActiveThumbnailLink(null);
        }}
        link={activeThumbnailLink}
        onUpdateThumbnail={handleUpdateThumbnail}
      />

      {/* Alternative Title Font Modal (48 Fonts) */}
      <TitleFontModal
        isOpen={showTitleFontModal}
        onClose={() => setShowTitleFontModal(false)}
        selectedFont={getTitleFontName(currentProfile.alternativeTitleFont)}
        onSelectFont={handleSelectAlternativeTitleFont}
      />

      {/* Add Product Modal (Shop Sub-System with Scraper) */}
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        collections={currentProfile.collections || []}
        onAddProduct={handleAddProduct}
      />

      {/* Phase 2: Sticky Unsaved Changes Bar with Undo/Redo */}
      <UnsavedChangesBar
        isDirty={isDirty}
        onSave={handleSaveProfile}
        onDiscard={handleDiscardChanges}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        isSaving={isSaving}
      />
    </div>
  );
}
