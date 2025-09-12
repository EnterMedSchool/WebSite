// Edge-friendly global rate limiting using Upstash Redis REST (optional)
// Falls back to in-memory best-effort if Upstash is not configured.

type AllowResult = {
  allow: boolean;
  retryAfter?: number; // seconds
  limit?: number;
  remaining?: number;
  reset?: number; // seconds until reset boundary
  source?: 'upstash' | 'local';
};

const MINUTE_MS = 60_000;

function getUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

export async function globalRateAllow(limitPerMinute: number): Promise<AllowResult> {
  const upstash = getUpstash();
  if (upstash) {
    try {
      const now = Date.now();
      const minute = Math.floor(now / MINUTE_MS);
      const k1 = `${process.env.RATE_PREFIX ?? 'rate:global'}:${minute}`;
      const k0 = `${process.env.RATE_PREFIX ?? 'rate:global'}:${minute - 1}`;

      // Pipeline: INCR current, EXPIRE current, GET previous
      const res = await fetch(`${upstash.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstash.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', k1],
          ['EXPIRE', k1, '65'],
          ['GET', k0],
        ]),
      });
      if (!res.ok) throw new Error(`upstash ${res.status}`);
      // Upstash returns array of { result: ... }
      const arr = (await res.json()) as Array<{ result: any }>;
      const curr = Number(arr?.[0]?.result ?? 0);
      const prev = Number(arr?.[2]?.result ?? 0);
      const msInto = now % MINUTE_MS;
      const weightPrev = (MINUTE_MS - msInto) / MINUTE_MS; // proportion of prev minute overlapping
      const rolling = curr + prev * weightPrev;
      const remaining = Math.max(0, Math.floor(limitPerMinute - rolling));
      const reset = Math.max(1, Math.ceil((MINUTE_MS - msInto) / 1000));
      if (rolling > limitPerMinute) {
        return { allow: false, retryAfter: reset, limit: limitPerMinute, remaining: 0, reset, source: 'upstash' };
      }
      return { allow: true, limit: limitPerMinute, remaining, reset, source: 'upstash' };
    } catch {
      // Fail open on Upstash errors; fallback to local
    }
  }

  // Local fallback: simple fixed window counter per instance
  const gk = '__GLOBAL_RATE_LOCAL__';
  // @ts-ignore
  const g: any = globalThis as any;
  if (!g[gk]) g[gk] = { minute: Math.floor(Date.now() / MINUTE_MS), count: 0 };
  const now = Date.now();
  const current = Math.floor(now / MINUTE_MS);
  if (g[gk].minute !== current) {
    g[gk].minute = current;
    g[gk].count = 0;
  }
  g[gk].count += 1;
  const msInto = now % MINUTE_MS;
  const reset = Math.max(1, Math.ceil((MINUTE_MS - msInto) / 1000));
  if (g[gk].count > limitPerMinute) {
    return { allow: false, retryAfter: reset, limit: limitPerMinute, remaining: 0, reset, source: 'local' };
  }
  const remaining = Math.max(0, limitPerMinute - g[gk].count);
  return { allow: true, limit: limitPerMinute, remaining, reset, source: 'local' };
}

export function isPathExcludedFromGlobal(pathname: string): boolean {
  // Skip static assets and internal Next serving paths
  if (!pathname) return false;
  const p = pathname.toLowerCase();
  return (
    p.startsWith('/_next') ||
    p.startsWith('/static') ||
    p.startsWith('/images') ||
    p.startsWith('/assets') ||
    p === '/favicon.ico' ||
    p === '/robots.txt' ||
    p === '/sitemap.xml' ||
    p === '/health' ||
    p === '/api/health' ||
    p.startsWith('/api/auth')
  );
}

// Generic keyed limiter (e.g., per IP). Same sliding-window approach with Upstash.
export async function keyedRateAllow(keyPrefix: string, limitPerMinute: number): Promise<AllowResult> {
  const upstash = getUpstash();
  if (upstash) {
    try {
      const now = Date.now();
      const minute = Math.floor(now / MINUTE_MS);
      const k1 = `${keyPrefix}:${minute}`;
      const k0 = `${keyPrefix}:${minute - 1}`;
      const res = await fetch(`${upstash.url}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstash.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', k1],
          ['EXPIRE', k1, '65'],
          ['GET', k0],
        ]),
      });
      if (!res.ok) throw new Error(`upstash ${res.status}`);
      const arr = (await res.json()) as Array<{ result: any }>;
      const curr = Number(arr?.[0]?.result ?? 0);
      const prev = Number(arr?.[2]?.result ?? 0);
      const msInto = now % MINUTE_MS;
      const weightPrev = (MINUTE_MS - msInto) / MINUTE_MS;
      const rolling = curr + prev * weightPrev;
      const remaining = Math.max(0, Math.floor(limitPerMinute - rolling));
      const reset = Math.max(1, Math.ceil((MINUTE_MS - msInto) / 1000));
      if (rolling > limitPerMinute) {
        return { allow: false, retryAfter: reset, limit: limitPerMinute, remaining: 0, reset, source: 'upstash' };
      }
      return { allow: true, limit: limitPerMinute, remaining, reset, source: 'upstash' };
    } catch {
      // fallthrough
    }
  }
  const gk = `__KEY_RATE_LOCAL__:${keyPrefix}`;
  // @ts-ignore
  const g: any = globalThis as any;
  if (!g[gk]) g[gk] = { minute: Math.floor(Date.now() / MINUTE_MS), count: 0 };
  const now = Date.now();
  const current = Math.floor(now / MINUTE_MS);
  if (g[gk].minute !== current) {
    g[gk].minute = current;
    g[gk].count = 0;
  }
  g[gk].count += 1;
  const msInto = now % MINUTE_MS;
  const reset = Math.max(1, Math.ceil((MINUTE_MS - msInto) / 1000));
  if (g[gk].count > limitPerMinute) {
    return { allow: false, retryAfter: reset, limit: limitPerMinute, remaining: 0, reset, source: 'local' };
  }
  const remaining = Math.max(0, limitPerMinute - g[gk].count);
  return { allow: true, limit: limitPerMinute, remaining, reset, source: 'local' };
}
