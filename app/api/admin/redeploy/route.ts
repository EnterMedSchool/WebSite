import { NextResponse } from "next/server";

export async function POST() {
  const url = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!url) return NextResponse.json({ error: 'missing_hook_url' }, { status: 400 });
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) return NextResponse.json({ error: 'hook_failed', status: res.status }, { status: 500 });
  return NextResponse.json({ ok: true });
}

