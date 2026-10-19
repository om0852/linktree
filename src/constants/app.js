/**
 * TreeInBio - Centralized Application Constants
 */

export const PLATFORM_NAME = 'TreeInBio';
export const PLATFORM_TAGLINE = 'The Modern Bio-Link & Digital Creator Studio Platform';
export const PLATFORM_SUPPORT_EMAIL = 'support@treeinbio.com';
export const DEFAULT_AVATAR_BACKGROUND = '52796F';
export const DEFAULT_AVATAR_COLOR = 'FFFEFA';

export const AUTH_COOKIE_NAME = 'tb_auth_token';
export const AUTH_TOKEN_EXPIRY_DAYS = 7;

export const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const INITIAL_USER_PROFILE = {
  username: '',
  name: 'New Creator',
  title: 'Digital Creator & Professional',
  titleLogo: {
    enabled: false,
    url: '',
    height: 40,
  },
  bio: 'Welcome to my official TreeInBio page! Explore my links and connect below.',
  avatar: '',
  avatarShape: 'circle', // 'circle' | 'rounded' | 'squircle' | 'arch' | 'hexagon' | 'diamond'
  verified: false,
  location: '',
  niche: 'creator',
  nicheLabel: 'Creator',
  layout: 'bento',
  theme: 'atelier',
  buttonShape: 'rounded',
  font: 'Playfair Display',
  headerLayout: 'classic', // 'classic' | 'banner' | 'hero' | 'cutout' | 'shape'
  coverImage: '',
  socialsPosition: 'top',
  heroVideo: '',
  socials: {},
  links: [],
  collections: [],
  widgets: {
    hasNewsletter: false,
    newsletterTitle: 'Subscribe for direct updates',
    hasTipJar: true,
    mediaKitStats: {
      followers: '0',
      engagement: '0%',
      monthlyViews: '0',
    },
  },
  storyBubble: {
    enabled: false,
    videoUrl: '',
    caption: '',
  },
  socialProof: {
    enabled: false,
    showDownloads: true,
    showClicks: true,
    intervalMs: 8000,
  },
  trackingPixels: {
    metaPixelId: '',
    ga4MeasurementId: '',
    tiktokPixelId: '',
    pinterestTagId: '',
  },
  compliance: {
    affiliateDisclosure: false,
    disclosureText: 'This page contains affiliate links. I may earn a commission at no extra cost to you.',
  },
  accessGate: {
    enabled: false,
    type: 'none', // 'none' | 'passcode' | 'age_18' | 'sensitive'
    passcode: '',
    title: 'Restricted Profile',
    description: 'This profile requires verification before viewing content.',
  },
  leadCapture: {
    enabled: true,
    title: "Let's Connect",
    subtitle: 'Drop your contact info to get in touch directly',
    buttonText: 'Exchange Contact',
    triggerMode: 'button_only',
    autoOpenDelaySeconds: 3,
    fields: {
      name: { enabled: true, required: true, label: 'Full Name' },
      phone: { enabled: true, required: true, label: 'Phone Number' },
      email: { enabled: true, required: true, label: 'Email Address' },
      company: { enabled: false, required: false, label: 'Company / Organization' },
      note: { enabled: true, required: false, label: 'Message / Project Details' },
    },
    syncToGoogleContacts: true,
    successMessage: 'Thank you! Your contact details have been sent.',
  },
  scheduleMeeting: {
    enabled: true,
    title: 'Book a 1:1 Consultation',
    subtitle: 'Pick an open slot for a direct video call.',
    buttonText: 'Schedule 1:1',
    durationMinutes: 30,
    price: 'Free',
    platform: 'google_meet',
    customLocationUrl: '',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startHour: '09:00',
    endHour: '17:00',
    slotIntervalMinutes: 30,
    timezone: 'UTC',
    googleCalendarSync: true,
  },
  alternativeTitleFont: '',
  shop: {
    enabled: true,
    published: false,
    collections: [],
    products: [],
  },
  designSettings: {
    wallpaper: {
      type: 'fill',
      value: '#FFFEFA',
      gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      blurImage: '',
      pattern: 'dots',
      imageUrl: '',
      videoUrl: '',
    },
    buttonStyle: 'solid', // 'solid' | 'glass' | 'outline'
    buttonRoundness: 'full', // 'sharp' | 'slight' | 'rounded' | 'full'
    buttonShadow: 'soft', // 'none' | 'soft' | 'hard' | 'offset'
    buttonColor: '#52796F',
    buttonTextColor: '#FFFFFF',
    buttonShadowColor: 'rgba(0,0,0,0.12)',
    customColors: ['#52796F', '#28352F', '#FFFEFA', '#F5F3ED', '#CAD8CE', '#38BDF8'],
    stickers: [],
    hideFooter: false,
  },
};

