import { buildMatcherFromShards, highlightText, loadShard } from './highlight';
import { GlossaryManifest } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

const MANIFEST_PATH = path.join(process.cwd(), 'public', 'glossary', 'index.v1.meta.json');

async function loadManifest(): Promise<GlossaryManifest | null> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function shardKeysForText(html: string): string[] {
  const text = String(html || '');
  const tokens = new Set<string>();
  const rx = /[A-Za-z][A-Za-z0-9'\-]*/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text))) {
    const c = m[0][0].toLowerCase();
    if (c >= 'a' && c <= 'z') tokens.add(c);
  }
  return Array.from(tokens.values()).sort();
}

function replaceInTextNodes(html: string, replacer: (text: string) => string): string {
  // Split by tags; apply only on text parts
  const parts = html.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    if (parts[i].startsWith('<')) continue; // tag
    parts[i] = replacer(parts[i]);
  }
  return parts.join('');
}

export async function highlightHTML(html: string): Promise<string> {
  const manifest = await loadManifest();
  if (!manifest || !manifest.shards?.length) return html || '';
  const keys = shardKeysForText(html).filter((k) => manifest.shards.includes(k));
  if (!keys.length) return html || '';

  const shards = (await Promise.all(keys.map(loadShard))).filter(Boolean) as any[];
  const matcher = buildMatcherFromShards(shards);
  if (!matcher) return html || '';

  return replaceInTextNodes(html, (text) => {
    const tokens = highlightText(text, matcher);
    let out = '';
    for (const t of tokens) {
      if (t.type === 'text') out += t.value;
      else if (t.type === 'match') {
        const ids = t.ids;
        if (ids.length <= 1) {
          const id = ids[0] || '';
          out += `<span class="glossary-term" data-term-id="${id}">${t.value}</span>`;
        } else {
          const choices = ids.join(',');
          out += `<span class="glossary-term glossary-term--ambiguous" data-choices="${choices}">${t.value}</span>`;
        }
      }
    }
    return out;
  });
}

