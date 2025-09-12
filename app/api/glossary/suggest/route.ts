import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lmsAdminDrafts } from "@/drizzle/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ok(data: any, status = 200) { return NextResponse.json(data, { status }); }
function bad(msg: string, status = 400) { return NextResponse.json({ error: msg }, { status }); }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null as any);
    if (!body || typeof body !== "object") return bad("Invalid JSON payload", 400);
    const email = String(body.email || "").trim();
    const key = String(body.key || "").trim(); // e.g., glossary-term:<id> or lesson:<slug>
    const title = body.title == null ? null : String(body.title).slice(0, 200);
    const payload = body.payload ?? {};
    if (!email || !key) return bad("Missing email or key", 400);

    const [row] = await db.insert(lmsAdminDrafts)
      .values({ email, key, title, payload: payload as any })
      .returning({ id: lmsAdminDrafts.id });

    return ok({ ok: true, id: row?.id });
  } catch (e: any) {
    return bad(String(e?.message ?? e), 500);
  }
}
