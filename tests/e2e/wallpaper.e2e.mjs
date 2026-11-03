// Photo wallpapers: who may upload, what may be uploaded, how photos are
// served and saved, the public page markup, and the MCP photo tools.
import crypto from 'crypto';
import { base, callTool, connectMcp, createKey, createReport, getOwnProfile, register, saveProfile } from './helpers.mjs';

const jpeg = (n) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), crypto.randomBytes(n)]);
const meta = { avg: '#7a6a5a', dark: '#101010', light: '#f4f1ea', top: '#c9d6e3', palette: ['#c0392b', '#7a6a5a'], width: 2560, height: 1707, smallWidth: 1280 };
const form = (large, small, m = meta) => {
  const f = new FormData();
  f.append('large', new Blob([large]), 'a');
  f.append('small', new Blob([small]), 'b');
  f.append('meta', JSON.stringify(m));
  return f;
};
const upload = (headers, body) => fetch(`${base}/api/media`, { method: 'POST', headers, body });

export async function run() {
  const t = createReport('wallpaper');
  const { username, cookie } = await register('Photo Tester');
  const key = (await createKey(cookie, { name: 'photo', permissions: ['write'] })).fullKey;

  t.check('signed-out upload refused', (await upload({}, form(jpeg(100), jpeg(50)))).status === 401);
  t.check('API key (AI assistant) upload refused', (await upload({ Authorization: `Bearer ${key}` }, form(jpeg(100), jpeg(50)))).status === 403);
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>');
  t.check('SVG refused', (await upload({ cookie }, form(svg, svg))).status === 400);
  const html = Buffer.from('<html><script>alert(document.cookie)</script></html>');
  t.check('HTML named as an image refused', (await upload({ cookie }, form(html, html))).status === 400);
  t.check('oversized photo refused', (await upload({ cookie }, form(jpeg(3 * 1024 * 1024), jpeg(50)))).status === 400);
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), crypto.randomBytes(40)]);
  t.check('mismatched sizes refused', (await upload({ cookie }, form(jpeg(100), png))).status === 400);

  const res = await upload({ cookie }, form(jpeg(200 * 1024), jpeg(60 * 1024), { ...meta, palette: ['#c0392b', 'url(javascript:x)'], evil: '<script>' }));
  const up = await res.json();
  t.check('photo uploaded', res.status === 201 && /^\/api\/media\/[a-f0-9]{24}$/.test(up.url));
  t.check('junk measurements dropped', up.meta?.palette.length === 1 && !('evil' in up.meta));

  let r = await fetch(`${base}${up.url}`);
  const large = Buffer.from(await r.arrayBuffer());
  t.check('served with safe headers', r.status === 200 && r.headers.get('content-type') === 'image/jpeg' && r.headers.get('x-content-type-options') === 'nosniff' && /sandbox/.test(r.headers.get('content-security-policy')) && /immutable/.test(r.headers.get('cache-control')) && large.length === 200 * 1024 + 4);
  r = await fetch(`${base}${up.url}?size=small`);
  t.check('served phone size', r.status === 200 && Number(r.headers.get('content-length')) === 60 * 1024 + 4);
  t.check('bad id is 404', (await fetch(`${base}/api/media/not-an-id`)).status === 404);

  const own = await getOwnProfile(username, cookie);
  own.designSettings.wallpaper = { type: 'image', imageUrl: up.url, imageMeta: up.meta, focalX: 30, focalY: 140, overlay: 'bogus', blur: 3 };
  await saveProfile(own, cookie);
  const saved = (await getOwnProfile(username, cookie)).designSettings.wallpaper;
  t.check('wallpaper saved and clamped', saved.imageUrl === up.url && saved.focalX === 30 && saved.focalY === 100 && saved.overlay === 'auto' && saved.imageMeta?.avg === '#7a6a5a', JSON.stringify(saved));

  const unsafe = structuredClone(own);
  unsafe.designSettings.wallpaper = { type: 'image', imageUrl: 'javascript:alert(1)', imageMeta: meta };
  await saveProfile(unsafe, cookie);
  const afterUnsafe = (await getOwnProfile(username, cookie)).designSettings.wallpaper;
  t.check('unsafe image URL dropped', afterUnsafe.imageUrl === '' && afterUnsafe.imageMeta === null);
  await saveProfile(own, cookie);

  const page = await (await fetch(`${base}/${username}`)).text();
  t.check('public page draws the photo with srcset and focal point', page.includes(`srcSet="${up.url}?size=small 1280w, ${up.url} 2560w"`) && page.includes('object-position:30% 100%'));
  t.check('photo layer pinned to the screen', /class="fixed inset-0 -z-10[^"]*"/.test(page));

  const c = await connectMcp(key);
  let m = await callTool(c, 'get_profile');
  t.check('get_profile describes the photo', m.data?.design?.wallpaper?.uploaded === true && m.data.design.wallpaper.shade.mode === 'auto');
  m = await callTool(c, 'update_design', { wallpaper: { type: 'image', focal_x: 70, shade: 'dark', shade_strength: 50, blur: 6 } });
  t.check('MCP adjusts focal point, shade and blur, keeping the upload', !m.err && m.data.design.wallpaper.image_url === up.url && m.data.design.wallpaper.focal_point.x === 70 && m.data.design.wallpaper.shade.strength === 50 && m.data.design.wallpaper.blur === 6, m.err);
  m = await callTool(c, 'match_photo_colors');
  t.check('MCP matches colours to the photo', !m.err && /^#[0-9a-f]{6}$/.test(m.data.design.button_color), m.err);
  t.check('MCP refuses an http photo', (await callTool(c, 'update_design', { wallpaper: { type: 'image', image_url: 'http://insecure.example/a.jpg' } })).err);
  t.check('MCP cannot point at an upload by path', (await callTool(c, 'update_design', { wallpaper: { type: 'image', image_url: '/api/media/0123456789abcdef01234567' } })).err);
  t.check('MCP shade limited to 85%', (await callTool(c, 'update_design', { wallpaper: { type: 'image', shade_strength: 100 } })).err);
  m = await callTool(c, 'update_design', { wallpaper: { type: 'image', image_url: 'https://images.example.com/a.jpg' } });
  t.check('a linked photo has no measurements', !m.err && m.data.design.wallpaper.uploaded === false && m.data.design.wallpaper.photo_colors === null);
  t.check('match_photo_colors refuses a linked photo', (await callTool(c, 'match_photo_colors')).err);
  t.check('check_page notes the linked photo', (await callTool(c, 'check_page')).data.issues.some((i) => /photo is a link/.test(i.message)));
  await c.close();

  return { failed: t.finish(), usernames: [username] };
}
