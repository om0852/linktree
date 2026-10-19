import { Composio } from '@composio/core';

// Cache client instance if API key is in process.env
let cachedClient = null;
let cachedApiKey = null;

export function getComposioClient(apiKeyOverride) {
  const key = (apiKeyOverride || process.env.COMPOSIO_API_KEY || '').trim();
  if (!key) {
    throw new Error('Composio API Key is missing. Please set COMPOSIO_API_KEY in .env.local or enter it in the Integrations console.');
  }

  if (cachedClient && cachedApiKey === key) {
    return cachedClient;
  }

  cachedClient = new Composio({ apiKey: key });
  cachedApiKey = key;
  return cachedClient;
}

export function isComposioConfigured() {
  const key = process.env.COMPOSIO_API_KEY;
  return Boolean(key && key.trim().length > 5);
}

export async function createAuthorizationLink(client, userId, toolkitSlug, callbackUrl) {
  // 1. Look for existing Auth Config for this toolkit
  const configs = await client.authConfigs.list({ toolkit: toolkitSlug });
  let authConfigId = configs.items && configs.items.length > 0 ? configs.items[0].id : null;

  // 2. If none exists, attempt to create a Composio-managed auth config
  if (!authConfigId) {
    try {
      const created = await client.authConfigs.create(toolkitSlug, {
        type: 'use_composio_managed_auth',
        name: `${toolkitSlug} Managed Auth`
      });
      authConfigId = created.id;
    } catch (createErr) {
      if (
        createErr.message?.includes('Default auth config not found') || 
        createErr.message?.includes('use_custom_auth') ||
        createErr.message?.includes('does not have managed credentials')
      ) {
        throw new Error(
          `"${toolkitSlug}" requires your own OAuth App credentials (Client ID & Client Secret) registered in the Composio Dashboard -> Auth Configs. (Tip: GitHub, Google, Gmail, Calendar, Discord, Slack, Notion, and YouTube work out-of-the-box with 1-click Managed Auth!)`
        );
      }
      throw createErr;
    }
  }

  // 3. Use modern /api/v3/connected_accounts/link API
  const linkReq = await client.connectedAccounts.link(userId, authConfigId, {
    callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/connectors?connected=${toolkitSlug}`
  });

  return linkReq;
}

// Top Tier platforms out of Composio's 1500+ ecosystem, mapped for TreeInBio bio-links & creator studio
export const FEATURED_TOOLKITS = [
  {
    slug: 'instagram',
    name: 'Instagram',
    category: 'Social Media',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F',
    color: '#E4405F',
    accentColor: '#f43f5e',
    description: 'Sync Instagram business & creator profiles, fetch latest reels, media grids, and impressions.',
    bioUseCase: 'Live Instagram Feed & Latest Reels Showcase widget',
    popularActions: ['INSTAGRAM_GET_IG_USER_MEDIA', 'INSTAGRAM_GET_IG_MEDIA_INSIGHTS']
  },
  {
    slug: 'github',
    name: 'GitHub',
    category: 'Developer',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/github/ffffff',
    color: '#24292e',
    accentColor: '#38bdf8',
    description: 'Sync repositories, live star counts, recent commit heatmaps, and pull requests.',
    bioUseCase: 'Live Bento Dev Card with pinned repo & contribution streak',
    popularActions: ['github_get_user', 'github_list_user_repos', 'github_get_starred_repos']
  },
  {
    slug: 'spotify',
    name: 'Spotify',
    category: 'Music & Audio',
    authType: 'custom',
    iconUrl: 'https://cdn.simpleicons.org/spotify/1DB954',
    color: '#1DB954',
    accentColor: '#1ed760',
    description: 'Embed currently playing track, recent playlists, top tracks, and artist profile links.',
    bioUseCase: 'Dynamic "Now Playing" audio waveform widget on public bio',
    popularActions: ['spotify_get_current_user_profile', 'spotify_get_users_top_artists_and_tracks']
  },
  {
    slug: 'youtube',
    name: 'YouTube',
    category: 'Video & Media',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/youtube/FF0000',
    color: '#FF0000',
    accentColor: '#ef4444',
    description: 'Stream latest videos directly on bio, track subscriber counts, and embed playlists.',
    bioUseCase: 'Hero Video Player auto-updated whenever you upload a new video',
    popularActions: ['youtube_list_channels', 'youtube_list_videos']
  },
  {
    slug: 'googlecalendar',
    name: 'Google Calendar',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/googlecalendar/4285F4',
    color: '#4285F4',
    accentColor: '#60a5fa',
    description: 'Allow clients, fans, or recruiters to schedule calls and bookings right on your bio.',
    bioUseCase: 'Interactive 1-on-1 Consultation & Meeting Booking Widget',
    popularActions: ['googlecalendar_list_events', 'googlecalendar_create_event']
  },
  {
    slug: 'googledrive',
    name: 'Google Drive',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/googledrive/4285F4',
    color: '#4285F4',
    accentColor: '#34a853',
    description: 'Connect Google Drive to sync media kits, video showreels, high-res press photos, and downloadable creator assets.',
    bioUseCase: 'Direct in-bio Google Drive folder download card & live asset sync',
    popularActions: ['googledrive_list_files', 'googledrive_get_file_metadata', 'googledrive_create_folder']
  },
  {
    slug: 'googlemeet',
    name: 'Google Meet',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/googlemeet/00897B',
    color: '#00897B',
    accentColor: '#2dd4bf',
    description: 'Automatically generate encrypted Google Meet video rooms for booked creator meetings and fan consultations.',
    bioUseCase: 'Instant 1-click video conference room generator for scheduled calls',
    popularActions: ['googlemeet_create_meeting', 'googlemeet_get_conference']
  },
  {
    slug: 'zoom',
    name: 'Zoom Video',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/zoom/2D8CFF',
    color: '#2D8CFF',
    accentColor: '#38bdf8',
    description: 'Connect your personal or enterprise Zoom account to sync scheduled webinars and coaching sessions.',
    bioUseCase: 'Direct Zoom video meeting invite generation on confirmed bookings',
    popularActions: ['zoom_create_meeting', 'zoom_list_meetings']
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    category: 'Social Media',
    authType: 'custom',
    iconUrl: 'https://cdn.simpleicons.org/tiktok/ffffff',
    color: '#000000',
    accentColor: '#00f2fe',
    description: 'Showcase trending TikTok videos, follower stats, and viral sound clips directly on public bio.',
    bioUseCase: 'Embed trending TikTok video feed with real-time play counter',
    popularActions: ['tiktok_get_user_info', 'tiktok_list_videos']
  },
  {
    slug: 'canva',
    name: 'Canva',
    category: 'Marketing & CRM',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/canva/00C4CC',
    color: '#00C4CC',
    accentColor: '#22d3ee',
    description: 'Link Canva brand kits, pitch decks, and digital press kit templates directly for partners.',
    bioUseCase: 'One-click editable brand kit & digital asset distribution',
    popularActions: ['canva_list_designs', 'canva_export_design']
  },
  {
    slug: 'dropbox',
    name: 'Dropbox',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/dropbox/0061FF',
    color: '#0061FF',
    accentColor: '#3b82f6',
    description: 'Host high-resolution 4K showreels and master audio files for brand partners.',
    bioUseCase: 'Instant file transfer & media asset bundle locker',
    popularActions: ['dropbox_list_folder', 'dropbox_get_temporary_link']
  },
  {
    slug: 'gmail',
    name: 'Gmail / Google Mail',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/gmail/EA4335',
    color: '#EA4335',
    accentColor: '#f87171',
    description: 'Send automated welcome emails to fans who join your newsletter or send inquiries.',
    bioUseCase: 'Instant auto-responder for business inquiries & sponsorships',
    popularActions: ['gmail_send_email', 'gmail_list_messages']
  },
  {
    slug: 'notion',
    name: 'Notion',
    category: 'Productivity & Notes',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/notion/ffffff',
    color: '#000000',
    accentColor: '#a78bfa',
    description: 'Auto-sync Notion database pages, published blogs, media kits, or public roadmaps.',
    bioUseCase: 'Public Resource Hub & dynamic link list driven by Notion DB',
    popularActions: ['notion_search', 'notion_query_database']
  },
  {
    slug: 'discord',
    name: 'Discord',
    category: 'Community & Social',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/discord/5865F2',
    color: '#5865F2',
    accentColor: '#818cf8',
    description: 'Display live community server member count and one-click VIP server join invite.',
    bioUseCase: 'Live Community badge with real-time online member count',
    popularActions: ['discord_get_guild', 'discord_create_invite']
  },
  {
    slug: 'slack',
    name: 'Slack',
    category: 'Community & Social',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/slack/4A154B',
    color: '#4A154B',
    accentColor: '#c084fc',
    description: 'Notify your team channel instantly when someone tips, books a call, or subscribes.',
    bioUseCase: 'Real-time alert dispatch to your team channel for incoming leads',
    popularActions: ['slack_post_message', 'slack_list_channels']
  },
  {
    slug: 'twitter',
    name: 'X (Twitter)',
    category: 'Social Media',
    authType: 'custom',
    iconUrl: 'https://cdn.simpleicons.org/x/ffffff',
    color: '#000000',
    accentColor: '#94a3b8',
    description: 'Showcase pinned tweets, auto-tweet new bio announcements, and display follower count.',
    bioUseCase: 'Auto-tweet when links change & display pinned viral thread',
    popularActions: ['twitter_get_user_by_username', 'twitter_create_tweet']
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    category: 'Payments & E-Commerce',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/stripe/635BFF',
    color: '#635BFF',
    accentColor: '#818cf8',
    description: 'Accept custom creator tips, sell digital products, eBooks, and manage payouts directly.',
    bioUseCase: 'Native 1-click Tip Jar & Digital Product checkout cards',
    popularActions: ['stripe_create_payment_link', 'stripe_list_products']
  },
  {
    slug: 'calendly',
    name: 'Calendly',
    category: 'Productivity',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/calendly/006BFF',
    color: '#006BFF',
    accentColor: '#38bdf8',
    description: 'Embed your Calendly calendar directly inside a full-width Bento card.',
    bioUseCase: 'One-click VIP booking & coaching session scheduler',
    popularActions: ['calendly_get_current_user', 'calendly_list_event_types']
  },
  {
    slug: 'linear',
    name: 'Linear',
    category: 'Developer',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/linear/5E6AD2',
    color: '#5E6AD2',
    accentColor: '#a5b4fc',
    description: 'Showcase public product roadmap items and automatically log feature requests from bio.',
    bioUseCase: 'Public Creator Roadmap & Feature Voting Board',
    popularActions: ['linear_list_issues', 'linear_create_issue']
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    category: 'Marketing & CRM',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/hubspot/FF7A59',
    color: '#FF7A59',
    accentColor: '#fb923c',
    description: 'Send lead captures and newsletter signups directly into your enterprise CRM.',
    bioUseCase: 'Automatic Lead Enrichment & CRM Pipeline Creation',
    popularActions: ['hubspot_create_contact', 'hubspot_list_contacts']
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    category: 'Social Media',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/linkedin/0A66C2',
    color: '#0A66C2',
    accentColor: '#38bdf8',
    description: 'Display verified professional credentials, recommendations, and recent articles.',
    bioUseCase: 'Professional Executive Bento Card with verified career metrics',
    popularActions: ['linkedin_get_user_profile', 'linkedin_create_post']
  },
  {
    slug: 'twitch',
    name: 'Twitch',
    category: 'Video & Media',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/twitch/9146FF',
    color: '#9146FF',
    accentColor: '#c084fc',
    description: 'Show a pulsing "LIVE NOW" badge when streaming on Twitch, with live viewer count.',
    bioUseCase: 'Real-time Live Stream Radar with instant watch popup',
    popularActions: ['twitch_get_streams', 'twitch_get_channel_info']
  },
  {
    slug: 'reddit',
    name: 'Reddit',
    category: 'Community & Social',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/reddit/FF4500',
    color: '#FF4500',
    accentColor: '#fb923c',
    description: 'Sync top AMA threads, community discussions, and subreddit moderations.',
    bioUseCase: 'Live Creator AMA & community discussion spotlight',
    popularActions: ['reddit_get_user_info', 'reddit_list_posts']
  },
  {
    slug: 'shopify',
    name: 'Shopify',
    category: 'Payments & E-Commerce',
    authType: 'custom',
    iconUrl: 'https://cdn.simpleicons.org/shopify/7AB55C',
    color: '#7AB55C',
    accentColor: '#4ade80',
    description: 'Showcase trending merch, vinyls, and clothing line items with live inventory status.',
    bioUseCase: 'Live Merchandise Shelf with in-bio quick add-to-cart',
    popularActions: ['shopify_list_products', 'shopify_get_product_by_id']
  },
  {
    slug: 'airtable',
    name: 'Airtable',
    category: 'Productivity & Notes',
    authType: 'managed',
    iconUrl: 'https://cdn.simpleicons.org/airtable/18BFFF',
    color: '#18BFFF',
    accentColor: '#38bdf8',
    description: 'Use Airtable as your CMS to power links, press clippings, and portfolio items.',
    bioUseCase: 'No-code dynamic CMS feed syncing to your public bio',
    popularActions: ['airtable_list_records', 'airtable_create_record']
  }
];