export const DEFAULT_EMPTY_PROFILE = INITIAL_USER_PROFILE;

export const THEME_PRESETS = [
  { id: 'atelier', name: 'Atelier (Default)', bg: 'bg-[#FFFEFA]', cardBg: 'bg-[#F5F3ED]', text: 'text-[#28352F]', border: 'border-[#CAD8CE]', accent: '#52796F', primary: '#52796F', tag: 'Editorial' },
  { id: 'emerald-gold', name: 'Emerald & Gold', bg: 'bg-[#0f241d]', cardBg: 'bg-[#153228]', text: 'text-[#f6edd9]', border: 'border-[#cbb279]/40', accent: '#cbb279', primary: '#0f241d', tag: 'Luxury' },
  { id: 'dark-glass', name: 'Dark Glassmorphism', bg: 'bg-[#090d16]', cardBg: 'bg-white/10', text: 'text-white', border: 'border-white/20', accent: '#38bdf8', primary: '#38bdf8', tag: 'Futuristic' },
  { id: 'sunset', name: 'Sunset Gradient', bg: 'bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600', cardBg: 'bg-white/20', text: 'text-white', border: 'border-white/30', accent: '#f59e0b', primary: '#f59e0b', tag: 'Vibrant' },
  { id: 'minimal-light', name: 'Minimal Light', bg: 'bg-white', cardBg: 'bg-stone-50', text: 'text-stone-900', border: 'border-stone-200', accent: '#1c1917', primary: '#1c1917', tag: 'Clean' },
  { id: 'neon', name: 'Cyber Neon', bg: 'bg-slate-950', cardBg: 'bg-slate-900/90', text: 'text-emerald-400', border: 'border-emerald-500/50', accent: '#10b981', primary: '#10b981', tag: 'Cyber' },
  { id: 'agate', name: 'Agate Stone', bg: 'bg-[#2B2D42]', cardBg: 'bg-[#8D99AE]/20', text: 'text-[#EDF2F4]', border: 'border-[#8D99AE]/40', accent: '#EF233C', primary: '#2B2D42', tag: 'Modern' },
  { id: 'air', name: 'Air Sky', bg: 'bg-[#EBF4F6]', cardBg: 'bg-[#FFFFFF]', text: 'text-[#088395]', border: 'border-[#4E8EA2]/30', accent: '#0A4D68', primary: '#088395', tag: 'Breezy' },
  { id: 'astrid', name: 'Astrid Purple', bg: 'bg-[#1D1128]', cardBg: 'bg-[#371E4A]', text: 'text-[#E2CFEA]', border: 'border-[#805090]/40', accent: '#A06CD5', primary: '#1D1128', tag: 'Mystic' },
  { id: 'aura', name: 'Aura Glow', bg: 'bg-gradient-to-tr from-[#FFDEE9] to-[#B5FFFC]', cardBg: 'bg-white/70', text: 'text-[#333333]', border: 'border-white/60', accent: '#FF758C', primary: '#FF758C', tag: 'Pastel' },
  { id: 'bliss', name: 'Bliss Peach', bg: 'bg-[#FFF3E2]', cardBg: 'bg-[#FFE5CA]', text: 'text-[#1C0A00]', border: 'border-[#FA9884]/40', accent: '#E76161', primary: '#E76161', tag: 'Warm' },
  { id: 'bloom', name: 'Bloom Floral', bg: 'bg-[#F9F5F6]', cardBg: 'bg-[#F8E8EE]', text: 'text-[#4A2E35]', border: 'border-[#FDCEDF]', accent: '#DF7899', primary: '#DF7899', tag: 'Floral' },
  { id: 'breeze', name: 'Breeze Mint', bg: 'bg-[#E8F1F2]', cardBg: 'bg-[#FFFFFF]', text: 'text-[#13293D]', border: 'border-[#006494]/20', accent: '#247BA0', primary: '#247BA0', tag: 'Fresh' },
  { id: 'haven', name: 'Haven Earth', bg: 'bg-[#EFE9E6]', cardBg: 'bg-[#E0D5CE]', text: 'text-[#3B2C24]', border: 'border-[#C2ABA0]/50', accent: '#7F5539', primary: '#7F5539', tag: 'Organic' },
  { id: 'mineral', name: 'Mineral Slate', bg: 'bg-[#1E2022]', cardBg: 'bg-[#2B2E4A]', text: 'text-[#F0F5F9]', border: 'border-[#52616B]/40', accent: '#E84545', primary: '#1E2022', tag: 'Industrial' },
  { id: 'nourish', name: 'Nourish Sage', bg: 'bg-[#E9EDC9]', cardBg: 'bg-[#FEFAE0]', text: 'text-[#283618]', border: 'border-[#CCD5AE]', accent: '#606C38', primary: '#606C38', tag: 'Earthy' },
  { id: 'rise', name: 'Rise Gold', bg: 'bg-[#1A1A1D]', cardBg: 'bg-[#4E4E50]', text: 'text-[#FFEAA7]', border: 'border-[#F1C40F]/40', accent: '#F39C12', primary: '#F39C12', tag: 'Sunset' },
  { id: 'twilight', name: 'Twilight Deep', bg: 'bg-gradient-to-b from-[#0F2027] via-[#203A43] to-[#2C5364]', cardBg: 'bg-white/10', text: 'text-[#E0EAFC]', border: 'border-white/20', accent: '#6DD5ED', primary: '#6DD5ED', tag: 'Night' },
];

