"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function StudyRoomsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<any | null>(null);

  const load = async () => {
    const res = await fetch(`/api/study/sessions?sort=${sort}&page=${page}&limit=10`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setSessions(json.data || []);
      setTotal(json.total || 0);
    }
  };
  const loadMeta = async () => {
    const res = await fetch(`/api/study/user/meta`, { cache: "no-store" });
    if (res.ok) setMeta((await res.json()).data);
  };
  useEffect(() => { load(); }, [sort, page]);
  useEffect(() => { loadMeta(); }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 10)), [total]);

  return (
    <section className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Study Rooms</h1>
        <div className="flex items-center gap-4">
          {meta?.lastSessionSlug ? (
            <Link href={`/study-rooms/${meta.lastSessionSlug}`} className="underline">Join last one</Link>
          ) : null}
          <Link href="/study-rooms/new" className="underline">Create a room</Link>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm">Sort:</span>
        <button onClick={() => setSort("latest")} className={`px-2 py-1 rounded border ${sort === "latest" ? "bg-blue-600 text-white" : "bg-white"}`}>Latest</button>
        <button onClick={() => setSort("popular")} className={`px-2 py-1 rounded border ${sort === "popular" ? "bg-blue-600 text-white" : "bg-white"}`}>Popular</button>
      </div>
      <ul className="space-y-3">
        {sessions.map((s: any) => (
          <li key={s.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{s.title}</div>
              <div className="text-sm text-gray-500">{s.description}</div>
            </div>
            <Link href={`/study-rooms/${s.slug}`} className="underline">Open</Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-2 mt-4">
        <button className="border rounded px-3 py-1" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span className="text-sm">{page}/{totalPages}</span>
        <button className="border rounded px-3 py-1" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </section>
  );
}
