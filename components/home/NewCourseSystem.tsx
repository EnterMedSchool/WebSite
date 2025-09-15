"use client";

import React, { useMemo, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

export default function NewCourseSystem() {
  const [mode, setMode] = useState<"learn" | "flash" | "practice">("learn");
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  // progress bar animation value (purely cosmetic)
  const pct = useMemo(() => (mode === "learn" ? 62 : mode === "practice" ? 38 : 50), [mode]);

  return (
    <section className="wncs-root" aria-labelledby="wncs-heading">
      <div className="wncs-grid">
        {/* Left copy */}
        <div className="wncs-copy">
          <div className="wncs-kicker">What’s New</div>
          <ShimmerHeading
            title={<>
              Entirely New
              <br />
              Course System
            </>}
            size="lg"
            variant="indigo"
          />
          <p className="wncs-sub">
            A redesigned learning flow that brings lessons, practice questions and
            flashcards into a single, smooth experience. Faster, clearer and more fun.
          </p>
          <ul className="wncs-points" role="list">
            <li><span className="dot dot-1" />Integrated practice on lesson pages</li>
            <li><span className="dot dot-2" />One-tap flashcards with spaced review</li>
            <li><span className="dot dot-3" />Cleaner navigation and progress tracking</li>
          </ul>
        </div>

        {/* Right demos */}
        <div className="wncs-demos">
          {/* Main lesson demo */}
          <div className="demo-card lesson" role="region" aria-label="Lesson demo">
            <div className="lesson-header">
              <div className="tabs" role="tablist" aria-label="Lesson modes">
                {(["learn", "flash", "practice"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    className={`tab ${mode === m ? "active" : ""}`}
                    onClick={() => { setMode(m); setAnswer(null); setFlipped(false); }}
                  >
                    {m === "learn" ? "Learn" : m === "flash" ? "Flashcards" : "Practice"}
                  </button>
                ))}
              </div>
              <div className="progress" aria-hidden>
                <div className="bar" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className={`lesson-body show-${mode}`}>
              {/* Learn view */}
              <div className="view learn">
                <div className="video">
                  <div className="play" />
                </div>
                <div className="chips">
                  <span className="chip">DIC Pathophysiology</span>
                  <span className="chip">Clinical Signs</span>
                  <span className="chip">Management</span>
                </div>
              </div>

              {/* Flashcards view */}
              <div className="view flash">
                <div className={`card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((s) => !s)}>
                  <div className="face front">What is the hallmark of DIC?</div>
                  <div className="face back">Widespread microthrombi with concurrent bleeding due to consumption of clotting factors.</div>
                </div>
                <p className="hint">Click the card to flip</p>
              </div>

              {/* Practice view */}
              <div className="view practice">
                <div className="q">Best next step in a suspected case?</div>
                <div className="choices">
                  {[
                    { id: "a", label: "Start warfarin" },
                    { id: "b", label: "Order PT, PTT, fibrinogen, D-dimer" },
                    { id: "c", label: "Platelet transfusion only" },
                    { id: "d", label: "Immediate surgery" },
                  ].map((c) => {
                    const state = answer
                      ? c.id === "b"
                        ? "correct"
                        : c.id === answer
                        ? "wrong"
                        : "idle"
                      : "idle";
                    return (
                      <button
                        key={c.id}
                        onClick={() => setAnswer(c.id)}
                        className={`choice ${state}`}
                      >
                        <span className="dot" />{c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Floating mini demos (decorative, responsive) */}
          <div className="float card flash-mini">
            <div className="mini-title">Flashcards</div>
            <div className="mini-body">
              <div className="mini-card" />
              <div className="mini-card second" />
            </div>
          </div>
          <div className="float card practice-mini">
            <div className="mini-title">Practice</div>
            <div className="mini-bars">
              <span style={{ width: "85%" }} />
              <span style={{ width: "55%" }} />
              <span style={{ width: "70%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* component-scoped styles */}
      <style jsx>{`
        .wncs-root { margin-top: 1.25rem; }
        .wncs-grid { display: grid; grid-template-columns: 1fr; gap: 22px; }
        @media (min-width: 1024px) {
          .wncs-grid { grid-template-columns: 5fr 7fr; align-items: center; gap: 28px; }
        }

        .wncs-copy { padding: 4px 8px; }
        .wncs-kicker { color: #312e81; opacity: .7; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; font-size: 12px; }
        .wncs-sub { margin-top: .75rem; color: #334155; max-width: 46ch; }
        .wncs-points { margin-top: .75rem; color: #111827; display: grid; gap: .5rem; }
        .wncs-points li { display: flex; align-items: center; gap: .5rem; font-weight: 600; }
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 9999px; }
        .dot-1 { background: linear-gradient(135deg, #06b6d4, #3b82f6); box-shadow: 0 6px 16px rgba(59,130,246,.35); }
        .dot-2 { background: linear-gradient(135deg, #a78bfa, #f472b6); box-shadow: 0 6px 16px rgba(167,139,250,.35); }
        .dot-3 { background: linear-gradient(135deg, #10b981, #84cc16); box-shadow: 0 6px 16px rgba(16,185,129,.35); }

        .wncs-demos { position: relative; min-height: 460px; }
        @media (max-width: 1023px) { .wncs-demos { min-height: 560px; } }

        .card { border-radius: 18px; background: white; box-shadow: 0 14px 38px rgba(2,6,23,.12); border: 1px solid rgba(99,102,241,.12); }

        .demo-card.lesson { position: relative; overflow: hidden; }

        .lesson-header { padding: 14px 14px 10px; background: linear-gradient(90deg,#6366f1 0%,#a78bfa 48%,#06b6d4 100%); color: white; }
        .tabs { display: inline-flex; gap: 8px; padding: 4px; background: rgba(255,255,255,.16); border-radius: 9999px; }
        .tab { appearance: none; border: 0; cursor: pointer; font-weight: 700; color: white; padding: 6px 12px; border-radius: 9999px; opacity: .85; transition: all .18s ease; }
        .tab:hover { opacity: 1; transform: translateY(-1px); }
        .tab.active { background: white; color: #312e81; box-shadow: 0 8px 18px rgba(255,255,255,.35); }
        .progress { height: 6px; border-radius: 9999px; background: rgba(255,255,255,.28); margin-top: 10px; overflow: hidden; }
        .bar { height: 100%; background: linear-gradient(90deg,#22d3ee,#60a5fa); border-radius: 9999px; transition: width .6s cubic-bezier(.22,1,.36,1); }

        .lesson-body { position: relative; background: #fff; padding: 16px; }
        .lesson-body .view { display: none; }
        .lesson-body.show-learn .view.learn,
        .lesson-body.show-flash .view.flash,
        .lesson-body.show-practice .view.practice { display: block; }

        /* Learn view */
        .video { position: relative; border-radius: 16px; overflow: hidden; background:
          linear-gradient(180deg, rgba(49,46,129,.12), rgba(167,139,250,.10)); height: 220px; display: grid; place-items: center; }
        .video::after { content: ""; position: absolute; inset: 0; background: radial-gradient(180px 40px at 20% 25%, rgba(255,255,255,.55), transparent); opacity: .4; }
        .play { width: 58px; height: 58px; border-radius: 9999px; background: linear-gradient(135deg,#22d3ee,#6366f1); box-shadow: 0 10px 28px rgba(99,102,241,.35); position: relative; }
        .play::before { content: ""; position: absolute; left: 22px; top: 18px; border-left: 16px solid white; border-top: 10px solid transparent; border-bottom: 10px solid transparent; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .chip { font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 9999px; color: #312e81; background: linear-gradient(90deg,rgba(99,102,241,.12),rgba(6,182,212,.12)); border: 1px solid rgba(99,102,241,.20); }

        /* Flashcards view */
        .flash { display: grid; gap: 10px; place-items: center; padding: 10px 0 6px; }
        .hint { font-size: 12px; color: #475569; }
        .card { cursor: pointer; }
        .flash .card { width: 100%; max-width: 520px; height: 180px; perspective: 900px; border: none; box-shadow: none; background: transparent; }
        .flash .card .face { position: absolute; inset: 0; display: grid; place-items: center; padding: 18px; background: white; border-radius: 16px; backface-visibility: hidden; box-shadow: 0 12px 32px rgba(2,6,23,.14); border: 1px solid rgba(99,102,241,.12); }
        .flash .card .front { background: linear-gradient(180deg, rgba(96,165,250,.10), rgba(99,102,241,.06)); font-weight: 800; color: #1f2937; }
        .flash .card .back { transform: rotateY(180deg); color: #0f172a; }
        .flash .card.flipped .front { transform: rotateY(180deg); }
        .flash .card.flipped .back { transform: rotateY(360deg); }

        /* Practice view */
        .q { font-weight: 800; color: #0f172a; margin-bottom: 10px; }
        .choices { display: grid; gap: 8px; }
        .choice { display: flex; align-items: center; gap: 10px; border: 1px solid #e5e7eb; background: #fff; padding: 10px 12px; border-radius: 12px; font-weight: 700; color: #0f172a; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
        .choice .dot { width: 10px; height: 10px; border-radius: 9999px; background: #cbd5e1; }
        .choice:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(2,6,23,.06); }
        .choice.correct { border-color: #10b981; background: linear-gradient(180deg, rgba(16,185,129,.10), rgba(16,185,129,.04)); }
        .choice.correct .dot { background: #10b981; }
        .choice.wrong { border-color: #ef4444; background: linear-gradient(180deg, rgba(239,68,68,.10), rgba(239,68,68,.04)); }
        .choice.wrong .dot { background: #ef4444; }

        /* Floating mini demos */
        .float { position: absolute; inset: auto; }
        .flash-mini { right: -8px; top: -24px; width: 200px; padding: 12px; transform: rotate(6deg); background: linear-gradient(180deg,rgba(255,255,255,1),rgba(167,139,250,.12)); }
        .practice-mini { left: -10px; bottom: -18px; width: 220px; padding: 12px; transform: rotate(-5deg); background: linear-gradient(180deg,rgba(255,255,255,1),rgba(34,211,238,.12)); }
        @media (max-width: 1023px) {
          .flash-mini { right: 8px; top: 8px; transform: none; }
          .practice-mini { left: 8px; bottom: 8px; transform: none; }
        }
        .mini-title { font-size: 12px; font-weight: 800; color: #312e81; margin-bottom: 6px; }
        .mini-body { display: flex; gap: 8px; }
        .mini-card { flex: 1; height: 64px; border-radius: 12px; background: linear-gradient(135deg,#a78bfa,#f472b6); opacity: .9; box-shadow: 0 10px 22px rgba(167,139,250,.35); }
        .mini-card.second { background: linear-gradient(135deg,#60a5fa,#22d3ee); box-shadow: 0 10px 22px rgba(96,165,250,.35); }
        .mini-bars { display: grid; gap: 6px; }
        .mini-bars span { display: block; height: 8px; border-radius: 9999px; background: linear-gradient(90deg,#22d3ee,#60a5fa); box-shadow: 0 6px 14px rgba(34,211,238,.35); }
      `}</style>
    </section>
  );
}
