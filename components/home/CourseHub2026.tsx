"use client";

import React, { useMemo, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

export default function CourseHub2026() {
  const [tab, setTab] = useState<"feed" | "calendar" | "rotations" | "messages">("feed");
  const pct = useMemo(() => (tab === "feed" ? 72 : tab === "calendar" ? 48 : tab === "rotations" ? 36 : 58), [tab]);

  return (
    <section className="wch-root" aria-labelledby="wch-heading">
      <div className="wch-grid">
        {/* Left: demos */}
        <div className="wch-demos">
          <div className="card hub" role="region" aria-label="Course Hub demo">
            <div className="hub-header">
              <div className="tabs" role="tablist" aria-label="Hub views">
                {(["feed","calendar","rotations","messages"] as const).map((m) => (
                  <button key={m} className={`tab ${m===tab? 'active':''}`} onClick={() => setTab(m)}>
                    {m[0].toUpperCase()+m.slice(1)}
                  </button>
                ))}
              </div>
              <div className="progress"><div className="bar" style={{ width: `${pct}%` }} /></div>
            </div>

            <div className={`hub-body show-${tab}`}>
              <div className="view feed">
                <div className="feed-card">
                  <div className="avatar" /><div className="lines"><span className="l" /><span className="l short" /></div>
                </div>
                <div className="feed-card">
                  <div className="avatar" /><div className="lines"><span className="l" /><span className="l short" /></div>
                </div>
                <div className="feed-card">
                  <div className="avatar" /><div className="lines"><span className="l" /><span className="l short" /></div>
                </div>
              </div>
              <div className="view calendar">
                <div className="cal">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="day">
                      <span className="pill" style={{width: `${20 + i*8}%`}} />
                      <span className="pill b" style={{width: `${28 + (6-i)*6}%`}} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="view rotations">
                <div className="rot-list">
                  {["Internal Med","Surgery","Pediatrics","OB/GYN"].map((r,i) => (
                    <div key={r} className="rot-item"><span className={`dot c${(i%3)+1}`} /> {r}</div>
                  ))}
                </div>
              </div>
              <div className="view messages">
                <div className="msg-bubble left">Team meeting moved to 14:00</div>
                <div className="msg-bubble right">Got it, thanks!</div>
                <div className="msg-bubble left">New tips in the rotations guide</div>
              </div>
            </div>
          </div>

          {/* floating minis */}
          <div className="float card mini-cal">
            <div className="mini-title">Rotations</div>
            <div className="mini-bars">
              <span style={{width: '80%'}} />
              <span style={{width: '60%'}} />
              <span style={{width: '70%'}} />
            </div>
          </div>
        </div>

        {/* Right: copy */}
        <div className="wch-copy">
          <div className="wch-kicker">EnterMedSchool Already?</div>
          <ShimmerHeading title={<>
            Course Hub for
            <br />
            Your Class
          </>} size="lg" variant="teal" align="right" />
          <p className="wch-sub">
            Enjoy a shared space for your cohort. See notifications, representative messages,
            rotations calendar with guides, tips, class and exam schedules, and more.
          </p>
          <ul className="wch-points" role="list">
            <li><span className="dot t1"/>Announcements and events feed</li>
            <li><span className="dot t2"/>Rotations calendar + guides</li>
            <li><span className="dot t3"/>Messages and reminders</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .wch-root { margin-top: 3rem; }
        .wch-grid { display:grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1024px){ .wch-grid { grid-template-columns: 7fr 5fr; align-items: center; } }

        .wch-copy { text-align: right; padding: 4px 8px; }
        .wch-kicker { color:#0f766e; opacity:.7; font-weight:800; letter-spacing:.06em; text-transform:uppercase; font-size:12px; }
        .wch-sub { margin-top:.75rem; color:#0f172a; opacity:.85; }
        .wch-points { margin-top:.75rem; display:grid; gap:.5rem; color:#0f172a; }
        .wch-points li { display:flex; align-items:center; justify-content:flex-end; gap:.5rem; font-weight:700; }
        .dot { width:10px; height:10px; border-radius:9999px; display:inline-block; }
        .dot.t1{ background:linear-gradient(135deg,#14b8a6,#22d3ee); box-shadow:0 6px 16px rgba(20,184,166,.35); }
        .dot.t2{ background:linear-gradient(135deg,#60a5fa,#34d399); box-shadow:0 6px 16px rgba(96,165,250,.35); }
        .dot.t3{ background:linear-gradient(135deg,#f59e0b,#fb7185); box-shadow:0 6px 16px rgba(251,113,133,.35); }

        .wch-demos { position:relative; min-height:460px; }
        .card { border-radius:24px; background:#fff; border:1px solid rgba(20,184,166,.18); box-shadow:0 16px 40px rgba(2,6,23,.12); }
        .hub { overflow:hidden; }
        .hub-header { padding: 14px 14px 10px; color:white; background: linear-gradient(90deg,#06b6d4,#14b8a6,#60a5fa); border-radius:22px 22px 0 0; }
        .tabs { display:inline-flex; gap:8px; padding:4px; background:rgba(255,255,255,.18); border-radius:9999px; }
        .tab { border:0; appearance:none; cursor:pointer; font-weight:800; color:white; padding:6px 12px; border-radius:9999px; opacity:.9; }
        .tab.active { background:white; color:#0f766e; box-shadow:0 8px 18px rgba(255,255,255,.35); }
        .progress { height:6px; border-radius:9999px; background:rgba(255,255,255,.28); margin-top:10px; overflow:hidden; }
        .bar { height:100%; background: linear-gradient(90deg,#34d399,#60a5fa); border-radius:9999px; transition: width .6s cubic-bezier(.22,1,.36,1); }
        .hub-body { background:#fff; padding: 16px; border-radius:0 0 22px 22px; position:relative; }
        .hub-body .view { display:none; }
        .hub-body.show-feed .view.feed,
        .hub-body.show-calendar .view.calendar,
        .hub-body.show-rotations .view.rotations,
        .hub-body.show-messages .view.messages { display:block; }

        .feed-card { display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; margin-bottom:8px; box-shadow:0 6px 16px rgba(2,6,23,.06); }
        .avatar { width:32px; height:32px; border-radius:9999px; background: linear-gradient(135deg,#60a5fa,#22d3ee); }
        .lines { flex:1; }
        .l { display:block; height:10px; border-radius:9999px; background: linear-gradient(90deg,#e2e8f0,#dbeafe); }
        .l.short { width:60%; margin-top:6px; }

        .cal { display:grid; gap:10px; }
        .day { background: #f0fdf4; padding:10px; border-radius:14px; border:1px solid #bbf7d0; box-shadow:0 6px 16px rgba(16,185,129,.15); }
        .pill { display:block; height:8px; border-radius:9999px; background: linear-gradient(90deg,#34d399,#22d3ee); margin-bottom:6px; }
        .pill.b { background: linear-gradient(90deg,#60a5fa,#14b8a6); }

        .rot-list { display:grid; gap:8px; }
        .rot-item { display:flex; align-items:center; gap:10px; font-weight:800; padding:10px 12px; border-radius:14px; border:1px solid #e5e7eb; }
        .rot-item .dot { width:10px; height:10px; }
        .rot-item .dot.c1 { background:#34d399; }
        .rot-item .dot.c2 { background:#06b6d4; }
        .rot-item .dot.c3 { background:#60a5fa; }

        .messages { }
        .msg-bubble { display:inline-block; padding:10px 12px; border-radius:12px; border:1px solid #e2e8f0; margin:6px 0; box-shadow:0 6px 16px rgba(2,6,23,.06); }
        .msg-bubble.left { background: #ecfeff; }
        .msg-bubble.right { background: #f0fdf4; float:right; clear:both; }

        .float { position:absolute; right:-8px; bottom:-18px; width:220px; transform: rotate(5deg); padding:12px; background: linear-gradient(180deg,rgba(255,255,255,1),rgba(20,184,166,.12)); }
        @media (max-width: 1023px) { .float { right: 8px; bottom: 8px; transform: none; } }
        .mini-title { font-size:12px; font-weight:800; color:#0f766e; margin-bottom:6px; }
        .mini-bars { display:grid; gap:6px; }
        .mini-bars span { display:block; height:8px; border-radius:9999px; background: linear-gradient(90deg,#14b8a6,#60a5fa); box-shadow:0 6px 14px rgba(20,184,166,.35); }
      `}</style>
    </section>
  );
}

