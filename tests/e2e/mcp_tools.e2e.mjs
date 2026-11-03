// MCP tools work end to end, and keys only do what their scope allows.
import { base, callTool, connectMcp, createKey, createReport, register } from './helpers.mjs';

export async function run() {
  const t = createReport('mcp-tools');
  const owner = await register('MCP Tester');
  const other = await register('Someone Else');
  const writeKey = (await createKey(owner.cookie, { name: 'write key', permissions: ['write'] })).fullKey;
  const readKey = (await createKey(owner.cookie, { name: 'read key', permissions: ['read'] })).fullKey;
  t.check('create keys', writeKey && readKey);

  const mint = await fetch(`${base}/api/v1/api-keys`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${writeKey}` }, body: JSON.stringify({ name: 'x' }) });
  t.check('API key cannot create API keys', mint.status === 403, `status ${mint.status}`);
  const anon = await fetch(`${base}/api/mcp`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) });
  t.check('no key is rejected', anon.status === 401, `status ${anon.status}`);

  const w = await connectMcp(writeKey);
  const tools = (await w.listTools()).tools.map((tool) => tool.name);
  t.check('tools listed', tools.length >= 30, `${tools.length} tools`);
  const who = (await callTool(w, 'whoami')).data;
  t.check('whoami', who?.account === owner.username && who.access === 'read and write');
  const opts = (await callTool(w, 'list_design_options')).data;
  t.check('design options', opts?.themes?.length >= 24 && opts.templates.length >= 8);

  let r = await callTool(w, 'apply_template', { template: 'musician' });
  t.check('apply_template', !r.err && r.data.design.theme === 'twilight' && r.data.design.title_font === 'Bebas Neue' && r.data.links.length === 4, r.err);
  r = await callTool(w, 'add_link', { title: 'New single', url: 'https://example.com/single', icon: 'Music', highlight: 'glow', position: 1 });
  t.check('add_link returns the new link', !r.err && r.data.link?.position === 1 && r.data.link.highlight === 'glow', r.err);
  const linkId = r.data?.link?.id;
  r = await callTool(w, 'update_link', { link_id: linkId, title: 'New single (out now)', badge: 'NEW' });
  t.check('update_link', !r.err && r.data.link?.title === 'New single (out now)', r.err);
  const links = (await callTool(w, 'list_links')).data;
  r = await callTool(w, 'reorder_links', { link_ids: [links[2].id, links[0].id] });
  t.check('reorder_links', !r.err && r.data.links[0].id === links[2].id && r.data.links[1].id === links[0].id);
  r = await callTool(w, 'set_link_archived', { link_id: links[4].id, archived: true });
  t.check('archive link', !r.err && r.data.link?.archived === true);
  r = await callTool(w, 'update_design', { page_font: 'Inter', button_roundness: 'slight', colors: { title: '#111111' } });
  t.check('update_design reports readability fixes', !r.err && r.data.design.page_font === 'Inter' && r.data.design.readability_adjustments.some((a) => a.startsWith('title')), r.err);
  r = await callTool(w, 'apply_theme', { theme: 'emerald-gold' });
  t.check('apply_theme', !r.err && r.data.design.theme === 'emerald-gold' && r.data.design.readability_adjustments.length === 0);
  r = await callTool(w, 'update_profile', { bio: 'Written by an AI assistant', socials: { instagram: 'mcp.test' } });
  t.check('update_profile', !r.err && r.data.bio === 'Written by an AI assistant' && r.data.socials.instagram === 'mcp.test', r.err);
  r = await callTool(w, 'update_widgets', { tip_jar: false, lead_capture: { title: 'Say hi' } });
  t.check('update_widgets', !r.err && r.data.widgets.tip_jar === false && r.data.widgets.lead_capture.title === 'Say hi', r.err);
  for (const name of ['get_analytics', 'list_leads', 'list_bookings', 'list_domains']) {
    r = await callTool(w, name, name === 'get_analytics' ? { range: '7d' } : {});
    t.check(name, !r.err, r.err);
  }
  r = await callTool(w, 'apply_theme', { theme: 'nope' });
  t.check('bad theme is a clean error', r.err && /Unknown theme/.test(r.err));
  r = await callTool(w, 'get_profile', { workspace: other.username });
  t.check("another user's workspace is refused", Boolean(r.err), r.text.slice(0, 80));

  const html = await (await fetch(`${base}/${owner.username}`)).text();
  t.check('public page shows the changes', html.includes('Written by an AI assistant') && html.includes('New single (out now)'));

  const ro = await connectMcp(readKey);
  t.check('read key can read', !(await callTool(ro, 'get_profile')).err);
  r = await callTool(ro, 'update_profile', { bio: 'should not change' });
  t.check('read key cannot write (MCP)', r.err && /read-only/.test(r.err));
  const direct = await fetch(`${base}/api/profile`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${readKey}` }, body: JSON.stringify({ username: owner.username, bio: 'x' }) });
  t.check('read key cannot write (REST)', direct.status === 403, `status ${direct.status}`);

  await w.close();
  await ro.close();
  return { failed: t.finish(), usernames: [owner.username, other.username] };
}
