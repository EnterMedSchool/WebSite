"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

// react-force-graph-2d must be dynamically imported (no SSR)
// Explicitly resolve the default export to avoid "element type is invalid" issues in prod
const ForceGraph2D = dynamic(() => import("react-force-graph-2d").then(m => m.default), { ssr: false }) as any;

type GraphJSON = {
  nodes: { id: string; label: string; slug?: string; courseId?: number }[];
  edges: { id: string; source: string; target: string }[];
  meta?: any;
};

type Manifest = {
  version: number;
  courses: { id: number; slug: string; title: string; size: number; x: number; y: number; r: number }[];
  cross: { from: number; to: number; count: number }[];
};

export default function WowGraph({ src = "/graph/v1/graph.json" }: { src?: string }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [mode, setMode] = useState<"pending"|"sharded"|"full">("pending");
  useEffect(() => {
    let cancelled = false;
    fetch(src.replace("graph.json","manifest.json"))
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(j => { if (!cancelled) { setManifest(j); setMode("sharded"); } })
      .catch(() => { if (!cancelled) setMode("full"); });
    return () => { cancelled = true; };
  }, [src]);
  if (mode === 'pending') return <div className="p-4 text-gray-500">Loading…</div>;
  if (mode === 'sharded' && manifest) return <WowShardedGraph baseSrc={src.replace("graph.json","")} manifest={manifest}/>;
  return <WowFullGraph src={src}/>;
}

