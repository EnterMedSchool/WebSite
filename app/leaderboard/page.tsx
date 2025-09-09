"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Range = "weekly" | "all";
type Item = {
  userId: number;
  username: string;
  name: string | null;
  image: string | null;
  level: number;
  xp?: number;
  weeklyXp?: number;
  rank: number;
};

type ApiResp = {
  range: Range;
  totalUsers: number;
  items: Item[];
  nextCursor: string | null;
  me: Item | null;
};

export default function LeaderboardPage() {
  const [range, setRange] = useState<Range>("weekly");
  const [items, setItems] = useState<Item[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [me, setMe] = useState<Item | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadFirst() {
      setLoading(true); setError(null);
      try {
        const r = await fetch(`/api/leaderboard?range=${range}`);
        const j: ApiResp = await r.json();
        if (!cancelled) {
          setItems(j.items || []);
          setNextCursor(j.nextCursor || null);
          setTotalUsers(j.totalUsers || 0);
          setMe(j.me || null);
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFirst();
    return () => { cancelled = true; };
  }, [range]);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/leaderboard?range=${range}&cursor=${encodeURIComponent(nextCursor)}`);
      const j: ApiResp = await r.json();
      setItems((it) => [...it, ...(j.items || [])]);
      setNextCursor(j.nextCursor || null);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const top3 = useMemo(() => items.slice(0, 3), [items]);

  const percentBetter = useMemo(() => {
    if (!me || !totalUsers || me.rank <= 0) return null;
    const better = Math.max(0, totalUsers - me.rank);
    const pct = Math.round((better / Math.max(1, totalUsers)) * 100);
    return pct;
  }, [me, totalUsers]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => setRange("weekly")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === 'weekly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Weekly</button>
        <button onClick={() => setRange("all")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${range === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All Time</button>
      </div>

      {me && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-4 text-white shadow-lg">
            <div className="text-sm opacity-80">Your Rank</div>
            <div className="text-3xl font-extrabold">#{me.rank}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-gray-100">
            <div className="text-sm text-gray-600">Points</div>
            <div className="text-2xl font-extrabold text-indigo-700">{range === 'weekly' ? me.weeklyXp ?? 0 : me.xp ?? 0}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-gray-100">
            <div className="text-sm text-gray-600">You’re doing better than</div>
            <div className="text-2xl font-extrabold text-emerald-600">{percentBetter ?? 0}%</div>
          </div>
        </div>
      )}

      {/* Podium (top 3) */}
      {top3.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-6">
          {top3.map((p, idx) => (
            <div key={p.userId} className={`relative rounded-2xl ${idx === 1 ? 'from-amber-400 to-yellow-500' : idx === 0 ? 'from-indigo-500 to-fuchsia-500' : 'from-sky-400 to-indigo-500'} bg-gradient-to-br p-4 text-white shadow-lg`}> 
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/90">
                  {p.image ? (
                    <Image src={p.image} alt={p.name || p.username} width={40} height={40} className="h-10 w-10 object-cover" />
                  ) : (
                    <span className="text-indigo-700">{(p.name || p.username || 'U').slice(0,1).toUpperCase()}</span>
                  )}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.name || p.username}</div>
                  <div className="text-xs opacity-80">Level {p.level}</div>
                </div>
              </div>
              <div className="text-lg font-extrabold">{range === 'weekly' ? (p.weeklyXp ?? 0) : (p.xp ?? 0)} pts</div>
              <div className="absolute -top-3 -right-3 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-indigo-700 shadow">#{p.rank}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rest of the list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow ring-1 ring-gray-100">
        <ul className="divide-y">
          {items.slice(3).map((r) => (
            <li key={r.userId} className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 text-center text-sm font-bold text-indigo-700">#{r.rank}</div>
              <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                {r.image ? (
                  <Image src={r.image} alt={r.name || r.username} width={32} height={32} className="h-8 w-8 object-cover" />
                ) : (
                  <span className="text-indigo-700">{(r.name || r.username || 'U').slice(0,1).toUpperCase()}</span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-900">{r.name || r.username}</div>
                <div className="text-xs text-gray-500">Level {r.level}</div>
              </div>
              <div className="text-sm font-semibold text-indigo-700">{range === 'weekly' ? (r.weeklyXp ?? 0) : (r.xp ?? 0)} pts</div>
            </li>
          ))}
        </ul>

        <div className="border-t p-3 text-center">
          {nextCursor ? (
            <button disabled={loading} onClick={loadMore} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-60">{loading ? 'Loading…' : 'Load more'}</button>
          ) : (
            <span className="text-sm text-gray-500">No more users</span>
          )}
        </div>
      </div>

      {error && <div className="mt-4 text-sm text-rose-600">{error}</div>}
    </div>
  );
}

