"use client";

import { useEffect, useMemo, useState } from "react";

export default function MiniTrend({ uni }: { uni: string }) {
  const slug = useMemo(() => uni.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), [uni]);
  const [ptsAll, setPtsAll] = useState<Record<string, Array<{ year: number; score: number }>>>({});
  const [seats, setSeats] = useState<{ eu?: number; nonEu?: number; year?: number }>({});

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const res = await fetch(`/api/compare/scores?unis=${slug}`, { cache: "no-store" });
        const json = await res.json();
        const s = json.series?.[0];
        if (!s || off) return;
        const groups: Record<string, Array<{ year: number; score: number }>> = {};
        for (const p of s.points) {
          const k = p.type || 'All';
          (groups[k] ||= []).push({ year: p.year, score: p.score });
        }
        for (const k of Object.keys(groups)) groups[k].sort((a,b)=>a.year-b.year);
        setPtsAll(groups);
        const latestYear = Math.max(...(s.seats?.map((x: any)=>x.year) ?? [0]));
        const eu = s.seats?.find((x: any)=>x.year===latestYear && x.type==='EU')?.seats;
        const nonEu = s.seats?.find((x: any)=>x.year===latestYear && x.type==='NonEU')?.seats;
        setSeats({ eu, nonEu, year: latestYear > 0 ? latestYear : undefined });
      } catch {}
    })();
    return () => { off = true; };
  }, [slug]);

  const types = Object.keys(ptsAll);
  if (types.length === 0) return null;
  const W = 260, H = 82, P = 10;
  const years = Array.from(new Set(types.flatMap(t=> ptsAll[t].map(p=>p.year)))).sort((a,b)=>a-b);
  const min = Math.min(...types.flatMap(t=> ptsAll[t].map(p=>p.score)), 0), max = Math.max(...types.flatMap(t=> ptsAll[t].map(p=>p.score)), 100);
  const x = (i:number)=> P + (i/(Math.max(1, years.length-1)))*(W-2*P);
  const y = (v:number)=> H-P - ((v-min)/(max-min||1))*(H-2*P);
  const palette: Record<string,string> = { NonEU: '#8B5CF6', EU: '#F59E0B', All: '#6C63FF' };
  function smoothPath(points: Array<{x:number;y:number}>): string {
    if (!points.length) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i=1;i<points.length;i++){
      const prev = points[i-1];
      const curr = points[i];
      const midX = (prev.x + curr.x)/2;
      const midY = (prev.y + curr.y)/2;
      d += ` Q ${prev.x},${prev.y} ${midX},${midY}`;
    }
    const last = points[points.length-1];
    d += ` T ${last.x},${last.y}`;
    return d;
  }
  const paths = types.map(t => {
    const pts = years.map((yr,i) => {
      const m = ptsAll[t].find(p=>p.year===yr);
      return m ? { x: x(i), y: y(m.score), raw: m.score, year: yr } : null;
    }).filter(Boolean) as Array<{x:number;y:number;raw:number;year:number}>;
    return { t, d: smoothPath(pts.map(p=>({x:p.x,y:p.y}))), color: palette[t] || '#6C63FF', end: pts[pts.length-1] };
  });

  return (
    <div className="flex items-center justify-between gap-3">
      <svg width={W} height={H} className="rounded-xl bg-gray-50 ring-1 ring-gray-200/60">
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {paths.map((p,i)=> (
          <g key={i}>
            <path d={p.d} fill="none" stroke={p.color} strokeWidth={2} strokeLinecap="round" />
            {p.end && (
              <text x={p.end.x + 4} y={p.end.y - 2} className="fill-gray-600 text-[9px]">{p.end.raw.toFixed(0)}</text>
            )}
          </g>
        ))}
      </svg>
      <div className="grid w-[132px] grid-rows-2 gap-2">
        <div className="rounded-xl bg-indigo-50 px-2 py-1.5 text-indigo-800 ring-1 ring-indigo-200/60">
          <div className="text-[9px] font-semibold uppercase tracking-wide">EU</div>
          <div className="text-base font-extrabold leading-5">{seats.eu ?? '—'}</div>
          <div className="text-[9px] text-indigo-700/70">{seats.year ? `seats in ${seats.year}` : ''}</div>
        </div>
        <div className="rounded-xl bg-amber-50 px-2 py-1.5 text-amber-800 ring-1 ring-amber-200/60">
          <div className="text-[9px] font-semibold uppercase tracking-wide">NonEU</div>
          <div className="text-base font-extrabold leading-5">{seats.nonEu ?? '—'}</div>
          <div className="text-[9px] text-amber-700/70">{seats.year ? `seats in ${seats.year}` : ''}</div>
        </div>
      </div>
    </div>
  );
}
