// Optional KV cache via Upstash REST API
// Enable by setting UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

function kvUrl(): string | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_TOKEN;
  if (!url || !token) return null;
  return url.replace(/\/$/, "");
}

function kvToken(): string | null {
  return (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_TOKEN) || null;
}

export function kvAvailable(): boolean {
  return !!kvUrl() && !!kvToken();
}

async function kvCmd(cmd: string[]): Promise<any> {
  const url = kvUrl(); const token = kvToken();
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd })
    } as any);
    if (!res.ok) return null;
    const j = await res.json();
    return j?.result ?? null;
  } catch { return null; }
}

export async function kvGetJSON<T = any>(key: string): Promise<T | null> {
  const val = await kvCmd(["GET", key]);
  if (typeof val !== 'string') return null;
  try { return JSON.parse(val) as T; } catch { return null; }
}

export async function kvSetJSON(key: string, value: any, ttlSec: number): Promise<void> {
  const url = kvUrl(); const token = kvToken();
  if (!url || !token) return;
  try {
    const payload = JSON.stringify(value);
    // SET key value EX ttl
    await kvCmd(["SET", key, payload, "EX", String(Math.max(1, Math.floor(ttlSec))) ]);
  } catch {}
}

