"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

// react-force-graph must be dynamically imported (no SSR)
const ForceGraph2D = dynamic(() => import("react-force-graph").then(m => m.ForceGraph2D), { ssr: false }) as any;

type GraphJSON = {
  nodes: { id: string; label: string; slug?: string; courseId?: number }[];
  edges: { id: string; source: string; target: string }[];
  meta?: any;
};

export default function WowGraph({ src = "/graph/v1/graph.json" }: { src?: string }) {
  const [data, setData] = useState<GraphJSON | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<any>(null);
  const [focus, setFocus] = useState<string | null>(null);

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
    const targetCount = 120; // total nodes including originals
    const courseCount = 5;
    for (let i = startId; i < targetCount + 1; i++) {
      nodes.push({ id: String(i), label: `Lesson ${i}`, courseId: 1 + Math.floor(rand() * courseCount) });
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
    const nodes = augmented.nodes.map(n => ({ id: n.id, name: n.label, courseId: n.courseId }));
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
    links.forEach(l => { l.__on = false; });
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
      const s = String((l.source as any).id ?? l.source);
      const t = String((l.target as any).id ?? l.target);
      const ds = depth.get(s); const dt = depth.get(t);
      if (ds !== undefined && dt !== undefined && ds === dt + 1) l.__on = true; else l.__on = false;
    });
  }, [focus, fgData, inMap]);

  // Camera fit on first render
  useEffect(() => {
    if (!ref.current || !fgData) return;
    const t = setTimeout(() => ref.current.zoomToFit(400, 50), 0);
    return () => clearTimeout(t);
  }, [fgData]);

  if (err) return <div className="p-4 text-red-600">Failed to load: {err}</div>;
  if (!fgData) return <div className="p-4 text-gray-500">Loading…</div>;

  function colorForCourse(courseId?: number) {
    if (!courseId) return "#9aa3af";
    const hues = [0, 24, 48, 72, 96, 150, 180, 210, 260, 300];
    const h = hues[Math.abs(courseId) % hues.length];
    return `hsl(${h} 70% 52%)`;
  }

  return (
    <ForceGraph2D
      ref={ref}
      graphData={fgData}
      cooldownTicks={200}
      linkCurvature={(l: any) => (l.__on ? 0.35 : 0.2)}
      linkColor={(l: any) => (l.__on ? "rgba(245,158,11,0.9)" : "rgba(99,102,241,0.25)")}
      linkDirectionalParticles={(l: any) => (l.__on ? 4 : 0)}
      linkDirectionalParticleWidth={(l: any) => (l.__on ? 3 : 0)}
      linkDirectionalParticleSpeed={(l: any) => (l.__on ? 0.006 : 0)}
      nodeRelSize={4}
      nodeColor={(n: any) => (n.__on || !focus ? colorForCourse(n.courseId) : "#e5e7eb")}
      nodeLabel={(n: any) => n.name}
      onNodeClick={(n: any) => setFocus(String(n.id))}
      enablePanInteraction
      enableZoomInteraction
      width={undefined}
      height={undefined}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
