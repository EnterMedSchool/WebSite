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
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (!isAdminPath) return NextResponse.next();

  // Allow only CORS preflight to pass for API (if any)
  if (req.method === 'OPTIONS') return NextResponse.next();

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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

