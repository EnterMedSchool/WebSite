"use client";

import React, { useMemo, useRef, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type HoverInfo = { title: string; body: string; x: number; y: number; from: 'anki' | 'web' } | null;

export default function AnkiIntegration() {
  const [hover, setHover] = useState<HoverInfo>(null);
  const ankiRef = useRef<HTMLDivElement | null>(null);
  const webRef = useRef<HTMLDivElement | null>(null);
  const demosRef = useRef<HTMLDivElement | null>(null);

  const glossary: Record<string, { title: string; body: string }> = useMemo(
    () => ({
      DIC: {
        title: "Disseminated Intravascular Coagulation",
        body: "Widespread microthrombi with consumption of platelets and factors → bleeding. ↑D‑dimer, ↓fibrinogen, prolonged PT/PTT.",
      },
      ACTH: {
        title: "Adrenocorticotropic Hormone",
        body: "Pituitary peptide (POMC) stimulating adrenal cortisol production; diurnal variation with early‑morning peak.",
      },
      CRH: {
        title: "Corticotropin‑Releasing Hormone",
        body: "Hypothalamic hormone that drives ACTH secretion; stress‑responsive; negative feedback by cortisol.",
      },
    }),
    []
  );

  function showPopover(e: React.MouseEvent<HTMLSpanElement>, key: keyof typeof glossary, scope: "anki" | "web") {
    const box = scope === "anki" ? ankiRef.current : webRef.current;
    const hostRoot = demosRef.current; // render outside cards to avoid clipping
    if (!box || !hostRoot) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const host = hostRoot.getBoundingClientRect();
    setHover({
      title: glossary[key].title,
      body: glossary[key].body,
      x: rect.left - host.left + rect.width / 2,
      y: rect.top - host.top + rect.height + 10,
      from: scope,
    });
  }

  return (
    <section className="anki-root" aria-labelledby="anki-heading">
      <div className="anki-grid">
        {/* Copy */}
        <div className="anki-copy">
          <div className="kicker">What’s New</div>
          <ShimmerHeading title={<>
            Anki Integration
          </>} pretitle="Glossary Highlights" variant="electric" size="md" />
          <p className="lead">Our glossary pops right into your Anki reviews. Terms get highlighted automatically; hover to see concise definitions, why it matters, and quick tips. Chrome extension brings the same magic to any page you read.</p>
          <ul className="points" role="list">
            <li><span className="dot d1" />Automatic term highlighting in Anki</li>
            <li><span className="dot d2" />Hover popups with definitions + context</li>
            <li><span className="dot d3" />Chrome extension for the open web</li>
          </ul>
        </div>

        {/* Demos */}
        <div ref={demosRef} className="anki-demos">
          {/* Anki card demo */}
          <div ref={ankiRef} className="card anki-demo" onMouseLeave={() => setHover(null)}>
            <div className="card-head">
              <span className="pill">Review</span>
              <span className="dots" aria-hidden>
                <i /> <i /> <i />
              </span>
              <img className="anki-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Anki-icon.svg/2048px-Anki-icon.svg.png" alt="Anki" width="18" height="18" />
            </div>
            <div className="card-body">
              <div className="img">
                <div className="mini-review one">
                  <div className="bar title" />
                  <div className="bar" />
                  <div className="bar short" />
                </div>
                <div className="mini-review two">
                  <div className="bar title" />
                  <div className="bar" />
                </div>
                <div className="mini-review three">
                  <div className="bar title" />
                  <div className="bar" />
                  <div className="bar short" />
                </div>
              </div>
              <div className="text">
                The hypothalamus releases <span className="hl" onMouseEnter={(e) => showPopover(e, "CRH", "anki")}>CRH</span> which stimulates the pituitary to release <span className="hl" onMouseEnter={(e) => showPopover(e, "ACTH", "anki")}>ACTH</span>. Cortisol exerts negative feedback. Severe sepsis can trigger <span className="hl" onMouseEnter={(e) => showPopover(e, "DIC", "anki")}>DIC</span>.
              </div>
            </div>
          </div>

          {/* Browser demo */}
          <div ref={webRef} className="card web-demo" onMouseLeave={() => setHover(null)}>
            <div className="browser-bar"><span /><span /><span /></div>
            <div className="web-body">
              While browsing an article, the extension highlights terms like <span className="hl" onMouseEnter={(e) => showPopover(e, "DIC", "web")}>DIC</span> and <span className="hl" onMouseEnter={(e) => showPopover(e, "ACTH", "web")}>ACTH</span>. Hover to preview; click to jump into deep‑dive pages on EnterMedSchool.
            </div>
          </div>
          {hover && (
            <div className="popover" style={{ left: hover.x, top: hover.y }}>
              <div className="pop-title">{hover.title}</div>
              <div className="pop-body">{hover.body}</div>
              <div className="pop-cta">{hover.from === 'web' ? 'Chrome' : '+ Learn'} • Quick open</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .anki-root { }
        .anki-grid { display:grid; grid-template-columns: 1fr; gap: 22px; align-items:center; }
        @media (min-width: 1024px) { .anki-grid { grid-template-columns: 5fr 7fr; } }
        .kicker { color:#312e81; opacity:.7; font-weight:900; text-transform:uppercase; letter-spacing:.06em; font-size:12px; }
        .lead { margin-top:.5rem; color:#0f172a; opacity:.85; max-width: 60ch; }
        .points { margin-top:.75rem; display:grid; gap:.5rem; color:#0f172a; }
        .points li { display:flex; align-items:center; gap:.5rem; font-weight:800; }
        .dot { width:10px; height:10px; border-radius:9999px; display:inline-block; }
        .dot.d1 { background:linear-gradient(135deg,#22d3ee,#60a5fa); box-shadow:0 6px 16px rgba(34,211,238,.35) }
        .dot.d2 { background:linear-gradient(135deg,#a78bfa,#6366f1); box-shadow:0 6px 16px rgba(167,139,250,.35) }
        .dot.d3 { background:linear-gradient(135deg,#34d399,#10b981); box-shadow:0 6px 16px rgba(16,185,129,.35) }

        .anki-demos { position:relative; display:grid; gap:16px; }
        .card { position:relative; background:#fff; border:1px solid #e2e8f0; border-radius:22px; box-shadow:0 16px 40px rgba(2,6,23,.12); overflow:visible; }
        .anki-demo .card-head { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:linear-gradient(90deg,#6366f1,#06b6d4); color:white; }
        .anki-logo { width:18px; height:18px; filter: drop-shadow(0 2px 8px rgba(0,0,0,.15)); }
        .pill { font-size:11px; font-weight:900; border-radius:9999px; padding:4px 8px; background:white; color:#312e81; }
        .dots i { display:inline-block; width:6px; height:6px; border-radius:9999px; background:white; opacity:.75; margin-left:6px; }
        .card-body { display:grid; gap:10px; padding:12px; }
        .img { position:relative; height:140px; border-radius:14px; background: linear-gradient(135deg,#e0e7ff,#cffafe); box-shadow: inset 0 0 0 1px rgba(99,102,241,.2); overflow:hidden; }
        .mini-review { position:absolute; left:12px; right:12px; background:white; border:1px solid #e2e8f0; border-radius:12px; padding:8px; box-shadow:0 8px 22px rgba(2,6,23,.10); animation: floatUp 6s ease-in-out infinite; }
        .mini-review.one { top:10px; animation-delay:0s; }
        .mini-review.two { top:54px; left:24px; right:24px; animation-delay:.8s; }
        .mini-review.three { top:96px; width:60%; left:auto; right:14px; animation-delay:1.4s; }
        .bar { height:8px; border-radius:9999px; background: linear-gradient(90deg,#a78bfa,#22d3ee); opacity:.9; margin-top:6px; }
        .bar.title { width:40%; height:10px; background: linear-gradient(90deg,#6366f1,#06b6d4); }
        .bar.short { width:60%; }
        @keyframes floatUp { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        .text { line-height:1.6; color:#0f172a; }
        .hl { position:relative; display:inline-block; padding:0 4px; border-radius:6px; background: linear-gradient(90deg, rgba(167,139,250,.25), rgba(34,211,238,.25)); cursor:default; box-shadow: inset 0 -2px 0 rgba(99,102,241,.35); }

        .web-demo { background:#fff; }
        .browser-bar { height:28px; background:linear-gradient(90deg,#e5e7eb,#f1f5f9); display:flex; align-items:center; gap:6px; padding:0 10px; }
        .browser-bar span { width:10px; height:10px; border-radius:9999px; background:#cbd5e1; display:inline-block; }
        .web-body { padding:12px; color:#0f172a; }

        .popover { position:absolute; transform:translate(-50%, 0); width:min(360px, 80vw); background:white; border:1px solid #e2e8f0; border-radius:14px; padding:10px; box-shadow:0 18px 44px rgba(2,6,23,.16); z-index:30; }
        .pop-title { font-weight:900; color:#111827; }
        .pop-body { margin-top:4px; color:#334155; font-size:13px; }
        .pop-cta { margin-top:8px; font-size:12px; font-weight:900; color:#0369a1; background:#e0f2fe; border:1px solid #bae6fd; padding:4px 8px; border-radius:9999px; display:inline-block; }
      `}</style>
    </section>
  );
}
