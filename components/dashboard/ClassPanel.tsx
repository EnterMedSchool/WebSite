"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the heavy client only when needed
const CourseMatesClient = dynamic(() => import("@/app/course-mates/CourseMatesClient"), { ssr: false });

export default function ClassPanel() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean>(false);
  const [initial, setInitial] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/course-mates/initial", { credentials: "include" });
        if (!r.ok) throw new Error("Failed to load");
        const j = await r.json();
        if (cancelled) return;
        setAuthed(!!j?.authed);
        setInitial(j?.initial || null);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading class hub…</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!authed) return <div className="p-6 text-sm text-gray-700">Please sign in to view your class.</div>;
  if (!initial) return <div className="p-6 text-sm text-gray-600">No data available.</div>;

  return (
    <div className="px-2 pb-4">
      <CourseMatesClient authed={true} initial={initial} />
    </div>
  );
}

