import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const list = await db.select().from(courses);
  return NextResponse.json({ courses: list });
}

