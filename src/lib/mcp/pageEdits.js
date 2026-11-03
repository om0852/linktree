// Page edits an AI assistant may make, as pure functions (profile, args) →
// profile. Each one only touches the fields it names; everything else on the
// page (access gate, tracking pixels, username, ownership, …) is carried over
// unchanged, so an assistant has no way to reach those settings.
import { z } from 'zod';
import { AVATAR_SHAPES, GOOGLE_FONTS_LIST, LINK_HIGHLIGHT_IDS, PAGE_FONTS } from '@/constants/app';
import { ALL_THEMES, applyTemplateToProfile, applyThemeToProfile, findTemplate, findTheme } from '@/lib/profileDesign';
import { ToolError } from './routeCall';

// Icon names the renderers know (ICON_MAP in PhoneMockup / PublicBioView).
export const LINK_ICONS = ['Globe', 'Video', 'Star', 'Mail', 'FileText', 'Music', 'ShoppingBag', 'Zap', 'Briefcase', 'BookOpen', 'Calendar', 'MessageSquare', 'TrendingUp', 'Ticket', 'Youtube', 'Instagram', 'Twitter', 'Linkedin', 'Github', 'Spotify', 'Imdb'];
export const HEADER_LAYOUTS = ['classic', 'banner', 'hero'];
export const BUTTON_STYLES = ['solid', 'glass', 'outline'];
export const BUTTON_ROUNDNESS = ['sharp', 'slight', 'rounded', 'full'];
export const BUTTON_SHADOWS = ['none', 'soft', 'hard', 'offset'];
export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SLOT_INTERVALS = [15, 20, 30, 45, 60, 90, 120];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

// Hard limits so a runaway assistant cannot bloat a page.
export const LIMITS = { links: 60, products: 40, socials: 12 };

