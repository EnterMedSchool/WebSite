import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = (
    await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id as any, userId))
      .limit(1)
  )[0];

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const res = NextResponse.json({ user: row });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
