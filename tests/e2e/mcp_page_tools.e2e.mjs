// MCP v1.1 page tools and guardrails: shop, stickers, card colour, booking
// hours, lead status, dry_run, batches, overwrite protection, deletion budget.
import { base, callTool, connectMcp, createKey, createReport, getOwnProfile, register, saveProfile } from './helpers.mjs';

export async function run() {
  const t = createReport('mcp-page-tools');
  const { username, cookie } = await register('Page Tools Tester');
  const key = (await createKey(cookie, { name: 'v11', permissions: ['write'] })).fullKey;
  const c = await connectMcp(key);
  const call = (name, args) => callTool(c, name, args);
  const profile = async () => (await call('get_profile')).data;

  const names = (await c.listTools()).tools.map((tool) => tool.name);
  const forbidden = names.filter((n) => /api_key|password|delete_domain|access|gate|pixel|delete_workspace|delete_lead|username/.test(n));
  t.check('no tools for critical settings', forbidden.length === 0, forbidden.join(','));
  t.check('page tools listed', ['check_page', 'apply_changes', 'add_product', 'remove_stickers', 'update_lead_status', 'list_products', 'list_stickers', 'set_shop_visible', 'match_photo_colors'].every((n) => names.includes(n)));

  t.check('javascript: link refused', (await call('add_link', { title: 'x', url: 'javascript:alert(1)' })).err);
  t.check('data: image refused', (await call('add_product', { title: 'x', url: 'https://example.com', image_url: 'data:image/png;base64,AAAA' })).err);
  t.check('non-gradient wallpaper refused', (await call('update_design', { wallpaper: { type: 'gradient', gradient: 'url(https://evil.example/x.png)' } })).err);
  t.check('bad social handle refused', (await call('update_profile', { socials: { instagram: '<script>' } })).err);

  const before = await profile();
  await c.callTool({ name: 'update_profile', arguments: { bio: 'Bio via MCP', accessGate: { enabled: true, type: 'passcode', passcode: 'pwned' }, trackingPixels: { metaPixelId: '123' }, username: 'hijack' } });
  const own = await getOwnProfile(username, cookie);
  t.check('extra args cannot change access gate, pixels or username', !own.accessGate?.enabled && !own.trackingPixels?.metaPixelId && own.username === username);

  let r = await call('apply_theme', { theme: 'mineral', dry_run: true });
  t.check('dry_run lists changes and saves nothing', r.data?.dry_run && r.data.changes.some((ch) => ch.field === 'design.theme') && (await profile()).design.theme === before.design.theme);
  r = await call('update_profile', { bio: 'should not save', if_unchanged_since: before.updated_at });
  t.check('stale if_unchanged_since refused', r.err && /changed/.test(r.err), r.err);

  const p0 = await profile();
  r = await call('apply_changes', { changes: [
    { tool: 'apply_theme', args: { theme: 'agate' } },
    { tool: 'update_design', args: { title_font: 'Roboto', colors: { card: '#3a3d55' } } },
    { tool: 'add_link', args: { title: 'Batch link', url: 'https://example.com/batch', icon: 'Star' } },
  ], if_unchanged_since: p0.updated_at });
  const p1 = await profile();
  t.check('apply_changes applies every edit', !r.err && p1.design.theme === 'agate' && p1.design.title_font === 'Roboto' && p1.design.card_color === '#3a3d55' && p1.links.some((l) => l.title === 'Batch link'), r.err);
  r = await call('apply_changes', { changes: [{ tool: 'apply_theme', args: { theme: 'neon' } }, { tool: 'add_link', args: { title: 'Bad', url: 'ftp://x' } }] });
  t.check('an invalid batch saves nothing', r.err && (await profile()).design.theme === 'agate', r.err);
  const activity = await (await fetch(`${base}/api/v1/mcp-activity`, { headers: { cookie } })).json();
  t.check('a batch is one activity entry', activity.activity?.some((a) => a.tool === 'apply_changes' && a.ok));
  t.check('custom card colour rendered', (await (await fetch(`${base}/${username}`)).text()).toLowerCase().includes('3a3d55'));

  r = await call('add_product', { title: 'Watch', url: 'https://example.com/watch', price: '3499', currency: 'INR', image_url: 'https://example.com/watch.jpg' });
  const productId = r.data?.shop?.products?.[0]?.id;
  t.check('add_product keeps image and currency', !r.err && r.data.shop.products[0].image_url === 'https://example.com/watch.jpg' && r.data.shop.products[0].currency === 'INR', r.err);
  r = await call('set_shop_visible', { visible: true });
  t.check('shop visible', !r.err && r.data.shop.visible);
  r = await call('update_product', { product_id: productId, price: '3299' });
  t.check('update_product', !r.err && r.data.shop.products[0].price === '3299');
  t.check('remove_product needs confirm', /confirm/.test((await call('remove_product', { product_id: productId })).err || ''));

  r = await call('update_widgets', { schedule_meeting: { available_days: ['Mon', 'Wed', 'Fri'], start_time: '10:00', end_time: '18:00', slot_interval_minutes: 45, timezone: 'Asia/Kolkata' } });
  t.check('booking availability saved', !r.err && r.data.widgets.schedule_meeting.available_days.join(',') === 'Mon,Wed,Fri' && r.data.widgets.schedule_meeting.timezone === 'Asia/Kolkata', r.err);
  t.check('unknown time zone refused', (await call('update_widgets', { schedule_meeting: { timezone: 'Mars/Olympus' } })).err);
  t.check('start after end refused', (await call('update_widgets', { schedule_meeting: { start_time: '19:00', end_time: '09:00' } })).err);

  await fetch(`${base}/api/leads`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ creatorUsername: username, fullName: 'Ada', email: 'ada@example.com', phone: '+15555550111', note: 'hi' }) });
  const leads = (await call('list_leads')).data;
  r = await call('update_lead_status', { lead_id: leads.leads[0].id, status: 'contacted' });
  t.check('update_lead_status', !r.err && r.data.status === 'contacted', r.err);

  const withStickers = await getOwnProfile(username, cookie);
  withStickers.designSettings.stickers = [{ id: 's1', name: 'Star', emoji: '⭐', x: 10, y: 10 }, { id: 's2', name: 'Fire', emoji: '🔥', x: 20, y: 20 }];
  await saveProfile(withStickers, cookie);
  const stickers = (await call('list_stickers')).data;
  r = await call('remove_stickers', { sticker_ids: ['s1'], confirm: true });
  t.check('list and remove one sticker', stickers.length === 2 && !r.err && r.data.design.stickers === 1, r.err);

  const audit = (await call('check_page')).data;
  t.check('check_page reports issues with fixes', typeof audit?.score === 'number' && audit.issues.some((i) => i.fix));

  let blockedAt = null;
  for (let i = 0; i < 27 && !blockedAt; i += 1) {
    const added = await call('add_link', { title: `tmp ${i}`, url: `https://example.com/${i}` });
    const del = await call('delete_link', { link_id: added.data?.link?.id, confirm: true });
    if (del.err) blockedAt = { i, msg: del.err };
  }
  t.check('daily deletion budget stops a runaway assistant', blockedAt && blockedAt.i >= 20 && /Daily limit/.test(blockedAt.msg), blockedAt ? `blocked at ${blockedAt.i}` : 'never blocked');

  await c.close();
  return { failed: t.finish(), usernames: [username] };
}