export const AVATAR_SHAPES = [
  { id: 'circle', name: 'Circle', label: 'Circle', class: 'rounded-full' },
  { id: 'rounded', name: 'Rounded', label: 'Rounded', class: 'rounded-2xl' },
  { id: 'squircle', name: 'Squircle', label: 'Squircle', class: 'rounded-[30%]' },
  { id: 'arch', name: 'Arch', label: 'Arch', class: 'rounded-t-full rounded-b-xl' },
  { id: 'hexagon', name: 'Hexagon', label: 'Hexagon', class: 'mask-hexagon' },
  { id: 'diamond', name: 'Diamond', label: 'Diamond', class: 'rounded-xl rotate-45 scale-90' },
  { id: 'cutout', name: 'Cutout', label: 'Cutout', class: 'rounded-none' },
];

export const CURATED_THEMES = [
  { id: 'ariana-cloud', name: 'Ariana Cloud', creator: 'Ariana Grande', bg: 'bg-gradient-to-b from-[#f3e7e9] via-[#e3eeff] to-[#e3eeff]', cardBg: 'bg-white/80 backdrop-blur-md', text: 'text-[#4A4E69]', border: 'border-[#C9ADA7]/40', accent: '#9A8C98', primary: '#9A8C98', tag: 'Pop Icon' },
  { id: 'olivia-guts', name: 'Olivia Guts', creator: 'Olivia Rodrigo', bg: 'bg-[#2B0938]', cardBg: 'bg-[#431259]', text: 'text-[#F3C5FF]', border: 'border-[#9B5DE5]/50', accent: '#E056FD', primary: '#9B5DE5', tag: 'Alt Pop' },
  { id: 'billie-blohsh', name: 'Billie Neon', creator: 'Billie Eilish', bg: 'bg-[#0b0c10]', cardBg: 'bg-[#1f2833]', text: 'text-[#25f43a]', border: 'border-[#25f43a]/50', accent: '#25f43a', primary: '#25f43a', tag: 'Hyper Dark' },
  { id: 'travis-cactus', name: 'Cactus Earth', creator: 'Travis Scott', bg: 'bg-[#3A332B]', cardBg: 'bg-[#52493F]', text: 'text-[#E8DCC4]', border: 'border-[#8C7A6B]/50', accent: '#D4A373', primary: '#D4A373', tag: 'Hypebeast' },
  { id: 'dua-future', name: 'Nostalgia Disco', creator: 'Dua Lipa', bg: 'bg-gradient-to-tr from-[#FF007F] via-[#7928CA] to-[#00DFD8]', cardBg: 'bg-black/40 backdrop-blur-lg', text: 'text-white', border: 'border-white/30', accent: '#00DFD8', primary: '#FF007F', tag: 'Nu-Disco' },
  { id: 'steve-lacy', name: 'Gemini Lo-Fi', creator: 'Steve Lacy', bg: 'bg-[#FFB703]', cardBg: 'bg-[#FB8500]/20', text: 'text-[#023047]', border: 'border-[#023047]/30', accent: '#219EBC', primary: '#023047', tag: 'Lo-Fi' },
];

