'use client';

import { useSyncExternalStore } from 'react';

/*
 * Signed-in user, workspace list and active workspace, kept for the whole
 * browser session. Every dashboard page renders its own sidebar, so without
 * this each navigation mounted a sidebar that showed a placeholder until
 * /api/auth/me and /api/profile/workspaces answered again.
 *
 * The module-level state survives client-side navigation; sessionStorage
 * carries it across a full reload of the tab.
 */
const STORAGE_KEY = 'tib.workspace-session';
const EMPTY = Object.freeze({ authUser: null, workspaces: [], activeUsername: '', activeName: '' });

let state = EMPTY;
let hydrated = false;
const listeners = new Set();

function hydrateOnce() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') state = { ...EMPTY, ...saved };
  } catch {
    // Storage can be unavailable (private mode); start empty.
  }
}

function getSnapshot() {
  hydrateOnce();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateWorkspaceSession(patch) {
  hydrateOnce();
  const next = { ...state, ...patch };
  if (Object.keys(patch).every((key) => Object.is(state[key], next[key]))) return;
  state = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures; the in-memory copy still prevents flicker.
  }
  listeners.forEach((listener) => listener());
}

export function clearWorkspaceSession() {
  state = EMPTY;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  listeners.forEach((listener) => listener());
}

/**
 * The session is gone (expired, signed out elsewhere, account removed): drop
 * the cached workspace so no one else's name lingers in the sidebar, and send
 * the visitor to sign in, returning to this page afterwards.
 */
export function endSignedOutSession() {
  clearWorkspaceSession();
  if (typeof window === 'undefined') return;
  const next = `${window.location.pathname}${window.location.search}`;
  const goToSignIn = () => window.location.replace(`/?auth=login&next=${encodeURIComponent(next)}`);
  // Drop the cookie first: a well-signed token for a removed account would
  // otherwise pass the proxy and bounce straight back here.
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}).finally(goToSignIn);
}

export function useWorkspaceSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
