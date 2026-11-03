// check_page: a read-only review of a page so an assistant can check its own
// work. Each issue says how serious it is and which tool call would fix it.
import { DEFAULT_EMPTY_PROFILE, hasMediaKitStats } from '@/constants/app';
import { findTheme } from '@/lib/profileDesign';
import { getReadableThemeColors } from '@/lib/theme-contrast';
import { LINK_ICONS } from './pageEdits';

const issue = (severity, area, message, fix) => ({ severity, area, message, ...(fix ? { fix } : {}) });

export function auditPage(profile, { domains = [] } = {}) {
  const issues = [];
  const ds = profile.designSettings || {};
  const theme = findTheme(profile.theme);
  const links = (profile.links || []).filter((link) => !link.isArchived && link.active !== false && !link.disabled);

  // Design
  if (!theme) issues.push(issue('warning', 'design', `Theme "${profile.theme}" is unknown, so default colours are used.`, 'apply_theme'));
  const readable = getReadableThemeColors(theme, ds.wallpaper, ds.customColors || {});
  if (ds.customColors?.title && ds.customColors.title.toLowerCase() !== readable.title) issues.push(issue('info', 'design', `The chosen title colour is hard to read and is shown as ${readable.title}.`, 'update_design colors.title'));
  if (ds.customColors?.pageText && ds.customColors.pageText.toLowerCase() !== readable.body) issues.push(issue('info', 'design', `The chosen text colour is hard to read and is shown as ${readable.body}.`, 'update_design colors.page_text'));
  if (readable.cardsFollowPage) issues.push(issue('info', 'design', 'The wallpaper and the theme\'s cards clash, so cards are drawn as glass. Pick a theme for this wallpaper or set a card colour.', 'apply_theme / update_design colors.card'));
  if (ds.wallpaper?.type === 'image' && !ds.wallpaper.imageUrl) issues.push(issue('warning', 'design', 'Wallpaper is set to an image but has no image URL.', 'update_design wallpaper'));
  if ((ds.stickers || []).length) issues.push(issue('info', 'design', `${ds.stickers.length} sticker(s) on the page. Placement can only be checked visually; make sure none cover text.`, 'list_stickers / remove_stickers'));

  // Profile
  if (!profile.bio || profile.bio === DEFAULT_EMPTY_PROFILE.bio) issues.push(issue('suggestion', 'profile', 'The bio is the default text. A short personal bio converts better.', 'update_profile bio'));
  if (!profile.avatar || /ui-avatars\.com/.test(profile.avatar)) issues.push(issue('suggestion', 'profile', 'The avatar is generated initials. A real photo makes the page more personal.', 'update_profile avatar_url'));
  if (!Object.keys(profile.socials || {}).length) issues.push(issue('suggestion', 'profile', 'No social handles yet.', 'update_profile socials'));

  // Links
  if (!links.length) issues.push(issue('warning', 'links', 'The page has no visible links.', 'add_link'));
  const seen = new Map();
  for (const link of links) {
    if (!link.url || link.url === '#') issues.push(issue('warning', 'links', `"${link.title}" has no real URL (starter link?).`, `update_link ${link.id} url`));
    if (link.icon && !LINK_ICONS.includes(link.icon)) issues.push(issue('info', 'links', `"${link.title}" uses an unknown icon "${link.icon}", so none is shown.`, `update_link ${link.id} icon`));
    const key = (link.url || '').replace(/\/+$/, '').toLowerCase();
    if (key && key !== '#' && seen.has(key)) issues.push(issue('info', 'links', `"${link.title}" and "${seen.get(key)}" point to the same URL.`, 'delete_link / set_link_archived'));
    else if (key) seen.set(key, link.title);
  }
  const highlighted = links.filter((link) => link.highlight && link.highlight !== 'none');
  if (highlighted.length > 2) issues.push(issue('suggestion', 'links', `${highlighted.length} links are highlighted; more than two compete for attention.`, 'update_link highlight none'));

  // Shop
  const products = profile.shop?.products || [];
  if (products.length && !profile.shop?.published) issues.push(issue('warning', 'shop', `${products.length} product(s) exist but the Shop tab is hidden.`, 'set_shop_visible visible=true'));
  for (const product of products) {
    if (!product.image) issues.push(issue('suggestion', 'shop', `"${product.title}" has no image.`, `update_product ${product.id} image_url`));
    if (!product.price || product.price === '0') issues.push(issue('info', 'shop', `"${product.title}" has no price.`, `update_product ${product.id} price`));
  }

  // Widgets
  const meeting = profile.scheduleMeeting || {};
  if (meeting.enabled !== false && !(meeting.availableDays || []).length) issues.push(issue('warning', 'widgets', 'Booking is on but no days are available, so visitors cannot book.', 'update_widgets schedule_meeting.available_days'));
  if (profile.leadCapture?.enabled === false && meeting.enabled === false) issues.push(issue('suggestion', 'widgets', 'Neither the contact form nor booking is on, so visitors have no way to reach out.', 'update_widgets'));
  if (profile.widgets?.mediaKitStats && !hasMediaKitStats(profile.widgets.mediaKitStats)) issues.push(issue('info', 'widgets', 'The stats bar is hidden because every number is zero.', 'update_widgets media_kit_stats'));

  // Domains
  for (const domain of domains) {
    if (!domain.verified) issues.push(issue('warning', 'domains', `${domain.hostname} is not verified yet, so it does not show your page.`, 'verify_domain'));
  }

  const weight = { warning: 10, suggestion: 4, info: 1 };
  const score = Math.max(0, 100 - issues.reduce((sum, item) => sum + (weight[item.severity] || 0), 0));
  return {
    score,
    summary: issues.length ? `${issues.filter((i) => i.severity === 'warning').length} warning(s), ${issues.filter((i) => i.severity === 'suggestion').length} suggestion(s), ${issues.filter((i) => i.severity === 'info').length} note(s).` : 'No issues found.',
    issues,
  };
}
