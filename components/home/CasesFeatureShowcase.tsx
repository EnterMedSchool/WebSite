"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

const stages = [
  {
    id: "presentation",
    label: "Presentation",
    title: "Initial presentation",
    blurb: "35-year-old with progressive weight gain, purple striae, and hypertension.",
    vibe: "history",
  },
  {
    id: "labs",
    label: "Targeted labs",
    title: "Focused hormonal testing",
    blurb: "Establish ACTH-dependent hypercortisolism before you localise.",
    vibe: "labs",
  },
  {
    id: "decision",
    label: "Critical decision",
    title: "Differentiate the source",
    blurb: "Pick the next best move after confirming biochemical excess.",
    vibe: "decision",
  },
  {
    id: "management",
    label: "Management",
    title: "Definitive management",
    blurb: "Lock in the plan once you identify the culprit.",
    vibe: "management",
  },
];

const options: Record<string, Array<{ id: string; copy: string; outcome: "correct" | "warning" | "info"; detail: string }>> = {
  presentation: [
    {
      id: "history",
      copy: "Start with guided history cues",
      outcome: "info",
      detail: "Swipe through chief complaint, risk factors, and timeline to set the stage.",
    },
    {
      id: "skip",
      copy: "Jump to imaging",
      outcome: "warning",
      detail: "You miss low-effort wins when you skip baselines. Mobile prompts prevent that.",
    },
  ],
  labs: [
    {
      id: "dex",
      copy: "Low-dose dex suppression",
      outcome: "correct",
      detail: "See cortisol, ACTH, and metabolic markers animate in with explanations.",
    },
    {
      id: "random",
      copy: "Random cortisol recheck",
      outcome: "warning",
      detail: "Redundant testing slows you down. The case engine nudges better stewardship.",
    },
  ],
  decision: [
    {
      id: "highdex",
      copy: "High-dose dexamethasone",
      outcome: "correct",
      detail: "Watch the algorithm update as suppression confirms a pituitary source.",
    },
    {
      id: "ips",
      copy: "Inferior petrosal sampling",
      outcome: "warning",
      detail: "Too invasive, too soon. The stage timeline glows red to flag the detour.",
    },
  ],
  management: [
    {
      id: "surgery",
      copy: "Refer for transsphenoidal resection",
      outcome: "correct",
      detail: "Earn bonus XP and see recovery checkpoints unlock in the summary.",
    },
    {
      id: "ketoconazole",
      copy: "Start ketoconazole bridge",
      outcome: "info",
      detail: "Valid backup when surgery is delayed. The engine lets you branch and replay.",
    },
  ],
};