export const GOOGLE_FONTS_LIST = {
  suggested: [
    { name: 'Playfair Display', category: 'Serif', sample: 'Elegance Redefined' },
    { name: 'Cinzel', category: 'Display', sample: 'ROYALTY & CLASS' },
    { name: 'Abril Fatface', category: 'Display', sample: 'Bold Editorial' },
    { name: 'Bebas Neue', category: 'Display', sample: 'POWERFUL HEADLINES' },
    { name: 'Righteous', category: 'Display', sample: 'Modernist Wave' },
    { name: 'Pacifico', category: 'Handwriting', sample: 'California Coast' },
    { name: 'Lobster', category: 'Display', sample: 'Playful Curves' },
    { name: 'Great Vibes', category: 'Handwriting', sample: 'Luxury Script' },
    { name: 'Sacramento', category: 'Handwriting', sample: 'Fine Signature' },
    { name: 'Dancing Script', category: 'Handwriting', sample: 'Dynamic Motion' },
    { name: 'Permanent Marker', category: 'Handwriting', sample: 'STREET ATTITUDE' },
    { name: 'Monoton', category: 'Display', sample: 'NEO DISCO' },
    { name: 'Caveat', category: 'Handwriting', sample: 'Casual handwritten notes' },
    { name: 'Satisfy', category: 'Handwriting', sample: 'Smooth calligraphy' },
    { name: 'Comfortaa', category: 'Display', sample: 'Friendly & rounded' },
    { name: 'Fredoka', category: 'Display', sample: 'Pop & bouncy vibes' },
    { name: 'Russo One', category: 'Display', sample: 'HEAVY IMPACT' },
    { name: 'Bangers', category: 'Display', sample: 'COMIC BOOK ACTION' },
    { name: 'Audiowide', category: 'Display', sample: 'CYBER TECH 2099' },
    { name: 'Faster One', category: 'Display', sample: 'SPEED VELOCITY' },
    { name: 'Creepster', category: 'Display', sample: 'SPOOKY NIGHT' },
    { name: 'Special Elite', category: 'Display', sample: 'Vintage typewriter key' },
    { name: 'Press Start 2P', category: 'Display', sample: '8-BIT RETRO GAMER' },
    { name: 'Bungee', category: 'Display', sample: 'URBAN SIGNAGE' },
    { name: 'Shrikhand', category: 'Display', sample: 'Spicy Display Pop' },
    { name: 'Ultra', category: 'Serif', sample: 'TITANIC SLAB' },
    { name: 'Titan One', category: 'Display', sample: 'CHUNKY POSTER' },
    { name: 'Syne', category: 'Display', sample: 'Avant-garde Fashion' },
  ],
  other: [
    { name: 'Inter', category: 'Sans-Serif', sample: 'Universal interface standard' },
    { name: 'Roboto', category: 'Sans-Serif', sample: 'Clean modern precision' },
    { name: 'Open Sans', category: 'Sans-Serif', sample: 'Optimized web clarity' },
    { name: 'Montserrat', category: 'Sans-Serif', sample: 'Geometric architectural purity' },
    { name: 'Lato', category: 'Sans-Serif', sample: 'Warm balanced humanism' },
    { name: 'Poppins', category: 'Sans-Serif', sample: 'Friendly geometric curves' },
    { name: 'Raleway', category: 'Sans-Serif', sample: 'Sophisticated thin tracking' },
    { name: 'Nunito', category: 'Sans-Serif', sample: 'Soft rounded sans-serif' },
    { name: 'Oswald', category: 'Sans-Serif', sample: 'CONDENSED IMPACT DESIGN' },
    { name: 'Merriweather', category: 'Serif', sample: 'Pleasant reading on screens' },
    { name: 'Source Sans 3', category: 'Sans-Serif', sample: 'Engineered typographic clarity' },
    { name: 'Quicksand', category: 'Sans-Serif', sample: 'Minimal soft curves' },
    { name: 'Rubik', category: 'Sans-Serif', sample: 'Slightly rounded structure' },
    { name: 'Work Sans', category: 'Sans-Serif', sample: 'Optimized for mobile UI' },
    { name: 'DM Sans', category: 'Sans-Serif', sample: 'Crisp contemporary tech' },
    { name: 'Plus Jakarta Sans', category: 'Sans-Serif', sample: 'Premium startup brand standard' },
    { name: 'Space Grotesk', category: 'Sans-Serif', sample: 'Tech-forward quirky details' },
    { name: 'Fira Code', category: 'Monospace', sample: '=> Developer code ligatures' },
    { name: 'Space Mono', category: 'Monospace', sample: 'Raw monospaced tech terminal' },
    { name: 'Lora', category: 'Serif', sample: 'Contemporary literary craft' },
  ],
};

