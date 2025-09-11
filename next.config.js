/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Existing
      { protocol: 'https', hostname: 'lh1.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh2.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },

      // Media used on the IMAT page
      { protocol: 'https', hostname: 'entermedschool.com' },
      { protocol: 'https', hostname: 'entermedschool.b-cdn.net' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },

  // Add global X-Robots-Tag for staging: default to noindex
  async headers() {
    const allowIndex = process.env.NEXT_PUBLIC_ALLOW_INDEX === 'true';
    const headers = [];
    // Long-term immutable caching for static graph assets
    headers.push({
      source: '/graph/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, immutable, max-age=31536000, s-maxage=31536000' },
      ],
    });
    if (!allowIndex) {
      headers.push({
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      });
    }
    return headers;
  },
  experimental: {
    outputFileTracingIncludes: {
      "app/api/admin/db/migrate/route.ts": ["./drizzle/migrations/**"],
    },
  },
};

module.exports = nextConfig;
