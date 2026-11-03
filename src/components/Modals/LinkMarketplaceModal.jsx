'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderPlus,
  Link as LinkIcon,
  ShoppingBag,
  FileText,
  Music,
  Calendar,
  Mail,
  MessageSquare,
  Users,
  Tag
} from '@/components/icons';
import Modal, { ModalButton } from '@/components/ui/Modal';
import { PillTab, ToolbarPill, EmptyState } from '@/components/ui/patterns';
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
    <Modal onClose={onClose} title="Add Block" width="xl" bodyClassName="flex flex-col gap-[15px] pr-[4px]">
      <div className="flex flex-col gap-[10px]">
        <form onSubmit={handleOmniSubmit} className="flex items-center gap-[10px]">
          <div className="relative flex h-[34px] flex-1 items-center">
            <Search className="absolute left-[10px] text-[#808080]" size={16} strokeWidth={0.85} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blocks or paste a URL"
              className="h-[34px] w-full rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-[#FAFAFA] px-[30px] text-[12px] font-light outline-none placeholder:text-[#808080] focus:border-[#404040]"
              autoFocus
            />
          </div>
          {search.trim().length > 3 && (
            <ModalButton type="submit" className="w-auto shrink-0 px-[15px]">
              Add Link
            </ModalButton>
          )}
        </form>

        {!search && (
          <div className="flex flex-wrap items-center gap-[10px]">
            <ToolbarPill onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'link') || MARKETPLACE_ITEMS[0])}>
              Link
            </ToolbarPill>
            <ToolbarPill onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'collection') || MARKETPLACE_ITEMS[1])}>
              Collection
            </ToolbarPill>
            <ToolbarPill onClick={() => handleItemClick(MARKETPLACE_ITEMS.find(it => it.id === 'product') || MARKETPLACE_ITEMS[4])}>
              Product
            </ToolbarPill>
            <ToolbarPill
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
            >
              Contact Form
            </ToolbarPill>
          </div>
        )}
      </div>

      {!search && (
        <div className="flex flex-wrap items-center gap-[10px] border-b-[0.5px] border-[#DCDCDC] pb-[15px]">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <PillTab key={cat.id} active={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)}>
              {cat.label}
            </PillTab>
          ))}
        </div>
      )}

      <div className="min-h-[300px]">
        {filteredItems.length === 0 ? (
          <EmptyState title={`No blocks match "${search}"`}>Press Enter to add it as a link.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 md:grid-cols-3">
            {filteredItems.map((item) => {
              const Icon = item.icon || LinkIcon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="relative flex w-full flex-col items-start rounded-[10px] border-[0.5px] border-[#dcdcdc] bg-white p-[20px] text-left hover:bg-[#F8F8F9]"
                >
                  <div className="flex w-full items-start justify-between gap-[10px]">
                    <span className="flex size-[40px] shrink-0 items-center justify-center text-[#333333]">
                      <Icon size={40} strokeWidth={1} className="size-[40px]" />
                    </span>
                    {item.badge && (
                      <span className="rounded-[4px] bg-[#F8F8F9] px-[6px] py-[2px] text-[10px] text-[#333333]">{item.badge}</span>
                    )}
                  </div>
                  <span className="my-[10px] text-[14px] font-medium text-black">{item.title}</span>
                  <span className="line-clamp-2 text-[12px] text-[#404040]">{item.subtitle}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