export const STICKER_PACKS = [
  {
    id: 'spooky',
    name: 'Sorta Spooky',
    tag: 'Trending',
    stickers: [
      { id: 'spooky_1', name: 'Ghostie', emoji: '👻', url: '' },
      { id: 'spooky_2', name: 'Pumpkin Jack', emoji: '🎃', url: '' },
      { id: 'spooky_3', name: 'Witch Hat', emoji: '🧙‍♀️', url: '' },
      { id: 'spooky_4', name: 'Bat Flap', emoji: '🦇', url: '' },
      { id: 'spooky_5', name: 'Spider Web', emoji: '🕸️', url: '' },
      { id: 'spooky_6', name: 'Crystal Ball', emoji: '🔮', url: '' },
    ],
  },
  {
    id: 'creator',
    name: 'Like & Subscribe',
    tag: 'Creator Pack',
    stickers: [
      { id: 'creator_1', name: 'Subscribe Bell', emoji: '🔔', url: '' },
      { id: 'creator_2', name: 'Fire Flame', emoji: '🔥', url: '' },
      { id: 'creator_3', name: '100 Score', emoji: '💯', url: '' },
      { id: 'creator_4', name: 'Sparkles Star', emoji: '✨', url: '' },
      { id: 'creator_5', name: 'Thumbs Up', emoji: '👍', url: '' },
      { id: 'creator_6', name: 'Red Heart', emoji: '❤️', url: '' },
    ],
  },
  {
    id: 'arrows',
    name: 'This Way!',
    tag: 'Pointers',
    stickers: [
      { id: 'arrow_1', name: 'Point Down', emoji: '👇', url: '' },
      { id: 'arrow_2', name: 'Point Right', emoji: '👉', url: '' },
      { id: 'arrow_3', name: 'Neon Arrow', emoji: '➡️', url: '' },
      { id: 'arrow_4', name: 'Down Arrow', emoji: '⬇️', url: '' },
      { id: 'arrow_5', name: 'Target Bullseye', emoji: '🎯', url: '' },
      { id: 'arrow_6', name: 'Rocket Blast', emoji: '🚀', url: '' },
    ],
  },
  {
    id: 'cause',
    name: 'Community & Cause',
    tag: 'Support',
    stickers: [
      { id: 'cause_1', name: 'Support Hands', emoji: '🤲', url: '' },
      { id: 'cause_2', name: 'Green Plant', emoji: '🌱', url: '' },
      { id: 'cause_3', name: 'Rainbow Peace', emoji: '🌈', url: '' },
      { id: 'cause_4', name: 'Donate Coin', emoji: '🪙', url: '' },
      { id: 'cause_5', name: 'Loving Ribbon', emoji: '🎗️', url: '' },
      { id: 'cause_6', name: 'Global Earth', emoji: '🌍', url: '' },
    ],
  },
];

