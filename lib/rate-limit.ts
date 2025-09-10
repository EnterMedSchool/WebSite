// Minimal in-memory rate limiter for serverless Node.js runtimes.
// Note: This is best-effort only (per-instance). For stronger guarantees,
// use a shared store (e.g., Upstash/Redis) later.

type HitStore = Map<string, number[]>;

function getStore(): HitStore {
  const g = globalThis as any;
  if (!g.__EMS_RATE_STORE__) g.__EMS_RATE_STORE__ = new Map();
  return g.__EMS_RATE_STORE__ as HitStore;
}

export function rateAllow(key: string, limit: number, windowMs: number): boolean {
  try {
    const store = getStore();
    const now = Date.now();
    const cutoff = now - windowMs;
    const arr = (store.get(key) || []).filter((t) => t > cutoff);
    if (arr.length >= limit) {
      store.set(key, arr);
      return false;
    }
    arr.push(now);
    store.set(key, arr);
    return true;
  } catch {
    return true; // fail-open
  }
}

export function clientIpFrom(req: Request): string {
  try {
    const h = (req as any).headers;
    const get = (k: string) => (typeof h.get === 'function' ? h.get(k) : h[k]);
    const xf = get('x-forwarded-for') || get('x-real-ip') || get('cf-connecting-ip') || get('x-vercel-forwarded-for');
    if (xf && typeof xf === 'string') return xf.split(',')[0].trim();
  } catch {}
  return '0.0.0.0';
}

