'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import AtelierHeader from '../../components/Atelier/AtelierHeader';
import { DEFAULT_EMPTY_PROFILE } from '@/constants/app';
import { PillTab, SkeletonRows, table } from '@/components/ui';
import { Check, Copy, Trash2 } from '@/components/icons';
import { endSignedOutSession } from '@/lib/workspaceStore';

// What an assistant can do, grouped the way people think about it.
const CAPABILITIES = [
  { title: 'Design', text: 'Apply themes and templates, change fonts, wallpaper, buttons and colours (always kept readable).' },
  { title: 'Profile & links', text: 'Edit name, bio and socials; add, edit, reorder, archive or delete links and highlights.' },
  { title: 'Widgets', text: 'Turn the contact form, bookings, tip jar, newsletter and stats on or off and edit their text.' },
  { title: 'Analytics', text: 'Views, clicks, CTR, top links, countries, cities and devices for any date range.' },
  { title: 'Leads & bookings', text: 'Read leads, confirm or cancel bookings, add meeting links or create Google Meet links.' },
  { title: 'Domains & workspaces', text: 'Work across all your workspaces and connect or verify custom domains.' },
];

const CLIENTS = [
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'other', label: 'Other (stdio)' },
];

function setupFor(client, url, key) {
  const secret = key || '<your API key>';
  if (client === 'claude') {
    return {
      steps: ['Open Claude → Settings → Connectors → Add custom connector.', 'Paste the server URL and add the header below.', 'In Claude Desktop you can instead add this to claude_desktop_config.json:'],
      code: JSON.stringify({ mcpServers: { treeinbio: { command: 'npx', args: ['-y', 'mcp-remote', url, '--header', `Authorization:Bearer ${secret}`] } } }, null, 2),
    };
  }
  if (client === 'chatgpt') {
    return {
      steps: ['In ChatGPT, open Settings → Connectors (developer mode) → Create.', 'Use the server URL below and choose header authentication with the key.'],
      code: `URL:    ${url}\nHeader: Authorization: Bearer ${secret}`,
    };
  }
  if (client === 'cursor') {
    return {
      steps: ['Add this to .cursor/mcp.json (or Settings → MCP → Add server).'],
      code: JSON.stringify({ mcpServers: { treeinbio: { url, headers: { Authorization: `Bearer ${secret}` } } } }, null, 2),
    };
  }
  return {
    steps: ['For any client that only runs local (stdio) servers, bridge with mcp-remote:'],
    code: JSON.stringify({ mcpServers: { treeinbio: { command: 'npx', args: ['-y', 'mcp-remote', url, '--header', `Authorization:Bearer ${secret}`] } } }, null, 2),
  };
}

