"use client";

import React, { useMemo, useState } from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

export default function CourseHub2026() {
  const [tab, setTab] = useState<"feed" | "calendar" | "rotations" | "messages">("feed");
  const [rotSel, setRotSel] = useState(0);
  const [unread, setUnread] = useState(3);
  const pct = useMemo(() => (tab === "feed" ? 72 : tab === "calendar" ? 48 : tab === "rotations" ? 36 : 58), [tab]);
  const cal = useMemo(() => ([
    { name: 'Mon', items: [ { type: 'Lecture', title: 'Anatomy: Upper Limb', time: '09:00', span: 60 }, { type: 'Lab', title: 'Biochem Lab', time: '13:00', span: 50 } ] },
    { name: 'Tue', items: [ { type: 'Rotation', title: 'Internal Medicine', time: '08:00', span: 70 }, { type: 'Lecture', title: 'Physiology: Cardiac Output', time: '14:00', span: 45 } ] },
    { name: 'Wed', items: [ { type: 'Lecture', title: 'Histology: Epithelium', time: '10:00', span: 55 }, { type: 'Exam', title: 'MCQ quiz — Biochem', time: '16:00', span: 35 } ] },
    { name: 'Thu', items: [ { type: 'Workshop', title: 'Suturing Skills', time: '12:00', span: 40 }, { type: 'Rotation', title: 'Pediatrics Ward', time: '14:00', span: 60 } ] },
    { name: 'Fri', items: [ { type: 'Lecture', title: 'Neuro: Synapses', time: '09:00', span: 50 }, { type: 'Seminar', title: 'IMAT Strategy Clinic', time: '15:00', span: 45 } ] },
    { name: 'Sat', items: [ { type: 'Event', title: 'Student Meetup', time: '11:00', span: 40 } ] },
    { name: 'Sun', items: [ { type: 'Revision', title: 'Study Group — Library', time: '13:00', span: 60 } ] },
  ]), []);
  const mobileHighlights = [
    {
      id: 'feed',
      label: 'Feed',
      title: 'Stay on track',
      copy: 'Reminders, events and quick wins gathered in one scrollable feed.',
      bullets: ['Pin urgent tasks', 'Color-coded priorities', 'Swipe to acknowledge'],
      accent: 'indigo',
    },
    {
      id: 'planner',
      label: 'Planner',
      title: 'Plan and preview',
      copy: 'Weekly overview with tap targets for lectures, labs and rotations.',
      bullets: ['Drag-and-drop scheduling', 'Alerts before busy weeks', 'Tap to open detailed view'],
      accent: 'emerald',
    },
    {
      id: 'support',
      label: 'Support',
      title: 'Never study alone',
      copy: 'Messages, annotations and mentor tips living alongside your coursework.',
      bullets: ['Reply inline with classmates', 'Flag concepts for review', 'Share resources instantly'],
      accent: 'violet',
    },
  ];

  return (
    <section className="wch-root" aria-labelledby="wch-heading">
      <div className="wch-mobile" aria-labelledby="wch-mobile-heading">
        <div className="mobile-card hero">
          <span className="mobile-kicker">Course Hub</span>
          <h3 id="wch-mobile-heading" className="mobile-title">Entirely New Course System</h3>
          <p className="mobile-copy">A redesigned flow that bundles lessons, flashcards and live planning into a single hub made for phones.</p>
          <div className="mobile-cta">
            <button type="button" className="mobile-primary">Explore lessons</button>
            <button type="button" className="mobile-ghost">Open calendar</button>
          </div>
        </div>
        <div className="mobile-highlights">
          {mobileHighlights.map((item) => (
            <article key={item.id} className={`mobile-card accent-${item.accent}`}>
              <span className="mobile-label">{item.label}</span>
              <h4 className="mobile-card-title">{item.title}</h4>
              <p className="mobile-card-copy">{item.copy}</p>
              <ul className="mobile-bullets" role="list">
                {item.bullets.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mobile-support">
          <p>Need a guided plan? We can tailor a weekly path or help you pick the right university shortlist.</p>
          <button type="button" className="mobile-outline">Book a free consult</button>
        </div>
      </div>
      <div className="wch-desktop">
      <div className="wch-grid">
        {/* Left: demos */}
        <div className="wch-demos">
          <div className="card hub" role="region" aria-label="Course Hub demo">
            <div className="hub-header">
              <div className="tabs" role="tablist" aria-label="Hub views">
                {(["feed","calendar","rotations","messages"] as const).map((m) => (
                  <button
                    key={m}
                    className={`tab ${m===tab? 'active':''}`}
                    onClick={() => {
                      setTab(m);
                      if (m === 'messages' && unread > 0) setTimeout(() => setUnread(0), 700);
                    }}
                  >
                    {m === 'messages' && unread > 0 ? (
                      <span className="tab-with-badge">
                        Messages <span className="unread">{unread}</span>
                      </span>
                    ) : m[0].toUpperCase()+m.slice(1)}
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
                  {cal.map((d, i) => (
                    <div key={d.name} className="day" title={d.name}>
                      <div className="day-head">
                        <span className="dot a" />
                        <span className="label">{d.name}</span>
                      </div>
                      <div className="ev-list">
                        {d.items.map((ev, k) => (
                          <div key={k} className={`ev ${ev.type.toLowerCase()}`} style={{ width: `${Math.min(92, 24 + ev.span)}%` }}>
                            <span className="ev-time">{ev.time}</span>
                            <span className="ev-title">{ev.title}</span>
                            <span className="ev-type">{ev.type}</span>
                          </div>
                        ))}
                      </div>
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
                <div className="msg-bubble left">Hey team, anyone up for a quick IMAT practice after anatomy?</div>
                <div className="msg-bubble right">Yes! I can bring flashcards. Library at 17:30?</div>
                <div className="msg-bubble left">Perfect. Also rep said rotations sign‑ups open Thursday.</div>
                <div className="msg-bubble right">Nice—let’s target Internal Med first. I’ll add tips in the hub.</div>
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
        .tab-with-badge { position: relative; display:inline-flex; align-items:center; gap:8px; }
        .unread { display:inline-block; min-width:18px; height:18px; padding:0 6px; border-radius:9999px; background:#ef4444; color:white; font-size:11px; font-weight:900; line-height:18px; box-shadow:0 6px 14px rgba(239,68,68,.35); }
        .hub-body { background:#fff; padding: 16px; border-radius:0 0 22px 22px; position:relative; }
        .hub-body .view { display:none; }
        .hub-body.show-feed .view.feed,
        .hub-body.show-calendar .view.calendar,
        .hub-body.show-rotations .view.rotations,
        .hub-body.show-messages .view.messages { display:block; }

        .feed-row { display:grid; grid-template-columns: 28px 1fr; gap:10px; align-items:start; padding:10px 12px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; margin-bottom:8px; box-shadow:0 6px 16px rgba(2,6,23,.06); transition: transform .15s ease, box-shadow .15s ease; }
        .feed-row:hover { transform: translateY(-1px); box-shadow:0 10px 22px rgba(2,6,23,.08); }
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
        .day-head { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
        .day .label { font-size:12px; font-weight:900; color:#0f766e; }
        .day .dot { width:6px; height:6px; border-radius:9999px; background:#34d399; opacity:.8; }
        .ev-list { display:grid; gap:8px; }
        .ev { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px; padding:8px 10px; border-radius:12px; border:1px solid #e2e8f0; background:white; box-shadow:0 6px 16px rgba(2,6,23,.06); transition: transform .15s ease, box-shadow .15s ease; }
        .ev:hover { transform: translateY(-1px); box-shadow:0 10px 22px rgba(2,6,23,.08); }
        .ev-time { font-size:12px; color:#0f172a; font-weight:900; }
        .ev-title { font-size:12px; color:#334155; }
        .ev-type { font-size:11px; font-weight:900; border-radius:9999px; padding:4px 8px; }
        .ev.lecture { border-color:#bfdbfe; }
        .ev.lecture .ev-type { background:#dbeafe; color:#1e3a8a; }
        .ev.lab { border-color:#99f6e4; }
        .ev.lab .ev-type { background:#ccfbf1; color:#0f766e; }
        .ev.exam { border-color:#fecdd3; }
        .ev.exam .ev-type { background:#ffe4e6; color:#9f1239; }
        .ev.rotation { border-color:#a7f3d0; }
        .ev.rotation .ev-type { background:#d1fae5; color:#065f46; }
        .ev.workshop .ev-type { background:#fef3c7; color:#92400e; }
        .ev.seminar .ev-type { background:#ede9fe; color:#5b21b6; }
        .ev.event .ev-type { background:#e0e7ff; color:#3730a3; }
        .ev.revision .ev-type { background:#f1f5f9; color:#334155; }

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
        .wch-mobile { display: none; }
        .wch-desktop { display: block; }
        .mobile-card { position: relative; border-radius: 24px; padding: 20px; background: rgba(255,255,255,0.94); border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 18px 40px rgba(15,23,42,0.12); display: grid; gap: 12px; color: #0f172a; }
        .mobile-card.hero { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.22)); }
        .mobile-kicker { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #312e81; }
        .mobile-title { font-size: 24px; font-weight: 900; line-height: 1.15; color: #0f172a; }
        .mobile-copy { color: #1e293b; font-size: 15px; line-height: 1.55; }
        .mobile-cta { display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .mobile-primary { border-radius: 9999px; padding: 10px 0; font-weight: 800; background: linear-gradient(90deg,#6366f1,#22d3ee); color: white; border: none; box-shadow: 0 12px 28px rgba(79,70,229,0.32); }
        .mobile-ghost { border-radius: 9999px; padding: 10px 0; font-weight: 800; border: 1px solid rgba(79,70,229,0.3); background: white; color: #312e81; }
        .mobile-highlights { display: grid; gap: 16px; }
        .mobile-label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: rgba(15,23,42,0.55); }
        .mobile-card-title { font-size: 18px; font-weight: 800; color: #0f172a; }
        .mobile-card-copy { font-size: 14px; color: #1f2937; opacity: .85; }
        .mobile-bullets { display: grid; gap: 6px; list-style: none; padding: 0; margin: 0; font-size: 13px; color: #0f172a; }
        .mobile-bullets li { position: relative; padding-left: 18px; }
        .mobile-bullets li::before { content: ""; position: absolute; left: 0; top: 8px; width: 8px; height: 8px; border-radius: 9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 6px 14px rgba(79,70,229,0.25); }
        .accent-indigo { background: linear-gradient(135deg, rgba(99,102,241,0.16), rgba(79,70,229,0.08)); }
        .accent-emerald { background: linear-gradient(135deg, rgba(16,185,129,0.14), rgba(45,212,191,0.08)); }
        .accent-violet { background: linear-gradient(135deg, rgba(168,85,247,0.16), rgba(99,102,241,0.1)); }
        .mobile-support { text-align: center; display: grid; gap: 10px; padding: 16px; border-radius: 24px; background: rgba(255,255,255,0.88); border: 1px solid rgba(15,23,42,0.08); box-shadow: 0 16px 36px rgba(15,23,42,0.12); }
        .mobile-support p { font-size: 14px; color: #1e293b; }
        .mobile-outline { border-radius: 9999px; padding: 10px 0; font-weight: 800; border: 1px solid rgba(6,95,70,0.25); background: white; color: #047857; }
        @media (max-width: 1023px) { .wch-mobile { display: grid; gap: 18px; } .wch-desktop { display: none; } }
        @media (min-width: 1024px) { .wch-mobile { display: none; } }
      `}</style>
    </section>
  );
}
