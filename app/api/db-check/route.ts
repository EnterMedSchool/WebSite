export const runtime = "nodejs";

import { sql } from "@/lib/db";

export async function GET() {
  if (!process.env.POSTGRES_URL) {
    return Response.json(
      { connected: false, message: "Vercel Postgres env vars not set" },
      { status: 200 }
    );
  }

  try {
    const result = await sql`select now() as now`;
    return Response.json({ connected: true, now: result.rows[0].now });
  } catch (err: any) {
    return Response.json({ connected: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}