const subscribeNever = () => () => {};

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      }}
      className="flex h-[26px] shrink-0 items-center gap-[5px] rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-white px-[10px] text-[11px] text-[#333333] hover:bg-[#F8F8F9]"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export default function AiAssistantsPage() {
  const [currentProfile, setCurrentProfile] = useState(DEFAULT_EMPTY_PROFILE);
  const [authUser, setAuthUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', access: 'write', expiresInDays: 90 });
  const [activity, setActivity] = useState([]);
  const [undoingId, setUndoingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [error, setError] = useState('');
  const [client, setClient] = useState('claude');
  // Full URL in the browser; the server render shows the path only.
  const serverUrl = useSyncExternalStore(subscribeNever, () => `${window.location.origin}/api/mcp`, () => '/api/mcp');

  const loadKeys = async () => {
    try {
      const res = await fetch('/api/v1/api-keys');
      const data = await res.json();
      if (data.success) setKeys(data.keys || []);
    } finally {
      setLoading(false);
    }
  };

  // Changes made through MCP, newest first; page edits can be undone.
  const loadActivity = async () => {
    try {
      const data = await (await fetch('/api/v1/mcp-activity')).json();
      if (data.success) setActivity(data.activity || []);
    } catch (err) {
      console.error('Failed to load AI activity:', err);
    }
  };

  const handleUndo = async (entry) => {
    if (!confirm(`Undo "${entry.tool}" on @${entry.workspace}? The page goes back to how it was before this change.`)) return;
    setUndoingId(entry.id);
    setError('');
    try {
      const data = await (await fetch(`/api/v1/mcp-activity/${entry.id}/undo`, { method: 'POST' })).json();
      if (!data.success) throw new Error(data.error || 'Undo failed.');
      await loadActivity();
    } catch (err) {
      setError(err.message);
    } finally {
      setUndoingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      const data = await (await fetch('/api/auth/me')).json();
      if (!data.authenticated || !data.user) {
        endSignedOutSession();
        return;
      }
      setAuthUser(data.user);
      if (data.profile) setCurrentProfile(data.profile);
      await Promise.all([loadKeys(), loadActivity()]);
    })().catch((err) => console.error('Failed to load AI page:', err));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), permissions: [form.access], expiresInDays: form.expiresInDays }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not create the key.');
      setNewKey({ ...data.key, fullKey: data.fullKey });
      setForm({ name: '', access: 'write', expiresInDays: 90 });
      await loadKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key) => {
    if (!confirm(`Revoke "${key.name}"? Assistants using it lose access immediately.`)) return;
    const res = await fetch(`/api/v1/api-keys?id=${encodeURIComponent(key.id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setKeys((prev) => prev.filter((k) => k.id !== key.id));
      if (newKey?.id === key.id) setNewKey(null);
    } else {
      setError(data.error || 'Could not revoke the key.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
  };

  const accessOf = (perms = []) => (perms.includes('*') || perms.includes('write') ? 'Full access' : 'Read only');
  const setup = setupFor(client, serverUrl, newKey?.fullKey);

  return (
    <div className="min-h-screen bg-canvas text-ink-700">
      <div className="lg:pl-[280px] h-screen overflow-hidden flex flex-col">
        <main style={{ height: 'calc(100vh - 20px)' }} className="mt-[10px] mx-[10px] lg:ml-0 min-w-0 rounded-[10px] bg-white p-[15px] flex flex-col overflow-hidden">
          <AtelierHeader
            title="AI Assistants"
            mobileOpen={mobileOpen}
            currentProfile={currentProfile}
            authUser={authUser}
            onLogout={handleLogout}
            onToggleMobile={() => setMobileOpen(!mobileOpen)}
            onProfileSwitched={(profile) => profile && setCurrentProfile(profile)}
          />

          <div className="customScrollBar mt-[15px] min-h-0 flex-1 overflow-y-auto pr-[6px] -mr-[9px] flex flex-col gap-[15px]">
            {/* Intro + server URL */}
            <section className="rounded-[10px] border-[0.5px] border-[#DCDCDC] p-[15px]">
              <h2 className="text-[14px] font-semibold text-black">Let any AI assistant run your page</h2>
              <p className="mt-[5px] max-w-[720px] text-[12px] text-[#404040]">
                Connect Claude, ChatGPT, Cursor or any app that supports MCP (Model Context Protocol). Ask it to redesign your page, add links, check analytics or confirm bookings, and it uses the same rules as the Studio. Changes go live right away.
              </p>
              <div className="mt-[12px] flex flex-wrap items-center gap-[8px]">
                <span className="text-[12px] text-[#808080]">Server URL</span>
                <code className="rounded-[5px] bg-[#FAFAFA] border-[0.5px] border-[#DCDCDC] px-[10px] py-[5px] text-[12px] text-black">{serverUrl}</code>
                <CopyButton text={serverUrl} />
              </div>
              <div className="mt-[15px] grid gap-[10px] sm:grid-cols-2 xl:grid-cols-3">
                {CAPABILITIES.map((item) => (
                  <div key={item.title} className="rounded-[8px] bg-[#FAFAFA] px-[12px] py-[10px]">
                    <p className="text-[12px] font-medium text-black">{item.title}</p>
                    <p className="mt-[2px] text-[11px] text-[#404040]">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Create key */}
            <section className="rounded-[10px] border-[0.5px] border-[#DCDCDC] p-[15px]">
              <h2 className="text-[14px] font-semibold text-black">1. Create an API key</h2>
              <p className="mt-[3px] text-[12px] text-[#808080]">One key per assistant, so you can revoke each on its own. Read-only keys can look but never change anything.</p>
              <form onSubmit={handleCreate} className="mt-[12px] flex flex-wrap items-center gap-[8px]">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Name, e.g. Claude on my laptop"
                  maxLength={100}
                  className="h-[34px] min-w-[220px] flex-1 rounded-[50px] border-[0.5px] border-[#C4C4C4] bg-[#FAFAFA] px-[14px] text-[12px] font-light outline-none focus:border-black"
                />
                <div className="flex items-center gap-[6px]" role="radiogroup" aria-label="Access">
                  {[['write', 'Full access'], ['read', 'Read only']].map(([id, label]) => (
                    <PillTab key={id} active={form.access === id} onClick={() => setForm((f) => ({ ...f, access: id }))} role="radio" aria-checked={form.access === id}>
                      {label}
                    </PillTab>
                  ))}
                </div>
                <select
                  aria-label="Expires"
                  value={form.expiresInDays}
                  onChange={(e) => setForm((f) => ({ ...f, expiresInDays: Number(e.target.value) }))}
                  className="h-[34px] rounded-[50px] border-[0.5px] border-[#DCDCDC] bg-white px-[12px] text-[12px]"
                >
                  <option value={7}>Expires in 7 days</option>
                  <option value={30}>Expires in 30 days</option>
                  <option value={90}>Expires in 90 days</option>
                  <option value={365}>Expires in 1 year</option>
                  <option value={0}>Never expires</option>
                </select>
                <button type="submit" disabled={creating || !form.name.trim()} className="h-[34px] rounded-[50px] bg-[#16A34A] px-[16px] text-[12px] text-white hover:bg-[#15803D] disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create key'}
                </button>
              </form>
              {error && <p role="alert" className="mt-[10px] text-[12px] text-[#FF4359]">{error}</p>}
              {newKey && (
                <div className="mt-[12px] rounded-[8px] border-[0.5px] border-[#FFE082] bg-[#FFF8E1] p-[12px]">
                  <p className="text-[12px] font-medium text-[#92400E]">Copy this key now. It is shown only once.</p>
                  <div className="mt-[8px] flex flex-wrap items-center gap-[8px]">
                    <code className="break-all rounded-[5px] bg-white px-[10px] py-[5px] text-[12px] text-black">{newKey.fullKey}</code>
                    <CopyButton text={newKey.fullKey} label="Copy key" />
                  </div>
                  <p className="mt-[6px] text-[11px] text-[#92400E]">The setup below already includes it.</p>
                </div>
              )}

              <div className="mt-[15px]">
                {loading ? (
                  <SkeletonRows rows={2} />
                ) : keys.length === 0 ? (
                  <p className="text-[12px] text-[#808080]">No keys yet.</p>
                ) : (
                  <div className={table.wrapper}>
                    <table className={table.table}>
                      <thead className={table.head}>
                        <tr>
                          <th className={table.th}>Name</th>
                          <th className={table.th}>Key</th>
                          <th className={table.th}>Access</th>
                          <th className={table.th}>Last used</th>
                          <th className={table.th}>Expires</th>
                          <th className={`${table.th} w-[60px]`} />
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((key) => (
                          <tr key={key.id} className={table.row}>
                            <td className={table.td}>{key.name}</td>
                            <td className={`${table.td} font-mono text-[11px]`}>{key.keyPrefix}…</td>
                            <td className={table.td}>{accessOf(key.permissions)}</td>
                            <td className={table.td}>{key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}</td>
                            <td className={table.td}>
                              {key.expired
                                ? <span className="text-[#FF4359]">Expired</span>
                                : key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                            </td>
                            <td className={table.td}>
                              <button type="button" onClick={() => handleRevoke(key)} aria-label={`Revoke ${key.name}`} title="Revoke" className="text-[#808080] hover:text-[#FF4359]">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* Setup per client */}
            <section className="rounded-[10px] border-[0.5px] border-[#DCDCDC] p-[15px]">
              <h2 className="text-[14px] font-semibold text-black">2. Connect your assistant</h2>
              <div className="mt-[10px] flex flex-wrap gap-[8px]">
                {CLIENTS.map((item) => (
                  <PillTab key={item.id} active={client === item.id} onClick={() => setClient(item.id)}>{item.label}</PillTab>
                ))}
              </div>
              <ol className="mt-[12px] list-decimal pl-[18px] text-[12px] text-[#404040] space-y-[3px]">
                {setup.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className="relative mt-[10px]">
                <pre className="overflow-x-auto rounded-[8px] bg-[#1A1A1A] p-[12px] text-[11px] leading-[1.6] text-[#E8F7EE]">{setup.code}</pre>
                <div className="absolute right-[8px] top-[8px]"><CopyButton text={setup.code} /></div>
              </div>
              <p className="mt-[10px] text-[11px] text-[#808080]">
                Then try: &ldquo;Show my TreeInBio analytics for the last 7 days&rdquo; or &ldquo;Give my page the Musician template and add a link to my new single.&rdquo;
              </p>
            </section>

            {/* Every change an assistant made, with undo for page edits */}
            <section className="rounded-[10px] border-[0.5px] border-[#DCDCDC] p-[15px]">
              <div className="flex items-center justify-between gap-[10px]">
                <h2 className="text-[14px] font-semibold text-black">Recent AI activity</h2>
                <button type="button" onClick={loadActivity} className="text-[11px] text-[#16A34A] hover:underline">Refresh</button>
              </div>
              <p className="mt-[3px] text-[12px] text-[#808080]">Every change made through an assistant, kept for 90 days. You can undo the latest page edit of each workspace.</p>
              {activity.length === 0 ? (
                <p className="mt-[12px] text-[12px] text-[#808080]">No AI changes yet.</p>
              ) : (
                <div className={`${table.wrapper} mt-[12px]`}>
                  <table className={table.table}>
                    <thead className={table.head}>
                      <tr>
                        <th className={table.th}>When</th>
                        <th className={table.th}>Change</th>
                        <th className={table.th}>Workspace</th>
                        <th className={table.th}>Key</th>
                        <th className={table.th}>Result</th>
                        <th className={`${table.th} w-[80px]`} />
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((entry) => (
                        <tr key={entry.id} className={table.row}>
                          <td className={`${table.td} whitespace-nowrap`}>{new Date(entry.createdAt).toLocaleString()}</td>
                          <td className={table.td}>
                            <span className="font-mono text-[11px]">{entry.tool}</span>
                            <span className="block max-w-[320px] truncate text-[10px] text-[#808080]" title={entry.args}>{entry.args}</span>
                          </td>
                          <td className={table.td}>@{entry.workspace}</td>
                          <td className={table.td}>{entry.keyName || '—'}</td>
                          <td className={table.td}>
                            {entry.undoneAt
                              ? <span className="text-[#808080]">Undone</span>
                              : entry.ok ? <span className="text-[#16A34A]">Done</span> : <span className="text-[#FF4359]" title={entry.error}>Failed</span>}
                          </td>
                          <td className={table.td}>
                            {entry.undoable && (
                              <button
                                type="button"
                                onClick={() => handleUndo(entry)}
                                disabled={undoingId === entry.id}
                                className="h-[24px] rounded-[50px] border-[0.5px] border-[#DCDCDC] px-[10px] text-[11px] hover:bg-[#F8F8F9] disabled:opacity-50"
                              >
                                {undoingId === entry.id ? 'Undoing...' : 'Undo'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
