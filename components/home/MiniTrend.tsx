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
  const W = 200, H = 56, P = 8;
  const years = pts.map(p=>p.year);
  const min = Math.min(...pts.map(p=>p.score), 0), max = Math.max(...pts.map(p=>p.score), 100);
  const x = (i:number)=> P + (i/(Math.max(1, pts.length-1)))*(W-2*P);
  const y = (v:number)=> H-P - ((v-min)/(max-min||1))*(H-2*P);
  const d = pts.map((p,i)=> `${i?'L':'M'} ${x(i)},${y(p.score)}`).join(' ');

  return (
    <div className="flex items-center justify-between gap-3">
      <svg width={W} height={H} className="rounded-lg bg-gray-50 ring-1 ring-gray-200/60">
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="#6C63FF" strokeWidth={2} />
      </svg>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">EU {seats.eu ?? '—'}</span>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">NonEU {seats.nonEu ?? '—'}</span>
      </div>
    </div>
  );
}