export function getTitleFontName(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    if (val.enabled === false) return '';
    return val.font || '';
  }
  return '';
}

/**
 * Validates whether a sticker src/imageUrl is a valid URL or base64 image
 * to prevent emoji strings from triggering broken <img> tags.
 */
export const isImageUrl = (val) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
};

/**
 * Mathematically projects sticker coordinates and transforms across devices
 * (Mobile, Tablet, and Laptop in Split or Centered modes).
 */
export const getStickerDeviceProps = (stk, targetMode = 'mobile', desktopLayout = 'split') => {
  if (!stk) return { x: 50, y: 50, scale: 1, rotate: 0, flipX: false, anchorType: 'HEADER', coordinateMode: 'height-percent' };

  const anchorType = stk?.devices?.mobile?.anchorType ?? stk?.anchorType ?? 'HEADER';

  // 1. If explicit override exists for this specific device mode, use it directly!
  const override = stk?.devices?.[targetMode];
  if (override && typeof override.x === 'number' && typeof override.y === 'number') {
    return {
      x: override.x,
      y: override.y,
      scale: override.scale ?? stk.scale ?? 1,
      rotate: override.rotate ?? override.rotation ?? stk.rotate ?? stk.rotation ?? 0,
      flipX: Boolean(override.flipX ?? override.flipHorizontal ?? stk.flipX ?? stk.flipHorizontal),
      coordinateMode: override.coordinateMode ?? stk.coordinateMode ?? 'height-percent',
      anchorType: override.anchorType ?? anchorType,
    };
  }

  // 2. Base mobile reference coordinates
  const mobileOverride = stk?.devices?.mobile;
  const baseX = typeof mobileOverride?.x === 'number' ? mobileOverride.x : (typeof stk.x === 'number' ? stk.x : 50);
  const baseY = typeof mobileOverride?.y === 'number' ? mobileOverride.y : (typeof stk.y === 'number' ? stk.y : 50);
  const baseScale = mobileOverride?.scale ?? stk.scale ?? 1;
  const baseRotate = mobileOverride?.rotate ?? mobileOverride?.rotation ?? stk.rotate ?? stk.rotation ?? 0;
  const baseFlip = Boolean(mobileOverride?.flipX ?? mobileOverride?.flipHorizontal ?? stk.flipX ?? stk.flipHorizontal);
  const coordinateMode = mobileOverride?.coordinateMode ?? stk.coordinateMode ?? 'height-percent';

  if (targetMode === 'mobile') {
    return {
      x: baseX,
      y: baseY,
      scale: baseScale,
      rotate: baseRotate,
      flipX: baseFlip,
      coordinateMode,
      anchorType,
    };
  }

  // 3. Mathematical Projection: Mobile -> Tablet (Single column wider bento)
  if (targetMode === 'tablet') {
    const deltaX = baseX - 50;
    // Map horizontal distance from center proportionally to tablet card width
    const tabletX = Math.round(Math.max(5, Math.min(95, 50 + deltaX * 0.85)));
    const tabletY = coordinateMode === 'pixel-offset'
      ? baseY
      : Math.max(2, Math.min(98, baseY));
    return {
      x: tabletX,
      y: tabletY,
      scale: Number((baseScale * 1.05).toFixed(2)),
      rotate: baseRotate,
      flipX: baseFlip,
      coordinateMode,
      anchorType,
    };
  }

  // 4. Mathematical Projection: Mobile -> Laptop
  if (targetMode === 'laptop' || targetMode === 'fluid' || targetMode === 'desktop') {
    if (desktopLayout === 'centered') {
      // Centered stream mode: card width spans 672px of 1024px (~65.6%) centered at 50%
      const deltaX = baseX - 50;
      const centeredX = Math.round(Math.max(8, Math.min(92, 50 + deltaX * 0.656)));
      return {
        x: centeredX,
        y: coordinateMode === 'pixel-offset' ? baseY : Math.max(2, Math.min(98, baseY)),
        scale: Number((baseScale * 1.1).toFixed(2)),
        rotate: baseRotate,
        flipX: baseFlip,
        coordinateMode,
        anchorType,
      };
    } else {
      // 2-Column Split Bento mode:
      // Left Column (Header, Avatar, Bio, TipJar) is width 42%, Center = 21%
      // Right Column (Links, Shop, Newsletter) is width 58%, Center = 71%
      if (coordinateMode === 'pixel-offset') {
        const splitX = baseX < 50 ? Math.round(Math.max(4, Math.min(38, 21 + (baseX - 50) * 0.38))) : Math.round(Math.max(44, Math.min(96, 71 + (baseX - 50) * 0.52)));
        return {
          x: splitX,
          y: baseY,
          scale: Number((baseScale * 1.05).toFixed(2)),
          rotate: baseRotate,
          flipX: baseFlip,
          coordinateMode,
          anchorType,
        };
      } else if (baseY <= 28) {
        // Upper section -> Anchored to Left Column around Avatar/Bio
        const deltaX = baseX - 50;
        const leftColX = Math.round(Math.max(4, Math.min(38, 21 + deltaX * 0.38)));
        const leftColY = Math.round(Math.max(3, Math.min(45, baseY * 1.25)));
        return {
          x: leftColX,
          y: leftColY,
          scale: Number((baseScale * 1.05).toFixed(2)),
          rotate: baseRotate,
          flipX: baseFlip,
          coordinateMode,
          anchorType,
        };
      } else {
        // Lower section -> Anchored to Right Column around Links/Widgets
        const deltaX = baseX - 50;
        const rightColX = Math.round(Math.max(44, Math.min(96, 71 + deltaX * 0.52)));
        const rightColY = Math.round(Math.max(5, Math.min(95, (baseY - 20) * 1.1)));
        return {
          x: rightColX,
          y: rightColY,
          scale: Number((baseScale * 1.05).toFixed(2)),
          rotate: baseRotate,
          flipX: baseFlip,
          coordinateMode,
          anchorType,
        };
      }
    }
  }

  return { x: baseX, y: baseY, scale: baseScale, rotate: baseRotate, flipX: baseFlip, coordinateMode, anchorType };
};

