// Shared helpers for the end-to-end suites. They run against a started build
// (TEST_BASE_URL) backed by a disposable database (MONGODB_URI), create
// throwaway tib-e2e-xxxxxx accounts and remove them again when done.
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export const base = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

export function createReport(suite) {
  const results = [];
  return {
    check(name, ok, detail = '') {
      results.push({ name, ok: Boolean(ok), detail: detail ? String(detail).slice(0, 200) : '' });
    },
    finish() {
      for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} [${suite}] ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
      const failed = results.filter((r) => !r.ok).length;
      console.log(`${suite}: ${results.length - failed} passed, ${failed} failed`);
      return failed;
    },
  };
}

export const newUsername = () => `tib-e2e-${crypto.randomBytes(3).toString('hex')}`;

/** Register a throwaway account; returns { username, cookie }. */
export async function register(name = 'E2E Tester') {
  const username = newUsername();
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    // Sign-ups are limited per IP; each test account comes from its own test
    // IP so a full run stays under the limit (behind Vercel the platform sets it).
    headers: { 'content-type': 'application/json', 'x-real-ip': `198.51.100.${crypto.randomInt(1, 255)}` },
    body: JSON.stringify({ email: `${username}@example.com`, username, password: `${crypto.randomUUID()}Aa1!`, name }),
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${await res.text()}`);
  return { username, cookie: (res.headers.get('set-cookie') || '').split(';')[0] };
}

export async function createKey(cookie, body) {
  const res = await fetch(`${base}/api/v1/api-keys`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(body) });
  return res.json();
}

export async function connectMcp(key) {
  const client = new Client({ name: 'tib-e2e', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/api/mcp`), { requestInit: { headers: { Authorization: `Bearer ${key}` } } }));
  return client;
}

/** Call a tool; returns { err, data } with the text parsed as JSON when it is JSON. */
export async function callTool(client, name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  const text = res.content?.[0]?.text || '';
  let data = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { err: res.isError ? text : null, data, text };
}

export async function getOwnProfile(username, cookie) {
  return (await (await fetch(`${base}/api/profile?username=${username}`, { headers: { cookie } })).json()).profile;
}

export async function saveProfile(profile, cookie) {
  return fetch(`${base}/api/profile`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify(profile) });
}

/** Direct database access for steps the API cannot do (expiring a key). */
export async function withDb(fn) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  try {
    return await fn(mongoose.connection.db);
  } finally {
    await mongoose.disconnect();
  }
}

/** Remove everything a throwaway account created. Only tib-e2e-* accounts. */
export async function cleanupAccounts(usernames) {
  const names = usernames.filter((u) => /^tib-e2e-[a-f0-9]{6}$/.test(u));
  if (!names.length || !process.env.MONGODB_URI) return;
  await withDb(async (db) => {
    const owners = (await db.collection('users').find({ username: { $in: names } }, { projection: { _id: 1 } }).toArray()).map((u) => String(u._id));
    const targets = [
      ['mediaassets', { ownerId: { $in: owners } }],
      ['users', { username: { $in: names } }],
      ['profiles', { username: { $in: names } }],
      ['analyticsevents', { $or: [{ target_id: { $in: names } }, { profileUsername: { $in: names } }] }],
      ['leads', { creatorUsername: { $in: names } }],
      ['bookings', { creatorUsername: { $in: names } }],
      ['subscribers', { profileUsername: { $in: names } }],
      ['apikeys', { username: { $in: names } }],
      ['mcpactivities', { accountUsername: { $in: names } }],
      ['customdomains', { username: { $in: names } }],
    ];
    for (const [collection, filter] of targets) await db.collection(collection).deleteMany(filter);
  });
}
