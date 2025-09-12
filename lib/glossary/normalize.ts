// Shared normalization utilities (kept in TS for reuse)

export function normalizeSurface(s: string): string {
  if (!s) return '';
  let t = s.trim();
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-');
  t = t.replace(/[\u2018\u2019\u02BC]/g, "'");
  t = t.replace(/[\u201C\u201D]/g, '"');
  try { t = t.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); } catch {}
  t = t.toLowerCase();
  return t;
}

export function expandVariants(surface: string): string[] {
  const out = new Set<string>();
  const s = normalizeSurface(surface);
  if (!s) return [];
  out.add(s);
  if (/^[a-z]+$/.test(s)) {
    out.add(`${s}s`);
    if (s.endsWith('y') && s.length > 1 && !'aeiou'.includes(s[s.length - 2])) out.add(`${s.slice(0, -1)}ies`);
    else if (/(s|x|z|ch|sh)$/.test(s)) out.add(`${s}es`);
  }
  const greek: Record<string, string> = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ' };
  for (const [name, sym] of Object.entries(greek)) {
    if (s === name) out.add(sym);
    if (s === sym) out.add(name);
  }
  return Array.from(out);
}

export function shardKey(form: string): string {
  return /^[a-z]/.test(form) ? form[0] : '0';
}

