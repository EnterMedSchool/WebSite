import fs from 'node:fs/promises';
import path from 'node:path';
import { GlossaryShard } from './types';

const SHARDS_DIR = path.join(process.cwd(), 'public', 'glossary', 'shards');

const cache: Record<string, GlossaryShard | null> = Object.create(null);

export async function loadShard(key: string): Promise<GlossaryShard | null> {
  if (key in cache) return cache[key];
  try {
    const p = path.join(SHARDS_DIR, `${key}.json`);
    const raw = await fs.readFile(p, 'utf8');
    const j = JSON.parse(raw);
    cache[key] = j;
    return j;
  } catch {
    cache[key] = null;
    return null;
  }
}

function escapeForRegex(s: string): string {
  return s
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\\ /g, ' ')
    .replace(/\\'/g, "'")
    .replace(/\\-/g, '-')
    .replace(/\\\//g, '/');
}

export type Matcher = {
  rx: RegExp;
  map: Record<string, string[]>; // normalized surface -> ids
};

export function buildMatcherFromShards(shards: GlossaryShard[]): Matcher | null {
  const map: Record<string, string[]> = Object.create(null);
  for (const sh of shards) {
    for (const [form, ids] of sh.forms) {
      const k = form.toLowerCase();
      if (!map[k]) map[k] = ids.slice();
      else {
        for (const id of ids) if (!map[k].includes(id)) map[k].push(id);
      }
    }
  }
  const alts = Object.keys(map).sort((a, b) => b.length - a.length);
  if (!alts.length) return null;
  let rx: RegExp;
  try {
    rx = new RegExp(`(?<![A-Za-z0-9])(?:${alts.map(escapeForRegex).join('|')})(?![A-Za-z0-9])`, 'gi');
  } catch {
    rx = new RegExp(`\\b(?:${alts.map(escapeForRegex).join('|')})\\b`, 'gi');
  }
  return { rx, map };
}

export type Token = { type: 'text'; value: string } | { type: 'match'; value: string; ids: string[] };

export function highlightText(text: string, m: Matcher): Token[] {
  const tokens: Token[] = [];
  if (!text || !m) return [{ type: 'text', value: text || '' }];
  m.rx.lastIndex = 0;
  let last = 0;
  for (let match; (match = m.rx.exec(text)); ) {
    const word = match[0];
    const key = word.toLowerCase();
    const ids = m.map[key] || [];
    if (!ids.length) continue;
    if (match.index > last) tokens.push({ type: 'text', value: text.slice(last, match.index) });
    tokens.push({ type: 'match', value: word, ids });
    last = m.rx.lastIndex;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

