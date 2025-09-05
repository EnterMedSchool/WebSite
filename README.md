## WebSite Skeleton

Production-ready skeleton for a large learning platform on Vercel.

What you get:

- Next.js App Router (TypeScript, strict mode)
- Tailwind CSS
- NextAuth with Credentials (dev) and optional GitHub OAuth (prod-ready)
- Example protected page (`/dashboard`)
- Example dynamic pages (`/course/[slug]`, `/quiz/[id]`)
- Example API routes (`/api/health`, `/api/quiz/[id]`)

### Getting Started

1) Install dependencies

```bash
npm install
```

2) Configure environment variables

Copy `.env.example` to `.env` and set values.

For local dev, the provided Credentials provider works with any username/password (for testing only). For OAuth, add GitHub creds:

```
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=...
GITHUB_SECRET=...
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 and test:

- Home page links
- `/dashboard` (redirects to sign-in if not authenticated)
- `/api/health` returns JSON

### Deploying to Vercel

1) Push this repo to GitHub
2) Import the project in Vercel
3) Add the same env vars in Vercel Project Settings → Environment Variables
4) Deploy

### Notes & Next Steps

- Database layer is not included yet. For scale, consider Vercel Postgres (Neon) + Drizzle ORM or Prisma.
- Content strategy: MDX for rich content, or headless CMS (Sanity/Contentful), or database-backed lessons.
- Add design system components, animation libs (Framer Motion), analytics, and e2e tests as we proceed.

