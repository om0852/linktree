'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  FolderPlus, 
  Link as LinkIcon, 
  ShoppingBag, 
  FileText, 
  Music, 
  Video, 
  Calendar, 
  Mail, 
  MessageSquare, 
  Users, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Tag
} from 'lucide-react';
import { 
  InstagramIcon, 
  YoutubeIcon, 
  TwitterIcon, 
  SpotifyIcon 
} from '../Common/SocialIcons';

export const MARKETPLACE_CATEGORIES = [
  { id: 'suggested', label: 'Suggested' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'communities', label: 'Communities' },
  { id: 'social', label: 'Social & Feeds' },
  { id: 'media', label: 'Media & Embeds' },
  { id: 'contact', label: 'Contact & Forms' },
  { id: 'scheduling', label: 'Scheduling & Events' },
  { id: 'text', label: 'Text & Headings' }
];

export const MARKETPLACE_ITEMS = [
  // Suggested
  {
    id: 'link',
    categoryId: 'suggested',
    title: 'Standard Link',
    subtitle: 'Send visitors to any website, article, or destination',
    icon: LinkIcon,
    badge: 'Essential',
    type: 'standard',
    defaultData: { type: 'standard', title: '', url: 'https://', icon: 'Globe' }
  },
  {
    id: 'collection',
    categoryId: 'suggested',
    title: 'Collection (Folder)',
    subtitle: 'Group multiple links into a grid, carousel, or list',
    icon: FolderPlus,
    badge: 'Organize',
    type: 'collection',
    isCollection: true
  },
  {
    id: 'instagram',
    categoryId: 'suggested',
    title: 'Instagram Posts & Reels',
    subtitle: 'Display your Instagram feed in a swipeable carousel format',
    icon: InstagramIcon,
    badge: 'Popular',
    type: 'instagram',
    defaultData: { type: 'instagram', mediaType: 'instagram', title: 'Instagram Feed', url: 'https://instagram.com/' }
  },
  {
    id: 'youtube',
    categoryId: 'suggested',
    title: 'YouTube Video & Playlist',
    subtitle: 'Showcase shorts, uploads, or a playlist carousel',
    icon: YoutubeIcon,
    badge: 'Popular',
    type: 'youtube',
    defaultData: { type: 'youtube', mediaType: 'youtube', title: 'Watch Latest Video', url: 'https://youtube.com/' }
  },

  // Commerce
  {
    id: 'product',
    categoryId: 'commerce',
    title: 'Digital Product / Download',
    subtitle: 'Offer guides, PDFs, or presets with instant lead capture',
    icon: ShoppingBag,
    badge: 'Monetize',
    type: 'product',
    defaultData: { type: 'product', mediaType: 'product', title: 'Creator Preset Pack', price: '$19.99', badge: 'Special' }
  },
  {
    id: 'amaze',
    categoryId: 'commerce',
    title: 'Amaze Store Carousel',
    subtitle: 'Showcase rotating physical and merch products',
    icon: Tag,
    badge: 'Merch',
    type: 'product',
    defaultData: { type: 'product', mediaType: 'product', title: 'Official Merchandise', price: '$29.99' }
  },
  {
    id: 'coaching',
    categoryId: 'commerce',
    title: '1:1 Coaching & Consultation',
    subtitle: 'Paid or complimentary direct video sessions',
    icon: Calendar,
    badge: 'Services',
    type: 'standard',
    defaultData: { type: 'featured', title: 'Book 1:1 Creator Strategy Call', badge: 'Limited', size: 'large' }
  },

  // Communities
  {
    id: 'discord',
    categoryId: 'communities',
    title: 'Discord Community',
    subtitle: 'Invite fans and members to your private Discord server',
    icon: Users,
    badge: 'Community',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Join our Discord Community', url: 'https://discord.gg/' }
  },
  {
    id: 'telegram',
    categoryId: 'communities',
    title: 'Telegram Channel',
    subtitle: 'Broadcast alerts, announcements, and VIP signals',
    icon: MessageSquare,
    badge: 'Broadcast',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Join VIP Telegram Channel', url: 'https://t.me/' }
  },
  {
    id: 'whatsapp_community',
    categoryId: 'communities',
    title: 'WhatsApp Group / Alerts',
    subtitle: 'Instant mobile messaging group for core supporters',
    icon: MessageSquare,
    badge: 'Direct',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Join WhatsApp Insider Group', url: 'https://chat.whatsapp.com/' }
  },

  // Social
  {
    id: 'spotify_track',
    categoryId: 'social',
    title: 'Spotify Music Track / Album',
    subtitle: 'Embed playable Spotify audio tracks and playlists',
    icon: SpotifyIcon,
    badge: 'Audio',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Listen on Spotify', url: 'https://open.spotify.com/', embed: { enabled: true, platform: 'spotify', embedId: '' } }
  },
  {
    id: 'twitter_feed',
    categoryId: 'social',
    title: 'X / Twitter Showcase',
    subtitle: 'Showcase trending posts and thread highlights',
    icon: TwitterIcon,
    badge: 'Feed',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Follow on X', url: 'https://x.com/' }
  },

  // Media
  {
    id: 'podcast',
    categoryId: 'media',
    title: 'Podcast Show & Episodes',
    subtitle: 'Direct audio player for Apple Podcasts and Spotify',
    icon: Music,
    badge: 'Show',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Latest Podcast Episode', url: 'https://podcasts.apple.com/' }
  },
  {
    id: 'lead_magnet_pdf',
    categoryId: 'media',
    title: 'Free Gated PDF / E-Book',
    subtitle: 'Require email or WhatsApp unlock before downloading',
    icon: FileText,
    badge: 'Lead Magnet',
    type: 'standard',
    defaultData: { 
      type: 'standard', 
      title: 'Free Ultimate Guide PDF', 
      badge: 'Free',
      leadMagnet: { enabled: true, assetType: 'pdf', previewText: 'Free PDF Download', requireEmail: true } 
    }
  },

  // Contact
  {
    id: 'lead_exchange',
    categoryId: 'contact',
    title: 'Contact Exchange Form',
    subtitle: 'Capture visitor name, phone, WhatsApp, and auto-sync to CRM',
    icon: Mail,
    badge: 'CRM Sync',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Exchange Contact With Me', badge: 'Connect' }
  },
  {
    id: 'newsletter_signup',
    categoryId: 'contact',
    title: 'Newsletter Subscription',
    subtitle: 'Grow your direct mailing list with a 1-tap form',
    icon: Mail,
    badge: 'Subscribers',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Subscribe to Weekly Newsletter', badge: 'Weekly' }
  },

  // Scheduling & Events
  {
    id: 'calendar_booking',
    categoryId: 'scheduling',
    title: 'Calendar Appointment',
    subtitle: 'Sync availability with Google Calendar and schedule meetings',
    icon: Calendar,
    badge: '1:1 Meet',
    type: 'standard',
    defaultData: { type: 'standard', title: 'Schedule 30-min Video Call', badge: 'Available' }
  },

  // Text
  {
    id: 'text_header',
    categoryId: 'text',
    title: 'Section Header Divider',
    subtitle: 'Visually divide your link sections with a clean headline',
    icon: FileText,
    badge: 'Layout',
    type: 'standard',
    defaultData: { type: 'standard', title: '✨ Featured Resources', url: '#', badge: 'Section' }
  }
];

