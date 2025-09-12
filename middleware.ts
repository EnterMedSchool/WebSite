import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // Edge throttle for ALL API routes to avoid storms in dev/prod
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
  // Run on all admin routes AND all API routes (dev throttle)
  matcher: ['/admin/:path*', '/api/:path*'],
};
