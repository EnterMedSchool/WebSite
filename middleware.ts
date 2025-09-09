import { NextRequest, NextResponse } from "next/server";

const enabled = (process.env.STUDY_ROOMS_ENABLED === '1') || (process.env.STUDY_ROOMS_ENABLED === 'true') || (process.env.NEXT_PUBLIC_STUDY_ROOMS_ENABLED === '1') || (process.env.NEXT_PUBLIC_STUDY_ROOMS_ENABLED === 'true');

export function middleware(req: NextRequest) {
  if (!enabled) {
    const p = req.nextUrl.pathname;
    if (p.startsWith('/study-rooms') || p.startsWith('/api/study')) {
      return new Response('Not Found', { status: 404 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/study-rooms/:path*',
    '/api/study/:path*',
  ],
};