export default function LinkMarketplaceModal({
  isOpen,
  onClose,
  onSelectApp,
  onAddLink,
  onCreateCollection
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('suggested');

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (q) {
      return MARKETPLACE_ITEMS.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.categoryId.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    }
    return MARKETPLACE_ITEMS.filter(item => item.categoryId === activeCategory);
  }, [search, activeCategory]);

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    if (item.isCollection) {
      if (onCreateCollection) {
        onCreateCollection();
      } else if (onSelectApp) {
        onSelectApp(item);
      } else if (onAddLink) {
        onAddLink(item);
      }
    } else {
      if (onSelectApp) {
        onSelectApp(item);
      } else if (onAddLink) {
        onAddLink(item);
      }
    }
    onClose();
  };

  const handleOmniSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    // Detect if pasted link is URL
    const isUrl = search.startsWith('http://') || search.startsWith('https://') || search.includes('.');
    if (isUrl) {
      const url = search.startsWith('http') ? search : `https://${search}`;
      const customItem = {
        id: 'custom_link',
        title: 'Custom Link',
        type: 'standard',
        defaultData: {
          title: 'My Link',
          url,
          icon: 'Globe'
        }
      };
      if (onSelectApp) {
        onSelectApp(customItem);
      } else if (onAddLink) {
        onAddLink(customItem);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFEFA] border border-[#CAD8CE] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#28352F]">
        
        {/* Header with Omni-Bar */}
        <div className="p-4 sm:p-5 border-b border-[#CAD8CE]/80 bg-[#F5F3ED]/40 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#52796F]/15 flex items-center justify-center text-[#52796F]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-sans font-bold text-base sm:text-lg text-[#28352F]">Add to Profile</h2>
                <p className="text-xs text-[#5C6B64]">Choose a block type, integration, or paste any URL</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C6B64] hover:text-[#28352F] hover:bg-[#E8EFEA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Omni Search & Link Paste Bar */}
          <form onSubmit={handleOmniSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-[#52796F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Paste any link URL or search apps (Spotify, Instagram, Amaze, Form, PDF)..."
              className="w-full pl-10 pr-24 py-2.5 bg-white border border-[#CAD8CE] rounded-xl text-xs sm:text-sm font-medium placeholder:text-[#5C6B64]/60 focus:outline-none focus:border-[#52796F] focus:ring-2 focus:ring-[#52796F]/15 transition-all shadow-xs"
              autoFocus
            />
            {search.trim().length > 3 && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#52796F] hover:bg-[#3D5C54] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Add Link
              </button>
            )}
          </form>

          {/* Quick-Select Hero Cards */}
          {!search && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'link') || MARKETPLACE_ITEMS[0])}
                className="p-2.5 rounded-xl border border-[#CAD8CE] bg-white hover:border-[#52796F] hover:shadow-xs transition-all flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8EFEA] flex items-center justify-center text-[#52796F] shrink-0 group-hover:scale-105 transition-transform">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#28352F]">Link</div>
                  <div className="text-[10px] text-[#5C6B64]">Standard card</div>
                </div>
              </button>

              <button
                onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'collection') || MARKETPLACE_ITEMS[1])}
                className="p-2.5 rounded-xl border border-[#CAD8CE] bg-white hover:border-[#52796F] hover:shadow-xs transition-all flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#28352F]">Collection</div>
                  <div className="text-[10px] text-[#5C6B64]">Folder group</div>
                </div>
              </button>

              <button
                onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'product') || MARKETPLACE_ITEMS[4])}
                className="p-2.5 rounded-xl border border-[#CAD8CE] bg-white hover:border-[#52796F] hover:shadow-xs transition-all flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#28352F]">Product</div>
                  <div className="text-[10px] text-[#5C6B64]">Merch / Digital</div>
                </div>
              </button>

              <button
                onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'lead_exchange') || {
                  id: 'lead_exchange',
                  categoryId: 'contact',
                  title: 'Contact Exchange Form',
                  subtitle: 'Capture visitor name, phone, WhatsApp, and auto-sync to CRM',
                  icon: Mail,
                  badge: 'CRM Sync',
                  type: 'standard',
                  defaultData: { type: 'standard', title: 'Exchange Contact With Me', badge: 'Connect' }
                })}
                className="p-2.5 rounded-xl border border-[#CAD8CE] bg-white hover:border-[#52796F] hover:shadow-xs transition-all flex items-center gap-2.5 text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#28352F]">Form / Lead</div>
                  <div className="text-[10px] text-[#5C6B64]">CRM contact</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Body Content with Category Sidebar & Right Grid */}
        <div className="flex-1 flex overflow-hidden min-h-[380px]">
          
          {/* Category Rail (Visible on md+, horizontal scroll on mobile) */}
          {!search && (
            <div className="w-48 sm:w-56 border-r border-[#CAD8CE]/80 bg-[#F5F3ED]/30 p-2.5 overflow-y-auto shrink-0 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B64] px-2.5 py-1">Categories</span>
              {MARKETPLACE_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-[#52796F] text-white shadow-xs' 
                        : 'text-[#28352F] hover:bg-[#E8EFEA]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'translate-x-0.5' : ''}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Items Grid */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-2 text-[#5C6B64]">
                <Search className="w-8 h-8 opacity-40" />
                <p className="text-sm font-semibold text-[#28352F]">No integration apps match "{search}"</p>
                <p className="text-xs">Press Enter to add it as a direct URL link.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const Icon = item.icon || LinkIcon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className="p-3.5 rounded-xl border border-[#CAD8CE] bg-white hover:border-[#52796F] hover:shadow-md transition-all flex items-start gap-3.5 text-left cursor-pointer group relative w-full"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F5F3ED] border border-[#CAD8CE] flex items-center justify-center text-[#52796F] shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#28352F] group-hover:text-[#52796F] transition-colors truncate">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#5C6B64] line-clamp-2 mt-0.5 leading-snug">
                          {item.subtitle}
                        </p>
                      </div>

                      {item.badge && (
                        <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#E8EFEA] text-[#52796F] border border-[#CAD8CE]/50">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