const hex = z.string().regex(/^#[\da-f]{6}$/i, 'Use a 6-digit hex colour like #16A34A');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM, e.g. 09:30');

// Links may be web, email or phone; images must be https (no data:, no
// javascript:, no local files).
const LINK_URL = /^(https?:\/\/|mailto:|tel:)/i;
const linkUrl = z.string().min(1).max(2000).refine((value) => LINK_URL.test(value.trim()), 'Use an https://, mailto: or tel: link');
const imageUrl = z.string().max(2000).refine((value) => /^https:\/\//i.test(value.trim()), 'Images must be https:// URLs');
const handle = z.string().max(100).refine((value) => value === '' || /^[\w.@\-/]+$/.test(value), 'Use the handle only, e.g. salunke_om0852');

const titleFonts = () => GOOGLE_FONTS_LIST.suggested.map((font) => font.name).concat(PAGE_FONTS);
const newId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const pick = (src, map) => Object.fromEntries(Object.entries(map).filter(([from]) => src[from] !== undefined).map(([from, to]) => [to, src[from]]));
const findLink = (profile, id) => {
  const link = (profile.links || []).find((item) => item.id === id);
  if (!link) throw new ToolError(`No link with id "${id}". Use list_links.`, 404);
  return link;
};
const findProduct = (profile, id) => {
  const product = (profile.shop?.products || []).find((item) => item.id === id);
  if (!product) throw new ToolError(`No product with id "${id}". Use list_products.`, 404);
  return product;
};
const requireConfirm = (confirm, what, alternative) => {
  if (confirm !== true) throw new ToolError(`Not ${what}: set confirm to true only if the owner explicitly asked for it in this conversation.${alternative ? ` ${alternative}` : ''}`);
};

const linkFields = {
  title: z.string().min(1).max(120).optional(),
  url: linkUrl.optional(),
  subtitle: z.string().max(160).optional(),
  icon: z.enum(LINK_ICONS).optional(),
  badge: z.string().max(24).optional().describe('Short tag such as NEW or POPULAR; empty removes it'),
  size: z.enum(['small', 'large']).optional().describe('large spans the full row in the bento layout'),
  highlight: z.enum(LINK_HIGHLIGHT_IDS).optional(),
  hidden: z.boolean().optional().describe('Hide without archiving'),
};
const applyLinkFields = (link, fields) => {
  const next = { ...link };
  for (const key of ['title', 'subtitle', 'icon', 'badge', 'size', 'highlight']) if (fields[key] !== undefined) next[key] = fields[key];
  if (fields.url !== undefined) next.url = fields.url.trim();
  if (fields.hidden !== undefined) next.active = !fields.hidden;
  return next;
};

const productFields = {
  title: z.string().min(1).max(120).optional(),
  url: z.string().max(2000).refine((value) => /^https?:\/\//i.test(value.trim()), 'Use an https:// link').optional(),
  price: z.string().max(20).optional().describe('Number as text, e.g. "3499"'),
  currency: z.enum(CURRENCIES).optional(),
  image_url: imageUrl.optional(),
  description: z.string().max(300).optional(),
  collection: z.string().max(40).optional(),
};
const applyProductFields = (product, fields) => {
  const next = { ...product };
  for (const key of ['title', 'price', 'currency', 'description', 'collection']) if (fields[key] !== undefined) next[key] = fields[key];
  if (fields.url !== undefined) next.url = fields.url.trim();
  if (fields.image_url !== undefined) next.image = fields.image_url.trim();
  return next;
};

/**
 * Every page edit. `input` is a zod shape (without workspace / dry_run, which
 * the tool layer adds); `destructive` edits spend the daily deletion budget.
 */
export const PAGE_EDITS = {
  update_profile: {
    title: 'Update profile',
    description: 'Change name, title, bio, location, avatar or cover image (https), social handles, link layout (bento/stack), header layout, avatar shape or where social icons sit.',
    input: {
      name: z.string().min(1).max(80).optional(),
      title: z.string().max(120).optional(),
      bio: z.string().max(500).optional(),
      location: z.string().max(80).optional(),
      avatar_url: imageUrl.optional(),
      cover_image_url: imageUrl.optional(),
      socials: z.record(z.string().regex(/^[a-z]{2,20}$/), handle).optional().describe('Handles only, e.g. {"instagram":"handle","linkedin":"in-slug","github":"user","youtube":"@channel","twitter":"handle"}; empty string removes one'),
      layout: z.enum(['bento', 'stack']).optional(),
      header_layout: z.enum(HEADER_LAYOUTS).optional(),
      avatar_shape: z.enum(AVATAR_SHAPES.map((shape) => shape.id)).optional(),
      socials_position: z.enum(['top', 'bottom']).optional(),
    },
    apply(p, { socials, avatar_url, cover_image_url, header_layout, avatar_shape, socials_position, ...fields }) {
      const next = { ...p };
      for (const key of ['name', 'title', 'bio', 'location', 'layout']) if (fields[key] !== undefined) next[key] = fields[key];
      if (avatar_url !== undefined) next.avatar = avatar_url.trim();
      if (cover_image_url !== undefined) next.coverImage = cover_image_url.trim();
      if (header_layout) next.headerLayout = header_layout;
      if (avatar_shape) next.avatarShape = avatar_shape;
      if (socials_position) next.socialsPosition = socials_position;
      if (socials) {
        const merged = { ...(p.socials || {}) };
        for (const [network, value] of Object.entries(socials)) {
          if (value) merged[network] = value; else delete merged[network];
        }
        if (Object.keys(merged).length > LIMITS.socials) throw new ToolError(`At most ${LIMITS.socials} social handles.`);
        next.socials = merged;
      }
      return next;
    },
  },

  apply_theme: {
    title: 'Apply theme',
    description: 'Apply a theme (see list_design_options) or "random". Sets background, text, card and button colours together, always readable.',
    input: { theme: z.string().describe('Theme id or "random"') },
    apply(p, { theme }) {
      let preset = findTheme(theme);
      if (theme === 'random') {
        const choices = ALL_THEMES.filter((t) => t.id !== p.theme);
        preset = choices[Math.floor(Math.random() * choices.length)];
      }
      if (!preset) throw new ToolError(`Unknown theme "${theme}". Use list_design_options.`);
      const themed = applyThemeToProfile(p, preset);
      // A new theme also resets a custom card colour so the cards match it.
      if (themed.designSettings?.customColors?.card) {
        const { card, ...rest } = themed.designSettings.customColors;
        themed.designSettings = { ...themed.designSettings, customColors: rest };
      }
      return themed;
    },
  },

  apply_template: {
    title: 'Apply template',
    description: 'Apply a complete look (theme, fonts, header, avatar shape, button corners). Starter links and bio are added only when the page has none.',
    input: { template: z.string().describe('Template id from list_design_options'), add_starter_links: z.boolean().optional().describe('Default true') },
    apply(p, { template, add_starter_links }) {
      const found = findTemplate(template);
      if (!found) throw new ToolError(`Unknown template "${template}". Use list_design_options.`);
      return applyTemplateToProfile(p, found, { addStarterLinks: add_starter_links !== false });
    },
  },

  update_design: {
    title: 'Update design',
    description: 'Fine-tune the design: page font, title font (or null for the page font), wallpaper, button style/corners/shadow, colours (title, page text, card, button, button text) and footer. Unreadable colours are shown in a readable colour instead.',
    input: {
      page_font: z.enum(PAGE_FONTS).optional(),
      title_font: z.string().nullable().optional().describe('A title font from list_design_options, or null'),
      wallpaper: z.object({
        type: z.enum(['fill', 'gradient', 'image']),
        color: hex.optional().describe('For fill'),
        gradient: z.string().max(300).regex(/^(linear|radial)-gradient\([#\d\s,.%a-z()-]+\)$/i, 'Use linear-gradient(...) or radial-gradient(...) with colours').optional().describe('For gradient, e.g. "linear-gradient(135deg, #0f2027, #2c5364)"'),
        image_url: imageUrl.optional().describe('For image'),
      }).optional(),
      button_style: z.enum(BUTTON_STYLES).optional(),
      button_roundness: z.enum(BUTTON_ROUNDNESS).optional(),
      button_shadow: z.enum(BUTTON_SHADOWS).optional(),
      colors: z.object({
        title: hex.optional(), page_text: hex.optional(), card: hex.nullable().optional().describe('Card background, or null for the theme\'s'),
        button: hex.optional(), button_text: hex.optional(),
      }).optional(),
      hide_footer: z.boolean().optional(),
    },
    apply(p, { page_font, title_font, wallpaper, button_style, button_roundness, button_shadow, colors, hide_footer }) {
      if (title_font && !titleFonts().includes(title_font)) throw new ToolError(`Unknown title font "${title_font}". Use list_design_options.`);
      if (wallpaper?.type === 'fill' && !wallpaper.color) throw new ToolError('A fill wallpaper needs color.');
      if (wallpaper?.type === 'gradient' && !wallpaper.gradient) throw new ToolError('A gradient wallpaper needs gradient.');
      if (wallpaper?.type === 'image' && !wallpaper.image_url) throw new ToolError('An image wallpaper needs image_url.');
      const ds = { ...(p.designSettings || {}) };
      if (wallpaper) {
        ds.wallpaper = {
          ...(ds.wallpaper || {}),
          type: wallpaper.type,
          value: wallpaper.type === 'fill' ? wallpaper.color : '',
          gradient: wallpaper.type === 'gradient' ? wallpaper.gradient : '',
          imageUrl: wallpaper.type === 'image' ? wallpaper.image_url.trim() : '',
        };
      }
      if (button_style) ds.buttonStyle = button_style;
      if (button_roundness) ds.buttonRoundness = button_roundness;
      if (button_shadow) ds.buttonShadow = button_shadow;
      if (hide_footer !== undefined) ds.hideFooter = hide_footer;
      if (colors) {
        ds.customColors = { ...(ds.customColors || {}) };
        if (colors.title) ds.customColors.title = colors.title;
        if (colors.page_text) ds.customColors.pageText = colors.page_text;
        if (colors.card !== undefined) {
          if (colors.card) ds.customColors.card = colors.card; else delete ds.customColors.card;
        }
        if (colors.button) ds.buttonColor = colors.button;
        if (colors.button_text) ds.buttonTextColor = colors.button_text;
      }
      const next = { ...p, designSettings: ds };
      if (page_font) next.font = page_font;
      if (title_font !== undefined) next.alternativeTitleFont = title_font ? { enabled: true, font: title_font } : { enabled: false, font: 'DM Sans' };
      return next;
    },
  },

  add_link: {
    title: 'Add link',
    description: 'Add a link to the page (at the top unless a position is given).',
    input: { ...linkFields, title: z.string().min(1).max(120), url: linkUrl, position: z.number().int().min(1).optional().describe('1 = first') },
    apply(p, { position, ...fields }) {
      const links = [...(p.links || [])];
      if (links.length >= LIMITS.links) throw new ToolError(`A page can have at most ${LIMITS.links} links.`);
      const link = applyLinkFields({ id: newId('link'), size: 'large', icon: 'Globe', active: true, disabled: false, isArchived: false, clicks: 0, highlight: 'none' }, fields);
      links.splice(position ? Math.min(position - 1, links.length) : 0, 0, link);
      return { ...p, links };
    },
  },

  update_link: {
    title: 'Update link',
    description: 'Change a link\'s title, URL, subtitle, icon, badge, size, highlight or visibility.',
    input: { link_id: z.string(), ...linkFields },
    apply(p, { link_id, ...fields }) {
      findLink(p, link_id);
      return { ...p, links: p.links.map((link) => (link.id === link_id ? applyLinkFields(link, fields) : link)) };
    },
  },

  delete_link: {
    title: 'Delete link',
    description: 'Delete a link permanently (prefer set_link_archived to keep it).',
    destructive: true,
    input: { link_id: z.string(), confirm: z.boolean().optional().describe('Must be true, and only when the owner explicitly asked to delete this link') },
    apply(p, { link_id, confirm }) {
      requireConfirm(confirm, 'deleted', 'To hide it instead, use set_link_archived.');
      findLink(p, link_id);
      return { ...p, links: p.links.filter((link) => link.id !== link_id) };
    },
  },

  set_link_archived: {
    title: 'Archive or restore link',
    description: 'Archive a link (hidden from the page, kept for later) or restore it.',
    input: { link_id: z.string(), archived: z.boolean() },
    apply(p, { link_id, archived }) {
      findLink(p, link_id);
      return { ...p, links: p.links.map((link) => (link.id === link_id ? { ...link, isArchived: archived } : link)) };
    },
  },

  reorder_links: {
    title: 'Reorder links',
    description: 'Set the display order. Pass link ids in the new order; links you leave out keep their relative order after them.',
    input: { link_ids: z.array(z.string()).min(1).max(LIMITS.links) },
    apply(p, { link_ids }) {
      const byId = new Map((p.links || []).map((link) => [link.id, link]));
      for (const id of link_ids) if (!byId.has(id)) throw new ToolError(`No link with id "${id}". Use list_links.`, 404);
      const unique = [...new Set(link_ids)];
      const rest = (p.links || []).filter((link) => !unique.includes(link.id));
      return { ...p, links: [...unique.map((id) => byId.get(id)), ...rest] };
    },
  },

  update_widgets: {
    title: 'Update widgets',
    description: 'Turn widgets on or off and edit them: contact form, 1:1 booking (text, price, length and availability: days, hours, slot length, time zone), tip jar, newsletter, and the stats bar.',
    input: {
      lead_capture: z.object({ enabled: z.boolean().optional(), title: z.string().max(80).optional(), subtitle: z.string().max(160).optional(), button_text: z.string().max(40).optional() }).optional(),
      schedule_meeting: z.object({
        enabled: z.boolean().optional(), title: z.string().max(80).optional(), subtitle: z.string().max(160).optional(),
        button_text: z.string().max(40).optional(), duration_minutes: z.number().int().min(10).max(240).optional(), price: z.string().max(20).optional(),
        available_days: z.array(z.enum(WEEK_DAYS)).min(1).max(7).optional(),
        start_time: time.optional(), end_time: time.optional(),
        slot_interval_minutes: z.number().int().refine((n) => SLOT_INTERVALS.includes(n), `One of ${SLOT_INTERVALS.join(', ')}`).optional(),
        timezone: z.string().max(60).optional().describe('IANA time zone, e.g. Asia/Kolkata'),
      }).optional(),
      tip_jar: z.boolean().optional(),
      newsletter: z.boolean().optional(),
      media_kit_stats: z.object({ followers: z.string().max(20).optional(), engagement: z.string().max(20).optional(), monthly_views: z.string().max(20).optional() }).optional(),
    },
    apply(p, { lead_capture, schedule_meeting, tip_jar, newsletter, media_kit_stats }) {
      const next = { ...p, widgets: { ...(p.widgets || {}) } };
      if (lead_capture) next.leadCapture = { ...(p.leadCapture || {}), ...pick(lead_capture, { enabled: 'enabled', title: 'title', subtitle: 'subtitle', button_text: 'buttonText' }) };
      if (schedule_meeting) {
        const meeting = {
          ...(p.scheduleMeeting || {}),
          ...pick(schedule_meeting, {
            enabled: 'enabled', title: 'title', subtitle: 'subtitle', button_text: 'buttonText', duration_minutes: 'durationMinutes', price: 'price',
            start_time: 'startHour', end_time: 'endHour', slot_interval_minutes: 'slotIntervalMinutes', timezone: 'timezone',
          }),
        };
        if (schedule_meeting.available_days) meeting.availableDays = WEEK_DAYS.filter((day) => schedule_meeting.available_days.includes(day));
        if (schedule_meeting.timezone) {
          // supportedValuesOf lists only canonical names (Asia/Calcutta, not Asia/Kolkata), so ask the formatter instead.
          try {
            new Intl.DateTimeFormat('en-US', { timeZone: schedule_meeting.timezone });
          } catch {
            throw new ToolError(`Unknown time zone "${schedule_meeting.timezone}". Use an IANA name such as Asia/Kolkata.`);
          }
          if (!/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(schedule_meeting.timezone)) throw new ToolError(`Unknown time zone "${schedule_meeting.timezone}". Use an IANA name such as Asia/Kolkata.`);
        }
        if (meeting.startHour && meeting.endHour && meeting.startHour >= meeting.endHour) throw new ToolError('start_time must be before end_time.');
        next.scheduleMeeting = meeting;
      }
      if (tip_jar !== undefined) next.widgets.hasTipJar = tip_jar;
      if (newsletter !== undefined) next.widgets.hasNewsletter = newsletter;
      if (media_kit_stats) next.widgets.mediaKitStats = { ...(p.widgets?.mediaKitStats || {}), ...pick(media_kit_stats, { followers: 'followers', engagement: 'engagement', monthly_views: 'monthlyViews' }) };
      return next;
    },
  },

  add_product: {
    title: 'Add shop product',
    description: 'Add a product to the page\'s Shop tab (title, https link, price, currency, https image, description).',
    input: { ...productFields, title: z.string().min(1).max(120), url: productFields.url.unwrap() },
    apply(p, fields) {
      const shop = { enabled: true, published: false, collections: [], ...(p.shop || {}) };
      const products = [...(shop.products || [])];
      if (products.length >= LIMITS.products) throw new ToolError(`A shop can have at most ${LIMITS.products} products.`);
      products.unshift(applyProductFields({ id: newId('prod'), price: '0', currency: 'INR', collection: 'All Products', description: '', image: '' }, fields));
      return { ...p, shop: { ...shop, products } };
    },
  },

  update_product: {
    title: 'Update shop product',
    description: 'Change a product\'s title, link, price, currency, image, description or collection.',
    input: { product_id: z.string(), ...productFields },
    apply(p, { product_id, ...fields }) {
      findProduct(p, product_id);
      return { ...p, shop: { ...p.shop, products: p.shop.products.map((item) => (item.id === product_id ? applyProductFields(item, fields) : item)) } };
    },
  },

  remove_product: {
    title: 'Remove shop product',
    description: 'Remove a product from the shop.',
    destructive: true,
    input: { product_id: z.string(), confirm: z.boolean().optional().describe('Must be true, and only when the owner explicitly asked to remove it') },
    apply(p, { product_id, confirm }) {
      requireConfirm(confirm, 'removed');
      findProduct(p, product_id);
      return { ...p, shop: { ...p.shop, products: p.shop.products.filter((item) => item.id !== product_id) } };
    },
  },

  set_shop_visible: {
    title: 'Show or hide the shop',
    description: 'Show the Shop tab on the public page (published) or hide it.',
    input: { visible: z.boolean() },
    apply(p, { visible }) {
      return { ...p, shop: { enabled: true, collections: [], products: [], ...(p.shop || {}), published: visible } };
    },
  },

  remove_stickers: {
    title: 'Remove stickers',
    description: 'Remove some stickers (by id) or all of them. Adding and placing stickers is done in the Studio.',
    destructive: true,
    input: {
      sticker_ids: z.array(z.string()).min(1).max(50).optional().describe('Omit to remove all'),
      confirm: z.boolean().optional().describe('Must be true, and only when the owner explicitly asked to remove stickers'),
    },
    apply(p, { sticker_ids, confirm }) {
      requireConfirm(confirm, 'removed');
      const stickers = p.designSettings?.stickers || [];
      if (sticker_ids) {
        const known = new Set(stickers.map((stk) => stk.id));
        for (const id of sticker_ids) if (!known.has(id)) throw new ToolError(`No sticker with id "${id}". Use list_stickers.`, 404);
      }
      const kept = sticker_ids ? stickers.filter((stk) => !sticker_ids.includes(stk.id)) : [];
      return { ...p, designSettings: { ...(p.designSettings || {}), stickers: kept } };
    },
  },
};

export const PAGE_EDIT_NAMES = Object.keys(PAGE_EDITS);
