/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ensure SQL migrations are bundled for the migrate API route
    outputFileTracingIncludes: {
      "app/api/admin/db/migrate/route.ts": ["./drizzle/migrations/**"],
    },
  },
};

export default nextConfig;
