"use client";

import React, { useEffect, useMemo, useState } from "react";

type Review = {
  id: string | number;
  name: string;
  avatar?: string | null;
  university?: string | null;
  stars?: number;
  quote: string;
};

const FALLBACK: Review[] = [
  {
    id: 1,
    name: "Giacomo • IMAT 2023",
    university: "Pavia",
    stars: 5,
    quote:
      "The practice questions and explanations were exactly like the exam. I owe my admission to EMS.",
  },
  {
    id: 2,
    name: "Sara • IMAT 2022",
    university: "Turin",
    stars: 5,
    quote:
      "Loved the past papers and quick glossary. Being able to review concepts from the card saved me time.",
  },
  {
    id: 3,
    name: "Leon • IMAT 2024",
    university: "Bologna",
    stars: 4,
    quote:
      "Clear, modern and fast. EMS guided me from choosing a school to exam day.",
  },
  {
    id: 4,
    name: "Maya • IMAT 2021",
    university: "Padova",
    stars: 5,
    quote:
      "The free materials are generous. I bought the course to support and it more than paid off.",
  },
];

export default function ReviewsSection() {
  const [items, setItems] = useState<Review[]>(FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const res = await fetch("/api/testimonials/random", { next: { revalidate: 60 } });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const arr: any[] = data?.items || data?.reviews || [];
        if (!cancelled && Array.isArray(arr) && arr.length) {
          const mapped: Review[] = arr.slice(0, 12).map((r: any, i: number) => ({
            id: r.id ?? i,
            name: r.name || r.author || "Student",
            avatar: r.avatar || r.photo || null,
            university: r.university || r.uni || null,
            stars: r.rating || 5,
            quote: r.quote || r.text || r.body || "Great course and community!",
          }));
          setItems(mapped);
        }
      } catch {}
      finally { if (!cancelled) setLoading(false); }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const rows = useMemo(() => {
    const half = Math.ceil(items.length / 2);
    return [items.slice(0, half), items.slice(half)];
  }, [items]);

  return (
    <section className="rev-root" aria-labelledby="reviews-heading">
      <div className="rev-head">
        <div className="kicker">Student Stories</div>
        <h3 id="reviews-heading" className="title">What Learners Say</h3>
        <p className="sub">Real messages from IMAT students who used EnterMedSchool to plan, practice and get in.</p>
      </div>

      <div className="strip-wrap">
        {rows.map((row, idx) => (
          <div key={idx} className={`strip ${idx === 1 ? 'reverse' : ''}`} aria-hidden={loading && idx>0}>
            {row.map((r) => (
              <figure key={r.id} className="card">
                <div className="stars" aria-label={`${r.stars ?? 5} stars`}>
                  {Array.from({ length: r.stars ?? 5 }).map((_, i) => <span key={i}>★</span>)}
                </div>
                <blockquote>“{r.quote}”</blockquote>
                <figcaption>
                  <div className="avatar" aria-hidden>{(r.avatar ? '' : (r.name || 'S')[0])}</div>
                  <div className="meta">
                    <div className="name">{r.name}</div>
                    {r.university && <div className="uni">{r.university}</div>}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>

      <style jsx>{`
        .rev-head { text-align:center; margin-bottom: 14px; }
        .kicker { color:#0f172a; opacity:.6; text-transform:uppercase; letter-spacing:.06em; font-weight:900; font-size:12px; }
        .title { margin:6px 0; font-size: clamp(20px, 4.5vw, 36px); font-weight: 900; color:#0f172a; }
        .sub { color:#334155; max-width: 70ch; margin: 0 auto; }

        .strip-wrap { display:grid; gap:10px; overflow:hidden; }
        .strip { display:flex; gap:12px; animation: marquee 26s linear infinite; }
        .strip.reverse { animation-direction: reverse; animation-duration: 30s; }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }

        .card { min-width: 320px; max-width: 360px; flex: 0 0 auto; background:white; border:1px solid #e2e8f0; border-radius:16px; padding:12px; box-shadow:0 16px 40px rgba(2,6,23,.10); }
        .stars { color:#f59e0b; font-size: 14px; letter-spacing:1px; }
        blockquote { margin:8px 0 10px; color:#0f172a; font-weight:600; }
        figcaption { display:flex; align-items:center; gap:10px; }
        .avatar { width:28px; height:28px; border-radius:9999px; background:linear-gradient(135deg,#60a5fa,#22d3ee); color:white; display:grid; place-items:center; font-size:12px; font-weight:900; }
        .meta .name { font-weight:900; color:#0f172a; }
        .meta .uni { font-size:12px; color:#64748b; font-weight:800; }
      `}</style>
    </section>
  );
}

