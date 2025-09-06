"use client";

import { useEffect, useMemo, useState } from "react";

export default function MiniTrend({ uni }: { uni: string }) {
  const slug = useMemo(() => uni.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), [uni]);
  const [pts, setPts] = useState<Array<{ year: number; score: number }>>([]);
  const [seats, setSeats] = useState<{ eu?: number; nonEu?: number }>({});

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`/api/compare/scores?unis=${slug}`, { cache: "no-store" });
        const json = await res.json();
        const s = json.series?.[0];
        if (!s || off) return;
        const non = s.points.filter((p: any) => p.type === "NonEU").sort((a: any,b: any)=>a.year-b.year);
        const any = non.length ? non : s.points.sort((a: any,b: any)=>a.year-b.year);
        setPts(any.map((p: any) => ({ year: p.year, score: p.score })));
        const latestYear = Math.max(...(s.seats?.map((x: any)=>x.year) ?? [0]));
        const eu = s.seats?.find((x: any)=>x.year===latestYear && x.type==='EU')?.seats;
        const nonEu = s.seats?.find((x: any)=>x.year===latestYear && x.type==='NonEU')?.seats;
        setSeats({ eu, nonEu });
      } catch {}
    })();
    return () => { off = true; };
  }, [slug]);

  if (!pts.length) return null;
  const W = 160, H = 46, P = 6;
  const years = pts.map(p=>p.year);
  const min = Math.min(...pts.map(p=>p.score), 0), max = Math.max(...pts.map(p=>p.score), 100);
  const x = (i:number)=> P + (i/(Math.max(1, pts.length-1)))*(W-2*P);
  const y = (v:number)=> H-P - ((v-min)/(max-min||1))*(H-2*P);
  const d = pts.map((p,i)=> `${i?'L':'M'} ${x(i)},${y(p.score)}`).join(' ');

  return (
    <div className="flex items-center justify-between gap-2">
      <svg width={W} height={H} className="rounded bg-gray-50">
        <path d={d} fill="none" stroke="#6C63FF" strokeWidth={2} />
      </svg>
      <div className="text-[10px] text-gray-600">
        <div>Seats: <span className="font-semibold">EU {seats.eu ?? '—'}</span> · <span className="font-semibold">NonEU {seats.nonEu ?? '—'}</span></div>
      </div>
    </div>
  );
}

