export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql as vpsql } from "@/lib/db";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  try {
    // Read and execute all .sql files under drizzle/migrations (sorted)
    const folder = path.join(process.cwd(), "drizzle", "migrations");
    const files = (await readdir(folder)).filter((f) => f.endsWith(".sql")).sort();
    const executed: string[] = [];
    for (const file of files) {
      const content = await readFile(path.join(folder, file), "utf8");
      if (content && content.trim().length > 0) {
        await vpsql.unsafe(content);
        executed.push(file);
      }
    }
    return NextResponse.json({ ok: true, executed });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
