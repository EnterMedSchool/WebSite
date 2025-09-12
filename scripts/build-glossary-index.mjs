#!/usr/bin/env node
/**
 * Build a compact, sharded glossary surface index and per-term previews
 * from https://github.com/EnterMedSchool/Anki/tree/main/glossary/terms.
 *
 * Outputs:
 *  - public/glossary/index.v1.meta.json
 *  - public/glossary/shards/{a..z,0}.json
 *  - public/glossary/terms/<id>.json
 *
 * Design goals:
 *  - Minimal client payloads (shards by first char; array-based storage)
 *  - Deterministic output for CDN caching
 *  - No external deps; Node 18+ only
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_BASE = 'https://raw.githubusercontent.com/EnterMedSchool/Anki/main/glossary';
const TERMS_BASE = `${SOURCE_BASE}/terms`;
const INDEX_URL = `${SOURCE_BASE}/index.json`;

const OUT_BASE = path.join(process.cwd(), 'public', 'glossary');
const OUT_SHARDS = path.join(OUT_BASE, 'shards');
const OUT_TERMS = path.join(OUT_BASE, 'terms');
const CACHE_DIR = path.join(process.cwd(), '.cache', 'glossary');
const CACHE_TERMS = path.join(CACHE_DIR, 'terms');
const CACHE_MANIFEST = path.join(CACHE_DIR, 'manifest.json');

/** Utility: sleep */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalize a visible surface for matching */
function normalizeSurface(s) {
  if (!s || typeof s !== 'string') return '';
  let t = s.trim();
  // Unify whitespace
  t = t.replace(/\s+/g, ' ');
  // Unify dashes and quotes
  t = t.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
  t = t.replace(/[\u2018\u2019\u02BC]/g, "'");
  t = t.replace(/[\u201C\u201D]/g, '"');
  // Strip diacritics
  try { t = t.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch {}
  // Lowercase for indexing
  t = t.toLowerCase();
  return t;
}

/** Expand safe morphological variants for single words */
function expandVariants(surface) {
  const out = new Set();
  const s = normalizeSurface(surface);
  if (!s) return [];
  out.add(s);
  if (/^[a-z]+$/.test(s)) {
    // Plurals
    out.add(`${s}s`);
    if (s.endsWith('y') && s.length > 1 && !'aeiou'.includes(s[s.length - 2])) out.add(`${s.slice(0, -1)}ies`);
    else if (/(s|x|z|ch|sh)$/.test(s)) out.add(`${s}es`);
  }
  // Greek aliases (minimal, extend as needed)
  const greek = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ' };
  for (const [name, sym] of Object.entries(greek)) {
    if (s === name) out.add(sym);
    if (s === sym) out.add(name);
  }
  return Array.from(out);
}

function isLikelyUseful(form) {
  // Filter extremely short or generic tokens; adjust as needed.
  if (!form) return false;
  if (form.length <= 2) return false; // avoid "ph", "iv", etc.
  // Allow common medical abbreviations length 3+
  return true;
}

async function fetchJson(url, retries = 2, headers = {}) {
  for (let i = 0; i <= retries; i++) {
    const r = await fetch(url, { redirect: 'follow', headers });
    if (r.ok) return r.json();
    if (r.status === 304) return { __notModified: true };
    if (i < retries) await sleep(200 * (i + 1));
  }
  throw new Error(`Fetch failed: ${url}`);
}

/** Gather all term JSONs from index */
async function loadTerms() {
  await fs.mkdir(CACHE_TERMS, { recursive: true });
  // Load previous ETags manifest if present
  let etags = {};
  try { etags = JSON.parse(await fs.readFile(CACHE_MANIFEST, 'utf8')); } catch {}

  const index = await fetchJson(INDEX_URL);
  const files = Array.isArray(index?.files) ? index.files : [];
  const version = String(index?.version || new Date().toISOString().slice(0, 10));
  const terms = [];

  // Concurrency pool
  const max = 16;
  let i = 0;
  async function worker() {
    while (i < files.length) {
      const fname = files[i++];
      const url = `${TERMS_BASE}/${fname}`;
      try {
        const prevEtag = etags[fname];
        const t = await fetchJson(url, 2, prevEtag ? { 'If-None-Match': prevEtag } : {});
        if (t && t.__notModified) {
          // load from cache
          const p = path.join(CACHE_TERMS, fname);
          const raw = await fs.readFile(p, 'utf8');
          terms.push(JSON.parse(raw));
        } else if (t && typeof t === 'object') {
          terms.push(t);
          // persist to cache and etag map if header available
          try {
            const res = await fetch(url, { method: 'HEAD' });
            const et = res.headers.get('etag');
            if (et) etags[fname] = et;
          } catch {}
          await fs.writeFile(path.join(CACHE_TERMS, fname), JSON.stringify(t), 'utf8');
        }
      } catch (e) {
        console.warn('skip term', fname, String(e?.message || e));
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(max, files.length || 1) }, worker));
  try { await fs.writeFile(CACHE_MANIFEST, JSON.stringify(etags, null, 2), 'utf8'); } catch {}
  return { version, terms };
}

/** Build sharded surface map and previews */
function buildArtifacts(version, terms) {
  const surfaceToIds = new Map(); // form -> Set<id>
  const previews = new Map();     // id -> preview

  for (const t of terms) {
    const id = String(t.id || '').trim();
    if (!id) continue;
    const names = ([])
      .concat(t.names || [])
      .concat(t.aliases || [])
      .concat(t.abbr || [])
      .concat(t.patterns || []);
    const base = names.length ? names : [id];
    const uniq = new Set();
    for (const raw of base) {
      const norm = normalizeSurface(String(raw || ''));
      if (!norm) continue;
      for (const v of expandVariants(norm)) uniq.add(v);
    }
    for (const form of uniq) {
      const f = normalizeSurface(form);
      if (!isLikelyUseful(f)) continue;
      const cur = surfaceToIds.get(f) || new Set();
      cur.add(id);
      surfaceToIds.set(f, cur);
    }
    const title = Array.isArray(t.names) && t.names.length ? String(t.names[0]) : id;
    const img0 = Array.isArray(t.images) && t.images.length ? t.images[0] : null;
    previews.set(id, {
      id,
      title,
      definition: typeof t.definition === 'string' ? t.definition : '',
      primary_tag: typeof t.primary_tag === 'string' ? t.primary_tag : undefined,
      tags: Array.isArray(t.tags) ? t.tags : undefined,
      image: img0 ? { src: img0.src, alt: img0.alt } : undefined,
    });
  }

  // Build shards
  const shards = new Map(); // shardKey -> [ [form, [ids]] ]
  for (const [form, idsSet] of surfaceToIds.entries()) {
    const key = /^[a-z]/.test(form) ? form[0] : '0';
    if (!shards.has(key)) shards.set(key, []);
    const ids = Array.from(idsSet);
    shards.get(key).push([form, ids]);
  }
  // Sort for determinism (by form length desc, then alpha)
  for (const arr of shards.values()) {
    arr.sort((a, b) => (b[0].length - a[0].length) || a[0].localeCompare(b[0]));
  }

  const manifest = {
    version,
    updatedAt: new Date().toISOString(),
    countTerms: previews.size,
    countForms: surfaceToIds.size,
    shards: Array.from(shards.keys()).sort(),
  };

  return { manifest, shards, previews };
}

async function writeArtifacts(manifest, shards, previews) {
  await fs.mkdir(OUT_SHARDS, { recursive: true });
  await fs.mkdir(OUT_TERMS, { recursive: true });

  // Write shards
  for (const key of manifest.shards) {
    const arr = shards.get(key) || [];
    const obj = { v: 1, shard: key, forms: arr };
    const p = path.join(OUT_SHARDS, `${key}.json`);
    await fs.writeFile(p, JSON.stringify(obj), 'utf8');
  }

  // Write manifest
  await fs.writeFile(path.join(OUT_BASE, 'index.v1.meta.json'), JSON.stringify(manifest, null, 2), 'utf8');

  // Write per-term previews
  for (const [id, pv] of previews.entries()) {
    const p = path.join(OUT_TERMS, `${id}.json`);
    await fs.writeFile(p, JSON.stringify(pv), 'utf8');
  }
}

async function main() {
  console.log('Building glossary index from', INDEX_URL);
  const { version, terms } = await loadTerms();
  console.log(`Loaded ${terms.length} terms (version ${version}).`);
  const { manifest, shards, previews } = buildArtifacts(version, terms);
  await writeArtifacts(manifest, shards, previews);
  console.log(`Wrote ${manifest.shards.length} shards, ${previews.size} previews.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