export default function CasesFeatureShowcase() {
  const [activeStage, setActiveStage] = useState(stages[0].id);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const stageMeta = useMemo(() => stages.find((stage) => stage.id === activeStage) ?? stages[0], [activeStage]);
  const stageOptions = options[activeStage] ?? [];

  const scorePulse = useMemo(() => {
    if (!selectedOption) return null;
    const outcome = stageOptions.find((opt) => opt.id === selectedOption)?.outcome;
    if (outcome === "correct") return "+6";
    if (outcome === "info") return "+2";
    return "-3";
  }, [selectedOption, stageOptions]);

  return (
    <section className="wncases-root" aria-labelledby="wncases-heading">
      <div className="wncases-grid">
        <div className="wncases-copy">
          <h3 id="wncases-heading" className="sr-only">Explore the new clinical cases experience</h3>
          <span className="wncases-kicker">Cases are live</span>
          <ShimmerHeading
            title={
              <>
                Clinical reasoning
                <br />
                goes interactive
              </>
            }
            size="lg"
            variant="violet"
          />
          <p className="wncases-sub">
            Our new <strong>/cases</strong> hub lets you think like a doctor. Navigate branching decisions,
            reveal labs in real time, and compare your pathway with expert reasoning.
          </p>
          <ul className="wncases-points" role="list">
            <li><span className="spark spark-1" />Stage-by-stage sagas tuned to clerkship priorities</li>
            <li><span className="spark spark-2" />Dynamic feedback when you take a detour or nail the move</li>
            <li><span className="spark spark-3" />Replay phases to chase perfect scores and mastery XP</li>
          </ul>
          <Link href="/cases" className="wncases-cta" aria-label="Explore the new cases experience">
            Explore cases
            <svg viewBox="0 0 24 24" aria-hidden className="cta-icon">
              <path d="M5 12h14m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="wncases-demo" role="region" aria-live="polite" aria-label="Clinical case preview">
          <header className="demo-header">
            <div className="demo-title">
              Hypercortisolism pathway
              <span className="badge">Beta</span>
            </div>
            <div className="score" aria-live="off">
              Score
              <span className={`score-value ${scorePulse ? "pulse" : ""}`} data-pulse={scorePulse ?? ""}>
                24
              </span>
            </div>
          </header>

          <div className="timeline" role="tablist" aria-label="Case stages">
            {stages.map((stage) => {
              const isActive = stage.id === activeStage;
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={`timeline-node ${isActive ? "active" : ""}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveStage(stage.id);
                    setSelectedOption(null);
                  }}
                >
                  <span className="node-indicator" />
                  <span className="node-label">{stage.label}</span>
                </button>
              );
            })}
          </div>

          <div className={`stage-card vibe-${stageMeta.vibe}`}>
            <div className="stage-meta">
              <span className="stage-pill">Phase insight</span>
              <h3>{stageMeta.title}</h3>
              <p>{stageMeta.blurb}</p>
            </div>

            <div className="options" role="radiogroup" aria-label="Select an action">
              {stageOptions.map((option) => {
                const isPicked = selectedOption === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isPicked}
                    className={`option ${isPicked ? "picked" : ""} outcome-${option.outcome}`}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <span className="option-glow" aria-hidden />
                    <span className="option-copy">{option.copy}</span>
                    <span className="option-detail">{option.detail}</span>
                  </button>
                );
              })}
            </div>

            <div className="case-foot">
              <div className="trail">
                <div className="trail-head">
                  <span className="trail-dot" />
                  {stageMeta.vibe === "management" ? "Case complete" : "Next insight unlocking"}
                </div>
                <div className="trail-bar">
                  <span className="trail-progress" />
                </div>
              </div>
              <button type="button" className="replay" onClick={() => setSelectedOption(null)}>
                Replay step
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wncases-root {
          position: relative;
          margin-top: 3rem;
          padding: clamp(1.75rem, 3vw, 2.5rem);
          border-radius: 38px;
          background: transparent;
          box-shadow: none;
          overflow: hidden;
        }
        .wncases-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: clamp(2rem, 5vw, 3.5rem);
          align-items: center;
        }
        .wncases-copy {
          display: grid;
          gap: 1rem;
          color: #0f172a;
        }
        .wncases-kicker {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          font-size: .85rem;
          text-transform: uppercase;
          letter-spacing: .28em;
          font-weight: 800;
          color: rgba(99,102,241,.85);
        }
        .wncases-kicker::before {
          content: "";
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: linear-gradient(135deg,#6366f1,#22d3ee);
          box-shadow: 0 0 0 6px rgba(99,102,241,.12);
        }
        .wncases-sub {
          font-size: clamp(1rem, 1.15vw + .6rem, 1.125rem);
          line-height: 1.6;
          color: rgba(15,23,42,.78);
        }
        .wncases-sub strong { color: #312e81; }
        .wncases-points {
          display: grid;
          gap: .75rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .wncases-points li {
          display: flex;
          align-items: flex-start;
          gap: .75rem;
          font-weight: 600;
          color: rgba(15,23,42,.86);
          font-size: .95rem;
        }
        .spark {
          width: 16px;
          height: 16px;
          border-radius: 12px;
          background: linear-gradient(135deg,#f59e0b,#fb7185);
          box-shadow: 0 0 0 4px rgba(250,204,21,.25);
          position: relative;
        }
        .spark::after {
          content: "";
          position: absolute;
          inset: -6px;
          border-radius: inherit;
          border: 2px solid rgba(99,102,241,.22);
          opacity: .6;
        }
        .spark-2 { background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 0 0 4px rgba(59,130,246,.24); }
        .spark-3 { background: linear-gradient(135deg,#14b8a6,#6366f1); box-shadow: 0 0 0 4px rgba(20,184,166,.24); }

        .wncases-cta {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          margin-top: .5rem;
          padding: .75rem 1.5rem;
          border-radius: 9999px;
          font-weight: 700;
          color: white;
          text-decoration: none;
          background: linear-gradient(90deg,#6366f1,#22d3ee,#22c55e);
          box-shadow: 0 16px 30px rgba(37,99,235,.25);
          transform: translateZ(0);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .wncases-cta:hover { transform: translateY(-2px); box-shadow: 0 22px 40px rgba(79,70,229,.28); }
        .cta-icon { width: 18px; height: 18px; }

        .wncases-demo {
          position: relative;
          border-radius: 26px;
          padding: 1.5rem;
          background: rgba(255,255,255,.82);
          box-shadow: 0 26px 60px rgba(15,23,42,.18);
          backdrop-filter: blur(14px);
          display: grid;
          gap: 1.25rem;
        }
        .wncases-demo::before {
          content: "";
          position: absolute;
          inset: -12% -16% auto 54%;
          height: 160px;
          background: radial-gradient(60% 60% at 50% 50%, rgba(79,70,229,.24), transparent);
          opacity: .8;
          filter: blur(40px);
        }
        .demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .demo-title {
          display: flex;
          align-items: center;
          gap: .5rem;
          font-weight: 800;
          color: #1f2937;
        }
        .badge {
          padding: .25rem .5rem;
          border-radius: 9999px;
          background: rgba(99,102,241,.12);
          color: #4338ca;
          font-size: .7rem;
          letter-spacing: .08em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .score {
          display: grid;
          justify-items: center;
          font-size: .75rem;
          font-weight: 700;
          color: rgba(15,23,42,.65);
        }
        .score-value {
          position: relative;
          margin-top: .25rem;
          padding: .35rem .75rem;
          border-radius: 9999px;
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          background: linear-gradient(180deg,rgba(248,250,252,1),rgba(226,232,240,.82));
          box-shadow: inset 0 0 0 1px rgba(148,163,184,.25), 0 12px 24px rgba(148,163,184,.45);
          transition: transform .18s ease;
        }
        .score-value.pulse::after {
          content: attr(data-pulse);
          position: absolute;
          top: -1.25rem;
          right: -1rem;
          font-size: .75rem;
          font-weight: 700;
          color: rgba(20,184,166,.95);
          filter: drop-shadow(0 8px 22px rgba(20,184,166,.35));
          animation: score-pop .9s ease;
        }
        .score-value.pulse[data-pulse^="-"]::after {
          color: rgba(239,68,68,.95);
          filter: drop-shadow(0 8px 22px rgba(239,68,68,.35));
        }

        .timeline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: .75rem;
          background: linear-gradient(90deg,rgba(79,70,229,.08),rgba(59,130,246,.06));
          padding: .75rem;
          border-radius: 18px;
        }
        .timeline-node {
          position: relative;
          display: grid;
          gap: .35rem;
          justify-items: center;
          padding: .75rem .5rem;
          border-radius: 16px;
          border: 1px solid rgba(99,102,241,.15);
          background: rgba(255,255,255,.85);
          color: #312e81;
          font-weight: 700;
          transition: transform .18s ease, box-shadow .18s ease, border .18s ease;
        }
        .timeline-node .node-indicator {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: rgba(148,163,184,.6);
        }
        .timeline-node .node-label { font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
        .timeline-node.active {
          border-color: rgba(79,70,229,.45);
          background: linear-gradient(180deg,rgba(224,231,255,1),rgba(191,219,254,.92));
          box-shadow: 0 12px 30px rgba(99,102,241,.22);
          transform: translateY(-2px);
        }
        .timeline-node.active .node-indicator { background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 0 0 4px rgba(129,140,248,.3); }

        .stage-card {
          position: relative;
          padding: 1.25rem;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(255,255,255,.82));
          box-shadow: inset 0 0 0 1px rgba(148,163,184,.18), 0 18px 40px rgba(15,23,42,.12);
          display: grid;
          gap: 1.25rem;
        }
        .stage-card::before {
          content: "";
          position: absolute;
          inset: -10% -15% auto;
          height: 120px;
          background: radial-gradient(50% 50% at 50% 50%, rgba(99,102,241,.16), transparent);
          opacity: .8;
        }
        .stage-card h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }
        .stage-card p {
          margin: .35rem 0 0;
          font-size: .95rem;
          color: rgba(15,23,42,.75);
        }
        .stage-pill {
          display: inline-flex;
          align-items: center;
          gap: .35rem;
          padding: .35rem .75rem;
          border-radius: 9999px;
          background: rgba(99,102,241,.12);
          color: #4338ca;
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .options {
          display: grid;
          gap: .75rem;
        }
        .option {
          position: relative;
          text-align: left;
          padding: .85rem 1rem;
          border-radius: 16px;
          background: rgba(248,250,252,.92);
          border: 1px solid rgba(148,163,184,.28);
          box-shadow: 0 10px 28px rgba(15,23,42,.06);
          transition: transform .18s ease, box-shadow .18s ease, border .18s ease;
        }
        .option:hover { transform: translateY(-2px); box-shadow: 0 18px 34px rgba(15,23,42,.12); }
        .option .option-copy {
          font-weight: 700;
          color: #0f172a;
          font-size: .95rem;
        }
        .option .option-detail {
          display: block;
          margin-top: .35rem;
          color: rgba(30,41,59,.75);
          font-size: .85rem;
        }
        .option .option-glow {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(120deg, rgba(99,102,241,.25), rgba(14,165,233,.2), rgba(16,185,129,.2));
          opacity: 0;
          transition: opacity .2s ease;
          filter: blur(0);
          z-index: -1;
        }
        .option.picked {
          border-color: rgba(99,102,241,.55);
          transform: translateY(-1px) scale(1.01);
        }
        .option.picked .option-glow { opacity: .9; }
        .option.outcome-correct { border-color: rgba(16,185,129,.4); }
        .option.outcome-warning { border-color: rgba(244,114,182,.4); }
        .option.outcome-info { border-color: rgba(59,130,246,.35); }

        .case-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .trail {
          flex: 1;
          display: grid;
          gap: .5rem;
        }
        .trail-head {
          display: flex;
          align-items: center;
          gap: .6rem;
          font-weight: 700;
          color: #1e293b;
          font-size: .85rem;
        }
        .trail-dot {
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: linear-gradient(135deg,#22d3ee,#6366f1);
          box-shadow: 0 0 0 4px rgba(125,211,252,.25);
        }
        .trail-bar {
          position: relative;
          height: 6px;
          border-radius: 9999px;
          background: rgba(148,163,184,.35);
          overflow: hidden;
        }
        .trail-progress {
          position: absolute;
          inset: 0;
          width: 70%;
          background: linear-gradient(90deg,#6366f1,#22d3ee,#22c55e);
          animation: shine 2.8s linear infinite;
        }
        .replay {
          padding: .6rem 1.1rem;
          border-radius: 9999px;
          border: 1px solid rgba(148,163,184,.45);
          background: rgba(255,255,255,.92);
          font-weight: 700;
          color: #312e81;
          box-shadow: 0 12px 24px rgba(79,70,229,.18);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .replay:hover { transform: translateY(-1px); box-shadow: 0 18px 34px rgba(79,70,229,.24); }

        .vibe-history .stage-pill { background: rgba(129,140,248,.14); color: #4338ca; }
        .vibe-labs .stage-pill { background: rgba(56,189,248,.15); color: #0f766e; }
        .vibe-decision .stage-pill { background: rgba(249,115,22,.15); color: #c2410c; }
        .vibe-management .stage-pill { background: rgba(5,150,105,.14); color: #047857; }

        @keyframes float-soft {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shine {
          0% { transform: translateX(-40%); }
          100% { transform: translateX(40%); }
        }
        @keyframes score-pop {
          0% { opacity: 0; transform: translateY(8px) scale(.6); }
          20% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; transform: translateY(-4px) scale(.95); }
          100% { opacity: 0; transform: translateY(-12px) scale(.85); }
        }

        @media (max-width: 1024px) {
          .wncases-grid { grid-template-columns: 1fr; }
          .wncases-demo { order: -1; }
          .wncases-root { border-radius: 28px; }
        }
        @media (max-width: 640px) {
          .wncases-root { padding: 1.5rem; }
          .wncases-demo { padding: 1.1rem; }
          .timeline { grid-template-columns: 1fr 1fr; }
          .timeline-node { padding: .65rem; }
          .stage-card { padding: 1rem; }
          .option { padding: .75rem .85rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wncases-root::before,
          .trail-progress,
          .score-value.pulse::after {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
