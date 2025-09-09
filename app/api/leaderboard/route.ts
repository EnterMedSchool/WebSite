import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Range = "weekly" | "all";

function parseCursor(cursor?: string | null) {
  if (!cursor) return null as null | { xp: number; id: number; rankOffset: number };
  try {
    const decoded = Buffer.from(String(cursor), "base64").toString("utf8");
    const obj = JSON.parse(decoded);
    const xp = Number(obj.xp);
    const id = Number(obj.id);
    const rankOffset = Number(obj.rankOffset || 0);
    if (!Number.isFinite(xp) || !Number.isFinite(id)) return null;
    return { xp, id, rankOffset };
  } catch {
    return null;
  }
}

function makeCursor(xp: number, id: number, rankOffset: number) {
  return Buffer.from(JSON.stringify({ xp, id, rankOffset })).toString("base64");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range: Range = (searchParams.get("range") as Range) === "all" ? "all" : "weekly";
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 20)));
    const cur = parseCursor(searchParams.get("cursor"));

    // Optional session (for "me" block); do not require auth to view leaderboard
    let userId = 0;
    try {
      const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
      if (isAuthConfigured) {
        const session = await getServerSession(authOptions as any);
        const sUserId = session && (session as any).userId ? Number((session as any).userId) : 0;
        if (Number.isSafeInteger(sUserId) && sUserId > 0 && sUserId <= 2147483647) userId = sUserId;
      }
    } catch {}

    // Total registered users (for percentile display)
    const totalR = await sql`SELECT COUNT(*)::int AS total FROM users`;
    const totalUsers = Number(totalR.rows[0]?.total || 0);

    if (range === "all") {
      // Keyset: order by xp DESC, id ASC
      const where = cur
        ? sql`WHERE (xp < ${cur.xp}) OR (xp = ${cur.xp} AND id > ${cur.id})`
        : sql``;
      const rows = await sql`
        SELECT id, username, name, image, level, xp
        FROM users
        ${where}
        ORDER BY xp DESC, id ASC
        LIMIT ${limit}
      `;

      // Rank offset comes from cursor, default 0
      const rankOffset = cur?.rankOffset ?? 0;
      const items = rows.rows.map((r: any, i: number) => ({
        userId: Number(r.id),
        username: r.username as string,
        name: r.name as string | null,
        image: r.image as string | null,
        level: Number(r.level || 1),
        xp: Number(r.xp || 0),
        weeklyXp: undefined as number | undefined,
        rank: rankOffset + i + 1,
      }));

      const last = rows.rows.at(-1);
      const nextCursor = last
        ? makeCursor(Number(last.xp || 0), Number(last.id || 0), rankOffset + rows.rows.length)
        : null;

      // Compute "me" rank if authenticated
      let me: any = null;
      if (userId) {
        const myR = await sql`SELECT id, xp, level, name, image, username FROM users WHERE id=${userId} LIMIT 1`;
        const meRow = myR.rows[0];
        if (meRow) {
          const myXp = Number(meRow.xp || 0);
          const beforeR = await sql`SELECT COUNT(*)::int AS cnt FROM users WHERE (xp > ${myXp}) OR (xp = ${myXp} AND id < ${userId})`;
          const rank = Number(beforeR.rows[0]?.cnt || 0) + 1;
          me = {
            userId,
            username: meRow.username as string,
            name: meRow.name as string | null,
            image: meRow.image as string | null,
            level: Number(meRow.level || 1),
            xp: myXp,
            weeklyXp: undefined,
            rank,
          };
        }
      }

      return NextResponse.json({
        range,
        totalUsers,
        items,
        nextCursor,
        me,
      });
    }

    // Weekly
    // Prefer materialized view if present; fallback to on-the-fly aggregate.
    const mvCheck = await sql`SELECT to_regclass('public.leaderboard_weekly_xp') AS reg`;
    const hasMv = !!mvCheck.rows[0]?.reg;
    const whereWeekly = cur
      ? sql`WHERE (COALESCE(t.weekly_xp,0) < ${cur.xp}) OR (COALESCE(t.weekly_xp,0) = ${cur.xp} AND t.id > ${cur.id})`
      : sql``;

    const rows = hasMv
      ? await sql`
          WITH base AS (
            SELECT u.id, u.username, u.name, u.image, u.level, u.xp,
                   COALESCE(lw.weekly_xp,0) AS weekly_xp
            FROM users u
            LEFT JOIN leaderboard_weekly_xp lw ON lw.user_id = u.id
          )
          SELECT * FROM base t
          ${whereWeekly}
          ORDER BY t.weekly_xp DESC, t.id ASC
          LIMIT ${limit}
        `
      : await sql`
          WITH weekly AS (
            SELECT user_id, COALESCE(SUM((payload->>'amount')::int),0) AS wxp
            FROM lms_events
            WHERE action='xp_awarded' AND created_at >= now() - interval '7 days'
            GROUP BY user_id
          ), base AS (
            SELECT u.id, u.username, u.name, u.image, u.level, u.xp, COALESCE(w.wxp,0) AS weekly_xp
            FROM users u
            LEFT JOIN weekly w ON w.user_id = u.id
          )
          SELECT * FROM base t
          ${whereWeekly}
          ORDER BY t.weekly_xp DESC, t.id ASC
          LIMIT ${limit}
        `;

    const rankOffset = cur?.rankOffset ?? 0;
    const items = rows.rows.map((r: any, i: number) => ({
      userId: Number(r.id),
      username: r.username as string,
      name: r.name as string | null,
      image: r.image as string | null,
      level: Number(r.level || 1),
      xp: Number(r.xp || 0),
      weeklyXp: Number(r.weekly_xp || 0),
      rank: rankOffset + i + 1,
    }));

    const last = rows.rows.at(-1);
    const lastWx = last ? Number((last as any).weekly_xp || 0) : 0;
    const nextCursor = last ? makeCursor(lastWx, Number(last.id || 0), rankOffset + rows.rows.length) : null;

    let me: any = null;
    if (userId) {
      const meRowR = hasMv
        ? await sql`
            SELECT u.id, u.username, u.name, u.image, u.level, u.xp, COALESCE(lw.weekly_xp,0) AS weekly_xp
            FROM users u
            LEFT JOIN leaderboard_weekly_xp lw ON lw.user_id = u.id
            WHERE u.id=${userId}
            LIMIT 1`
        : await sql`
            WITH weekly AS (
              SELECT user_id, COALESCE(SUM((payload->>'amount')::int),0) AS wxp
              FROM lms_events
              WHERE action='xp_awarded' AND created_at >= now() - interval '7 days'
              GROUP BY user_id
            )
            SELECT u.id, u.username, u.name, u.image, u.level, u.xp, COALESCE(w.wxp,0) AS weekly_xp
            FROM users u
            LEFT JOIN weekly w ON w.user_id = u.id
            WHERE u.id=${userId}
            LIMIT 1`;
      const meRow = meRowR.rows[0];
      if (meRow) {
        const myWx = Number(meRow.weekly_xp || 0);
        const beforeR = hasMv
          ? await sql`
              SELECT COUNT(*)::int AS cnt
              FROM users u
              LEFT JOIN leaderboard_weekly_xp lw ON lw.user_id = u.id
              WHERE (COALESCE(lw.weekly_xp,0) > ${myWx}) OR (COALESCE(lw.weekly_xp,0) = ${myWx} AND u.id < ${userId})`
          : await sql`
              WITH weekly AS (
                SELECT user_id, COALESCE(SUM((payload->>'amount')::int),0) AS wxp
                FROM lms_events
                WHERE action='xp_awarded' AND created_at >= now() - interval '7 days'
                GROUP BY user_id
              )
              SELECT COUNT(*)::int AS cnt
              FROM users u
              LEFT JOIN weekly w ON w.user_id = u.id
              WHERE (COALESCE(w.wxp,0) > ${myWx}) OR (COALESCE(w.wxp,0) = ${myWx} AND u.id < ${userId})`;
        const rank = Number(beforeR.rows[0]?.cnt || 0) + 1;
        me = {
          userId,
          username: meRow.username as string,
          name: meRow.name as string | null,
          image: meRow.image as string | null,
          level: Number(meRow.level || 1),
          xp: Number(meRow.xp || 0),
          weeklyXp: myWx,
          rank,
        };
      }
    }

    return NextResponse.json({ range, totalUsers, items, nextCursor, me });
  } catch (err: any) {
    console.error("leaderboard GET failed", err);
    return NextResponse.json({ error: "internal_error", message: String(err?.message || err) }, { status: 500 });
  }
}
