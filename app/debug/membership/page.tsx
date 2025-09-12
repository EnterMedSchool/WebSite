"use client";

import { useEffect, useState } from "react";

type Data = {
  userId: number;
  email: string | null;
  isPremium: boolean;
  hasImat: boolean;
  imat: { id: number; startDate?: string; currentDay?: number } | null;
  canToggle: boolean;
};

export default function MembershipDebugPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/me/membership", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setData(j);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function mutate(patch: Partial<{ premium: boolean; grantImat: boolean; revokeImat: boolean }>) {
    try {
      const r = await fetch("/api/me/membership", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setData(j);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Membership Tools (Dev)</h1>
      <p className="mt-1 text-sm text-gray-600">Quick self-service to test premium/IMAT access.</p>

      {loading ? (
        <div className="mt-6 text-sm text-gray-600">Loading…</div>
      ) : error ? (
        <div className="mt-6 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</div>
      ) : data ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border bg-white p-4 ring-1 ring-black/5">
            <div className="text-sm text-gray-800"><span className="font-semibold">User ID:</span> {data.userId}</div>
            <div className="text-sm text-gray-800"><span className="font-semibold">Email:</span> {data.email || "-"}</div>
          </div>

          <div className="rounded-xl border bg-white p-4 ring-1 ring-black/5">
            <div className="mb-2 text-sm font-semibold text-gray-900">Premium</div>
            <div className="flex items-center justify-between">
              <div className="text-sm">isPremium: <span className={data.isPremium ? "text-emerald-700" : "text-gray-700"}>{String(data.isPremium)}</span></div>
              <button
                disabled={!data.canToggle}
                onClick={() => mutate({ premium: !data.isPremium })}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${data.canToggle ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-600"}`}
              >
                {data.isPremium ? "Disable" : "Enable"}
              </button>
            </div>
            {!data.canToggle && (
              <div className="mt-2 text-[11px] text-gray-500">Toggles disabled in production. Set ALLOW_LOCAL_MEMBERSHIP_TOGGLE=1 to enable.</div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-4 ring-1 ring-black/5">
            <div className="mb-2 text-sm font-semibold text-gray-900">IMAT Membership</div>
            <div className="text-sm">hasImat: <span className={data.hasImat ? "text-emerald-700" : "text-gray-700"}>{String(data.hasImat)}</span></div>
            {data.imat ? (
              <div className="mt-1 text-[12px] text-gray-700">Plan id: {data.imat.id} • start: {String(data.imat.startDate || "-")}</div>
            ) : null}
            <div className="mt-3 flex gap-2">
              <button
                disabled={!data.canToggle}
                onClick={() => mutate({ grantImat: true })}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${data.canToggle ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-200 text-gray-600"}`}
              >Grant IMAT</button>
              <button
                disabled={!data.canToggle}
                onClick={() => mutate({ revokeImat: true })}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${data.canToggle ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-gray-200 text-gray-600"}`}
              >Revoke IMAT</button>
            </div>
            {!data.canToggle && (
              <div className="mt-2 text-[11px] text-gray-500">Toggles disabled in production. Set ALLOW_LOCAL_MEMBERSHIP_TOGGLE=1 to enable.</div>
            )}
          </div>

          <div className="text-[12px] text-gray-500">Tip: add <code>?demo=1</code> to lesson URLs to bypass video lock for development.</div>
        </div>
      ) : null}
    </div>
  );
}