// Sticker artwork is authored at the editor's unscaled canvas size, then grows
// with the rendered device canvas in the public profile.
const STICKER_REFERENCE_WIDTHS = { mobile: 308, tablet: 596, laptop: 828, fluid: 904 };

export const getStickerCanvasPositionStyle = (props) => ({
  left: `${props?.x ?? 50}%`,
  top: props?.coordinateMode === 'pixel-offset'
    ? `${props?.y ?? 0}px`
    : `${props?.y ?? 50}%`,
});

export const getStickerGraphicSizeStyle = (targetMode = 'mobile', graphic = 'emoji') => {
  const referenceWidth = STICKER_REFERENCE_WIDTHS[targetMode] || STICKER_REFERENCE_WIDTHS.mobile;
  const width = graphic === 'image' ? 40 : 30;
  const cssWidth = `${Number(((width / referenceWidth) * 100).toFixed(4))}cqw`;

  return graphic === 'image'
    ? { width: cssWidth, height: cssWidth }
    : {
        fontSize: cssWidth,
        lineHeight: `${Number(((36 / referenceWidth) * 100).toFixed(4))}cqw`,
      };
};

export const parseTailwindGradient = (str) => {
  if (!str) return '';
  if (str.startsWith('#') || str.startsWith('rgb') || str.startsWith('hsl')) return str;
  if (str.startsWith('linear-gradient') || str.startsWith('radial-gradient')) return str;
  if (!str.includes('from-') && !str.includes('to-') && !str.includes('gradient')) return str;

  // Direction
  let direction = 'to bottom';
  if (str.includes('to-br')) direction = 'to bottom right';
  else if (str.includes('to-tr')) direction = 'to top right';
  else if (str.includes('to-bl')) direction = 'to bottom left';
  else if (str.includes('to-tl')) direction = 'to top left';
  else if (str.includes('to-r')) direction = 'to right';
  else if (str.includes('to-l')) direction = 'to left';
  else if (str.includes('to-t')) direction = 'to top';
  else if (str.includes('to-b')) direction = 'to bottom';

  const getColor = (token) => {
    if (!token) return null;
    const matchHex = token.match(/\[(#[a-fA-F0-9]+)\]/);
    if (matchHex) return matchHex[1];
    const namedColors = {
      'amber-500': '#f59e0b',
      'amber-400': '#fbbf24',
      'rose-500': '#f43f5e',
      'rose-600': '#e11d48',
      'purple-600': '#9333ea',
      'purple-500': '#a855f7',
      'indigo-900': '#312e81',
      'indigo-600': '#4f46e5',
      'cyan-500': '#06b6d4',
      'cyan-400': '#22d3ee',
      'slate-950': '#020617',
      'slate-900': '#0f172a',
      'zinc-900': '#18181b',
      'emerald-500': '#10b981',
      'emerald-400': '#34d399',
      'emerald-600': '#059669',
      'teal-500': '#14b8a6',
      'blue-600': '#2563eb',
      'blue-500': '#3b82f6',
      'white': '#ffffff',
      'black': '#000000',
    };
    for (const [k, v] of Object.entries(namedColors)) {
      if (token.includes(k)) return v;
    }
    return null;
  };

  const tokens = str.split(' ');
  const fromToken = tokens.find(t => t.startsWith('from-'));
  const viaToken = tokens.find(t => t.startsWith('via-'));
  const toToken = tokens.find(t => t.startsWith('to-'));

  const fromColor = getColor(fromToken) || '#203A43';
  const viaColor = getColor(viaToken);
  const toColor = getColor(toToken) || '#2C5364';

  if (viaColor) {
    return `linear-gradient(${direction}, ${fromColor}, ${viaColor}, ${toColor})`;
  }
  return `linear-gradient(${direction}, ${fromColor}, ${toColor})`;
};