function WowFullGraph({ src }: { src: string }) {
  const [data, setData] = useState<GraphJSON | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<any>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<any | null>(null);
  const mouse = useRef<{x:number;y:number}>({x:0,y:0});
  const tRef = useRef(0);

  // Load static data
  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then(r => r.json())
      .then(j => { if (!cancelled) setData(j); })
      .catch(e => { if (!cancelled) setErr(String(e)); });
    return () => { cancelled = true; };
  }, [src]);

  // Dev augmentation: if dataset small, synthesize ~100 lessons to play with
  const augmented = useMemo<GraphJSON | null>(() => {
    if (!data) return null;
    const DEV = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).has('dev') || process.env.NODE_ENV !== 'production');
    if (!DEV) return data;
    if (data.nodes.length >= 80) return data;
    // Deterministic pseudo-random for stable builds
    let seed = 42; const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const nodes = data.nodes.slice();
    const edges = data.edges.slice();
    const startId = nodes.length ? Math.max(...nodes.map(n => Number(n.id) || 0)) + 1 : 1;
    const targetCount = 140; // total nodes including originals
    const courseCount = 5;
    const cats = ['anatomy','physiology','biochem','path','pharm'];
    for (let i = startId; i < targetCount + 1; i++) {
      nodes.push({ id: String(i), label: `Lesson ${i}` as any, courseId: 1 + Math.floor(rand() * courseCount), category: cats[Math.floor(rand()*cats.length)] } as any);
      // add 1-3 prerequisites among previous 20 nodes to ensure DAG
      const prereqCandidates = [] as number[];
      for (let k = Math.max(1, i - 20); k < i; k++) prereqCandidates.push(k);
      const prereqNum = 1 + Math.floor(rand() * 3);
      for (let t = 0; t < prereqNum && prereqCandidates.length; t++) {
        const j = Math.floor(rand() * prereqCandidates.length);
        const src = prereqCandidates.splice(j, 1)[0];
        edges.push({ id: `e${src}-${i}-${t}` as any, source: String(src), target: String(i) });
      }
    }
    return { ...data, nodes, edges };
  }, [data]);

  // Build runtime graph data for force-graph (objects are mutated by the lib)
  const fgData = useMemo(() => {
    if (!augmented) return null as any;
    // Randomly mark ~35% as completed for demo
    let seed = 7; const rand = () => (seed = (seed * 1103515245 + 12345) % 4294967296) / 4294967296;
    const nodes = augmented.nodes.map((n: any) => ({
      id: n.id,
      name: n.label,
      courseId: n.courseId,
      completed: rand() < 0.35,
      href: n.href || (n.slug ? `/lesson/${n.slug}` : undefined),
      lengthMin: n.lengthMin,
      excerpt: n.excerpt,
      courseSlug: n.courseSlug,
      courseTitle: n.courseTitle,
      slug: n.slug,
      category: n.category,
    }));
    const links = augmented.edges.map(e => ({ id: e.id, source: e.source, target: e.target }));
    return { nodes, links } as any;
  }, [augmented]);

  // Precompute incoming adjacency for fast ancestor traversal
  const inMap = useMemo(() => {
    if (!augmented) return null as Map<string, string[]> | null;
    const m = new Map<string, string[]>();
    for (const e of augmented.edges) {
      const tgt = String(e.target);
      const src = String(e.source);
      const arr = m.get(tgt) || [];
      arr.push(src);
      m.set(tgt, arr);
    }
    return m;
  }, [augmented]);

  // Highlight computation
  useEffect(() => {
    if (!fgData || !inMap) return;
    const nodes = fgData.nodes as any[];
    const links = fgData.links as any[];
    // reset
    nodes.forEach(n => { n.__on = false; });
    links.forEach(l => { l.__on = false; l.__tier = undefined; });
    if (!focus) return;
    // BFS on reversed edges: compute depth to focus
    const depth = new Map<string, number>();
    const q: string[] = [focus];
    depth.set(focus, 0);
    while (q.length) {
      const t = q.shift()!;
      const d = depth.get(t)!;
      const parents = inMap.get(t) || [];
      for (const p of parents) if (!depth.has(p)) { depth.set(p, d + 1); q.push(p); }
    }
    // mark nodes
    nodes.forEach(n => { if (depth.has(String(n.id))) n.__on = true; });
    // mark edges on path: parent -> child where depth[parent] = depth[child]+1
    links.forEach(l => {
      const s = String((l.source as any)?.id ?? (l as any).source);
      const t = String((l.target as any)?.id ?? (l as any).target);
      const ds = depth.get(s); const dt = depth.get(t);
      (l as any).__tier = dt;
      if (ds !== undefined && dt !== undefined && ds === dt + 1) l.__on = true; else l.__on = false;
    });

    // Emit a wave of particles along the whole chain tier-by-tier so long paths animate
    const maxTier = Math.max(...Array.from(depth.values()));
    let step = 0;
    const tick = () => {
      if (!ref.current) return;
      for (const l of links as any[]) {
        if (!l.__on) continue;
        if ((l.__tier ?? 0) === step) {
          try {
            ref.current.emitParticle(l);
            ref.current.emitParticle(l);
            ref.current.emitParticle(l);
          } catch {}
        }
      }
      step = (step + 1) % Math.max(1, maxTier + 1);
    };
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [focus, fgData, inMap]);

  // Camera fit on first render
  useEffect(() => {
    if (!ref.current || !fgData) return;
    const t = setTimeout(() => ref.current.zoomToFit(400, 50), 0);
    return () => clearTimeout(t);
  }, [fgData]);

  // Continuous rope animation
  useEffect(() => {
    let raf: number;
    const loop = () => {
      tRef.current += 0.02;
      if (ref.current) ref.current.refresh();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (err) return <div className="p-4 text-red-600">Failed to load: {err}</div>;
  if (!fgData) return <div className="p-4 text-gray-500">Loading…</div>;

  function colorForCourse(courseId?: number, category?: string) {
    if (category) {
      const catColors: Record<string,string> = {
        anatomy: '#ff6b6b', physiology: '#34d399', biochem: '#60a5fa', path: '#f59e0b', pharm: '#a78bfa'
      };
      return catColors[category] || '#e5e7eb';
    }
    if (!courseId) return "#9aa3af";
    const hues = [0, 24, 48, 72, 96, 150, 180, 210, 260, 300];
    const h = hues[Math.abs(courseId) % hues.length];
    return `hsl(${h} 80% 60%)`;
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={(e) => { const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect(); mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }; }}
    >
      <ForceGraph2D
        ref={ref}
        graphData={fgData}
        cooldownTicks={200}
        linkColor={(l: any) => (l.__on ? "rgba(245,158,11,0.9)" : "rgba(99,102,241,0.15)")}
        linkDirectionalParticles={(l: any) => (l.__on ? 2 : 0)}
        linkDirectionalParticleWidth={(l: any) => (l.__on ? 2.0 : 0)}
        linkDirectionalParticleSpeed={(l: any) => (l.__on ? 0.01 : 0)}
        nodeRelSize={5}
        nodeLabel={(n: any) => ""}
        onNodeClick={(n: any) => setFocus(String(n.id))}
        onNodeHover={(n: any) => setHover(n || null)}
        enablePanInteraction
        enableZoomInteraction
        width={undefined}
        height={undefined}
        style={{ width: "100%", height: "100%" }}
        // Rope-like bezier with wobble
        linkCanvasObjectMode={() => "replace"}
        linkCanvasObject={(l: any, ctx: CanvasRenderingContext2D, scale: number) => {
          const s = (l.source as any); const t = (l.target as any);
          if (!s || !t) return;
          const x1 = s.x, y1 = s.y, x2 = t.x, y2 = t.y;
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.max(1, Math.hypot(dx, dy));
          const nx = -dy / len, ny = dx / len; // normal
          const baseAmp = Math.min(20, len * 0.08) / Math.sqrt(scale);
          const amp = (l.__on ? baseAmp : baseAmp * 0.5);
          const phase = tRef.current * (l.__on ? 1.2 : 0.6) + (l.__tier || 0) * 0.5;
          const cx = (x1 + x2) / 2 + nx * amp * Math.sin(phase);
          const cy = (y1 + y2) / 2 + ny * amp * Math.sin(phase);
          // Base track (dim)
          ctx.lineWidth = (l.__on ? 3 : 1.2) / Math.sqrt(scale);
          ctx.strokeStyle = (l.__on ? "rgba(16,185,129,0.3)" : "rgba(99,102,241,0.12)");
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx, cy, x2, y2);
          ctx.stroke();
          // XP fill overlay
          if (l.__on) {
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, "#34d399");
            grad.addColorStop(0.5, "#a7f3d0");
            grad.addColorStop(1, "#34d399");
            ctx.strokeStyle = grad;
            ctx.lineWidth = 4 / Math.sqrt(scale);
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 12;
            // dash animation to simulate fill motion
            ctx.setLineDash([len * 0.25, len]);
            const offset = (1 - ((tRef.current * 40 + (l.__tier || 0) * 120) % (len)))
            ctx.lineDashOffset = offset;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cx, cy, x2, y2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
          }
        }}
        // Custom node draw with completion ring and checkmark
        nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, scale: number) => {
          const r = 4 + (n.__on || !focus ? 3 : 1);
          const color = n.completed ? "#22c55e" : (n.__on || !focus ? colorForCourse(n.courseId, n.category) : "#475569");
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
          // ring
          ctx.lineWidth = 2 / Math.sqrt(scale);
          ctx.strokeStyle = n.__on ? "#34d399" : "rgba(148,163,184,0.25)";
          ctx.stroke();
          // checkmark if completed
          if (n.completed) {
            ctx.strokeStyle = "white"; ctx.lineWidth = 2 / Math.sqrt(scale); ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(n.x - r * 0.6, n.y + r * 0.05);
            ctx.lineTo(n.x - r * 0.15, n.y + r * 0.5);
            ctx.lineTo(n.x + r * 0.7, n.y - r * 0.4);
            ctx.stroke();
          }
        }}
      />

      {hover && (
        <div
          style={{ left: mouse.current.x + 14, top: mouse.current.y + 14 }}
          className="pointer-events-none absolute z-10 w-72 rounded-xl border border-black/5 bg-white/95 p-3 text-xs shadow-xl ring-1 ring-black/10 backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${hover.completed ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
            <div className="font-semibold text-gray-900 truncate">{hover.name}</div>
          </div>
          {hover.courseTitle && (
            <div className="mt-0.5 text-[11px] text-gray-500">{hover.courseTitle}{hover.lengthMin ? ` • ${hover.lengthMin} min` : ''}</div>
          )}
          {hover.excerpt && (
            <div className="mt-2 line-clamp-4 text-[11px] text-gray-600">{hover.excerpt}</div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className={`text-[11px] ${hover.completed ? 'text-green-600' : 'text-gray-600'}`}>{hover.completed ? 'Completed' : 'Not completed'}</div>
            {hover.href && (
              <a href={hover.href} className="pointer-events-auto rounded-full bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700">Open</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================
// Sharded animated viewer
// =========================
function WowShardedGraph({ baseSrc, manifest }: { baseSrc: string; manifest: Manifest }) {
  const ref = useRef<any>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<any | null>(null);
  const mouse = useRef<{x:number;y:number}>({x:0,y:0});
  const tRef = useRef(0);

  // Graph state
  const [nodes, setNodes] = useState<any[]>(() => manifest.courses.map(c => ({ id: `c:${c.id}`, course: true, courseId: c.id, name: c.title, x: c.x, y: c.y, fx: c.x, fy: c.y })));
  const [links, setLinks] = useState<any[]>(() => manifest.cross.map((e, i) => ({ id:`ce:${i}`, source: `c:${e.from}`, target: `c:${e.to}`, weight: e.count })));

  // Incoming adjacency for lessons only
  const inMapRef = useRef<Map<string,string[]>>(new Map());

  // helpers
  function colorForCourse(courseId?: number) {
    if (!courseId) return "#9aa3af";
    const hues = [0,24,48,72,96,150,180,210,260,300];
    const h = hues[Math.abs(courseId)%hues.length];
    return `hsl(${h} 70% 52%)`;
  }

  // expand a course into its lessons
  async function expandCourse(courseId: number) {
    const existing = nodes.find(n => n.id === `c:${courseId}`);
    if (!existing) return; // already expanded
    const res = await fetch(`${baseSrc}course-${courseId}.json`);
    const data: GraphJSON = await res.json();
    // remove the course node and any aggregated cross links touching it
    const center = manifest.courses.find(c => c.id === courseId);
    const cx = center?.x ?? 0; const cy = center?.y ?? 0;
    const jitter = 60;
    setNodes(prev => prev.filter(n => n.id !== `c:${courseId}`).concat(
      data.nodes.map((n:any) => ({ id: n.id, name: n.label, courseId: n.courseId, href: n.slug ? `/lesson/${n.slug}`:undefined, x: cx + (Math.random()*2-1)*jitter, y: cy + (Math.random()*2-1)*jitter }))
    ));
    setLinks(prev => prev.filter(l => l.source !== `c:${courseId}` && l.target !== `c:${courseId}`).concat(
      data.edges.map((e:any) => ({ id: e.id, source: e.source, target: e.target }))
    ));
    // update inMap
    for (const e of data.edges) {
      const arr = inMapRef.current.get(String(e.target)) || [];
      arr.push(String(e.source));
      inMapRef.current.set(String(e.target), arr);
    }
  }

  // rope refresh
  useEffect(() => {
    let raf:number; const loop=()=>{ tRef.current += 0.02; if (ref.current) ref.current.refresh(); raf=requestAnimationFrame(loop);}; raf=requestAnimationFrame(loop); return ()=>cancelAnimationFrame(raf);
  }, []);

  // highlight computation (lessons only, among loaded ones)
  useEffect(() => {
    if (!focus) return; if (!ref.current) return;
    const depth = new Map<string,number>(); const q=[focus]; depth.set(focus,0);
    while(q.length){ const t=q.shift()!; const d=depth.get(t)!; const parents=inMapRef.current.get(t)||[]; for(const p of parents) if(!depth.has(p)){ depth.set(p,d+1); q.push(p);} }
    // wave along links
    let step=0; const maxTier=Math.max(...Array.from(depth.values()));
    const id=setInterval(()=>{ if(!ref.current) return; (links as any[]).forEach((l:any)=>{ const s=String((l.source as any)?.id ?? l.source); const t=String((l.target as any)?.id ?? l.target); const ds=depth.get(s); const dt=depth.get(t); l.__on = ds!==undefined && dt!==undefined && ds===dt+1; l.__tier = dt; if(l.__on && (l.__tier??0)===step){ try{ ref.current.emitParticle(l); ref.current.emitParticle(l);}catch{} } }); step=(step+1)%Math.max(1,maxTier+1); },250);
    return ()=>clearInterval(id);
  }, [focus, links]);

  // fit on first render
  useEffect(()=>{ if(!ref.current) return; const t=setTimeout(()=>ref.current.zoomToFit(400,50),0); return ()=>clearTimeout(t); }, []);

  return (
    <div className="relative h-full w-full" onMouseMove={(e)=>{const r=(e.currentTarget as HTMLDivElement).getBoundingClientRect(); mouse.current={x:e.clientX-r.left,y:e.clientY-r.top};}}>
      <ForceGraph2D
        ref={ref}
        graphData={{ nodes, links }}
        cooldownTicks={0}
        enableNodeDrag
        d3VelocityDecay={0.9}
        linkColor={(l:any)=> l.__on ? "rgba(245,158,11,0.9)" : "rgba(99,102,241,0.15)"}
        linkDirectionalParticles={(l:any)=> l.__on ? 2 : 0}
        linkDirectionalParticleWidth={(l:any)=> l.__on ? 2.0 : 0}
        linkDirectionalParticleSpeed={(l:any)=> l.__on ? 0.01 : 0}
        nodeRelSize={5}
        nodeLabel={(n:any)=> n.course ? n.name : ""}
        onNodeClick={(n:any)=>{ if(n.course) expandCourse(n.courseId); else setFocus(String(n.id)); }}
        onNodeHover={(n:any)=> setHover(n || null)}
        linkCanvasObjectMode={()=>"replace"}
        linkCanvasObject={(l:any, ctx:CanvasRenderingContext2D, scale:number)=>{ const s=(l.source as any); const t=(l.target as any); if(!s||!t) return; const x1=s.x,y1=s.y,x2=t.x,y2=t.y; const dx=x2-x1,dy=y2-y1; const len=Math.max(1,Math.hypot(dx,dy)); const nx=-dy/len, ny=dx/len; const baseAmp=Math.min(20,len*0.08)/Math.sqrt(scale); const amp=l.__on?baseAmp:baseAmp*0.5; const phase=tRef.current*(l.__on?1.2:0.6)+(l.__tier||0)*0.5; const cx=(x1+x2)/2 + nx*amp*Math.sin(phase); const cy=(y1+y2)/2 + ny*amp*Math.sin(phase); ctx.lineWidth=(l.__on?2.5:1)/Math.sqrt(scale); ctx.strokeStyle=l.__on?"rgba(245,158,11,0.9)":"rgba(99,102,241,0.15)"; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(cx,cy,x2,y2); ctx.stroke(); }}
        nodeCanvasObject={(n:any, ctx:CanvasRenderingContext2D, scale:number)=>{ if(n.course){ const r=8; ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fillStyle="#ffffff"; ctx.fill(); ctx.lineWidth=2/Math.sqrt(scale); ctx.strokeStyle=colorForCourse(n.courseId); ctx.stroke(); ctx.fillStyle="#111827"; ctx.font=`${12/Math.sqrt(scale)}px Inter, system-ui`; ctx.textAlign="left"; ctx.textBaseline="middle"; ctx.fillText(n.name, n.x + r + 4, n.y); return; } const r=4 + 2; const color = n.completed ? "#22c55e" : colorForCourse(n.courseId); ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2/Math.sqrt(scale); ctx.strokeStyle = n.__on?"#f59e0b":"rgba(0,0,0,0.08)"; ctx.stroke(); if(n.completed){ ctx.strokeStyle="white"; ctx.lineWidth=2/Math.sqrt(scale); ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(n.x-r*0.6,n.y+r*0.05); ctx.lineTo(n.x-r*0.15,n.y+r*0.5); ctx.lineTo(n.x+r*0.7,n.y-r*0.4); ctx.stroke(); } }}
        width={undefined}
        height={undefined}
        style={{ width:"100%", height:"100%" }}
      />

      {hover && !hover.course && (
        <div style={{ left: mouse.current.x + 14, top: mouse.current.y + 14 }} className="pointer-events-none absolute z-10 w-72 rounded-xl border border-black/5 bg-white/95 p-3 text-xs shadow-xl ring-1 ring-black/10 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${hover.completed ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
            <div className="font-semibold text-gray-900 truncate">{hover.name}</div>
          </div>
          {hover.courseTitle && (<div className="mt-0.5 text-[11px] text-gray-500">{hover.courseTitle}{hover.lengthMin ? ` • ${hover.lengthMin} min` : ''}</div>)}
          {hover.excerpt && (<div className="mt-2 line-clamp-4 text-[11px] text-gray-600">{hover.excerpt}</div>)}
          <div className="mt-2 flex items-center justify-between">
            <div className={`text-[11px] ${hover.completed ? 'text-green-600' : 'text-gray-600'}`}>{hover.completed ? 'Completed' : 'Not completed'}</div>
            {hover.href && (<a href={hover.href} className="pointer-events-auto rounded-full bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700">Open</a>)}
          </div>
        </div>
      )}
    </div>
  );
}
