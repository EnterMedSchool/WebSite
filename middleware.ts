import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { FREE_LESSON_SLUGS } from "@/lib/lesson/free-slugs";

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

  // Restrict Course Mates APIs to only work when called from the Course Mates page
  // This avoids accidental/background requests from other pages and saves DB work
  if (pathname.startsWith('/api/course-mates')) {
    try {
      const referer = String(req.headers.get('referer') || '').trim();
      const origin = String(req.headers.get('origin') || '').trim();
      const host = String(req.headers.get('host') || '').trim();
      const sfs = String(req.headers.get('sec-fetch-site') || '').trim().toLowerCase();

      // If Origin header is present, require same host (defends against CSRF/x-site)
      if (origin) {
        try {
          const o = new URL(origin);
          if (!host || o.host.toLowerCase() !== host.toLowerCase()) {
            return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
          }
        } catch {
          return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
        }
      }

      // If Sec-Fetch-Site is present, require same-origin/same-site/none
      if (sfs && !(sfs === 'same-origin' || sfs === 'same-site' || sfs === 'none')) {
        return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
      }

      // Require that the request originates from the Course Mates page (referer path)
      const refPath = referer ? new URL(referer).pathname : '';
      if (!refPath || !refPath.startsWith('/course-mates')) {
        return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
      }
    } catch {
      // If referer is missing or invalid, deny to prevent off-page usage
      return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }

  }

  // Temporary block: legacy course pages (focus on lessons/chapter experiences)
  const blockCourses = /^\/(courses?)(\/|$)/.test(pathname);
  const blockCourseSingular = /^\/course(\/|$)/.test(pathname);
  if (blockCourses || blockCourseSingular) {
    return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const lessonMatch = pathname.match(/^\/lesson\/([^/]+)/);
  if (lessonMatch) {
    const slug = lessonMatch[1];
    if (!FREE_LESSON_SLUGS.has(slug)) {
      try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
          const url = req.nextUrl.clone();
          url.pathname = '/signin';
          url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
          return NextResponse.redirect(url);
        }
      } catch {
        const url = req.nextUrl.clone();
        url.pathname = '/signin';
        url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(url);
      }
    }
  }

  // Feature guard: Timer/Tasks APIs hidden unless explicitly enabled
  const isWidgetsApi = pathname.startsWith('/api/timer') || pathname.startsWith('/api/todos');
  if (isWidgetsApi) {
    const flag = String(process.env.FEATURE_WIDGETS_ENABLED || '').trim();
    const enabled = flag === '1' || /^true$/i.test(flag);
    if (!enabled) {
      return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  // Early short-circuit for lesson APIs based on denial cookie (avoid DB)
  const m = pathname.match(/^\/api\/lesson\/([^/]+)\/(bundle|player|body)(?:\/|$)/);
  if (m) {
    const slug = m[1];
    // If we've recently denied this slug, return fast 403
    const denied = req.cookies.get(`ems_paid_denied_l_${slug}`)?.value;
    if (denied) {
      return new NextResponse(
        JSON.stringify({ error: 'forbidden_cached', reason: 'paid_course' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
      );
    }
    // For bundle specifically, require auth quickly (saves work inside the route)
    if (/\/bundle(?:\/|$)/.test(pathname)) {
      try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
          return new NextResponse(
            JSON.stringify({ error: 'unauthenticated' }),
            { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
          );
        }
      } catch {}
    }
  }

  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!isAdminPath) return NextResponse.next();

  // Allow only CORS preflight to pass for API (if any)
  if (req.method === 'OPTIONS') return NextResponse.next();

  // Bypass admin auth if an explicit seed key matches for database ops
  // Extend bypass to cover /api/admin/seed/* and /api/admin/db/* so you can
  // bootstrap or migrate before auth is configured.
  try {
    const isSeedOrDbPath = pathname.startsWith('/api/admin/seed') || pathname.startsWith('/api/admin/db');
    if (isSeedOrDbPath) {
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
  const token: any = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // Session invalidation check via sessionVersion for admin paths
  try {
    const uidRaw = token?.userId || token?.sub;
    const uid = uidRaw && /^\d+$/.test(String(uidRaw)) ? Number(uidRaw) : 0;
    const sv = Number(token?.sv || 1);
    if (uid > 0) {
      const row = (await db.select({ sv: users.sessionVersion }).from(users).where(eq(users.id as any, uid)).limit(1))[0] as any;
      if (!row?.sv || Number(row.sv) !== sv) {
        return new NextResponse(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      }
    }
  } catch {}
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
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    // Restrict Course Mates APIs to their page only
    '/api/course-mates/:path*',
    // Lesson APIs guarded with early checks
    '/api/lesson/:path*',
    '/lesson/:path*',
    // Blocked legacy sections
    '/course/:path*',
    '/courses/:path*',
    // Feature-flag block for widgets APIs
    '/api/timer/:path*',
    '/api/todos/:path*',
  ],
};
