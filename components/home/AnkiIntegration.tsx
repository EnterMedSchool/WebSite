"use client";

import React, { useMemo, useRef, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type HoverInfo = {
  title: string;
  body: string;
  x: number;
  y: number;
  from: "anki" | "web";
} | null;

type Confetti = { id: number; x: number; y: number; dx: number; dy: number; color: string };

export default function AnkiIntegration() {
  const [hover, setHover] = useState<HoverInfo>(null);
  const ankiRef = useRef<HTMLDivElement | null>(null);
  const webRef = useRef<HTMLDivElement | null>(null);
  const demosRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);
  const [answered, setAnswered] = useState<keyof typeof glossary | null>(null);
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  const glossary: Record<string, { title: string; body: string }> = useMemo(
    () => ({
      DIC: {
        title: "Disseminated Intravascular Coagulation",
        body:
          "Widespread microthrombi with consumption of platelets and factors leading to bleeding. High D-dimer, low fibrinogen, prolonged PT/PTT.",
      },
      ACTH: {
        title: "Adrenocorticotropic Hormone",
        body:
          "Pituitary peptide (POMC) that stimulates adrenal cortisol production; diurnal variation with early-morning peak.",
      },
      CRH: {
        title: "Corticotropin-Releasing Hormone",
        body:
          "Hypothalamic hormone that drives ACTH secretion; stress-responsive; negative feedback by cortisol.",
      },
    }),
    []
  );

  function showPopover(
    e: React.MouseEvent<HTMLSpanElement>,
    key: keyof typeof glossary,
    scope: "anki" | "web"
  ) {
    const hostRoot = demosRef.current;
    if (!hostRoot) return;
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

  function handleCatch(e: React.MouseEvent, term: keyof typeof glossary) {
    if (answered) return;
    const host = imgRef.current?.getBoundingClientRect();
    if (!host) return;
    const x = e.clientX - host.left;
    const y = e.clientY - host.top;
    const palette = ["#22d3ee", "#60a5fa", "#a78bfa", "#34d399", "#fb7185", "#f59e0b"];
    const dots: Confetti[] = Array.from({ length: 18 }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      dx: (Math.random() - 0.5) * 160,
      dy: (Math.random() - 0.5) * 120 - 20,
      color: palette[i % palette.length],
    }));
    setConfetti(dots);
    setTimeout(() => setConfetti([]), 900);
    setAnswered(term);
  }

  return (
    <section className="anki-root" aria-labelledby="anki-heading">
      <div className="anki-grid">
        {/* Copy */}
        <div className="anki-copy">
          <div className="kicker">What’s New</div>
          <ShimmerHeading
            pretitle="Glossary Highlights"
            title={"Anki Integration"}
            variant="electric"
            size="md"
          />
          <p className="lead">
            Our glossary pops into your Anki reviews. Terms highlight
            automatically; hover to see concise details. The Chrome extension
            brings the same magic anywhere you study.
          </p>
          <ul className="points" role="list">
            <li>
              <span className="dot d1" />Automatic term highlighting in Anki
            </li>
            <li>
              <span className="dot d2" />Hover popups with definitions + context
            </li>
            <li>
              <span className="dot d3" />Chrome extension for the open web
            </li>
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
              <img
                className="anki-logo"
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Anki-icon.svg/2048px-Anki-icon.svg.png"
                alt="Anki"
                width={18}
                height={18}
              />
            </div>
            <div className="card-body">
              <div ref={imgRef} className={`img ${answered ? "solved" : ""}`}>
                <div className="catch-hint">Active Recall? Try to catch one!</div>
                {!answered && (
                  <>
                    <button className="fly-card a" onClick={(e) => handleCatch(e, "ACTH")}>
                      <span className="bar title" />
                      <span className="bar" />
                      <span className="bar short" />
                    </button>
                    <button className="fly-card b" onClick={(e) => handleCatch(e, "CRH")}>
                      <span className="bar title" />
                      <span className="bar" />
                    </button>
                    <button className="fly-card c" onClick={(e) => handleCatch(e, "DIC")}>
                      <span className="bar title" />
                      <span className="bar" />
                      <span className="bar short" />
                    </button>
                  </>
                )}
                {answered && (
                  <div className="answer-card">
                    <div className="ans-title">{glossary[answered].title}</div>
                    <div className="ans-body">{glossary[answered].body}</div>
                  </div>
                )}
                <div className="confetti">
                  {confetti.map((d) => (
                    <span
                      key={d.id}
                      className="conf-dot"
                      style={{
                        left: d.x,
                        top: d.y,
                        background: d.color,
                        ["--dx" as any]: `${d.dx}px`,
                        ["--dy" as any]: `${d.dy}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="text">
                The hypothalamus releases
                {" "}
                <span className="hl" onMouseEnter={(e) => showPopover(e, "CRH", "anki")}>
                  CRH
                </span>
                {" "}
                which stimulates the pituitary to release
                {" "}
                <span className="hl" onMouseEnter={(e) => showPopover(e, "ACTH", "anki")}>
                  ACTH
                </span>
                . Cortisol exerts negative feedback. Severe sepsis can trigger
                {" "}
                <span className="hl" onMouseEnter={(e) => showPopover(e, "DIC", "anki")}>
                  DIC
                </span>
                .
              </div>
            </div>
          </div>

          {/* Browser demo */}
          <div ref={webRef} className="card web-demo" onMouseLeave={() => setHover(null)}>
            <div className="browser-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="web-body">
              While browsing an article, the extension highlights terms like
              {" "}
              <span className="hl" onMouseEnter={(e) => showPopover(e, "DIC", "web")}>
                DIC
              </span>
              {" "}
              and
              {" "}
              <span className="hl" onMouseEnter={(e) => showPopover(e, "ACTH", "web")}>
                ACTH
              </span>
              . Hover to preview; click to jump into deep-dive pages on
              EnterMedSchool.
            </div>
          </div>

          {hover && (
            <div className="popover" style={{ left: hover.x, top: hover.y }}>
              <div className="pop-title">{hover.title}</div>
              <div className="pop-body">{hover.body}</div>
              <div className="pop-cta">{hover.from === "web" ? "Chrome" : "+ Learn"} • Quick open</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .anki-grid { display: grid; grid-template-columns: 1fr; gap: 22px; align-items: center; }
        @media (min-width: 1024px) { .anki-grid { grid-template-columns: 5fr 7fr; } }
        .kicker { color: #312e81; opacity: .7; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; font-size: 12px; }
        .lead { margin-top: .5rem; color: #0f172a; opacity: .85; max-width: 60ch; }
        .points { margin-top: .75rem; display: grid; gap: .5rem; color: #0f172a; }
        .points li { display: flex; align-items: center; gap: .5rem; font-weight: 800; }
        .dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
        .dot.d1 { background: linear-gradient(135deg,#22d3ee,#60a5fa); box-shadow: 0 6px 16px rgba(34,211,238,.35); }
        .dot.d2 { background: linear-gradient(135deg,#a78bfa,#6366f1); box-shadow: 0 6px 16px rgba(167,139,250,.35); }
        .dot.d3 { background: linear-gradient(135deg,#34d399,#10b981); box-shadow: 0 6px 16px rgba(16,185,129,.35); }

        .anki-demos { position: relative; display: grid; gap: 16px; }
        .card { position: relative; background: #fff; border: 1px solid #e2e8f0; border-radius: 22px; box-shadow: 0 16px 40px rgba(2,6,23,.12); overflow: visible; }
        .anki-demo .card-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: linear-gradient(90deg,#6366f1,#06b6d4); color: white; }
        .pill { font-size: 11px; font-weight: 900; border-radius: 9999px; padding: 4px 8px; background: white; color: #312e81; }
        .dots i { display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: white; opacity: .75; margin-left: 6px; }
        .anki-logo { width: 18px; height: 18px; filter: drop-shadow(0 2px 8px rgba(0,0,0,.15)); }
        .card-body { display: grid; gap: 10px; padding: 12px; }

        .img { position: relative; height: 140px; border-radius: 14px; background: linear-gradient(135deg,#e0e7ff,#cffafe); box-shadow: inset 0 0 0 1px rgba(99,102,241,.2); overflow: hidden; }
        .bar { height: 8px; border-radius: 9999px; background: linear-gradient(90deg,#a78bfa,#22d3ee); opacity: .9; margin-top: 6px; display: block; }
        .bar.title { width: 40%; height: 10px; background: linear-gradient(90deg,#6366f1,#06b6d4); }
        .bar.short { width: 60%; }
        .fly-card { position: absolute; left: -40%; top: 16px; right: auto; width: 82%; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; box-shadow: 0 10px 24px rgba(2,6,23,.12); animation: flyAcross 4.2s linear infinite; cursor: pointer; }
        .fly-card.b { top: 60px; width: 70%; animation-duration: 3.6s; animation-delay: .6s; }
        .fly-card.c { top: 98px; width: 64%; animation-duration: 3.9s; animation-delay: 1.2s; }
        .fly-card:hover { transform: translateY(-2px); }
        @keyframes flyAcross { from { transform: translateX(0) } to { transform: translateX(180%) } }
        .answer-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%) scale(.9); background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px 12px; box-shadow: 0 18px 44px rgba(2,6,23,.16); width: 90%; animation: popIn .28s cubic-bezier(.22,1,.36,1) forwards; }
        .answer-card .ans-title { font-weight: 900; color: #111827; margin-bottom: 4px; }
        .answer-card .ans-body { font-size: 13px; color: #334155; }
        @keyframes popIn { to { transform: translate(-50%,-50%) scale(1); } }
        .confetti { position: absolute; inset: 0; pointer-events: none; }
        .conf-dot { position: absolute; width: 8px; height: 8px; border-radius: 9999px; animation: conf 900ms ease-out forwards; }
        @keyframes conf { from { opacity: 1; transform: translate(0,0) scale(1) } to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.6) } }
        .catch-hint { position:absolute; top:6px; left:10px; z-index:2; font-size:12px; font-weight:900; color:#0f172a; background: rgba(255,255,255,.85); border:1px solid #e2e8f0; border-radius:9999px; padding:4px 10px; box-shadow:0 6px 14px rgba(2,6,23,.08); }

        .text { line-height: 1.6; color: #0f172a; }
        .hl { position: relative; display: inline-block; padding: 0 4px; border-radius: 6px; background: linear-gradient(90deg, rgba(167,139,250,.25), rgba(34,211,238,.25)); cursor: default; box-shadow: inset 0 -2px 0 rgba(99,102,241,.35); }

        .web-demo { background: #fff; }
        .browser-bar { height: 28px; background: linear-gradient(90deg,#e5e7eb,#f1f5f9); display: flex; align-items: center; gap: 6px; padding: 0 10px; }
        .browser-bar span { width: 10px; height: 10px; border-radius: 9999px; background: #cbd5e1; display: inline-block; }
        .web-body { padding: 12px; color: #0f172a; }

        .popover { position: absolute; transform: translate(-50%, 0); width: min(360px, 80vw); background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 10px; box-shadow: 0 18px 44px rgba(2,6,23,.16); z-index: 30; }
        .pop-title { font-weight: 900; color: #111827; }
        .pop-body { margin-top: 4px; color: #334155; font-size: 13px; }
        .pop-cta { margin-top: 8px; font-size: 12px; font-weight: 900; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; padding: 4px 8px; border-radius: 9999px; display: inline-block; }
      `}</style>
    </section>
  );
}
