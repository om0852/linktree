'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
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
import { endSignedOutSession } from '@/lib/workspaceStore';
import PhoneMockup from '../components/Preview/PhoneMockup';
import { getReadableThemeColors, getReadableButtonText, getThemeAppearance, getPresetWallpaper } from '@/lib/theme-contrast';
import ThemeCard from '../components/Builder/ThemeCard';
import TemplateCard from '../components/Builder/TemplateCard';
import { PROFILE_TEMPLATES } from '../constants/templates';
import { applyThemeToProfile, applyTemplateToProfile } from '@/lib/profileDesign';
import { GEO_COUNTRIES } from '@/lib/geoTargeting';
import { 
  DEFAULT_EMPTY_PROFILE, 
  THEME_PRESETS, 
  AVATAR_SHAPES,
  CURATED_THEMES,
  STICKER_PACKS,
  GOOGLE_FONTS_LIST,
  getTitleFontName,
  getFontStack,
  PAGE_FONTS,
  LINK_HIGHLIGHTS,
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
  CardTitle,
  Toolbar,
  PillTab,
  ToolbarPill,
  SettingRow,
  Toggle,
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
  ChevronUp,
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
} from '@/components/icons';
import PaletteSuggester from '../components/Builder/PaletteSuggester';
import { detectEmbed } from '../utils/embedDetector';

/** Creatosaurus secondary button (AccountDeletePopup Cancel). */
const secondaryButton =
  'flex h-[34px] items-center rounded-[5px] border-[0.5px] border-[#C4C4C4] bg-[#F8F8F9] px-[12px] text-[12px] font-medium text-[#333333] hover:border-[#404040] hover:text-black';

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

// Links store the renderer's icon names (ICON_MAP keys such as "Music"); the
// editor list draws Material Symbols, which need their own names.
const MATERIAL_SYMBOLS = {
  Video: 'videocam', Star: 'star', Mail: 'mail', FileText: 'description', Music: 'music_note',
  ShoppingBag: 'shopping_bag', Zap: 'bolt', Briefcase: 'work', BookOpen: 'menu_book', Calendar: 'calendar_month',
  MessageSquare: 'chat', TrendingUp: 'trending_up', Ticket: 'confirmation_number', Globe: 'public',
  Youtube: 'smart_display', Instagram: 'photo_camera', Twitter: 'alternate_email', Linkedin: 'work',
  Spotify: 'headphones', Imdb: 'movie',
};
function toMaterialSymbol(icon) {
  if (!icon) return 'link';
  if (MATERIAL_SYMBOLS[icon]) return MATERIAL_SYMBOLS[icon];
  return /^[a-z_]+$/.test(icon) ? icon : 'link';
}

