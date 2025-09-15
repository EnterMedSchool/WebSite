"use client";

import React, { useMemo, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

export default function CourseHub2026() {
  const [tab, setTab] = useState<"feed" | "calendar" | "rotations" | "messages">("feed");
  const [rotSel, setRotSel] = useState(0);
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
              {/* FEED */}
              <div className="view feed">
                {[
                  { type: 'event', title: 'Anatomy lab moved to Wed 10:00', sub: 'Dissection room A · Prof. Romano' },
                  { type: 'announcement', title: 'Class photo next Monday', sub: 'Main courtyard · 12:30' },
                  { type: 'reminder', title: 'Submit clinical reflection #2', sub: 'Due Friday 23:59' },
                  { type: 'event', title: 'Cardiology webinar with alumni', sub: 'Zoom · Today 18:00' },
                  { type: 'announcement', title: 'New guide: Surgery rotation tips', sub: 'Pinned in Rotations tab' },
                ].map((f, i) => (
                  <div key={i} className={`feed-row ${f.type}`}>
                    <div className="left">
                      <span className="badge" />
                    </div>
                    <div className="right">
                      <div className="title">{f.title}</div>
                      <div className="sub">{f.sub}</div>
                      <div className="meta">
                        <span className={`chip ${f.type}`}>{f.type}</span>
                        <span className="time">{i === 0 ? '2h ago' : i === 1 ? '5h ago' : i === 2 ? 'yesterday' : 'this week'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CALENDAR */}
              <div className="view calendar">
                <div className="cal-head">Week 6</div>
                <div className="cal">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="day">
                      <div className="dotline">
                        <span className="dot a" />
                        <span className="dot b" />
                      </div>
                      <span className="pill" style={{width: `${20 + i*8}%`}} />
                      <span className="pill b" style={{width: `${28 + (6-i)*6}%`}} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ROTATIONS */}
              <div className="view rotations">
                <div className="rot-list">
                  {[
                    { name: 'Internal Medicine', site: 'San Carlo', pct: 62 },
                    { name: 'Surgery', site: 'Ospedale Maggiore', pct: 40 },
                    { name: 'Pediatrics', site: "Children's Hosp.", pct: 15 },
                    { name: 'OB/GYN', site: 'Regina Margherita', pct: 0 },
                  ].map((r,i) => (
                    <button type="button" key={r.name} className={`rot-item ${rotSel===i? 'active':''}`} onClick={() => setRotSel(i)}>
                      <span className={`dot c${(i%3)+1}`} />
                      <div className="rot-main">
                        <div className="rot-title">{r.name} · <span className="muted">{r.site}</span></div>
                        <div className="rot-bar"><span style={{ width: `${r.pct}%` }} /></div>
                      </div>
                      <span className="rot-guide">Guide</span>
                    </button>
                  ))}
                </div>
                {/* Selected rotation details */}
                <div className="rot-details">
                  <div className="rd-left">
                    <div className="rd-title">{['Internal Medicine','Surgery','Pediatrics','OB/GYN'][rotSel]} reviews</div>
                    <div className="rd-reviews">
                      {[
                        { u: 'AM', t: 'Great teaching rounds. Try to present early.', s: 5 },
                        { u: 'LK', t: 'Busy ward—bring a small notebook.', s: 4 },
                      ].map((r, idx) => (
                        <div key={idx} className="rev">
                          <span className="avatar">{r.u}</span>
                          <div className="text">
                            <div className="stars">{'★'.repeat(r.s)}{'☆'.repeat(5-r.s)}</div>
                            <div>{r.t}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rd-tips">
                      {['Arrive 10 min early','Ask to suture','Learn meds chart'].map((t) => (
                        <span key={t} className="tip">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rd-map">
                    <svg viewBox="0 0 220 140" className="map" aria-hidden>
                      <defs>
                        <linearGradient id="route" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="220" height="140" rx="12" fill="#e5f2ff" />
                      <path d="M14 120 C 40 90, 80 110, 100 80 S 160 60, 206 30" stroke="url(#route)" strokeWidth="6" fill="none" strokeLinecap="round" />
                      <circle cx="16" cy="120" r="6" fill="#10b981" />
                      <rect x="200" y="16" width="12" height="12" rx="3" fill="#ef4444" />
                    </svg>
                    <div className="map-legend"><span className="leg start" />Dorms <span className="leg dest" />Hospital</div>
                  </div>
                </div>
              </div>

              {/* MESSAGES */}
              <div className="view messages">
                <div className="msg-bubble left">Team meeting moved to 14:00</div>
                <div className="msg-bubble right">Got it, thanks!</div>
                <div className="msg-bubble left">New tips in the rotations guide</div>
                <div className="msg-bubble right">I\'ll share notes after class</div>
                <div className="msg-input" aria-disabled>Type a message…</div>
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
          <div className="float card mini-events" style={{ left: '-10px', bottom: '96px', transform: 'rotate(-6deg)' }}>
            <div className="mini-title">Events</div>
            <div className="mini-list">
              <span />
              <span />
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

        .feed-row { display:grid; grid-template-columns: 28px 1fr; gap:10px; align-items:start; padding:10px 12px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; margin-bottom:8px; box-shadow:0 6px 16px rgba(2,6,23,.06); }
        .feed-row .badge { display:block; width:12px; height:12px; border-radius:9999px; margin-top:6px; }
        .feed-row.event .badge { background: #34d399; box-shadow:0 0 0 4px #ecfdf5 inset; }
        .feed-row.announcement .badge { background: #60a5fa; box-shadow:0 0 0 4px #eff6ff inset; }
        .feed-row.reminder .badge { background: #f59e0b; box-shadow:0 0 0 4px #fffbeb inset; }
        .feed-row .title { font-weight:800; color:#0f172a; }
        .feed-row .sub { font-size:12px; color:#475569; margin-top:2px; }
        .feed-row .meta { display:flex; align-items:center; gap:8px; margin-top:6px; }
        .chip { font-size:11px; font-weight:800; border-radius:9999px; padding:4px 8px; background:#e2e8f0; color:#0f172a; }
        .chip.event { background:#d1fae5; color:#065f46; }
        .chip.announcement { background:#dbeafe; color:#1e3a8a; }
        .chip.reminder { background:#fef3c7; color:#92400e; }
        .time { font-size:11px; color:#64748b; }

        .cal-head { font-size:12px; font-weight:900; color:#0f766e; margin-bottom:6px; }
        .cal { display:grid; gap:10px; }
        .day { background: #f0fdf4; padding:10px; border-radius:14px; border:1px solid #bbf7d0; box-shadow:0 6px 16px rgba(16,185,129,.15); }
        .dotline { display:flex; gap:6px; margin-bottom:6px; }
        .dotline .dot { width:6px; height:6px; border-radius:9999px; background:#34d399; opacity:.7; }
        .dotline .dot.b { background:#60a5fa; }
        .pill { display:block; height:8px; border-radius:9999px; background: linear-gradient(90deg,#34d399,#22d3ee); margin-bottom:6px; }
        .pill.b { background: linear-gradient(90deg,#60a5fa,#14b8a6); }

        .rot-list { display:grid; gap:8px; }
        .rot-item { display:grid; grid-template-columns: 12px 1fr auto; align-items:center; gap:10px; font-weight:800; padding:10px 12px; border-radius:14px; border:1px solid #e5e7eb; background:#fff; transition: box-shadow .15s ease, transform .15s ease; }
        .rot-item:hover { transform: translateY(-1px); box-shadow:0 8px 20px rgba(2,6,23,.06); }
        .rot-item.active { box-shadow:0 10px 24px rgba(20,184,166,.18); border-color:#a7f3d0; }
        .rot-item .dot { width:10px; height:10px; }
        .rot-item .dot.c1 { background:#34d399; }
        .rot-item .dot.c2 { background:#06b6d4; }
        .rot-item .dot.c3 { background:#60a5fa; }
        .rot-main { display:grid; gap:6px; }
        .rot-title { color:#0f172a; font-weight:900; }
        .rot-title .muted { color:#64748b; font-weight:700; }
        .rot-bar { height:8px; background:#f1f5f9; border-radius:9999px; overflow:hidden; }
        .rot-bar span { display:block; height:100%; background: linear-gradient(90deg,#14b8a6,#60a5fa); border-radius:9999px; }
        .rot-guide { border:1px solid #0ea5e9; color:#0369a1; font-size:12px; font-weight:900; border-radius:9999px; padding:6px 10px; background:#e0f2fe; }
        .rot-details { display:grid; grid-template-columns: 1fr 220px; gap:12px; margin-top:12px; align-items:start; }
        @media (max-width: 640px) { .rot-details { grid-template-columns: 1fr; } }
        .rd-left { background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:10px; }
        .rd-title { font-size:12px; font-weight:900; color:#0f766e; margin-bottom:6px; }
        .rd-reviews { display:grid; gap:8px; }
        .rev { display:grid; grid-template-columns: 26px 1fr; gap:8px; align-items:start; }
        .rev .avatar { width:26px; height:26px; border-radius:9999px; background: linear-gradient(135deg,#60a5fa,#22d3ee); color:white; font-size:11px; display:grid; place-items:center; font-weight:900; box-shadow:0 4px 12px rgba(96,165,250,.35); }
        .rev .stars { color:#f59e0b; font-size:12px; line-height:1; margin-bottom:2px; }
        .rd-tips { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
        .tip { font-size:11px; border-radius:9999px; padding:4px 8px; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; }
        .rd-map { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:6px; display:grid; gap:4px; justify-items:center; }
        .map { width:100%; height:auto; border-radius:10px; display:block; }
        .map-legend { font-size:11px; color:#475569; display:flex; align-items:center; gap:8px; }
        .leg { width:10px; height:10px; border-radius:2px; display:inline-block; }
        .leg.start { background:#10b981; }
        .leg.dest { background:#ef4444; }

        .messages { }
        .msg-bubble { display:inline-block; padding:10px 12px; border-radius:12px; border:1px solid #e2e8f0; margin:6px 0; box-shadow:0 6px 16px rgba(2,6,23,.06); }
        .msg-bubble.left { background: #ecfeff; }
        .msg-bubble.right { background: #f0fdf4; float:right; clear:both; }
        .msg-input { margin-top:8px; border:1px dashed #cbd5e1; color:#64748b; font-size:12px; padding:10px; border-radius:10px; }

        .float { position:absolute; right:-8px; bottom:-18px; width:220px; transform: rotate(5deg); padding:12px; background: linear-gradient(180deg,rgba(255,255,255,1),rgba(20,184,166,.12)); }
        @media (max-width: 1023px) { .float { right: 8px; bottom: 8px; transform: none; } }
        .mini-title { font-size:12px; font-weight:800; color:#0f766e; margin-bottom:6px; }
        .mini-bars { display:grid; gap:6px; }
        .mini-bars span { display:block; height:8px; border-radius:9999px; background: linear-gradient(90deg,#14b8a6,#60a5fa); box-shadow:0 6px 14px rgba(20,184,166,.35); }
        .mini-events { width:180px; padding:12px; background: linear-gradient(180deg,rgba(255,255,255,1),rgba(99,102,241,.10)); }
        .mini-list { display:grid; gap:6px; }
        .mini-list span { display:block; height:8px; border-radius:9999px; background: linear-gradient(90deg,#a78bfa,#60a5fa); box-shadow:0 6px 14px rgba(99,102,241,.28); }
      `}</style>
    </section>
  );
}
