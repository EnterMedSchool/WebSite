"use client";

// Tiny localStorage cache for lesson bundle and player responses.

type CacheEntry<T> = { v: number; data: T };

function kBundle(slug: string) { return `ems:cache:bundle:${slug}`; }
function kPlayer(slug: string) { return `ems:cache:player:${slug}`; }

export function getBundleCached<T=any>(slug: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(kBundle(slug));
    if (!raw) return null;
    const j = JSON.parse(raw) as CacheEntry<T>;
    if (!j || typeof j.v !== 'number') return null;
    if (Date.now() - j.v > maxAgeMs) return null;
    return j.data;
  } catch { return null; }
}

export function setBundleCached<T=any>(slug: string, data: T) {
  try { localStorage.setItem(kBundle(slug), JSON.stringify({ v: Date.now(), data } as CacheEntry<T>)); } catch {}
}

export function getPlayerCached<T=any>(slug: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(kPlayer(slug));
    if (!raw) return null;
    const j = JSON.parse(raw) as CacheEntry<T>;
    if (!j || typeof j.v !== 'number') return null;
    if (Date.now() - j.v > maxAgeMs) return null;
    return j.data;
  } catch { return null; }
}

export function setPlayerCached<T=any>(slug: string, data: T) {
  try { localStorage.setItem(kPlayer(slug), JSON.stringify({ v: Date.now(), data } as CacheEntry<T>)); } catch {}
}

// Cross-tab inflight dedupe for bundle/player fetches
const CACHE_CH = typeof window !== 'undefined' ? new BroadcastChannel('ems-cache') : null;
const LOCK_TTL_MS = 10000;

function lockKey(kind: 'bundle'|'player', slug: string) { return `ems:lock:${kind}:${slug}`; }

function setLock(kind: 'bundle'|'player', slug: string) {
  try { localStorage.setItem(lockKey(kind, slug), String(Date.now())); } catch {}
}

function hasFreshLock(kind: 'bundle'|'player', slug: string) {
  try {
    const v = Number(localStorage.getItem(lockKey(kind, slug))||'0');
    return v && (Date.now() - v) < LOCK_TTL_MS;
  } catch { return false; }
}

function clearLock(kind: 'bundle'|'player', slug: string) {
  try { localStorage.removeItem(lockKey(kind, slug)); } catch {}
}

type Awaiter = { resolve: (v:any)=>void; reject: (e:any)=>void };
const waiters: Record<string, Awaiter[]> = {};

if (CACHE_CH) {
  CACHE_CH.onmessage = (ev) => {
    const msg = ev.data || {};
    if (!msg || !msg.type || !msg.key) return;
    if (msg.type === 'cache:update') {
      const list = waiters[msg.key] || [];
      for (const w of list) try { w.resolve(msg.data); } catch {}
      delete waiters[msg.key];
    }
  };
}

async function waitForBroadcast(key: string, timeoutMs = 2000): Promise<any> {
  if (!CACHE_CH) return Promise.reject(new Error('no-bc'));
  return new Promise((resolve, reject) => {
    const arr = waiters[key] || (waiters[key] = []);
    const t = setTimeout(() => { const i = arr.indexOf(w); if (i>=0) arr.splice(i,1); reject(new Error('timeout')); }, timeoutMs);
    const w: Awaiter = { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } };
    arr.push(w);
  });
}

export async function fetchBundleDedupe<T=any>(slug: string, fetcher: ()=>Promise<T>, ttlMs=LOCK_TTL_MS): Promise<T> {
  const key = `bundle:${slug}`;
  if (hasFreshLock('bundle', slug)) {
    try { const v = await waitForBroadcast(key, ttlMs); return v as T; } catch {}
  }
  setLock('bundle', slug);
  try {
    const data = await fetcher();
    try { CACHE_CH?.postMessage({ type: 'cache:update', key, data }); } catch {}
    return data;
  } finally {
    clearLock('bundle', slug);
  }
}

export async function fetchPlayerDedupe<T=any>(slug: string, fetcher: ()=>Promise<T>, ttlMs=LOCK_TTL_MS): Promise<T> {
  const key = `player:${slug}`;
  if (hasFreshLock('player', slug)) {
    try { const v = await waitForBroadcast(key, ttlMs); return v as T; } catch {}
  }
  setLock('player', slug);
  try {
    const data = await fetcher();
    try { CACHE_CH?.postMessage({ type: 'cache:update', key, data }); } catch {}
    return data;
  } finally {
    clearLock('player', slug);
  }
}
