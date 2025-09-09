"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStudyStore } from "@/lib/study/store";

type Mode = "focus" | "short" | "long";

const MODE_META: Record<Mode, { label: string; bg: string; chip: string; accent: string }> = {
  focus: { label: "Focus", bg: "from-rose-50 to-rose-100", chip: "bg-rose-100 text-rose-800", accent: "#f43f5e" },
  short: { label: "Short Break", bg: "from-emerald-50 to-emerald-100", chip: "bg-emerald-100 text-emerald-800", accent: "#10b981" },
  long: { label: "Long Break", bg: "from-sky-50 to-sky-100", chip: "bg-sky-100 text-sky-800", accent: "#0284c7" },
};

export default function FloatingTimerClean({ open, onClose }: { open: boolean; onClose: () => void }) {
  const slug = useStudyStore((s) => s.slug);
  const sessionId = useStudyStore((s) => s.sessionId);
  const sharedEndAt = useStudyStore((s) => s.sharedEndAt);
  const setSharedEndAt = useStudyStore((s) => s.setSharedEndAt);

  const [mode, setMode] = useState<Mode>("focus");
  const [preset, setPreset] = useState<{ focus: number; short: number; long: number }>({ focus: 25, short: 5, long: 15 });
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [, setTick] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number; dragging: boolean }>({ dx: 0, dy: 0, dragging: false });

  // rAF ticker
  useEffect(() => {
    if (!open) return;
    const loop = () => { setTick((t) => (t + 1) % 1000000); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [open]);

  // Load persisted mode/pos/preset
  useEffect(() => {
    if (!open) return;
    try {
      const m = localStorage.getItem("vl_timer_mode") as Mode | null;
      if (m === "focus" || m === "short" || m === "long") setMode(m);
      const p = localStorage.getItem("vl_timer_pos");
      if (p) { const obj = JSON.parse(p); if (obj && typeof obj.x === 'number' && typeof obj.y === 'number') setPos(obj); }
      const pr = localStorage.getItem("vl_timer_preset");
      if (pr) { const o = JSON.parse(pr); if (o && typeof o.focus==='number' && typeof o.short==='number' && typeof o.long==='number') setPreset(o); }
    } catch {}
  }, [open]);
  useEffect(() => { try { localStorage.setItem("vl_timer_mode", mode); } catch {} }, [mode]);
  useEffect(() => { if (pos) { try { localStorage.setItem("vl_timer_pos", JSON.stringify(pos)); } catch {} } }, [pos]);
  useEffect(() => { try { localStorage.setItem("vl_timer_preset", JSON.stringify(preset)); } catch {} }, [preset]);

  const remainingMs = useMemo(() => {
    const now = Date.now();
    if (running && target) return Math.max(0, target - now);
    if (sharedEndAt && !running) return Math.max(0, new Date(sharedEndAt).getTime() - now);
    return 0;
  }, [running, target, sharedEndAt]);

  const baseMin = mode === 'focus' ? preset.focus : (mode === 'short' ? preset.short : preset.long);
  const [mm, ss] = useMemo(() => {
    const ms = remainingMs || baseMin * 60 * 1000;
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return [String(m).padStart(2, '0'), String(s).padStart(2, '0')];
  }, [remainingMs, baseMin]);

  // Initial pos
  useEffect(() => {
    if (!open || pos) return;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    setPos({ x: Math.max(16, w - 420), y: Math.max(16, Math.round(h / 2 - 220)) });
  }, [open, pos]);

  // Drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, dragging: true };
    e.preventDefault();
  }, []);
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current.dragging) return;
      const w = window.innerWidth; const h = window.innerHeight;
      const el = cardRef.current; const cw = el ? el.offsetWidth : 360; const ch = el ? el.offsetHeight : 440;
      let nx = e.clientX - dragRef.current.dx; let ny = e.clientY - dragRef.current.dy;
      nx = Math.min(Math.max(8, nx), w - cw - 8); ny = Math.min(Math.max(8, ny), h - ch - 8);
      setPos({ x: nx, y: ny });
    }
    function onUp() { dragRef.current.dragging = false; }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const startLocal = useCallback(() => {
    const tgt = Date.now() + baseMin * 60 * 1000; setTarget(tgt); setRunning(true);
  }, [baseMin]);
  const pauseLocal = useCallback(() => setRunning(false), []);
  const shareTimer = useCallback(async (mins?: number) => {
    if (!slug) return; const m = typeof mins === 'number' ? mins : baseMin;
    const tgtIso = new Date(Date.now() + m * 60 * 1000).toISOString();
    setSharedEndAt(tgtIso);
    await fetch(`/api/study/sessions/${encodeURIComponent(slug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ sharedEndAt: tgtIso }) }).catch(()=>{});
  }, [slug, baseMin, setSharedEndAt]);

  if (!open || !pos) return null;
  const meta = MODE_META[mode]; const accent = meta.accent;

  const card = (
    <div ref={cardRef} className={`fixed z-[70] w-[360px] sm:w-[420px] overflow-hidden rounded-[28px] bg-gradient-to-b ${meta.bg} p-4 shadow-2xl ring-1 ring-black/5`} style={{ left: pos.x, top: pos.y }}>
      <div className="mb-2 flex cursor-grab items-center justify-between active:cursor-grabbing" onMouseDown={onMouseDown}>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1Zm.75 5h-1.5v6l5.25 3.15.75-1.23-4.5-2.67Z"/></svg>
          {meta.label}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('focus')} className={`h-7 w-7 rounded-full ring-2 ${mode==='focus'?'ring-rose-400 bg-rose-200':'ring-rose-200 bg-white'}`} title="Focus" />
          <button onClick={() => setMode('short')} className={`h-7 w-7 rounded-full ring-2 ${mode==='short'?'ring-emerald-400 bg-emerald-200':'ring-emerald-200 bg-white'}`} title="Short" />
          <button onClick={() => setMode('long')} className={`h-7 w-7 rounded-full ring-2 ${mode==='long'?'ring-sky-400 bg-sky-200':'ring-sky-200 bg-white'}`} title="Long" />
          <button onClick={onClose} className="ml-1 rounded-full px-2 py-1 text-sm text-gray-600 hover:bg-white/70">×</button>
        </div>
      </div>

      <div className="mt-3 grid place-items-center">
        <div className="text-center">
          <div className="font-black tabular-nums leading-none tracking-tight drop-shadow-sm" style={{ fontSize: '92px', color: accent }}>{mm}</div>
          <div className="-mt-2 font-black tabular-nums leading-none tracking-tight drop-shadow-sm" style={{ fontSize: '92px', color: accent }}>{ss}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <MenuButton
          onSave={(vals)=>setPreset(vals)}
          initial={preset}
          onUseCode={async(code)=>{
            const id = decodeRoomCode(code); if (!id) return alert('Invalid code');
            const r = await fetch(`/api/study/sessions/by-id/${id}`); if (!r.ok) return alert('Code not found');
            const j = await r.json(); const s = j?.data?.slug; if (!s) return alert('Code invalid');
            await fetch(`/api/study/sessions/${encodeURIComponent(s)}/join`, { method:'PATCH', credentials:'include' });
            window.location.href = `/study-rooms/${s}`;
          }}
          myCode={typeof sessionId === 'number' && sessionId>0 ? encodeRoomCode(sessionId) : null}
        />
        {running ? (
          <button onClick={pauseLocal} className="rounded-2xl px-4 py-2 text-white shadow hover:opacity-90" style={{ backgroundColor: accent }}>Pause</button>
        ) : (
          <button onClick={() => { startLocal(); if (slug) shareTimer(baseMin); }} className="rounded-2xl px-4 py-2 text-white shadow hover:opacity-90" style={{ backgroundColor: accent }}>Start</button>
        )}
        <button onClick={() => setTarget(null)} className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-gray-700 backdrop-blur hover:bg-white">Skip</button>
      </div>

      {slug && (
        <div className="mt-3 text-center">
          <button onClick={()=>shareTimer()} className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-black/15">Share to Room</button>
        </div>
      )}
    </div>
  );
  return createPortal(card, document.body);
}

function encodeRoomCode(id: number) { return 'S' + id.toString(36).toUpperCase(); }
function decodeRoomCode(s: string): number | null { const t = s.trim().toUpperCase(); if (!/^S[0-9A-Z]+$/.test(t)) return null; try { return parseInt(t.slice(1), 36); } catch { return null; } }

function MenuButton({ onSave, initial, onUseCode, myCode }: { onSave: (v:{focus:number;short:number;long:number})=>void; initial: {focus:number;short:number;long:number}; onUseCode: (code:string)=>void; myCode: string | null }) {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(initial.focus);
  const [short, setShort] = useState(initial.short);
  const [long, setLong] = useState(initial.long);
  const [code, setCode] = useState("");
  useEffect(()=>{ setFocus(initial.focus); setShort(initial.short); setLong(initial.long); }, [initial.focus, initial.short, initial.long]);
  return (
    <div className="relative">
      <button className="rounded-2xl bg-white/70 px-3 py-2 text-sm text-gray-700 backdrop-blur hover:bg-white" onClick={()=>setOpen(o=>!o)}>...</button>
      {open && (
        <div className="absolute left-1/2 z-[80] mt-2 w-[260px] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-2 text-xs font-semibold text-gray-700">Presets (minutes)</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <label className="block"><span className="mb-1 block text-gray-600">Focus</span><input type="number" min={1} className="w-full rounded border border-gray-300 p-1.5" value={focus} onChange={e=>setFocus(Math.max(1, Number(e.target.value)||1))}/></label>
            <label className="block"><span className="mb-1 block text-gray-600">Short</span><input type="number" min={1} className="w-full rounded border border-gray-300 p-1.5" value={short} onChange={e=>setShort(Math.max(1, Number(e.target.value)||1))}/></label>
            <label className="block"><span className="mb-1 block text-gray-600">Long</span><input type="number" min={1} className="w-full rounded border border-gray-300 p-1.5" value={long} onChange={e=>setLong(Math.max(1, Number(e.target.value)||1))}/></label>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="text-gray-600">Room Code</div>
            <div className="font-mono text-gray-900">{myCode ?? '—'}</div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input className="flex-1 rounded border border-gray-300 p-1.5 text-xs" placeholder="Enter code" value={code} onChange={e=>setCode(e.target.value)} />
            <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white" onClick={()=>onUseCode(code)}>Join</button>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="rounded bg-gray-100 px-2 py-1 text-xs" onClick={()=>setOpen(false)}>Close</button>
            <button className="ml-2 rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white" onClick={()=>{ onSave({ focus, short, long }); setOpen(false); }}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

