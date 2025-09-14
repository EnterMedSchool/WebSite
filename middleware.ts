import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

  // Temporary block: courses and chapters pages (focus on lessons only)
  // - Block top-level /course and /courses (but not /course-mates)
  // - Also block any /chapters or /chapter paths if present
  const blockCourses = /^\/(courses?)(\/|$)/.test(pathname);
  const blockCourseSingular = /^\/course(\/|$)/.test(pathname);
  const blockChapters = /^\/(chapters?|chapter)(\/|$)/.test(pathname);
  if (blockCourses || blockCourseSingular || blockChapters) {
    return new NextResponse('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
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
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    // Lesson APIs guarded with early checks
    '/api/lesson/:path*',
    // Blocked sections
    '/course/:path*',
    '/courses/:path*',
    '/chapter/:path*',
    '/chapters/:path*',
    // Feature-flag block for widgets APIs
    '/api/timer/:path*',
    '/api/todos/:path*',
  ],
};
