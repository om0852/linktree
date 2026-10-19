/**
 * TreeInBio - Theme Presets & Color Definitions
 */

export const THEME_PRESETS = [
  {
    id: 'atelier',
    name: 'Atelier Luxury (Editorial)',
    primaryColor: '#52796F',
    backgroundColor: '#FFFEFA',
    containerColor: '#F5F3ED',
    textColor: '#28352F',
    accentColor: '#CAD8CE',
    previewClass: 'bg-[#FFFEFA] border border-[#CAD8CE]',
  },
  {
    id: 'emerald-gold',
    name: 'Emerald & Gold',
    primaryColor: '#10b981',
    backgroundColor: '#030f0a',
    containerColor: '#082418',
    textColor: '#ffffff',
    accentColor: '#facc15',
    previewClass: 'bg-gradient-to-r from-emerald-600 to-amber-500',
  },
  {
    id: 'minimal-light',
    name: 'Minimal Clean Light',
    primaryColor: '#10b981',
    backgroundColor: '#f8fafc',
    containerColor: '#ffffff',
    textColor: '#062013',
    accentColor: '#a7f3d0',
    previewClass: 'bg-stone-100 border border-stone-300',
  },
  {
    id: 'dark-glass',
    name: 'Dark Glassmorphism',
    primaryColor: '#10b981',
    backgroundColor: '#040e0a',
    containerColor: '#0d261b',
    textColor: '#f8fafc',
    accentColor: '#34d399',
    previewClass: 'bg-stone-900 border border-emerald-500/30',
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    primaryColor: '#f59e0b',
    backgroundColor: '#1f1603',
    containerColor: '#3d2c07',
    textColor: '#fefce8',
    accentColor: '#facc15',
    previewClass: 'bg-gradient-to-r from-amber-600 to-yellow-500',
  },
  {
    id: 'neon',
    name: 'Cyberpunk Neon',
    primaryColor: '#22c55e',
    backgroundColor: '#020a05',
    containerColor: '#0a2215',
    textColor: '#4ade80',
    accentColor: '#86efac',
    previewClass: 'bg-black border border-emerald-400',
  },
];

export const BUTTON_SHAPES = [
  { id: 'rounded', label: 'Soft Rounded', class: 'rounded-xl' },
  { id: 'sharp', label: 'Editorial Sharp', class: 'rounded-none' },
  { id: 'pill', label: 'Organic Pill', class: 'rounded-full' },
  { id: 'brutalism', label: 'Neo-Brutalism', class: 'rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' },
];

export const FONTS = [
  { id: 'Inter', label: 'Inter (Design System Primary)', family: 'var(--font-sans)' },
  { id: 'Playfair Display', label: 'Playfair Display (Haute Couture Serif)', family: 'var(--font-serif)' },
  { id: 'DM Sans', label: 'DM Sans (Clean Modern Geometric)', family: 'var(--font-dm)' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Sleek Tech)', family: 'var(--font-jakarta)' },
  { id: 'Space Grotesk', label: 'Space Grotesk (Editorial Brutalist)', family: 'var(--font-space)' },
];