// Random theme other than the active one (called from the shuffle button).
function pickRandomTheme(themes, currentId) {
  const choices = themes.filter((theme) => theme.id !== currentId);
  return choices[Math.floor(Math.random() * choices.length)] || themes[0];
}

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
  const [history, setHistory] = useState([DEFAULT_EMPTY_PROFILE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRedoingRef = useRef(false);

  // Link addition & editing state
  const [isAddingLink, setIsAddingLinkState] = useState(false);
  const [editingLinkId, setEditingLinkIdState] = useState(null);
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
  const [isAddingCollection, setIsAddingCollectionState] = useState(false);
  const [editingCollectionId, setEditingCollectionIdState] = useState(null);

  // The link form and the collection form share one slot: opening either one
  // closes the other, so the form the user just asked for is the one shown.
  const closeCollectionForm = () => {
    setIsAddingCollectionState(false);
    setEditingCollectionIdState(null);
  };
  const closeLinkForm = () => {
    setIsAddingLinkState(false);
    setEditingLinkIdState(null);
  };
  const setIsAddingLink = (value) => {
    if (value) closeCollectionForm();
    setIsAddingLinkState(value);
  };
  const setEditingLinkId = (id) => {
    if (id) closeCollectionForm();
    setEditingLinkIdState(id);
  };
  const setIsAddingCollection = (value) => {
    if (value) closeLinkForm();
    setIsAddingCollectionState(value);
  };
  const setEditingCollectionId = (id) => {
    if (id) closeLinkForm();
    setEditingCollectionIdState(id);
  };
  const linkFormRef = useRef(null);
  const collectionFormRef = useRef(null);
  const showLinkForm = Boolean(isAddingLink || editingLinkId);
  const showCollectionForm = Boolean(isAddingCollection || editingCollectionId);

  // Bring the form that just opened into view inside the page card.
  useEffect(() => {
    if (showLinkForm) linkFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showLinkForm, editingLinkId]);
  useEffect(() => {
    if (showCollectionForm) collectionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showCollectionForm, editingCollectionId]);
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
          // Signed in but no profile yet: start from the empty profile.
          setSavedSnapshot(JSON.stringify(DEFAULT_EMPTY_PROFILE));
          setHistory([DEFAULT_EMPTY_PROFILE]);
          setHistoryIndex(0);
          return;
        }

        // No valid session: the proxy normally shows the landing page instead,
        // so this only happens when the account is gone or the session ended.
        endSignedOutSession();
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
  }, [currentProfile, history, historyIndex]);

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
  const ALL_THEMES = [...THEME_PRESETS, ...CURATED_THEMES];
  const DESIGN_SECTION_TITLES = {
    templates: 'Templates', profile: 'Profile & header', theme: 'Theme', wallpaper: 'Wallpaper', buttons: 'Buttons',
    text: 'Fonts', colors: 'Colors', stickers: 'Stickers', footer: 'Footer',
  };

  // Random theme from both libraries, never the one already active. Every
  // theme passes the contrast audit (src/lib/theme-contrast.js).
  const handleThemeShuffle = () => {
    const picked = pickRandomTheme(ALL_THEMES, currentProfile.theme);
    handleApplyThemePreset(picked);
    setToastMessage({ type: 'success', text: `Theme changed to "${picked.name}"` });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyThemePreset = (preset) => {
    setCurrentProfile((prev) => applyThemeToProfile(prev, preset));
  };

  // A template = theme + fonts + header + avatar + button corners, plus
  // starter links and bio for a profile that has none yet.
  const handleApplyTemplate = (template) => {
    setCurrentProfile((prev) => applyTemplateToProfile(prev, template));
    setToastMessage({ type: 'success', text: `"${template.name}" template applied. Replace the starter links with your own.` });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const setDesignColor = (key, value) => {
    setCurrentProfile((prev) => {
      const ds = prev.designSettings || {};
      if (key === 'title' || key === 'pageText') {
        return { ...prev, designSettings: { ...ds, customColors: { ...(ds.customColors || {}), [key]: value } } };
      }
      return { ...prev, designSettings: { ...ds, [key]: value } };
    });
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
      highlight: link.highlight || 'none',
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
    <div className="bg-canvas text-ink-700 antialiased min-h-screen">
      {/* High-Visibility Modern Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full animate-fadeIn shadow-modal transition-all">
          <div className={`p-[15px] rounded-[10px] border flex items-start gap-3 text-[12px]  font-medium ${
            toastMessage.type === 'success'
              ? 'bg-ink-900 border-brand-500 text-white'
              : toastMessage.type === 'info'
              ? 'bg-ink-900 border-line text-white'
              : 'bg-rose-950 border-rose-500 text-rose-100'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
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
                  className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 underline mt-1.5 text-[12px]"
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

      {/* Main Content Workspace Container */}
      <div className="lg:pl-[280px] h-screen overflow-hidden bg-canvas flex flex-col">
        {/* TreeInBio Top Header */}

        {/* Main Studio Viewport */}
        <main style={{ height: 'calc(100vh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
        <AtelierHeader
          title="Studio"
          mobileOpen={mobileSidebarOpen}
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
        <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
          <Toolbar
            left={
              <>
                <PillTab active={activeTab === 'links'} onClick={() => setActiveTab('links')}>Links</PillTab>
                <PillTab active={activeTab === 'style'} onClick={() => setActiveTab('style')}>Design</PillTab>
                <PillTab active={activeTab === 'widgets'} onClick={() => setActiveTab('widgets')}>Widgets</PillTab>
              </>
            }
            right={
              <>
                <button
                  type="button"
                  onClick={handleCopyBioUrl}
                  title="Copy bio link"
                  className="flex h-[34px] max-w-[260px] items-center gap-[6px] rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-white px-[10px] text-[12px] text-[#333333] hover:bg-[#F8F8F9BF]"
                >
                  <span className="truncate"><span className="text-[#808080]">treeinbio.me/</span>{currentProfile.username}</span>
                  {copiedBioUrl ? <Check size={14} color="#16A34A" /> : <Copy size={14} className="text-[#808080]" />}
                </button>
                <ToolbarPill onClick={handleAutoOptimize} title={`Engagement score ${ctrData.score}%. Apply a layout and theme tuned for clicks.`}>
                  Optimize
                </ToolbarPill>
              </>
            }
          />

          {activeTab === 'links' && (
            <div className="flex flex-wrap items-center gap-[10px]">
              <button
                type="button"
                onClick={() => setShowMarketplace(true)}
                className="flex h-[34px] items-center rounded-[5px] bg-black px-[7px] pr-[12px] text-[14px] text-white"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4.16699V15.8337M4.16669 10.0003H15.8334" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="ml-[10px]">Add to Bio</span>
              </button>
              <button
                type="button"
                className={secondaryButton}
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
              </button>
              <button
                type="button"
                className={secondaryButton}
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
              </button>
              <button
                type="button"
                className={secondaryButton}
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
              </button>
            </div>
          )}


          {/* 12-Column Responsive Split */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Architecture & Parameters */}
            <div className="xl:col-span-7 flex flex-col gap-6">
              {/* Tab 1: Links & Cards */}
              {activeTab === 'links' && (
                <>
                  {/* Inline Link Creator/Editor Form */}
                  {showLinkForm && (
                    <form
                      ref={linkFormRef}
                      onSubmit={handleSaveLinkForm}
                      className="scroll-mt-[15px] bg-white border-[0.5px] border-[#dcdcdc] rounded-[10px] p-[15px] flex flex-col gap-[15px] animate-fade-in"
                    >
                      <div className="flex items-center justify-between pb-2 border-b-[0.5px] border-line">
                        <span className="font-sans font-semibold text-[12px] text-ink-700">
                          {editingLinkId ? 'Edit Link' : 'Add New Link'}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setIsAddingLink(false);
                            setEditingLinkId(null);
                          }}
                          className="text-[12px]"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[12px]">
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
                            className=""
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

                        <div className="md:col-span-2">
                          <Label className="mb-1.5 block">Highlight</Label>
                          <div className="flex flex-wrap gap-[8px]" role="radiogroup" aria-label="Link highlight">
                            {LINK_HIGHLIGHTS.map((fx) => {
                              const active = (linkForm.highlight || 'none') === fx.id;
                              return (
                                <button
                                  key={fx.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={active}
                                  onClick={() => setLinkForm({ ...linkForm, highlight: fx.id })}
                                  className={`flex h-[30px] items-center rounded-[50px] border-[0.5px] px-[12px] text-[12px] ${active ? 'border-black bg-[#F8F8F9BF] text-black' : 'border-[#DCDCDC] bg-white text-[#333333] hover:bg-[#F8F8F9BF]'}`}
                                >
                                  <span className={fx.id === 'none' ? '' : `link-fx link-fx-${fx.id} rounded-[50px] px-[6px]`} style={{ '--link-fx-color': '#16A34A' }}>{fx.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-[#808080] mt-1">Draws attention to this link on your page. Use it on one or two links.</p>
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
                              className="font-semibold"
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
                            className=""
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
                      <div className="flex flex-col gap-1.5 pt-1 border-t-[0.5px] border-line">
                        {/* 1. Lead Magnet Lock to Unlock Accordion */}
                        <div className="rounded-[5px] border-[0.5px] border-line bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'magnet' ? null : 'magnet')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-[12px] text-ink-700 hover:bg-surface-2 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Lock size={13} className={linkForm.leadMagnet?.enabled ? 'text-amber-600' : 'text-ink-500'} />
                              <span>Lead Magnet &ldquo;Lock to Unlock&rdquo;</span>
                              {linkForm.leadMagnet?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-semibold">
                                  ACTIVE LOCK
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-500">
                              {openLinkAccordion === 'magnet' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'magnet' && (
                            <div className="p-2.5 bg-surface-2/70 border-t-[0.5px] border-line flex flex-col gap-2 text-[12px]">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(linkForm.leadMagnet?.enabled)}
                                  onChange={(e) => setLinkForm({
                                    ...linkForm,
                                    leadMagnet: { ...(linkForm.leadMagnet || {}), enabled: e.target.checked }
                                  })}
                                  className="rounded border-line text-brand-500 focus:ring-brand-500"
                                />
                                <span className="font-semibold text-ink-700">
                                  Require Email or WhatsApp to unlock this download
                                </span>
                              </label>

                              {linkForm.leadMagnet?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t-[0.5px] border-line">
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
                                      className=""
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
                                        className="rounded border-line text-brand-500"
                                      />
                                      <span className="text-[11px] text-ink-700">Require Email Address</span>
                                    </label>

                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(linkForm.leadMagnet?.requireWhatsApp)}
                                        onChange={(e) => setLinkForm({
                                          ...linkForm,
                                          leadMagnet: { ...(linkForm.leadMagnet || {}), requireWhatsApp: e.target.checked }
                                        })}
                                        className="rounded border-line text-brand-500"
                                      />
                                      <span className="text-[11px] text-ink-700">Require WhatsApp / Phone</span>
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 2. In-Page Media Player Preview Accordion */}
                        <div className="rounded-[5px] border-[0.5px] border-line bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'embed' ? null : 'embed')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-[12px] text-ink-700 hover:bg-surface-2 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Music size={13} className={linkForm.embed?.enabled ? 'text-brand-600' : 'text-ink-500'} />
                              <span>In-Page Media Preview (Zero Tab-Switching)</span>
                              {linkForm.embed?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-800 font-semibold">
                                  {linkForm.embed.platform}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-500">
                              {openLinkAccordion === 'embed' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'embed' && (
                            <div className="p-2.5 bg-surface-2/70 border-t-[0.5px] border-line flex flex-col gap-2 text-[12px]">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(linkForm.embed?.enabled)}
                                    onChange={(e) => setLinkForm({
                                      ...linkForm,
                                      embed: { ...(linkForm.embed || {}), enabled: e.target.checked }
                                    })}
                                    className="rounded border-line text-brand-500"
                                  />
                                  <span className="font-semibold text-ink-700">
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
                                  className="text-[10px] font-semibold text-brand-500 hover:underline flex items-center gap-1"
                                >
                                  <Sparkles size={11} /> Auto-Detect from URL
                                </button>
                              </div>

                              {linkForm.embed?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t-[0.5px] border-line">
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
                                      className=""
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 3. Time-Sensitive Flash Links Accordion */}
                        <div className="rounded-[5px] border-[0.5px] border-line bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'schedule' ? null : 'schedule')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-[12px] text-ink-700 hover:bg-surface-2 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Clock size={13} className={linkForm.schedule?.enabled ? 'text-blue-600' : 'text-ink-500'} />
                              <span>Time-Sensitive Flash Link (Countdown Badge)</span>
                              {linkForm.schedule?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-semibold">
                                  SCHEDULED
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-500">
                              {openLinkAccordion === 'schedule' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'schedule' && (
                            <div className="p-3 bg-surface-2/70 border-t-[0.5px] border-line flex flex-col gap-2.5 text-[12px]">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(linkForm.schedule?.enabled)}
                                  onChange={(e) => setLinkForm({
                                    ...linkForm,
                                    schedule: { ...(linkForm.schedule || {}), enabled: e.target.checked }
                                  })}
                                  className="rounded border-line text-brand-500"
                                />
                                <span className="font-semibold text-ink-700">
                                  Auto-show / auto-hide link with active countdown timer
                                </span>
                              </label>

                              {linkForm.schedule?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t-[0.5px] border-line">
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
                        <div className="rounded-[5px] border-[0.5px] border-line bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenLinkAccordion(openLinkAccordion === 'geo' ? null : 'geo')}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-[12px] text-ink-700 hover:bg-surface-2 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Globe size={13} className={linkForm.geoTargeting?.enabled ? 'text-teal-600' : 'text-ink-500'} />
                              <span>Country &amp; Geo-Targeting Rules</span>
                              {linkForm.geoTargeting?.enabled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-semibold">
                                  {linkForm.geoTargeting.countries?.length || 0} Countries
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-ink-500">
                              {openLinkAccordion === 'geo' ? '▲ Hide' : '▼ Configure'}
                            </span>
                          </button>

                          {openLinkAccordion === 'geo' && (
                            <div className="p-3 bg-surface-2/70 border-t-[0.5px] border-line flex flex-col gap-2.5 text-[12px]">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(linkForm.geoTargeting?.enabled)}
                                  onChange={(e) => setLinkForm({
                                    ...linkForm,
                                    geoTargeting: { ...(linkForm.geoTargeting || {}), enabled: e.target.checked }
                                  })}
                                  className="rounded border-line text-brand-500"
                                />
                                <span className="font-semibold text-ink-700">
                                  Show or hide this link based on visitor&rsquo;s country
                                </span>
                              </label>

                              {linkForm.geoTargeting?.enabled && (
                                <div className="space-y-3 pt-2 border-t-[0.5px] border-line">
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
                                      {GEO_COUNTRIES.map((country) => {
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
                                            className={`px-2 py-1.5 rounded-[5px] border text-left text-[12px] flex items-center justify-between transition-all cursor-pointer ${
                                              isSelected
                                                ? 'bg-brand-500 text-white border-brand-600 font-semibold '
                                                : 'bg-white text-ink-700 border-line hover:bg-surface-2'
                                            }`}
                                          >
                                            <span className="flex items-center gap-1.5">
                                              <span>{country.flag}</span>
                                              <span className="truncate">{country.name}</span>
                                            </span>
                                            {isSelected && <span className="font-semibold">✓</span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="text-[10px] text-ink-500 mt-1.5">
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
                          <Label htmlFor="link-icon-select" className="mb-0 text-[12px] font-semibold text-ink-500">Icon:</Label>
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
                  {showCollectionForm && (
                    <form
                      ref={collectionFormRef}
                      onSubmit={handleSaveCollection}
                      className="scroll-mt-[15px] bg-white border-[0.5px] border-[#dcdcdc] rounded-[10px] p-[15px] flex flex-col gap-[15px] animate-fade-in"
                    >
                      <div className="flex items-center justify-between pb-2 border-b-[0.5px] border-line">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-brand-500" />
                          <span className="font-sans font-semibold text-[12px] text-ink-700">
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
                          className="text-[12px]"
                        >
                          Cancel
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[12px]">
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
                          <span className="text-[11px] text-ink-500 font-medium mr-1">Quick Carousel Presets:</span>
                          <button
                            type="button"
                            onClick={() => setCollectionForm({
                              title: 'Instagram Posts & Reels',
                              viewMode: 'carousel',
                              type: 'instagram'
                            })}
                            className="px-2.5 py-1 rounded-[5px] text-[11px] font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 cursor-pointer transition-colors flex items-center gap-1"
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
                            className="px-2.5 py-1 rounded-[5px] text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer transition-colors flex items-center gap-1"
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
                            className="px-2.5 py-1 rounded-[5px] text-[11px] font-semibold bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 cursor-pointer transition-colors flex items-center gap-1"
                          >
                            🛍️ Amaze Store Carousel
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-ink-500">
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
                    <div className="bg-white border-[0.5px] border-line rounded-[10px] p-[15px] flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2.5 border-b-[0.5px] border-line">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-brand-500" />
                          <h3 className="text-[14px] font-sans font-semibold text-ink-700">Active Collections</h3>
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
                          className="text-brand-500"
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
                              className="p-3 rounded-[10px] bg-surface-2/80 border-[0.5px] border-line flex flex-col justify-between gap-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-[5px] bg-white border-[0.5px] border-line flex items-center justify-center text-brand-500 shrink-0 font-semibold">
                                    <Folder className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-[12px] text-ink-700 block truncate">
                                      {col.title}
                                    </span>
                                    <span className="text-[10px] text-ink-500">
                                      {linksInCol.length} link{linksInCol.length === 1 ? '' : 's'} assigned
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-ink-500">
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
                                    className="p-1 hover:text-ink-700 hover:bg-white rounded transition-colors"
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
                              <div className="flex items-center gap-1.5 pt-1.5 border-t-[0.5px] border-line">
                                <span className="text-[10px] text-ink-500 font-medium mr-1">View:</span>
                                {[
                                  { id: 'list', label: 'List' },
                                  { id: 'grid', label: 'Grid' },
                                  { id: 'carousel', label: 'Carousel' },
                                ].map((mode) => (
                                  <button
                                    key={mode.id}
                                    type="button"
                                    onClick={() => handleUpdateCollectionViewMode(col.id, mode.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                      (col.viewMode || 'list') === mode.id
                                        ? 'bg-brand-500 text-white '
                                        : 'bg-white text-ink-500 border-[0.5px] border-line hover:text-ink-700'
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
                  <div className="bg-white border-[0.5px] border-line rounded-[10px] p-[15px] flex flex-col gap-5">
                    {/* Content toolbar: Links | Shop on the left, Active | Archived (or Add Product) on the right */}
                    <div className="flex items-center justify-between gap-[10px] flex-wrap pb-[15px] border-b-[0.5px] border-line">
                      <div className="flex items-center gap-[8px]">
                        {[
                          { id: 'links', label: 'Links', icon: Share2, count: (currentProfile.links || []).filter((l) => !l.isArchived).length },
                          { id: 'shop', label: 'Shop', icon: ShoppingBag, count: (currentProfile.shop?.products || []).length },
                        ].map((tab) => {
                          const TabIcon = tab.icon;
                          const active = contentSubTab === tab.id;
                          return (
                            <PillTab key={tab.id} active={active} onClick={() => handleContentSubTabSwitch(tab.id)} className="gap-[6px] !px-[12px]">
                              <TabIcon className={`w-[14px] h-[14px] ${active ? 'text-black' : 'text-[#808080]'}`} />
                              <span>{tab.label}</span>
                              <span className={`min-w-[18px] rounded-[50px] px-[5px] text-center text-[10px] leading-[16px] ${active ? 'bg-black text-white' : 'bg-[#F0F0F0] text-[#808080]'}`}>
                                {tab.count}
                              </span>
                            </PillTab>
                          );
                        })}
                      </div>

                      {contentSubTab === 'links' ? (
                        <div className="flex items-center rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] p-[3px]" role="tablist" aria-label="Link filter">
                          {[
                            { id: 'active', label: 'Active', icon: null, count: (currentProfile.links || []).filter((l) => !l.isArchived).length },
                            { id: 'archived', label: 'Archived', icon: Archive, count: (currentProfile.links || []).filter((l) => l.isArchived).length },
                          ].map((filter) => {
                            const FilterIcon = filter.icon;
                            const active = linkFilterTab === filter.id;
                            return (
                              <button
                                key={filter.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setLinkFilterTab(filter.id)}
                                className={`flex h-[26px] items-center gap-[5px] rounded-[50px] px-[10px] text-[11px] transition-colors ${
                                  active ? 'bg-white text-black shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-[0.5px] border-[#DCDCDC]' : 'text-[#808080] hover:text-[#333333]'
                                }`}
                              >
                                {FilterIcon ? <FilterIcon className="w-[12px] h-[12px]" /> : <span className={`h-[6px] w-[6px] rounded-full ${active ? 'bg-[#16A34A]' : 'bg-[#C4C4C4]'}`} />}
                                <span>{filter.label}</span>
                                <span className="text-[10px] text-[#AAAAAA]">{filter.count}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddProductModal(true)}
                          className="flex h-[30px] items-center gap-[6px] rounded-[50px] bg-[#16A34A] px-[12px] text-[12px] text-white hover:bg-[#15803D]"
                        >
                          <Plus className="w-[14px] h-[14px]" /> Add product
                        </button>
                      )}
                    </div>

                    {/* Active Links List */}
                    {linkFilterTab === 'active' && (
                      <div className="flex flex-col gap-[10px]">
                        {currentProfile.leadCapture?.enabled !== false && (
                          <div className="rounded-[10px] border-[0.5px] border-[#dcdcdc] p-[15px]">
                            <SettingRow
                              title={currentProfile.leadCapture?.title || "Let's Connect"}
                              description={currentProfile.leadCapture?.subtitle || 'Contact form on your bio. Submissions appear in Leads.'}
                            >
                              <button type="button" onClick={() => setShowLeadModal(true)} className="text-[12px] text-[#16A34A] hover:underline">
                                Preview
                              </button>
                              <Link href="/leads" className="text-[12px] text-[#16A34A] hover:underline">Leads</Link>
                              <Toggle
                                checked={currentProfile.leadCapture?.enabled !== false}
                                label="Show contact form"
                                onChange={(checked) => setCurrentProfile(prev => ({
                                  ...prev,
                                  leadCapture: {
                                    ...(prev.leadCapture || {}),
                                    enabled: checked
                                  }
                                }))}
                              />
                            </SettingRow>
                          </div>
                        )}

                        {(currentProfile.links || []).filter(l => !l.isArchived).length === 0 ? (
                          <div className="flex flex-col items-center justify-center px-[20px] py-[40px] text-center">
                            <p className="text-[14px] font-semibold">No links yet</p>
                            <p className="mt-[4px] max-w-[280px] text-[12px] leading-[1.6] text-[#808080]">Add your first link, video, product or form.</p>
                            <button
                              type="button"
                              onClick={() => setShowMarketplace(true)}
                              className="mt-[10px] rounded-[50px] bg-[#16A34A] px-[29px] py-[8px] text-[12px] font-medium text-white hover:bg-[#15803D]"
                            >
                              Add to Bio
                            </button>
                          </div>
                        ) : (
                          (currentProfile.links || []).filter(l => !l.isArchived).map((link, idx, activeLinks) => {
                            const iconSymbol = toMaterialSymbol(link.icon);
                            const isEditingTitle = inlineEditingLinkId === link.id;

                            return (
                              <div
                                key={link.id || idx}
                                className={`group flex items-center justify-between gap-[10px] rounded-[10px] border-[0.5px] border-[#dcdcdc] bg-white px-[12px] py-[10px] transition-colors hover:bg-[#F8F8F9] ${link.disabled ? 'opacity-60' : ''}`}
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                                  <div className="flex shrink-0 flex-col text-[#808080]">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveLink(idx, 'up')}
                                      disabled={idx === 0}
                                      className="hover:text-black disabled:opacity-20"
                                      title="Move up"
                                      aria-label="Move up"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveLink(idx, 'down')}
                                      disabled={idx === activeLinks.length - 1}
                                      className="hover:text-black disabled:opacity-20"
                                      title="Move down"
                                      aria-label="Move down"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveThumbnailLink(link);
                                      setShowThumbnailModal(true);
                                    }}
                                    className="group/thumb relative flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-[#f5f5f5] text-[#333333]"
                                    title="Change thumbnail"
                                  >
                                    {link.thumbnailType === 'image' && link.thumbnail ? (
                                      <img src={link.thumbnail} alt="" className="h-full w-full object-cover" />
                                    ) : link.thumbnailType === 'icon' && link.thumbnail && !link.thumbnail.startsWith('http') && !link.thumbnail.startsWith('data:') ? (
                                      <span className="text-[18px]">{link.thumbnail}</span>
                                    ) : (
                                      <span className="material-symbols-outlined text-[18px] group-hover/thumb:hidden">{iconSymbol}</span>
                                    )}
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100">
                                      <ImagePlus size={16} />
                                    </span>
                                  </button>

                                  <div className="flex min-w-0 flex-1 flex-col">
                                    {isEditingTitle ? (
                                      <div className="flex w-full max-w-md items-center gap-[6px]">
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
                                            className="w-full rounded-[5px] border-[0.5px] border-[#404040] bg-[#FAFAFA] px-[10px] py-[5px] pr-[44px] text-[12px] outline-none"
                                            placeholder="Link title"
                                          />
                                          <span className={`absolute right-[8px] top-1/2 -translate-y-1/2 text-[10px] ${inlineTitleDraft.length >= 35 ? 'text-[#FF4359]' : 'text-[#808080]'}`}>
                                            {inlineTitleDraft.length}/35
                                          </span>
                                        </div>
                                        <button type="button" onClick={() => handleSaveInlineTitle(link.id)} title="Save" aria-label="Save title" className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#16A34A] text-white">
                                          <Check size={14} />
                                        </button>
                                        <button type="button" onClick={handleCancelInlineTitle} title="Cancel" aria-label="Cancel" className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#F8F8F9] text-[#333333]">
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex min-w-0 items-center gap-[6px]">
                                        <span
                                          onDoubleClick={() => handleStartInlineEdit(link)}
                                          className="max-w-[280px] cursor-text truncate text-[12px] font-medium text-[#333333]"
                                          title={link.title}
                                        >
                                          {link.title}
                                        </span>
                                        {link.badge && (
                                          <span className="shrink-0 rounded-[3px] bg-[#EEEEEE] px-[4px] py-[1px] text-[9px] font-medium text-[#888888]">{link.badge}</span>
                                        )}
                                        {link.geoTargeting?.enabled && (
                                          <span className="shrink-0 rounded-[3px] bg-[#EEEEEE] px-[4px] py-[1px] text-[9px] font-medium text-[#888888]" title={`Shown in: ${(link.geoTargeting.countries || []).join(', ') || 'selected countries'}`}>
                                            Geo
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <span className="truncate text-[10px] text-[#b0b0b0]" title={link.url}>
                                      {link.subtitle || link.url || 'No destination'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-[10px]">
                                  <span className="hidden text-[12px] tabular-nums text-[#333333] sm:inline" title="Clicks">{link.clicks || 0}</span>
                                  <Toggle checked={!link.disabled} onChange={() => handleToggleLink(link.id)} label="Show link" />
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLink(link)}
                                    title="Edit link"
                                    aria-label="Edit link"
                                    className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#808080] hover:bg-[#16A34A1A] hover:text-[#16A34A]"
                                  >
                                    <Sliders size={16} />
                                  </button>

                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveLinkMenuId(activeLinkMenuId === link.id ? null : link.id);
                                      }}
                                      title="More"
                                      aria-label="More actions"
                                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#808080] hover:bg-[#F8F8F9] hover:text-[#333333]"
                                    >
                                      <MoreVertical size={16} />
                                    </button>

                                    {activeLinkMenuId === link.id && (
                                      <div
                                        className="absolute right-0 top-[calc(100%+4px)] z-40 w-[200px] rounded-[10px] border-[0.5px] border-[#DCDCDC] bg-white p-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] animate-fade-in"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <p className="mb-[4px] border-b-[0.5px] border-[#DCDCDC] px-[8px] pb-[6px] text-[12px] font-medium">Options</p>
                                        <button
                                          type="button"
                                          onClick={() => { setActiveLinkMenuId(null); handleStartInlineEdit(link); }}
                                          className="w-full rounded-[5px] px-[8px] py-[6px] text-left text-[12px] hover:bg-[#F8F8F9]"
                                        >
                                          Rename
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleToggleLink(link.id); setActiveLinkMenuId(null); }}
                                          className="w-full rounded-[5px] px-[8px] py-[6px] text-left text-[12px] hover:bg-[#F8F8F9]"
                                        >
                                          {link.disabled ? 'Show' : 'Hide'}
                                        </button>
                                        {(currentProfile.collections || []).length > 0 && (
                                          <label className="block px-[8px] py-[6px]">
                                            <span className="mb-[4px] block text-[10px] text-[#808080]">Collection</span>
                                            <select
                                              value={link.collectionId || ''}
                                              onChange={(e) => { handleAssignLinkToCollection(link.id, e.target.value); setActiveLinkMenuId(null); }}
                                              className="h-[28px] w-full rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-white px-[6px] text-[12px] outline-none"
                                            >
                                              <option value="">None</option>
                                              {(currentProfile.collections || []).map((c) => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                              ))}
                                            </select>
                                          </label>
                                        )}
                                        <div className="my-[4px] h-[0.5px] bg-[#DCDCDC]" />
                                        <button
                                          type="button"
                                          onClick={() => { handleArchiveLink(link.id); setActiveLinkMenuId(null); }}
                                          className="w-full rounded-[5px] px-[8px] py-[6px] text-left text-[12px] hover:bg-[#F8F8F9]"
                                        >
                                          Archive
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { handleDeleteLink(link.id); setActiveLinkMenuId(null); }}
                                          className="w-full rounded-[5px] px-[8px] py-[6px] text-left text-[12px] text-[#FF4359] hover:bg-[#FFEDEF]"
                                        >
                                          Delete
                                        </button>
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
                          <div className="p-8 text-center border-2 border-dashed border-line rounded-[10px] flex flex-col items-center justify-center gap-2 text-ink-500">
                            <Archive className="w-8 h-8 text-ink-500/50" />
                            <p className="text-[12px] font-semibold text-ink-700">No archived links</p>
                            <p className="text-[12px] max-w-sm">
                              Archiving a link hides it from your public bio without losing its historical click metrics and traffic stats.
                            </p>
                          </div>
                        ) : (
                          (currentProfile.links || []).filter(l => l.isArchived).map((link) => (
                            <div
                              key={link.id}
                              className="p-3.5 rounded-[10px] flex items-center justify-between gap-3 bg-stone-50 border border-stone-200"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-[5px] bg-stone-200/80 border border-stone-300 flex items-center justify-center shrink-0 text-stone-500">
                                  <Archive className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-semibold text-stone-700 truncate line-through">
                                      {link.title}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                      ARCHIVED
                                    </span>
                                  </div>
                                  <span className="text-[12px] text-stone-500 truncate">
                                    {link.url} • <strong className="text-stone-700">{link.clicks || 0} historical clicks preserved</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleRestoreLink(link.id)}
                                  className="px-3 py-1.5 rounded-[5px] bg-brand-500 hover:bg-brand-600 text-white font-semibold text-[12px] flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Restore Link to Active Bio"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePermanentDeleteLink(link.id)}
                                  className="p-1.5 rounded-[5px] hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                        <div className={`p-[15px] rounded-[10px] border flex items-center justify-between gap-4 transition-all ${
                          currentProfile.shop?.published
                            ? 'bg-brand-50/80 border-brand-300'
                            : 'bg-surface-2 border-line'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                              currentProfile.shop?.published ? 'bg-brand-500 text-white ' : 'bg-brand-100 text-ink-500'
                            }`}>
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-[14px] font-semibold text-ink-700">Publish your Shop</h3>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  currentProfile.shop?.published
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-stone-200 text-stone-600'
                                }`}>
                                  {currentProfile.shop?.published ? 'Live on Bio' : 'Hidden'}
                                </span>
                              </div>
                              <p className="text-[12px] text-ink-500 mt-0.5">
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
                          <span className="font-semibold text-[12px] text-ink-700">
                            Products ({(currentProfile.shop?.products || []).length})
                          </span>
                          <Button
                            variant="primary"
                            size="xs"
                            leftIcon={Plus}
                            onClick={() => setShowAddProductModal(true)}
                            className="bg-brand-500 text-white"
                          >
                            Add Product
                          </Button>
                        </div>

                        {/* 2x3 Skeleton Loaders during sub-tab transition */}
                        {isShopTransitioning ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map((sk) => (
                              <div key={sk} className="h-44 rounded-[10px] bg-stone-100 border border-stone-200 p-3 flex flex-col justify-between">
                                <div className="w-full h-24 bg-stone-200 rounded-[5px]" />
                                <div className="space-y-1.5 mt-2">
                                  <div className="w-3/4 h-3 bg-stone-200 rounded" />
                                  <div className="w-1/2 h-2.5 bg-stone-200 rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (currentProfile.shop?.products || []).length === 0 ? (
                          <div className="p-10 text-center border-2 border-dashed border-line rounded-[10px] flex flex-col items-center justify-center gap-3 text-ink-500">
                            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-brand-500">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold text-ink-700">Your Shop is Empty</p>
                              <p className="text-[12px] max-w-sm mt-1">
                                Sell digital downloads, merchandise, courses, or paste external store links with 1-click automatic metadata fetching.
                              </p>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={Plus}
                              onClick={() => setShowAddProductModal(true)}
                              className="mt-1 bg-brand-500 text-white"
                            >
                              Add Your First Product
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {(currentProfile.shop?.products || []).map((product) => (
                              <div
                                key={product.id}
                                className="p-3 rounded-[10px] border-[0.5px] border-line bg-surface-2/40 hover:bg-surface-2 hover:border-brand-500/50 transition-all flex flex-col justify-between gap-3 group"
                              >
                                <div>
                                  {product.image ? (
                                    <div className="w-full h-28 rounded-[5px] overflow-hidden bg-stone-100 mb-2.5">
                                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-28 rounded-[5px] bg-brand-100/40 flex items-center justify-center text-brand-500 mb-2.5">
                                      <ShoppingBag className="w-8 h-8" />
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-[12px] font-semibold text-ink-700 line-clamp-2">
                                      {product.title}
                                    </h4>
                                    <span className="font-semibold text-[12px] px-2 py-0.5 rounded-[5px] bg-brand-100 text-brand-800 shrink-0">
                                      {product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : product.currency === 'GBP' ? '£' : product.currency === 'INR' ? '₹' : ''}
                                      {product.price}
                                    </span>
                                  </div>
                                  {product.description && (
                                    <p className="text-[12px] text-ink-500 line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  )}
                                  {product.collection && (
                                    <span className="text-[10px] text-ink-500 font-medium block mt-1">
                                      📁 {product.collection}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t-[0.5px] border-line text-[12px]">
                                  <a
                                    href={product.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-brand-500 hover:underline flex items-center gap-1 font-semibold truncate max-w-[140px]"
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
                {/* Design Tab: Drill-Down Slide Navigation Engine */}
                <div className="bg-white border-[0.5px] border-line rounded-[10px] p-[15px] flex flex-col gap-5">
                  {/* Header: Back navigation when in sub-menu or Root title */}
                  <div className="flex items-center justify-between pb-3.5 border-b-[0.5px] border-line">
                    <div className="flex items-center gap-2">
                      {designSubMenu !== 'root' ? (
                        <button
                          type="button"
                          onClick={() => setDesignSubMenu('root')}
                          className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-500 hover:text-brand-600 px-2 py-1 rounded-[5px] hover:bg-surface-2 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Design</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5 text-brand-500" />
                          <h3 className="text-[14px] font-sans font-semibold text-ink-700">
                            Design
                          </h3>
                        </div>
                      )}
                      {designSubMenu !== 'root' && (
                        <span className="text-[12px] font-semibold text-ink-700">
                          / {DESIGN_SECTION_TITLES[designSubMenu] || designSubMenu}
                        </span>
                      )}
                    </div>

                    {designSubMenu === 'theme' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={Dices}
                        onClick={handleThemeShuffle}
                        className="text-[12px] font-semibold text-brand-500"
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
                          id: 'templates',
                          title: 'Templates',
                          desc: 'Complete starter looks for creators, coaches, shops, music and more',
                          icon: Sparkles,
                          badge: `${PROFILE_TEMPLATES.length} looks`,
                        },
                        {
                          id: 'profile',
                          title: 'Profile & header',
                          desc: 'Name, bio, logo, avatar shape, header layout and story video',
                          icon: Contact,
                          badge: currentProfile.headerLayout || 'classic',
                        },
                        {
                          id: 'theme',
                          title: 'Theme',
                          desc: 'One-click looks: background, text, cards and buttons together',
                          icon: Palette,
                          badge: ALL_THEMES.find((t) => t.id === currentProfile.theme)?.name || 'Custom',
                        },
                        {
                          id: 'wallpaper',
                          title: 'Wallpaper',
                          desc: 'Page background: colour, gradient, image, blur, pattern or video',
                          icon: ImageIcon,
                          badge: currentProfile.designSettings?.wallpaper?.type || 'fill',
                        },
                        {
                          id: 'buttons',
                          title: 'Buttons',
                          desc: 'Link button style, corner shape and shadow',
                          icon: Layers,
                          badge: `${currentProfile.designSettings?.buttonStyle || 'solid'} • ${currentProfile.designSettings?.buttonRoundness || 'rounded'}`,
                        },
                        {
                          id: 'text',
                          title: 'Fonts',
                          desc: 'Page font for all text, plus an optional font for your name',
                          icon: Type,
                          badge: currentProfile.font || 'Playfair Display',
                        },
                        {
                          id: 'colors',
                          title: 'Colors',
                          desc: 'Title, text and button colours (kept readable automatically)',
                          icon: Paintbrush,
                          badge: 'Custom',
                        },
                        {
                          id: 'stickers',
                          title: 'Stickers',
                          desc: 'Decorate your page; drag them onto the preview',
                          icon: Smile,
                          badge: `${(currentProfile.designSettings?.stickers || []).length} placed`,
                        },
                        {
                          id: 'footer',
                          title: 'Footer',
                          desc: 'Show or hide the TreeInBio footer on your public page',
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
                            className="p-[15px] rounded-[10px] border-[0.5px] border-line bg-surface-2/60 hover:bg-surface-2 hover:border-brand-500 text-left flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-[10px] bg-white border-[0.5px] border-line flex items-center justify-center text-brand-500 group-hover:scale-105 transition-transform shrink-0">
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[12px] font-semibold text-ink-700 group-hover:text-brand-500 transition-colors truncate">
                                  {cat.title}
                                </h4>
                                <p className="text-[12px] text-ink-500 line-clamp-1 mt-0.5">
                                  {cat.desc}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[5px] bg-white border-[0.5px] border-line text-brand-500 capitalize">
                                {cat.badge}
                              </span>
                              <ChevronRight className="w-4 h-4 text-ink-500 group-hover:text-brand-500 transition-colors" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* SUB-MENU: TEMPLATES */}
                  {designSubMenu === 'templates' && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-[12px] text-ink-500">
                        Each template sets the theme, fonts, header, avatar shape and buttons together. If your page has no links yet, it also adds starter links you can edit.
                      </p>
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {PROFILE_TEMPLATES.map((template) => (
                          <TemplateCard key={template.id} template={template} onApply={handleApplyTemplate} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUB-MENU: PROFILE & HEADER */}
                  {designSubMenu === 'profile' && (
                    <div className="animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4 text-[12px]">
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
                          className=""
                        />
                      </div>

                      {/* Phase 2: Brand Logo Title Option */}
                      <div className="md:col-span-2 p-3.5 rounded-[10px] bg-surface-2 border-[0.5px] border-line flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-brand-500" />
                            <span className="font-semibold text-[12px] text-ink-700">
                              Brand Logo Title
                            </span>
                            <span className="text-[10px] text-ink-500">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t-[0.5px] border-line">
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
                                className="text-[12px]"
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
                                className="text-[12px]"
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
                            className="text-[12px] text-brand-500 hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
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
                          className="w-full px-3.5 py-2.5 bg-white border-[0.5px] border-line rounded-[5px] text-[12px] text-ink-700 placeholder-ink-500/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all leading-relaxed"
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
                          className=""
                        />
                      </div>

                      {/* Phase 2: Avatar Masks (Cutout & Shapes) */}
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="mb-0 font-semibold text-[12px] text-ink-500">
                            Avatar Mask Shape (Geometry &amp; Cutout)
                          </Label>
                          <span className="text-[11px] text-brand-500 font-semibold">
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
                                className={`p-2.5 rounded-[10px] border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-brand-500 text-white border-brand-600 '
                                    : 'bg-surface-2 text-ink-700 border-line hover:bg-white hover:border-brand-500'
                                }`}
                              >
                                {/* Shape Icon Miniature Silhouette */}
                                <div className={`w-7 h-7 border-2 ${isSelected ? 'border-white bg-white/20' : 'border-brand-500 bg-white'} ${
                                  shape.id === 'circle' ? 'rounded-full' :
                                  shape.id === 'rounded' ? 'rounded-[5px]' :
                                  shape.id === 'squircle' ? 'rounded-[30%]' :
                                  shape.id === 'arch' ? 'rounded-t-full rounded-b-xs' :
                                  shape.id === 'hexagon' ? '[clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]' :
                                  shape.id === 'diamond' ? 'rotate-45 scale-75 rounded-xs' :
                                  'border-dashed rounded-none'
                                }`} />
                                <span className="text-[10px] font-semibold truncate max-w-full">{shape.name}</span>
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
                            className=""
                          />
                          <p className="text-[11px] text-ink-500 mt-1">
                            Displays a panoramic cover banner behind your avatar at the very top of your profile.
                          </p>
                        </div>
                      )}

                      {/* Story Bubble Greeting Video Section */}
                      <div className="md:col-span-2 p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line flex flex-col gap-3 mt-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-[5px] bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shrink-0">
                              <Video className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h4 className="text-[12px] font-semibold text-ink-700">
                                Instagram/TikTok Story Bubble Avatar
                              </h4>
                              <p className="text-[12px] text-ink-500">
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t-[0.5px] border-line text-[12px]">
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
                                className=""
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
                  )}

                  {/* SUB-MENU 1: THEMES */}
                  {designSubMenu === 'theme' && (
                    <div className="space-y-5 animate-fadeIn">
                      <p className="text-[12px] text-ink-500">
                        A theme sets the background, text, cards and buttons in one click. You can fine-tune any of them afterwards in Wallpaper, Buttons, Fonts and Colors.
                      </p>

                      <div>
                        <h4 className="text-[12px] font-semibold text-ink-700 mb-2.5">Themes</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {THEME_PRESETS.map((preset) => (
                            <ThemeCard
                              key={preset.id}
                              theme={preset}
                              selected={currentProfile.theme === preset.id}
                              onSelect={handleApplyThemePreset}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t-[0.5px] border-line">
                        <h4 className="text-[12px] font-semibold text-ink-700">Creator-inspired themes</h4>
                        <p className="text-[12px] text-ink-500 mt-0.5 mb-2.5">
                          Same kind of theme, styled after an artist&apos;s album look.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {CURATED_THEMES.map((theme) => (
                            <ThemeCard
                              key={theme.id}
                              theme={theme}
                              subtitle={`Inspired by ${theme.creator}`}
                              selected={currentProfile.theme === theme.id}
                              onSelect={handleApplyThemePreset}
                            />
                          ))}
                        </div>
                      </div>

                      {/* AI Palette Suggester Component (Auto-detects from avatar) */}
                      <div className="pt-4 border-t-[0.5px] border-line">
                        <PaletteSuggester 
                          avatarUrl={currentProfile.avatar} 
                          currentTheme={currentProfile.theme} 
                          onSelectTheme={(themeId) => {
                            const theme = ALL_THEMES.find((t) => t.id === themeId);
                            if (theme) handleApplyThemePreset(theme);
                          }}
                        />
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
                                className={`p-3 rounded-[10px] border text-center capitalize text-[12px] font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand-500 text-white border-brand-600 '
                                    : 'bg-surface-2 text-ink-700 border-line hover:bg-white'
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
                        <div className="p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line space-y-2">
                          <Label htmlFor="wallpaper-fill">Fill Background Color</Label>
                          <div className="flex items-center gap-3">
                            <input
                              id="wallpaper-fill"
                              type="color"
                              value={currentProfile.designSettings?.wallpaper?.value || '#FFFFFF'}
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
                              className="w-10 h-10 rounded-[5px] cursor-pointer border-[0.5px] border-line"
                            />
                            <input
                              type="text"
                              value={currentProfile.designSettings?.wallpaper?.value || '#FFFFFF'}
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
                              className="text-[12px] px-3 py-2 bg-white border-[0.5px] border-line rounded-[5px]"
                            />
                          </div>
                        </div>
                      )}

                      {(currentProfile.designSettings?.wallpaper?.type === 'gradient') && (
                        <div className="p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line space-y-2">
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
                            className="text-[12px]"
                          />
                        </div>
                      )}

                      {(currentProfile.designSettings?.wallpaper?.type === 'blur' || currentProfile.designSettings?.wallpaper?.type === 'image') && (
                        <div className="p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line space-y-2">
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
                            className="text-[12px]"
                          />
                        </div>
                      )}

                      {(currentProfile.designSettings?.wallpaper?.type === 'video') && (
                        <div className="p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line space-y-2">
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
                            className="text-[12px]"
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
                                className={`p-3 rounded-[10px] border capitalize text-[12px] font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand-500 text-white border-brand-600 '
                                    : 'bg-surface-2 text-ink-700 border-line hover:bg-white'
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
                                className={`p-2.5 rounded-[10px] border text-center text-[12px] font-semibold transition-all ${
                                  isSelected
                                    ? 'bg-brand-500 text-white border-brand-600 '
                                    : 'bg-surface-2 text-ink-700 border-line hover:bg-white'
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
                                  className={`p-2.5 rounded-[10px] border text-center text-[12px] font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-brand-500 text-white border-brand-600 '
                                      : 'bg-surface-2 text-ink-700 border-line hover:bg-white'
                                  }`}
                                >
                                  {shd.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setDesignSubMenu('colors')}
                        className="text-[12px] font-medium text-brand-500 hover:underline"
                      >
                        Change button colours in Colors →
                      </button>
                    </div>
                  )}

                  {/* SUB-MENU 4: FONTS */}
                  {designSubMenu === 'text' && (
                    <div className="space-y-4 animate-fadeIn">
                      <p className="text-[12px] text-ink-500">
                        Your page uses two fonts: the page font for all text, and an optional title font for your name at the top.
                      </p>

                      {/* Live sample in the chosen fonts */}
                      <div className="rounded-[10px] border-[0.5px] border-line bg-surface-2 px-[15px] py-[18px] flex flex-col items-center gap-1 text-center">
                        <span className="text-[18px] font-bold text-ink-700 leading-tight" style={{ fontFamily: getFontStack(getTitleFontName(currentProfile.alternativeTitleFont) || currentProfile.font) }}>
                          {currentProfile.name || 'Your name'}
                        </span>
                        <span className="text-[12px] text-ink-500 max-w-[320px] line-clamp-2" style={{ fontFamily: getFontStack(currentProfile.font) }}>
                          {currentProfile.bio || 'Your bio, links and buttons use the page font.'}
                        </span>
                      </div>

                      <div>
                        <Label htmlFor="page-font-select">Page font</Label>
                        <Select
                          id="page-font-select"
                          value={currentProfile.font || 'Playfair Display'}
                          onChange={(e) => setCurrentProfile({ ...currentProfile, font: e.target.value })}
                        >
                          {[...new Set([currentProfile.font || 'Playfair Display', ...PAGE_FONTS])].map((font) => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                        </Select>
                        <p className="text-[11px] text-ink-500 mt-1">Bio, links, buttons, forms and every other text.</p>
                      </div>

                      <div>
                        <Label className="mb-1.5 block">Title font</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTitleFontModal(true)}
                            className="flex-1 justify-between text-[12px] font-medium bg-white border-line text-ink-700 hover:border-brand-500"
                          >
                            <span style={{ fontFamily: getFontStack(getTitleFontName(currentProfile.alternativeTitleFont)) || undefined }}>
                              {getTitleFontName(currentProfile.alternativeTitleFont) || 'Same as page font'}
                            </span>
                            <span className="text-brand-500">Change</span>
                          </Button>
                          {getTitleFontName(currentProfile.alternativeTitleFont) && (
                            <button
                              type="button"
                              onClick={() => handleSelectAlternativeTitleFont('')}
                              className="text-[12px] text-rose-500 hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-500 mt-1">Only your name at the top. Choose from 48 expressive Google Fonts.</p>
                      </div>
                    </div>
                  )}

                  {/* SUB-MENU 5: COLORS */}
                  {designSubMenu === 'colors' && (() => {
                    const activeTheme = ALL_THEMES.find((t) => t.id === currentProfile.theme) || null;
                    const ds = currentProfile.designSettings || {};
                    const readable = getReadableThemeColors(activeTheme, ds.wallpaper, ds.customColors || {});
                    const themeLook = activeTheme ? getThemeAppearance(activeTheme) : null;
                    const buttonColor = ds.buttonColor || themeLook?.button || '#16A34A';
                    const rows = [
                      { key: 'title', label: 'Title', help: 'Your name', chosen: ds.customColors?.title || readable.title, shown: readable.title },
                      { key: 'pageText', label: 'Page text', help: 'Bio and descriptions', chosen: ds.customColors?.pageText || readable.body, shown: readable.body },
                      { key: 'buttonColor', label: 'Button', help: 'Solid and outline buttons', chosen: buttonColor, shown: buttonColor },
                      {
                        key: 'buttonTextColor',
                        label: 'Button text',
                        help: 'Label on solid buttons',
                        chosen: ds.buttonTextColor || themeLook?.buttonText || '#FFFFFF',
                        shown: getReadableButtonText(buttonColor, ds.buttonTextColor || themeLook?.buttonText, themeLook?.buttonText),
                      },
                    ];
                    return (
                      <div className="space-y-4 animate-fadeIn">
                        <p className="text-[12px] text-ink-500">
                          Colours start from your theme. If a colour would be hard to read on its background, the page uses a readable one instead.
                        </p>
                        <div className="flex flex-col gap-2">
                          {rows.map((row) => {
                            const adjusted = row.shown.toLowerCase() !== row.chosen.toLowerCase();
                            return (
                              <div key={row.key} className="flex items-center justify-between gap-3 rounded-[10px] border-[0.5px] border-line bg-white px-[12px] py-[10px]">
                                <div className="min-w-0">
                                  <span className="block text-[12px] font-medium text-ink-700">{row.label}</span>
                                  <span className="block text-[11px] text-ink-500">
                                    {adjusted ? `Shown as ${row.shown} so it stays readable` : row.help}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <input
                                    type="color"
                                    aria-label={`${row.label} colour`}
                                    value={/^#[\da-f]{6}$/i.test(row.chosen) ? row.chosen : '#000000'}
                                    onChange={(e) => setDesignColor(row.key, e.target.value)}
                                    className="w-8 h-8 rounded-[5px] border-[0.5px] border-line cursor-pointer bg-white p-0.5"
                                  />
                                  <input
                                    type="text"
                                    aria-label={`${row.label} hex`}
                                    value={row.chosen}
                                    onChange={(e) => setDesignColor(row.key, e.target.value)}
                                    className="w-[84px] text-[12px] px-2 py-1.5 bg-white border-[0.5px] border-line rounded-[5px]"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {activeTheme && (
                          <button
                            type="button"
                            onClick={() => {
                              setDesignColor('title', themeLook.title);
                              setDesignColor('pageText', themeLook.body);
                              setDesignColor('buttonColor', themeLook.button);
                              setDesignColor('buttonTextColor', themeLook.buttonText);
                            }}
                            className="text-[12px] font-medium text-brand-500 hover:underline"
                          >
                            Reset to {activeTheme.name} colours
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* SUB-MENU 6: STICKERS */}
                  {designSubMenu === 'stickers' && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-[12px] font-semibold text-ink-500">
                            Interactive Sticker Packs (Drag & Drop onto Preview)
                          </h4>
                          <p className="text-[12px] text-stone-500 mt-0.5">
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
                            className="text-[12px] text-rose-500 hover:underline font-semibold"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {STICKER_PACKS.map((pack) => (
                        <div key={pack.id} className="p-3.5 rounded-[10px] bg-surface-2 border-[0.5px] border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-ink-700">{pack.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-[5px] bg-white border-[0.5px] border-line text-brand-500">
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
                                  // Place it beside the avatar in the profile header (the same
                                  // anchor a drag-and-drop there uses), staggering each new one
                                  // so they do not stack. Drag it from there to fine-tune.
                                  const header = document.querySelector('.phone-viewport [data-anchor-section="PROFILE_HEADER"], [data-anchor-section="PROFILE_HEADER"]');
                                  const refWidth = header?.offsetWidth || 308;
                                  const stickerId = `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                                  setCurrentProfile((prev) => {
                                    const existing = prev.designSettings?.stickers || [];
                                    const count = existing.length;
                                    const placement = {
                                      x: 78 - (count % 3) * 28,
                                      y: 28 + (Math.floor(count / 3) % 3) * 34,
                                      scale: 1,
                                      rotate: ((count * 7) % 20) - 10,
                                      flipX: false,
                                      anchorType: 'PROFILE_HEADER',
                                      coordinateMode: 'pixel-offset',
                                      refWidth,
                                    };
                                    const newSticker = {
                                      id: stickerId,
                                      emoji: stk.emoji,
                                      src: '',
                                      name: stk.name,
                                      ...placement,
                                      flipHorizontal: false,
                                      devices: {
                                        mobile: { ...placement },
                                        tablet: { ...placement },
                                        laptop: { ...placement },
                                        'laptop-centered': { ...placement },
                                      },
                                    };
                                    return {
                                      ...prev,
                                      designSettings: {
                                        ...(prev.designSettings || {}),
                                        stickers: [...existing, newSticker],
                                      },
                                    };
                                  });
                                }}
                                className="text-[16px] p-2.5 rounded-[10px] bg-white border-[0.5px] border-line hover:border-brand-500 hover:scale-110 transition-all flex items-center justify-center cursor-grab active:cursor-grabbing shadow-2xs select-none"
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
                    <div className="p-[15px] rounded-[10px] bg-surface-2 border-[0.5px] border-line flex items-center justify-between gap-4 animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[12px] font-semibold text-ink-700">Hide Linktree Footer Branding</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                            Free For All
                          </span>
                        </div>
                        <p className="text-[12px] text-ink-500 mt-0.5">
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

              {/* Tab 3: Widgets */}
              {activeTab === 'widgets' && (
                <div className="flex flex-col rounded-[10px] border-[0.5px] border-[#dcdcdc]">
                  {[
                    {
                      key: 'lead',
                      title: 'Contact Form',
                      description: 'Visitors can leave their details. Submissions appear in Leads.',
                      control: (
                        <button type="button" onClick={() => setShowLeadModal(true)} className="text-[12px] text-[#16A34A] hover:underline">Preview</button>
                      ),
                    },
                    {
                      key: 'lead-sync',
                      title: 'Sync Leads to Google Contacts',
                      description: 'Adds each new lead to your connected Google Contacts.',
                      control: (
                        <Toggle
                          label="Sync leads to Google Contacts"
                          checked={currentProfile.leadCapture?.syncToGoogleContacts !== false}
                          onChange={(checked) => setCurrentProfile({
                            ...currentProfile,
                            leadCapture: { ...(currentProfile.leadCapture || {}), syncToGoogleContacts: checked },
                          })}
                        />
                      ),
                    },
                    {
                      key: 'meeting',
                      title: 'Meeting Booking',
                      description: 'Visitors can request a 1:1 meeting in your available slots.',
                      control: (
                        <button type="button" onClick={() => setShowMeetingModal(true)} className="text-[12px] text-[#16A34A] hover:underline">Preview</button>
                      ),
                    },
                    {
                      key: 'tip',
                      title: 'Tip Jar',
                      description: 'Fans can pledge a tip with a short message.',
                      control: (
                        <button type="button" onClick={() => setShowTipModal(true)} className="text-[12px] text-[#16A34A] hover:underline">Preview</button>
                      ),
                    },
                    {
                      key: 'social-proof',
                      title: 'Activity Notifications',
                      description: 'Shows recent downloads, bookings and clicks as small pop-ups.',
                      control: (
                        <Toggle
                          label="Activity notifications"
                          checked={Boolean(currentProfile.socialProof?.enabled)}
                          onChange={(checked) => setCurrentProfile({
                            ...currentProfile,
                            socialProof: { ...(currentProfile.socialProof || {}), enabled: checked },
                          })}
                        />
                      ),
                      extra: currentProfile.socialProof?.enabled && (
                        <label className="flex items-center gap-[10px] text-[12px]">
                          <span className="text-[#808080]">Show every</span>
                          <input
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
                            className="w-[60px] rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[5px] text-center text-[12px] outline-none"
                          />
                          <span className="text-[#808080]">seconds</span>
                        </label>
                      ),
                    },
                    {
                      key: 'pixels',
                      title: 'Tracking Pixels',
                      description: 'Add your pixel IDs to retarget visitors on ad platforms.',
                      extra: (
                        <div className="grid grid-cols-1 gap-[15px] md:grid-cols-2">
                          {[
                            ['pixel-meta', 'Meta Pixel ID', 'e.g. 123456789012345', 'metaPixelId'],
                            ['pixel-ga4', 'Google Analytics ID', 'e.g. G-XXXXXXXXXX', 'ga4MeasurementId'],
                            ['pixel-tiktok', 'TikTok Pixel ID', 'e.g. CXXXXXXXXXXXXXXXXX', 'tiktokPixelId'],
                            ['pixel-pinterest', 'Pinterest Tag ID', 'e.g. 26XXXXXXXXXXXXX', 'pinterestTagId'],
                          ].map(([id, label, placeholder, field]) => (
                            <label key={id} htmlFor={id} className="flex flex-col gap-[5px]">
                              <span className="text-[12px] font-medium">{label}</span>
                              <input
                                id={id}
                                type="text"
                                placeholder={placeholder}
                                value={currentProfile.trackingPixels?.[field] || ''}
                                onChange={(e) => setCurrentProfile({
                                  ...currentProfile,
                                  trackingPixels: { ...(currentProfile.trackingPixels || {}), [field]: e.target.value.trim() }
                                })}
                                className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none placeholder:text-[#808080] focus:border-[#404040]"
                              />
                            </label>
                          ))}
                        </div>
                      ),
                    },
                    {
                      key: 'disclosure',
                      title: 'Affiliate Disclosure',
                      description: 'Shows a notice that your page contains affiliate links.',
                      control: (
                        <Toggle
                          label="Affiliate disclosure"
                          checked={Boolean(currentProfile.compliance?.affiliateDisclosure)}
                          onChange={(checked) => setCurrentProfile({
                            ...currentProfile,
                            compliance: { ...(currentProfile.compliance || {}), affiliateDisclosure: checked }
                          })}
                        />
                      ),
                      extra: currentProfile.compliance?.affiliateDisclosure && (
                        <label htmlFor="affiliate-disclosure-note" className="flex flex-col gap-[5px]">
                          <span className="text-[12px] font-medium">Disclosure Text</span>
                          <input
                            id="affiliate-disclosure-note"
                            type="text"
                            value={currentProfile.compliance?.disclosureText || ''}
                            onChange={(e) => setCurrentProfile({
                              ...currentProfile,
                              compliance: { ...(currentProfile.compliance || {}), disclosureText: e.target.value }
                            })}
                            placeholder="This page contains affiliate links. I may earn a commission at no extra cost to you."
                            className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none placeholder:text-[#808080] focus:border-[#404040]"
                          />
                        </label>
                      ),
                    },
                    {
                      key: 'gate',
                      title: 'Access Gate',
                      description: 'Ask for a passcode, an 18+ confirmation or a content warning before your page opens.',
                      control: (
                        <Toggle
                          label="Access gate"
                          checked={Boolean(currentProfile.accessGate?.enabled)}
                          onChange={(checked) => setCurrentProfile({
                            ...currentProfile,
                            accessGate: {
                              ...(currentProfile.accessGate || {}),
                              enabled: checked,
                              type: currentProfile.accessGate?.type === 'none' ? 'passcode' : (currentProfile.accessGate?.type || 'passcode'),
                            }
                          })}
                        />
                      ),
                      extra: currentProfile.accessGate?.enabled && (
                        <div className="grid grid-cols-1 gap-[15px] md:grid-cols-2">
                          <label htmlFor="gate-type-select" className="flex flex-col gap-[5px]">
                            <span className="text-[12px] font-medium">Type</span>
                            <select
                              id="gate-type-select"
                              value={currentProfile.accessGate?.type || 'passcode'}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                accessGate: { ...(currentProfile.accessGate || {}), type: e.target.value }
                              })}
                              className="h-[34px] rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] text-[12px] outline-none focus:border-[#404040]"
                            >
                              <option value="passcode">Passcode</option>
                              <option value="age_18">18+ confirmation</option>
                              <option value="sensitive">Content warning</option>
                            </select>
                          </label>
                          {currentProfile.accessGate?.type === 'passcode' && (
                            <label htmlFor="gate-passcode" className="flex flex-col gap-[5px]">
                              <span className="text-[12px] font-medium">Passcode <span className="text-[#FF4359]">*</span></span>
                              <input
                                id="gate-passcode"
                                type="text"
                                placeholder="e.g. VIP2026"
                                value={currentProfile.accessGate?.passcode || ''}
                                onChange={(e) => setCurrentProfile({
                                  ...currentProfile,
                                  accessGate: { ...(currentProfile.accessGate || {}), passcode: e.target.value }
                                })}
                                className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none placeholder:text-[#808080] focus:border-[#404040]"
                              />
                            </label>
                          )}
                          <label htmlFor="gate-title" className="flex flex-col gap-[5px]">
                            <span className="text-[12px] font-medium">Headline</span>
                            <input
                              id="gate-title"
                              type="text"
                              placeholder="e.g. Members Only"
                              value={currentProfile.accessGate?.title || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                accessGate: { ...(currentProfile.accessGate || {}), title: e.target.value }
                              })}
                              className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none placeholder:text-[#808080] focus:border-[#404040]"
                            />
                          </label>
                          <label htmlFor="gate-desc" className="flex flex-col gap-[5px]">
                            <span className="text-[12px] font-medium">Message</span>
                            <input
                              id="gate-desc"
                              type="text"
                              placeholder="e.g. Enter your passcode to continue."
                              value={currentProfile.accessGate?.description || ''}
                              onChange={(e) => setCurrentProfile({
                                ...currentProfile,
                                accessGate: { ...(currentProfile.accessGate || {}), description: e.target.value }
                              })}
                              className="rounded-[5px] border-[0.5px] border-[#dcdcdc] bg-[#FAFAFA] px-[10px] py-[8px] text-[12px] outline-none placeholder:text-[#808080] focus:border-[#404040]"
                            />
                          </label>
                        </div>
                      ),
                    },
                  ].map((row, index, rows) => (
                    <div key={row.key} className={`flex flex-col gap-[15px] px-[15px] py-[15px] ${index === rows.length - 1 ? '' : 'border-b-[0.5px] border-[#DCDCDC]'}`}>
                      <SettingRow title={row.title} description={row.description}>{row.control}</SettingRow>
                      {row.extra}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right 5 Columns: Live Bio Preview */}
            <div className="xl:col-span-5 flex flex-col gap-2">
              <div className="bg-white border-[0.5px] border-line rounded-[10px] p-[15px] flex flex-col items-center">
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
