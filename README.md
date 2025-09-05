# EnterMedSchool — Monorepo

A modular TypeScript monorepo targeting Vercel. It includes:
- Next.js web app with Tailwind
- Embedded Sanity Studio for editors (no-code content authoring)
- Shared Prisma/Postgres package for auth/subscriptions (skeleton)

## Quick Start

1) Requirements
- Node 18+ and npm 9+
- A Postgres database (Neon/Supabase) — optional for first run
- A Sanity project (for Studio) — optional for first run

2) Install dependencies
```
npm install
```

3) Env setup
- Copy `.env.example` to `.env` at repo root and fill values when ready (Vercel → Project Settings → Environment Variables).

4) Run locally
```
npm run dev
```
Open http://localhost:3000

5) Deploy to Vercel
- Push this repo to GitHub/GitLab/Bitbucket
- In Vercel, "Add New… → Project" and import the repo
- Framework preset: Next.js (defaults ok)
- Add env vars from `.env.example` as needed
- Deploy

## Structure
- apps/web — Next.js app (App Router)
- packages/db — Prisma schema + client

## Next steps
- Configure Sanity (projectId/dataset) and open `/studio` for embedded CMS
- Set up Postgres URL and run migrations when auth/payments are introduced
- Add Stripe keys and webhook secret before enabling subscriptions

## Scripts
- `npm run dev` — run web app
- `npm run build` — build web app
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run Prisma migrations

## Notes
- This repo is intentionally minimal and modular. We will add auth (Auth.js), Stripe, Redis jobs, and localization incrementally.
