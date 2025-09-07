import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // Use raw SQL to avoid selecting columns that may not exist if migrations haven't been applied yet
  const result = await sql`SELECT id, slug, title, description FROM courses ORDER BY id`;
  return NextResponse.json({ courses: result.rows });
}
