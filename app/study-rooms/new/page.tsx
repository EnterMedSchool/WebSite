"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStudyRoomPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const open = async () => {
      setError(null);
      // First, try to find existing personal room
      const res = await fetch(`/api/study/sessions?mysessions=true&limit=1`, { credentials: "include", cache: "no-store" });
      if (res.status === 401) {
        setError("Please sign in to open your study room.");
        return;
      }
      if (res.ok) {
        try {
          const json = await res.json();
          const room = (json.data || [])[0];
          if (room?.slug) {
            if (!mounted) return;
            router.replace(`/study-rooms/${room.slug}`);
            return;
          }
        } catch {}
      }
      // Fallback: ask server to return/create the personal room (idempotent)
      const res2 = await fetch("/api/study/sessions", { method: "POST", credentials: "include" });
      if (!res2.ok) {
        try { const j = await res2.json(); setError(j?.error || "Failed to open your room."); } catch { setError("Failed to open your room."); }
        return;
      }
      try {
        const json = await res2.json();
        if (!mounted) return;
        router.replace(`/study-rooms/${json.data.slug}`);
      } catch {
        setError("Unexpected response while opening your room.");
      }
    };
    void open();
    return () => { mounted = false; };
  }, [router]);

  return (
    <section className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">My Study Room</h1>
      <p>Opening your room…</p>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </section>
  );
}
