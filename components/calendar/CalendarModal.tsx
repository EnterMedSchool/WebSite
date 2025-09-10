"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CalEvent = {
  uid: string;
  title: string;
  start: string; // ISO
  end?: string | null; // ISO
  location?: string | null;
  allDay?: boolean;
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function fmtDayKey(d: Date) { return d.toISOString().slice(0, 10); }

export default function CalendarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(new Date());
  const ref = useRef<HTMLDivElement>(null);

  // Load when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch('/api/calendar', { credentials: 'include' });
        const j = await r.json();
        setEvents(Array.isArray(j?.events) ? j.events : []);
        setSource(j?.source || null);
        setDebug(j?.debug || null);
      } catch { setEvents([]); }
      finally { setLoading(false); }
    })();
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const map = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const ev of (events || [])) {
      const dt = new Date(ev.start);
      const key = fmtDayKey(dt);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(ev);
    }
    return m;
  }, [events]);

  if (!open) return null;

  // Build month grid (Sun..Sat, 6 rows)
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const startIdx = first.getDay(); // 0..6 Sun..Sat
  const days: Date[] = [];
  for (let i = 0; i < startIdx; i++) days.push(new Date(first.getFullYear(), first.getMonth(), i - startIdx + 1));
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(first.getFullYear(), first.getMonth(), d));
  while (days.length % 7 !== 0) days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + (days.length % 7 ? 7 - (days.length % 7) : 0)));

  function onBg(e: React.MouseEvent) { if (e.target === ref.current) onClose(); }

  return (
    <div ref={ref} className="fixed inset-0 z-[9998] grid place-items-center bg-gradient-to-br from-black/40 via-indigo-900/10 to-fuchsia-900/10 backdrop-blur-[2px] p-4" onClick={onBg}>
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-violet-200/60 bg-white/95 shadow-[0_30px_90px_rgba(99,102,241,0.35)] ring-1 ring-white/40 backdrop-blur-xl">
        <div className="grid gap-6 p-6 md:grid-cols-3">
          {/* Calendar grid */}
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-extrabold text-gray-900">{month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
              <div className="flex gap-2">
                <button onClick={() => { setMonth(addMonths(month, -1)); }} className="rounded-full bg-gray-100 px-3 py-1 text-sm">Prev</button>
                <button onClick={() => { setMonth(startOfMonth(new Date())); }} className="rounded-full bg-gray-100 px-3 py-1 text-sm">Today</button>
                <button onClick={() => { setMonth(addMonths(month, 1)); }} className="rounded-full bg-gray-100 px-3 py-1 text-sm">Next</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} className="py-1 font-semibold text-gray-600">{d}</div>
              ))}
              {days.map((d, i) => {
                const inMonth = d.getMonth() === month.getMonth();
                const key = fmtDayKey(d);
                const cnt = map.get(key)?.length || 0;
                const isSel = selected && fmtDayKey(selected) === key;
                return (
                  <button key={i} onClick={() => setSelected(new Date(d))} className={`h-20 rounded-lg border p-1 text-left ${inMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'} ${isSel ? 'ring-2 ring-indigo-500' : 'ring-1 ring-gray-200'}`}>
                    <div className="text-[11px] font-semibold">{d.getDate()}</div>
                    {cnt > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Array.from({ length: Math.min(4, cnt) }).map((_, j) => (
                          <span key={j} className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        ))}
                        {cnt > 4 && <span className="text-[10px] text-gray-500">+{cnt - 4}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right rail: events list */}
          <div>
            <div className="mb-2 text-lg font-semibold">{selected ? selected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Selected Day'}</div>
            {source === 'ics-empty' && (
              <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">
                No events returned from your school feed yet. If this looks wrong, share your ICS URL and we’ll map it.
                {debug && (<span className="ml-2 text-amber-700/70">status {debug.status}, bytes {debug.length}</span>)}
              </div>
            )}
            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
            ) : (
              <ul className="space-y-2 text-sm">
                {(map.get(selected ? fmtDayKey(selected) : fmtDayKey(new Date())) || []).map((ev) => {
                  const st = new Date(ev.start);
                  const en = ev.end ? new Date(ev.end) : null;
                  const hh = (n: number) => n.toString().padStart(2, '0');
                  const time = `${hh(st.getHours())}:${hh(st.getMinutes())}${en ? ' - ' + hh(en.getHours()) + ':' + hh(en.getMinutes()) : ''}`;
                  return (
                    <li key={ev.uid} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="font-semibold text-gray-900">{ev.title}</div>
                      <div className="text-xs text-gray-600">{time}{ev.location ? ` • ${ev.location}` : ''}</div>
                    </li>
                  );
                })}
                {((map.get(selected ? fmtDayKey(selected) : fmtDayKey(new Date())) || []).length === 0) && (
                  <li className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">No events for this day.</li>
                )}
              </ul>
            )}
            <div className="mt-4 text-right">
              <button onClick={onClose} className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
