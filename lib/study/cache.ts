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

