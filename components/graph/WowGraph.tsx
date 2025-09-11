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

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then(r => r.json())
      .then(j => { if (!cancelled) setData(j); })
      .catch(e => { if (!cancelled) setErr(String(e)); });
    return () => { cancelled = true; };
  }, [src]);

  const fgData = useMemo(() => {
    if (!data) return null;
    const nodes = data.nodes.map(n => ({ id: n.id, name: n.label, courseId: n.courseId }));
    const links = data.edges.map(e => ({ source: e.source, target: e.target }));
    return { nodes, links } as any;
  }, [data]);

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
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.004}
      linkColor={(l: any) => "rgba(99,102,241,0.5)"}
      linkCurvature={(l: any) => 0.25}
      nodeRelSize={4}
      nodeColor={(n: any) => colorForCourse(n.courseId)}
      nodeLabel={(n: any) => n.name}
      enablePanInteraction
      enableZoomInteraction
      width={undefined}
      height={undefined}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

