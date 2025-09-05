## WebSite Skeleton

Production-ready skeleton for a large learning platform on Vercel.

What you get:

- Next.js App Router (TypeScript, strict mode)
- Tailwind CSS
- NextAuth with Credentials (dev) and optional GitHub OAuth (prod-ready)
- Example protected page (`/dashboard`)
- Example dynamic pages (`/course/[slug]`, `/quiz/[id]`)
- Example API routes (`/api/health`, `/api/quiz/[id]`)
- Optional database via Vercel Postgres + Drizzle ORM (scaffolded)
 - Admin + Posts (blog): create posts via `/admin`, public at `/blog`

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
 - `/blog` and `/blog/[slug]` for posts
 - `/admin` requires sign-in and `ADMIN_USERS`

### Deploying to Vercel

1) Push this repo to GitHub
2) Import the project in Vercel
3) Add the same env vars in Vercel Project Settings → Environment Variables
4) Deploy

### Notes & Next Steps

- Database: Vercel Postgres (Neon) + Drizzle ORM is scaffolded. Add the Postgres integration in Vercel → Storage to enable.
- Content strategy: MDX for rich content, or headless CMS (Sanity/Contentful), or database-backed lessons.
- Add design system components, animation libs (Framer Motion), analytics, and e2e tests as we proceed.

## Database (Vercel Postgres + Drizzle)

1) In Vercel dashboard: Project → Storage → Add → Postgres. Link it to this project.
   - Vercel will inject env vars like `POSTGRES_URL` automatically.

2) For local development, copy those values into `.env` (or run `vercel env pull .env.local`).

3) Generate and push the initial schema:

```bash
npm run db:generate   # create SQL migrations from drizzle/schema.ts
npm run db:push       # apply migrations to the database
```

4) Verify the DB connection:

Open `/api/db-check` in the browser. You should see `{ connected: true }`.

Schema lives in `drizzle/schema.ts`. Database client lives in `lib/db.ts`.

Recommended: use Vercel KV (Upstash) later for presence/ephemeral chat state, and Vercel Cron for scheduled jobs.

## Admin + Posts

1) Set `ADMIN_USERS` env (comma-separated usernames). Example: `ADMIN_USERS=ari`

2) Sign in with the Credentials provider using that username.

3) Initialize tables once (if not using Drizzle CLI): send a POST request to `/api/admin/init` while signed in as admin.
   - Example using curl: `curl -X POST https://<your-domain>/api/admin/init`

4) Visit `/admin` to list posts and `/admin/posts/new` to create.

5) Public blog lives at `/blog` and `/blog/[slug]`.
