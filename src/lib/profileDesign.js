// Design changes shared by the Studio and the MCP tools, so a theme or
// template applied by an AI assistant looks exactly like one picked by hand.
import { THEME_PRESETS, CURATED_THEMES, DEFAULT_EMPTY_PROFILE } from '../constants/app.js';
import { PROFILE_TEMPLATES } from '../constants/templates.js';
import { getPresetWallpaper, getThemeAppearance } from './theme-contrast.js';

export const ALL_THEMES = [...THEME_PRESETS, ...CURATED_THEMES];

export const findTheme = (id) => ALL_THEMES.find((theme) => theme.id === id) || null;
export const findTemplate = (id) => PROFILE_TEMPLATES.find((template) => template.id === id) || null;

/** Profile with `preset` applied: wallpaper, button colours and readable text. */
export function applyThemeToProfile(profile, preset) {
  const wallpaper = getPresetWallpaper(preset);
  const look = getThemeAppearance(preset);
  const ds = profile.designSettings || {};
  return {
    ...profile,
    theme: preset.id,
    buttonShape: preset.buttonShape || profile.buttonShape || 'rounded',
    font: preset.font || profile.font || 'Plus Jakarta Sans',
    headerLayout: preset.headerLayout || profile.headerLayout || 'classic',
    avatarShape: preset.avatarShape || profile.avatarShape || 'circle',
    designSettings: {
      ...ds,
      // A theme replaces the wallpaper and every colour, so nothing from the
      // previous theme (a dark fill, a light title) survives the switch.
      wallpaper: { ...(ds.wallpaper || {}), ...wallpaper, imageUrl: '', blurImage: '', videoUrl: '' },
      buttonColor: look.button,
      buttonTextColor: look.buttonText,
      buttonStyle: preset.cardBg?.includes('/10') || preset.cardBg?.includes('/20') || preset.id === 'dark-glass'
        ? 'glass'
        : (ds.buttonStyle === 'glass' ? 'solid' : (ds.buttonStyle || 'solid')),
      buttonRoundness: ds.buttonRoundness || 'rounded',
      customColors: { ...(ds.customColors || {}), title: look.title, pageText: look.body },
    },
  };
}

/** Starter links for a template, shaped like Studio links. */
export function templateStarterLinks(template, now = Date.now()) {
  return template.links.map((item, index) => ({
    id: `link_${now}_${index}`,
    title: item.title,
    subtitle: item.subtitle,
    icon: item.icon,
    highlight: item.highlight || 'none',
    url: '#',
    badge: '',
    size: 'large',
    clicks: 0,
    active: true,
    disabled: false,
    isArchived: false,
  }));
}

/**
 * Profile with `template` applied: its theme plus fonts, header, avatar and
 * button corners. Starter links and bio are only added when the profile has
 * none of its own (`addStarterLinks` false skips the links).
 */
export function applyTemplateToProfile(profile, template, { addStarterLinks = true, now = Date.now() } = {}) {
  const theme = findTheme(template.themeId);
  const themed = theme ? applyThemeToProfile(profile, theme) : profile;
  const hasLinks = (themed.links || []).some((link) => !link.isArchived);
  const defaultBio = !themed.bio || themed.bio === DEFAULT_EMPTY_PROFILE.bio;
  return {
    ...themed,
    font: template.font,
    alternativeTitleFont: { enabled: true, font: template.titleFont },
    headerLayout: template.headerLayout || themed.headerLayout,
    avatarShape: template.avatarShape || themed.avatarShape,
    bio: defaultBio ? template.bio : themed.bio,
    designSettings: { ...(themed.designSettings || {}), buttonRoundness: template.buttonRoundness || 'rounded' },
    links: hasLinks || !addStarterLinks ? themed.links : [...templateStarterLinks(template, now), ...(themed.links || [])],
  };
}
