/**
 * TreeInBio - Production Workspace Connectors powered by Composio
 * Zero mock accounts or fake files. Live OAuth2 & platform operations.
 */

export const CONNECTOR_CATEGORIES = [
  'All Connectors',
  'Google Workspace',
  'Meetings & Booking',
  'Video & Social',
  'Music & Audio',
  'Developer & Tech',
  'Community & Alerts',
  'CRM & Payments'
];

export const AVAILABLE_CONNECTORS = [
  {
    id: 'googledrive',
    toolkitSlug: 'googledrive',
    name: 'Google Drive',
    category: 'Google Workspace',
    iconUrl: 'https://cdn.simpleicons.org/googledrive/4285F4',
    badge: 'Cloud Media',
    accentColor: '#4285F4',
    description: 'Connect your Google Drive to host and attach press kits, high-res photos, portfolio PDFs, and client assets directly to your public bio cards.',
    bioIntegration: 'Powers downloadable media kits, portfolio documents, and client asset delivery on your live bio.',
    popularActions: [
      {
        slug: 'GOOGLEDRIVE_CREATE_FILE',
        name: 'Create File or Folder',
        description: 'Create a new file or folder in Google Drive for press kits or client assets.',
        params: [
          { key: 'name', label: 'File / Folder Name', type: 'text', placeholder: 'e.g. Press_Kit_2026', required: true },
          { key: 'mime_type', label: 'MIME Type', type: 'text', placeholder: 'application/vnd.google-apps.folder', defaultValue: 'application/vnd.google-apps.folder' }
        ]
      },
      {
        slug: 'GOOGLEDRIVE_CREATE_SHORTCUT_TO_FILE',
        name: 'Create Asset Shortcut',
        description: 'Creates a convenient shortcut to a file or folder in Google Drive.',
        params: [
          { key: 'target_id', label: 'Target File ID', type: 'text', placeholder: 'Enter Google Drive File ID', required: true }
        ]
      },
      {
        slug: 'GOOGLEDRIVE_CREATE_COMMENT',
        name: 'Add File Comment',
        description: 'Post an editorial note or comment on an existing portfolio asset.',
        params: [
          { key: 'file_id', label: 'File ID', type: 'text', placeholder: 'Google Drive File ID', required: true },
          { key: 'content', label: 'Comment Content', type: 'text', placeholder: 'Review completed for client presentation', required: true }
        ]
      }
    ]
  },
  {
    id: 'googlecalendar',
    toolkitSlug: 'googlecalendar',
    name: 'Google Calendar',
    category: 'Meetings & Booking',
    iconUrl: 'https://cdn.simpleicons.org/googlecalendar/4285F4',
    badge: '1:1 Availability',
    accentColor: '#4285F4',
    description: 'Synchronize your Google Calendar availability with your profile booking widget to automatically prevent double-bookings and schedule appointments.',
    bioIntegration: 'Powers the public 1:1 meeting scheduler and automatically blocks out busy calendar slots.',
    popularActions: [
      {
        slug: 'GOOGLECALENDAR_EVENTS_LIST_ALL_CALENDARS',
        name: 'List Events from All Calendars',
        description: 'Retrieve all scheduled events and client appointments across your Google Calendars.',
        params: [
          { key: 'time_min', label: 'Time Min (ISO 8601)', type: 'text', placeholder: '2026-10-18T00:00:00Z', defaultValue: new Date().toISOString() },
          { key: 'time_max', label: 'Time Max (ISO 8601)', type: 'text', placeholder: '2026-11-18T23:59:59Z', defaultValue: new Date(Date.now() + 30 * 86400000).toISOString() }
        ]
      },
      {
        slug: 'GOOGLECALENDAR_FIND_EVENT',
        name: 'Find Calendar Event',
        description: 'Search for existing consultation bookings or events by keyword query.',
        params: [
          { key: 'query', label: 'Search Query', type: 'text', placeholder: 'e.g. Consultation or Client Call', required: true }
        ]
      },
      {
        slug: 'GOOGLECALENDAR_CREATE_EVENT',
        name: 'Create Calendar Event',
        description: 'Directly schedule a confirmed client appointment or consultation.',
        params: [
          { key: 'summary', label: 'Meeting Title', type: 'text', placeholder: '1:1 Creator Consultation', required: true },
          { key: 'start_time', label: 'Start Time (ISO)', type: 'text', placeholder: '2026-10-19T14:00:00Z', required: true },
          { key: 'end_time', label: 'End Time (ISO)', type: 'text', placeholder: '2026-10-19T15:00:00Z', required: true }
        ]
      }
    ]
  },
  {
    id: 'gmail',
    toolkitSlug: 'gmail',
    name: 'Gmail & Google Contacts',
    category: 'Google Workspace',
    iconUrl: 'https://cdn.simpleicons.org/gmail/EA4335',
    badge: 'Lead Sync & CRM',
    accentColor: '#EA4335',
    description: 'Automatically saves leads captured on your profile into your Google Contacts address book and dispatches automated email confirmations.',
    bioIntegration: 'Auto-syncs contact submissions from the Lead Capture widget directly into your Google Contacts and Gmail.',
    popularActions: [
      {
        slug: 'GMAIL_CREATE_EMAIL_DRAFT',
        name: 'Create Email Draft',
        description: 'Creates a draft email in your Gmail mailbox to follow up with a prospective client.',
        params: [
          { key: 'recipient_email', label: 'Recipient Email', type: 'email', placeholder: 'client@example.com', required: true },
          { key: 'subject', label: 'Email Subject', type: 'text', placeholder: 'Thanks for connecting on TreeInBio!', required: true },
          { key: 'body', label: 'Email Body Content', type: 'textarea', placeholder: 'Hi there, thank you for booking a session with me...', required: true }
        ]
      },
      {
        slug: 'GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID',
        name: 'Fetch Message Status',
        description: 'Fetch message delivery details or thread information for lead correspondence.',
        params: [
          { key: 'message_id', label: 'Gmail Message ID', type: 'text', placeholder: 'Enter Gmail Message ID', required: true }
        ]
      }
    ]
  },
  {
    id: 'youtube',
    toolkitSlug: 'youtube',
    name: 'YouTube Studio',
    category: 'Video & Social',
    iconUrl: 'https://cdn.simpleicons.org/youtube/FF0000',
    badge: 'Showreel & Stats',
    accentColor: '#FF0000',
    description: 'Showcase your YouTube channel statistics, latest showreels, and curated video playlists directly on your live bio page.',
    bioIntegration: 'Powers responsive video embeds and channel statistics on public bio cards.',
    popularActions: [
      {
        slug: 'YOUTUBE_LIST_CHANNELS',
        name: 'Fetch Channel Statistics',
        description: 'Retrieve verified channel details, subscriber count, total video count, and branding banner.',
        params: [
          { key: 'part', label: 'Parts to Fetch', type: 'text', placeholder: 'snippet,statistics', defaultValue: 'snippet,statistics' }
        ]
      },
      {
        slug: 'YOUTUBE_CREATE_PLAYLIST',
        name: 'Create Bio Playlist',
        description: 'Create a new YouTube playlist to curate top video content for bio visitors.',
        params: [
          { key: 'title', label: 'Playlist Title', type: 'text', placeholder: 'Top Highlights & Interviews 2026', required: true },
          { key: 'description', label: 'Playlist Description', type: 'text', placeholder: 'Featured videos on my TreeInBio profile' }
        ]
      }
    ]
  },
  {
    id: 'github',
    toolkitSlug: 'github',
    name: 'GitHub',
    category: 'Developer & Tech',
    iconUrl: 'https://cdn.simpleicons.org/github/24292e',
    badge: 'Dev Portfolio',
    accentColor: '#24292e',
    description: 'Sync repositories, live star counts, open-source projects, and commit heatmaps to showcase your engineering work.',
    bioIntegration: 'Powers the developer bento card with pinned repositories, star counters, and verified badges.',
    popularActions: [
      {
        slug: 'GITHUB_ADD_EMAIL_ADDRESS_FOR_AUTHENTICATED_USER',
        name: 'Manage Verified Dev Identity',
        description: 'Verify developer email addresses and identities associated with your GitHub creator profile.',
        params: [
          { key: 'emails', label: 'Email Addresses (comma separated)', type: 'text', placeholder: 'dev@treeinbio.com', required: true }
        ]
      },
      {
        slug: 'GITHUB_CREATE_AN_ORGANIZATION_REPOSITORY',
        name: 'Create Portfolio Project Repo',
        description: 'Initialize a new repository for open-source showcase or client deliverables.',
        params: [
          { key: 'name', label: 'Repository Name', type: 'text', placeholder: 'treeinbio-showcase', required: true },
          { key: 'org', label: 'Organization / Owner', type: 'text', placeholder: 'Enter organization or username', required: true }
        ]
      }
    ]
  },
  {
    id: 'instagram',
    toolkitSlug: 'instagram',
    name: 'Instagram',
    category: 'Video & Social',
    iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F',
    badge: 'Social Grid',
    accentColor: '#E4405F',
    description: 'Sync your verified Instagram profile, latest reels, media grids, and engagement insights directly to your live bio.',
    bioIntegration: 'Powers the dynamic Instagram media carousel and follower counter on public bio pages.',
    popularActions: [
      {
        slug: 'INSTAGRAM_GET_IG_MEDIA',
        name: 'Fetch Latest Media & Reels',
        description: 'Retrieve published Instagram photos, reels, or stories to update your bio media grid.',
        params: [
          { key: 'media_id', label: 'Instagram Media ID', type: 'text', placeholder: 'Enter media ID', required: true }
        ]
      },
      {
        slug: 'INSTAGRAM_CREATE_CAROUSEL_CONTAINER',
        name: 'Create Carousel Feed Container',
        description: 'Prepare a multi-image carousel container for showcase updates.',
        params: [
          { key: 'caption', label: 'Post Caption', type: 'text', placeholder: 'Check out my latest portfolio update on TreeInBio!' }
        ]
      }
    ]
  },
  {
    id: 'spotify',
    toolkitSlug: 'spotify',
    name: 'Spotify',
    category: 'Music & Audio',
    iconUrl: 'https://cdn.simpleicons.org/spotify/1DB954',
    badge: 'Audio Player',
    accentColor: '#1DB954',
    description: 'Embed your top tracks, artist discography, podcast episodes, and interactive music previews directly on your bio.',
    bioIntegration: 'Powers the interactive audio waveform player and "Now Playing" widget on public bio.',
    popularActions: [
      {
        slug: 'SPOTIFY_GET_ARTIST_S_TOP_TRACKS',
        name: "Fetch Artist's Top Tracks",
        description: 'Retrieve the top 10 catalog tracks for an artist to display on your bio audio player.',
        params: [
          { key: 'id', label: 'Spotify Artist ID', type: 'text', placeholder: 'e.g. 4Z8W4fKeB5YxbusRsdQVPb', required: true },
          { key: 'market', label: 'Market Code', type: 'text', placeholder: 'US', defaultValue: 'US' }
        ]
      },
      {
        slug: 'SPOTIFY_CREATE_PLAYLIST',
        name: 'Create Creator Bio Playlist',
        description: 'Create a brand new playlist for your followers and bio visitors.',
        params: [
          { key: 'name', label: 'Playlist Name', type: 'text', placeholder: 'Studio Vibes 2026', required: true },
          { key: 'description', label: 'Playlist Description', type: 'text', placeholder: 'Curated by TreeInBio creator' }
        ]
      }
    ]
  },
  {
    id: 'slack',
    toolkitSlug: 'slack',
    name: 'Slack',
    category: 'Community & Alerts',
    iconUrl: 'https://cdn.simpleicons.org/slack/4A154B',
    badge: 'Instant Alerts',
    accentColor: '#4A154B',
    description: 'Dispatch real-time notifications to your team Slack workspace whenever a visitor books a consultation or submits a lead.',
    bioIntegration: 'Sends instant alerts for confirmed bookings, consultation inquiries, and tip payments.',
    popularActions: [
      {
        slug: 'SLACK_ADMIN_CONVERSATIONS_SEARCH',
        name: 'Search Workspace Channels',
        description: 'List public or private team channels to configure automated alert delivery.',
        params: [
          { key: 'query', label: 'Channel Search Query', type: 'text', placeholder: 'leads or general' }
        ]
      },
      {
        slug: 'SLACK_CREATE_A_REMINDER',
        name: 'Create Meeting Reminder',
        description: 'Set an automated Slack reminder for an upcoming booked client appointment.',
        params: [
          { key: 'text', label: 'Reminder Text', type: 'text', placeholder: 'Client consultation with @visitor in 15 minutes', required: true },
          { key: 'time', label: 'Time / Offset', type: 'text', placeholder: 'in 15 minutes or 1729267200', required: true }
        ]
      }
    ]
  },
  {
    id: 'discord',
    toolkitSlug: 'discord',
    name: 'Discord',
    category: 'Community & Alerts',
    iconUrl: 'https://cdn.simpleicons.org/discord/5865F2',
    badge: 'Community Hub',
    accentColor: '#5865F2',
    description: 'Connect your VIP Discord community server to showcase live server presence, member stats, and invite links.',
    bioIntegration: 'Powers the verified Discord widget and automated server invite links on public bio.',
    popularActions: [
      {
        slug: 'DISCORD_GET_USER',
        name: 'Fetch Discord Creator Identity',
        description: 'Retrieve verified Discord user credentials, avatar, banner, and guild presence.',
        params: []
      },
      {
        slug: 'DISCORD_GET_GATEWAY',
        name: 'Check WebSocket Gateway',
        description: 'Verify live WebSocket Gateway connection health to Discord API.',
        params: []
      }
    ]
  },
  {
    id: 'notion',
    toolkitSlug: 'notion',
    name: 'Notion',
    category: 'CRM & Payments',
    iconUrl: 'https://cdn.simpleicons.org/notion/000000',
    badge: 'Workspace CRM',
    accentColor: '#000000',
    description: 'Sync your captured leads, contact inquiries, and consultation bookings directly into a Notion CRM database.',
    bioIntegration: 'Automatically appends incoming contact leads into your personal Notion CRM database.',
    popularActions: [
      {
        slug: 'NOTION_CREATE_NOTION_PAGE',
        name: 'Create CRM Lead Record',
        description: 'Creates a new page or database entry in your Notion workspace for a captured lead.',
        params: [
          { key: 'parent_id', label: 'Parent Page or Database ID', type: 'text', placeholder: 'Enter Notion page ID', required: true },
          { key: 'title', label: 'Record Title', type: 'text', placeholder: 'New Lead: John Doe', required: true }
        ]
      },
      {
        slug: 'NOTION_CREATE_DATABASE',
        name: 'Create Bio CRM Database',
        description: 'Creates a structured database in Notion specifically for TreeInBio bookings and leads.',
        params: [
          { key: 'parent_page_id', label: 'Parent Page ID', type: 'text', placeholder: 'Enter Notion parent page ID', required: true },
          { key: 'title', label: 'Database Name', type: 'text', placeholder: 'TreeInBio Contacts CRM 2026', required: true }
        ]
      }
    ]
  },
  {
    id: 'stripe',
    toolkitSlug: 'stripe',
    name: 'Stripe Express',
    category: 'CRM & Payments',
    iconUrl: 'https://cdn.simpleicons.org/stripe/635BFF',
    badge: 'Monetization',
    accentColor: '#635BFF',
    description: 'Accept 1-click tips, donations, and paid consultation bookings directly into your bank account with zero platform fees.',
    bioIntegration: 'Powers the "Send Tip" and paid booking checkout flow on your live bio page.',
    popularActions: [
      {
        slug: 'STRIPE_CREATE_CUSTOMER',
        name: 'Sync Customer Profile',
        description: 'Creates a customer record in Stripe for a client who confirmed a consultation.',
        params: [
          { key: 'email', label: 'Customer Email', type: 'email', placeholder: 'client@example.com', required: true },
          { key: 'name', label: 'Customer Name', type: 'text', placeholder: 'Jane Doe' }
        ]
      },
      {
        slug: 'STRIPE_CREATE_CUSTOMER_BALANCE_TRANSACTION',
        name: 'Balance Transaction Check',
        description: 'Check or adjust balance transactions for consultation bookings.',
        params: [
          { key: 'customer', label: 'Stripe Customer ID', type: 'text', placeholder: 'cus_...', required: true },
          { key: 'amount', label: 'Amount (in cents)', type: 'number', placeholder: '5000', required: true },
          { key: 'currency', label: 'Currency', type: 'text', placeholder: 'usd', defaultValue: 'usd' }
        ]
      }
    ]
  }
];
