import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { globalRateAllow, isPathExcludedFromGlobal, keyedRateAllow } from '@/lib/edge/rate';
import { getClientIpFromHeaders } from '@/lib/edge/ip';

// --- Edge API throttle (dev + prod) -----------------------------
// Token-bucket limiter at the middleware (edge) layer to stop
// accidental request storms before they reach route handlers.
// Lightweight, best-effort in-memory per runtime instance.
const edgeThrottle = (() => {
  const isDev = process.env.NODE_ENV !== 'production';
  // Enable by default in prod; in dev use DEV_THROTTLE (back-compat)
  const enabled = String(
    process.env.API_EDGE_THROTTLE ?? (isDev ? process.env.DEV_THROTTLE ?? '1' : '1'),
  ) !== '0';
  const MAX_RPS = Number(
    process.env.API_EDGE_MAX_RPS ?? (isDev ? process.env.DEV_MAX_RPS ?? 60 : 300),
  );
  const BURST = Number(
    process.env.API_EDGE_BURST ?? (isDev ? process.env.DEV_BURST ?? Math.max(120, MAX_RPS * 2) : Math.max(600, MAX_RPS * 2)),
  );

  const key = '__EDGE_TOKEN_BUCKET__';
  type Bucket = { tokens: number; lastRefill: number };
  // @ts-ignore
  const g: any = globalThis as any;
  if (!g[key]) {
    g[key] = { tokens: BURST, lastRefill: Date.now() } as Bucket;
  }

  function allow(): boolean {
    if (!enabled) return true;
    const bucket: Bucket = g[key];
    const now = Date.now();
    const delta = Math.max(0, now - bucket.lastRefill);
    const refill = (delta / 1000) * MAX_RPS;
    bucket.tokens = Math.min(BURST, bucket.tokens + refill);
    bucket.lastRefill = now;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  function tooManyResponse(url?: URL) {
    const res = new NextResponse(
      JSON.stringify({ error: 'too_many_requests', hint: 'edge throttle active' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Retry-After': '1',
          'X-Api-Edge-Throttle': '1',
          ...(url ? { 'X-Throttle-Path': url.pathname } : {}),
        },
      },
    );
    return res;
  }

  return { enabled, allow, tooManyResponse };
})();

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS || 'entermedschool@gmail.com')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(String(email).toLowerCase());
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // Global RPM throttle (site-wide), before everything else
  try {
    const limitRpm = Number(process.env.GLOBAL_RPM ?? 250);
    // Enable unless explicitly disabled
    const enabled = String(process.env.GLOBAL_RPM_ENABLED ?? '1') !== '0';
    const bypass = (process.env.GLOBAL_RPM_BYPASS_TOKEN || '').trim();
    const bypassHeader = (req.headers.get('x-bypass-rate') || '').trim();
    if (enabled && req.method !== 'OPTIONS' && !isPathExcludedFromGlobal(pathname) && (!bypass || bypassHeader !== bypass)) {
      const { allow, retryAfter, reset, limit, remaining } = await globalRateAllow(limitRpm);
      if (!allow) {
        const accept = String(req.headers.get('accept') || '').toLowerCase();
        const isApi = pathname.startsWith('/api/');
        const headers: Record<string, string> = {
          'Retry-After': String(retryAfter || 5),
          'Cache-Control': 'no-store',
          'X-Global-RateLimit': '1',
          'RateLimit-Limit': String(limit || limitRpm),
          'RateLimit-Remaining': String(Math.max(0, Number(remaining || 0))),
          'RateLimit-Reset': String(reset || retryAfter || 60),
          'X-Throttle-Path': pathname,
        };
        if (isApi || accept.includes('application/json')) {
          return new NextResponse(
            JSON.stringify({ error: 'too_many_requests', scope: 'global', limit: limitRpm }),
            { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
          );
        }
        const html = `<!doctype html>
          <html lang="en"><head><meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <title>Slow down</title>
          <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial,sans-serif;background:#f9fafb;color:#111827;margin:0;padding:2rem} .card{max-width:700px;margin:10vh auto;padding:1.25rem 1.5rem;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)} h1{font-size:1.5rem;margin:0 0 .5rem} p{margin:.25rem 0} .muted{color:#6b7280}</style>
          </head><body><div class="card">
          <h1>Too many requests</h1>
          <p>We’re protecting the site from high load. Please try again in ${String(retryAfter || 5)}s.</p>
          <p class="muted">Global limit: ${limitRpm} requests per minute.</p>
          </div></body></html>`;
        return new NextResponse(html, { status: 429, headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers } });
      }
    }
  } catch {}

  // Per-IP RPM limiter (fair-share), after global pass
  try {
    const enabled = String(process.env.IP_RPM_ENABLED ?? '1') !== '0';
    const limitRpm = Number(process.env.IP_RPM ?? 120);
    if (enabled && req.method !== 'OPTIONS' && pathname && !isPathExcludedFromGlobal(pathname)) {
      const ip = getClientIpFromHeaders(req.headers) || 'unknown';
      const key = `${process.env.RATE_PREFIX ?? 'rate'}:ip:${ip}`;
      const { allow, retryAfter, reset, limit, remaining } = await keyedRateAllow(key, limitRpm);
      if (!allow) {
        const isApi = pathname.startsWith('/api/');
        const headers: Record<string, string> = {
          'Retry-After': String(retryAfter || 5),
          'Cache-Control': 'no-store',
          'X-Ip-RateLimit': '1',
          'RateLimit-Limit': String(limit || limitRpm),
          'RateLimit-Remaining': String(Math.max(0, Number(remaining || 0))),
          'RateLimit-Reset': String(reset || retryAfter || 60),
          'X-Throttle-Path': pathname,
        };
        if (isApi) {
          return new NextResponse(
            JSON.stringify({ error: 'too_many_requests', scope: 'ip', limit: limitRpm }),
            { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
          );
        }
        return new NextResponse('Too many requests from your network. Please slow down.', { status: 429, headers });
      }
    }
  } catch {}

  // Per-user RPM limiter (authenticated users), after IP pass
  try {
    const enabled = String(process.env.USER_RPM_ENABLED ?? '1') !== '0';
    const limitRpm = Number(process.env.USER_RPM ?? 180);
    if (enabled && req.method !== 'OPTIONS' && pathname && !isPathExcludedFromGlobal(pathname)) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      const uid = (token as any)?.userId || (token as any)?.id || (token as any)?.sub || null;
      const email = (token as any)?.email || null;
      const userKeySrc = uid ? `id:${uid}` : (email ? `email:${String(email).toLowerCase()}` : null);
      if (userKeySrc) {
        const key = `${process.env.RATE_PREFIX ?? 'rate'}:user:${userKeySrc}`;
        const { allow, retryAfter, reset, limit, remaining } = await keyedRateAllow(key, limitRpm);
        if (!allow) {
          const headers: Record<string, string> = {
            'Retry-After': String(retryAfter || 5),
            'Cache-Control': 'no-store',
            'X-User-RateLimit': '1',
            'RateLimit-Limit': String(limit || limitRpm),
            'RateLimit-Remaining': String(Math.max(0, Number(remaining || 0))),
            'RateLimit-Reset': String(reset || retryAfter || 60),
            'X-Throttle-Path': pathname,
          };
          return new NextResponse(
            JSON.stringify({ error: 'too_many_requests', scope: 'user', limit: limitRpm }),
            { status: 429, headers: { 'Content-Type': 'application/json', ...headers } },
          );
        }
      }
    }
  } catch {}

  // Instance (edge) throttle for ALL API routes to avoid storms in dev/prod
  if (edgeThrottle.enabled && pathname.startsWith('/api/')) {
    if (!edgeThrottle.allow()) {
      return edgeThrottle.tooManyResponse(req.nextUrl);
    }
  }
  // If this is not an admin path, proceed normally after dev throttle check
  if (!isAdminPath) return NextResponse.next();

  // Allow only CORS preflight to pass for API (if any)
  if (req.method === 'OPTIONS') return NextResponse.next();

  // Bypass admin auth if an explicit seed key matches for seeding endpoints
  try {
    const isSeedPath = pathname.startsWith('/api/admin/seed');
    if (isSeedPath) {
      const url = req.nextUrl;
      const qp = url.searchParams.get('key');
      const headerKey = req.headers.get('x-seed-key');
      const key = String((qp ?? headerKey ?? '')).trim().replace(/^['"]|['"]$/g, '');
      const secret = String(process.env.SEED_SECRET ?? '').trim().replace(/^['"]|['"]$/g, '');
      if (secret && key && key === secret) {
        return NextResponse.next();
      }
    }
  } catch {}

  // Require NextAuth token (JWT strategy) and admin email allowlist
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = (token as any)?.email as string | undefined;
  if (!isAdminEmail(email)) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Add strict security headers for admin endpoints
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'same-origin');
  return res;
}

export const config = {
  // Run on everything (global throttle) but we’ll skip static paths in code.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
