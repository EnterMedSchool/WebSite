import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { terms } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function fetchJson<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return (await res.json()) as T;
}

export async function GET(req: Request) {
  const forbidden = requireKey(req);
  if (forbidden) return forbidden;

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") || "full").toLowerCase(); // "index" | "full"
  const limit = Math.max(0, Number(url.searchParams.get("limit") || 0));

  const INDEX_URL = "https://raw.githubusercontent.com/EnterMedSchool/Anki/main/glossary/index.json";
  const TERMB_URL = "https://raw.githubusercontent.com/EnterMedSchool/Anki/main/glossary/terms";

  try {
    const index: any = await fetchJson(INDEX_URL);
    // index shape: we accept either array of ids, or { terms:[{id,names,tags?},...]} or object map
    let items: { id: string; names?: string[]; tags?: any }[] = [];
    if (Array.isArray(index)) {
      items = index.map((id: any) => ({ id: String(id) }));
    } else if (Array.isArray(index?.terms)) {
      items = index.terms as any[];
    } else if (typeof index === "object" && index) {
      // try object map: { id: { names, tags } }
      items = Object.keys(index).map((id) => ({ id, ...(index[id] || {}) }));
    }
    if (!items.length) return NextResponse.json({ error: "No terms in index" }, { status: 400 });

    // Optional seeding only index metadata
    if (mode === "index") {
      let upserts = 0;
      for (const it of items) {
        const slug = (it.id || "").toString();
        if (!slug) continue;
        const title = Array.isArray(it.names) && it.names[0] ? String(it.names[0]) : slug;
        const [row] = await db
          .insert(terms)
          .values({ slug, title, tags: (it as any).tags ?? null })
          .onConflictDoUpdate({ target: [terms.slug], set: { title, tags: (it as any).tags ?? null, updatedAt: new Date() as any } })
          .returning({ id: terms.id });
        if (row?.id) upserts++;
        if (limit && upserts >= limit) break;
      }
      return NextResponse.json({ ok: true, mode, upserts });
    }

    // Full mode: fetch each term JSON
    let processed = 0;
    const max = limit > 0 ? limit : items.length;
    const concurrency = 5;
    let idx = 0;
    async function worker() {
      while (idx < max) {
        const cur = idx++;
        const it = items[cur];
        if (!it) break;
        const slug = (it.id || "").toString();
        if (!slug) continue;
        try {
          const url = `${TERMB_URL}/${encodeURIComponent(slug)}.json`;
          const data = await fetchJson<any>(url);
          const title = Array.isArray(data?.names) && data.names[0] ? String(data.names[0]) : slug;
          await db
            .insert(terms)
            .values({ slug, title, data: data as any, tags: (data as any)?.tags ?? null })
            .onConflictDoUpdate({ target: [terms.slug], set: { title, data: data as any, tags: (data as any)?.tags ?? null, updatedAt: new Date() as any } });
          processed++;
        } catch (e: any) {
          // continue
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return NextResponse.json({ ok: true, mode, processed });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

