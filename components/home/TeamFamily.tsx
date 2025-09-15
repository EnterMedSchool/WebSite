"use client";

import React, { useMemo, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

export default function TeamFamily() {
  const [barks, setBarks] = useState<Array<{ id: number; x: number; y: number; e: string }>>([]);
  const [wiggle, setWiggle] = useState(false);

  function woof(e: React.MouseEvent<HTMLDivElement>) {
    setWiggle(true);
    setTimeout(() => setWiggle(false), 700);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const emojis = ["🐶", "🐾", "💖", "🦴", "✨"];
    const created = Array.from({ length: 10 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      e: emojis[i % emojis.length],
    }));
    setBarks(created);
    setTimeout(() => setBarks([]), 900);
  }

  const points = useMemo(
    () => [
      "We reinvest paid-course funds into free content.",
      "Built by two siblings for students worldwide.",
      "Design, code and course materials crafted in-house.",
    ],
    []
  );

  return (
    <section className="fam-root" aria-labelledby="fam-heading">
      <div className="fam-grid">
        {/* Copy */}
        <div className="fam-copy">
          <div className="kicker">Meet the Team</div>
          <ShimmerHeading
            title={"Family–Run, Student–First"}
            pretitle="EnterMedSchool is a family business"
            size="md"
            variant="indigo"
          />
          <p className="lead">
            It’s just the two of us working full‑time to design, code and create
            course material. Every purchase helps us produce more high‑quality
            free content for everyone.
          </p>
          <ul className="points" role="list">
            {points.map((p, i) => (
              <li key={i}><span className={`dot d${(i % 3) + 1}`} />{p}</li>
            ))}
          </ul>
        </div>

        {/* People */}
        <div className="fam-people">
          {/* Ari */}
          <article className="photo-card">
            <img className="pc-img" alt="Ari Horesh" src="https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/channels4_profile-768x768.jpg" />
            <div className="pc-bubbles" aria-hidden>
              <span className="bubble b1" />
              <span className="bubble b2" />
              <span className="bubble b3" />
            </div>
            <div className="pc-overlay">
              <div className="pc-name">Ari Horesh</div>
              <div className="pc-role">Medical Student • Code • Design • Course Author</div>
              <div className="pc-tags">
                <span className="tag">Product</span>
                <span className="tag">Engineering</span>
                <span className="tag">Content</span>
              </div>
            </div>
          </article>

          {/* Daniela */}
          <article className="photo-card">
            <img className="pc-img" alt="Daniela Horesh" src="https://entermedschool.b-cdn.net/wp-content/uploads/2024/04/Daniela--768x955.jpg" />
            <div className="pc-bubbles" aria-hidden>
              <span className="bubble c1" />
              <span className="bubble c2" />
              <span className="bubble c3" />
            </div>
            <div className="pc-overlay">
              <div className="pc-name">Daniela Horesh</div>
              <div className="pc-role">Psychology & CS Student • Math/Physics • Research • Support</div>
              <div className="pc-tags">
                <span className="tag">Math & Physics</span>
                <span className="tag">Articles</span>
                <span className="tag">Student Support</span>
              </div>
            </div>
          </article>

          {/* Easter egg */}
          <article className="person pup" onClick={woof} role="button" aria-label="Say woof">
            <div className={`pup-wrap ${wiggle ? 'wiggle' : ''}`}>
              <img className="pup-img" alt="Layla the dog" src="https://entermedschool.b-cdn.net/wp-content/uploads/2023/06/Screenshot-2023-08-26-134251.png" />
              <span className="pup-tag">Tap me</span>
              <div className="pup-pop">
                {barks.map((b) => (
                  <span key={b.id} className="emo" style={{ left: b.x, top: b.y }}>{b.e}</span>
                ))}
              </div>
            </div>
            <div className="pup-caption">Layla • Chief Happiness Officer</div>
          </article>
        </div>
      </div>

      <style jsx>{`
        .fam-grid { display:grid; grid-template-columns:1fr; gap:22px; align-items:center; }
        @media (min-width: 1024px) { .fam-grid { grid-template-columns:5fr 7fr; } }
        .kicker { color:#312e81; opacity:.7; font-weight:900; text-transform:uppercase; letter-spacing:.06em; font-size:12px; }
        .lead { margin-top:.5rem; color:#0f172a; opacity:.85; max-width:60ch; }
        .points { margin-top:.75rem; display:grid; gap:.5rem; color:#0f172a; }
        .points li { display:flex; align-items:center; gap:.5rem; font-weight:800; }
        .dot { width:10px; height:10px; border-radius:9999px; display:inline-block; }
        .dot.d1{ background:linear-gradient(135deg,#22d3ee,#60a5fa); box-shadow:0 6px 16px rgba(34,211,238,.35); }
        .dot.d2{ background:linear-gradient(135deg,#a78bfa,#f472b6); box-shadow:0 6px 16px rgba(167,139,250,.35); }
        .dot.d3{ background:linear-gradient(135deg,#34d399,#10b981); box-shadow:0 6px 16px rgba(16,185,129,.35); }

        .fam-people { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width: 680px) { .fam-people { grid-template-columns:1fr 1fr; } }
        .person { position:relative; background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:12px; box-shadow:0 16px 40px rgba(2,6,23,.10); }

        .photo-card { position:relative; overflow:hidden; border-radius:18px; border:1px solid #e2e8f0; box-shadow:0 16px 40px rgba(2,6,23,.10); background:#000; aspect-ratio: 4/3; }
        .pc-img { width:100%; height:100%; object-fit:cover; opacity:.96; }
        .pc-overlay { position:absolute; inset:auto 0 0 0; padding:12px; color:white; background: linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0)); }
        .pc-name { font-weight:900; letter-spacing:.01em; }
        .pc-role { font-size:12px; opacity:.95; }
        .pc-tags { margin-top:6px; display:flex; flex-wrap:wrap; gap:6px; }
        .tag { font-size:11px; font-weight:900; border-radius:9999px; padding:4px 8px; background: rgba(255,255,255,.85); color:#0f172a; border:1px solid rgba(255,255,255,.6); }
        .pc-bubbles { position:absolute; inset:0; pointer-events:none; }
        .bubble { position:absolute; width:90px; height:90px; border-radius:9999px; filter: blur(18px); opacity:.35; animation: floatB 8s ease-in-out infinite; }
        .b1 { left:-10px; top:-10px; background: radial-gradient(circle at 30% 30%, rgba(99,102,241,.9), transparent 60%); }
        .b2 { right:-20px; top:10px; background: radial-gradient(circle at 60% 40%, rgba(6,182,212,.9), transparent 60%); animation-delay:1.3s; }
        .b3 { left:40%; bottom:-20px; background: radial-gradient(circle at 40% 60%, rgba(167,139,250,.9), transparent 60%); animation-delay:.6s; }
        .c1 { left:-10px; top:-12px; background: radial-gradient(circle at 30% 30%, rgba(244,114,182,.9), transparent 60%); }
        .c2 { right:-18px; bottom:16px; background: radial-gradient(circle at 60% 40%, rgba(251,113,133,.9), transparent 60%); animation-delay:1.1s; }
        .c3 { left:36%; top:10%; background: radial-gradient(circle at 60% 60%, rgba(99,102,241,.9), transparent 60%); animation-delay:.4s; }
        @keyframes floatB { 0% { transform: translateY(0) } 50% { transform: translateY(-8px) } 100% { transform: translateY(0) } }

        .pup { display:grid; justify-items:center; align-items:center; padding:10px; }
        .pup-wrap { position:relative; width:100%; aspect-ratio: 16/9; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 14px 34px rgba(2,6,23,.12); background: linear-gradient(135deg,#e0e7ff,#cffafe); cursor:pointer; }
        .pup-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; mix-blend:normal; }
        .pup-tag { position:absolute; top:8px; left:8px; background:rgba(255,255,255,.9); border:1px solid #e2e8f0; padding:4px 8px; border-radius:9999px; font-size:12px; font-weight:900; color:#0f172a; box-shadow:0 6px 14px rgba(2,6,23,.08); }
        .pup-pop { position:absolute; inset:0; pointer-events:none; }
        .emo { position:absolute; font-size:18px; animation:pupPop 900ms ease-out forwards; }
        @keyframes pupPop { from { opacity:1; transform: translate(0,0) scale(1)} to { opacity:0; transform: translate(20px,-30px) scale(0.6)} }
        .wiggle { animation:wig .7s ease both; }
        @keyframes wig { 0%{ transform:rotate(0) } 25%{ transform:rotate(2deg)} 50%{ transform:rotate(-2deg)} 75%{ transform:rotate(1.5deg)} 100%{ transform:rotate(0)} }
        .pup-caption { margin-top:6px; font-size:12px; color:#0f172a; font-weight:800; text-align:center; }
      `}</style>
    </section>
  );
}
