Study Rooms (VirtualLibrary migration)
=====================================

This folder documents the isolated “Study Rooms” feature migrated from the old VirtualLibrary app. All code for this feature is kept in separate folders and table prefixes to enable easy removal if needed.

Code Locations
- API routes: `app/api/study/**`
- Server libs: `lib/study/**`
- Drizzle tables: `drizzle/schema.ts` (tables prefixed with `study_`)

Environment Variables
- Pusher server: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
- Pusher client: `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`

Install & Migrate
1) Install deps: `npm i pusher pusher-js`
2) Generate migrations: `npm run db:generate`
3) Push migrations: `npm run db:push`

API Endpoints (skeleton)
- `GET /api/study/sessions?limit=&page=&sort=latest|popular&mysessions=true|false`
- `POST /api/study/sessions` { title, description }
- `GET /api/study/sessions/[slug]`
- `PATCH /api/study/sessions/[slug]` { slug?, sharedEndAt? }
- `PATCH /api/study/sessions/[sessionId]/join`
- `PATCH /api/study/sessions/[sessionId]/leave`
- `GET /api/study/messages?sessionId=...`
- `POST /api/study/messages` { sessionId, content }
- `GET /api/study/tasks?sessionId=...`
- `POST /api/study/tasks` { sessionId, title, items? }
- `PATCH /api/study/tasks/[taskListId]` { title?, items? }
- `DELETE /api/study/tasks/[taskListId]`

Realtime Events (Pusher)
- Channel: `study-session-{id}`
- Events: `presence:join`, `presence:leave`, `message:new`, `timer:tick`, `task:upsert`, `task:delete`

Removal
- Delete `app/api/study` and `lib/study` folders
- Remove `study_` tables from `drizzle/schema.ts` (and create a migration to drop them, if already applied)
- Remove Pusher env vars and packages if unused elsewhere

