import { authGetServerSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ChestIcon, BadgeIcon } from "@/components/xp/Icons";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const session = await authGetServerSession();
  if (!session) return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Achievements</h1>
      <p className="mt-2 text-slate-600">Sign in to see your badges and chests.</p>
    </div>
  );
  let userId = Number((session as any).userId || 0);
  if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) {
    const email = String((session as any)?.user?.email || '').toLowerCase();
    if (email) {
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
  }

  const rr = await sql`SELECT payload, created_at FROM lms_events WHERE user_id=${userId} AND action='reward' ORDER BY created_at DESC`;
  const rows = rr.rows.map((r: any) => {
    const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload || {};
    return { key: String(p.key || `${p.type}:${p.label}`), type: String(p.type || 'badge'), label: String(p.label || 'Reward'), when: new Date(r.created_at as string) };
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white shadow ring-1 ring-indigo-900/20">
        <h1 className="text-2xl font-extrabold">Achievements</h1>
        <p className="mt-1 text-sm text-white/90">Badges and chests you have earned across courses.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 ? (
          <div className="col-span-full rounded-2xl border bg-white p-6 text-slate-700 shadow ring-1 ring-black/5">No achievements yet. Complete lessons and chapters to unlock rewards!</div>
        ) : (
          rows.map((it) => (
            <div key={`${it.key}-${it.when.toISOString()}`} className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-indigo-50 to-emerald-50 ring-1 ring-inset ring-indigo-100">
                {it.type === 'chest' ? <ChestIcon className="h-10 w-10" /> : <BadgeIcon className="h-10 w-10" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">{it.label}</div>
                <div className="mt-0.5 text-xs text-slate-500">Earned {it.when.toLocaleDateString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

