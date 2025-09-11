"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings } from "react-sigma-v2";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { inferSettings as inferFA2 } from "graphology-layout-forceatlas2";
import "react-sigma-v2/lib/react-sigma-v2.css";

type GraphJSON = {
  version: number;
  nodes: { id: string; label: string; slug?: string; courseId?: number; x?: number; y?: number; size?: number }[];
  edges: { id: string; source: string; target: string; kind?: string }[];
  meta?: any;
};

type Manifest = {
  version: number;
  courses: { id: number; slug: string; title: string; size: number; x: number; y: number; r: number }[];
  cross: { from: number; to: number; count: number }[];
};

function useStaticGraph(url: string) {
  const [data, setData] = useState<GraphJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setData(j); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [url]);
  return { data, error };
}

function buildGraphology(data: GraphJSON) {
  const g = new Graph({ type: "directed", multi: false });
  for (const n of data.nodes) {
    g.addNode(n.id, {
      label: n.label,
      slug: n.slug,
      courseId: n.courseId,
      x: n.x ?? Math.random() * 1000,
      y: n.y ?? Math.random() * 1000,
      size: n.size ?? 2,
    });
  }
  for (const e of data.edges) g.addDirectedEdgeWithKey(e.id, e.source, e.target, { kind: e.kind ?? "required" });
  return g;
}

// Compute ancestor set (all prerequisites) for a node id using incoming edges
function computeAncestors(g: Graph, nodeId: string) {
  const visited = new Set<string>();
  const stack = [nodeId];
  // We'll collect edges that lie fully inside the visited ancestor set (excluding the starting node's outgoing)
  while (stack.length) {
    const t = stack.pop()!;
    // Traverse incoming edges: source -> t
    g.forEachInNeighbor(t, (src) => {
      if (!visited.has(src)) {
        visited.add(src);
        stack.push(src);
      }
    });
  }
  // Include the focus node for styling
  visited.add(nodeId);
  return visited;
}

// Palette by course id (deterministic)
function colorForCourse(courseId?: number) {
  if (!courseId) return "#9aa3af"; // gray
  const hues = [0, 24, 48, 72, 96, 150, 180, 210, 260, 300];
  const h = hues[Math.abs(courseId) % hues.length];
  return `hsl(${h} 70% 52%)`;
}

function GraphInner({ data }: { data: GraphJSON }) {
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const gRef = useRef<Graph | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  // Build the graph once
  useEffect(() => {
    const g = buildGraphology(data);
    // Base colors
    g.forEachNode((n, a) => {
      a.color = colorForCourse(a.courseId);
    });
    gRef.current = g;
    loadGraph(g);
    // Nice defaults
    setSettings({
      defaultNodeColor: "#607d8b",
      labelRenderedSizeThreshold: 6,
      labelDensity: 0.07,
      zIndex: true,
      allowInvalidContainer: true,
    });
    // Light force settle for nicer placement (fallback mode only)
    try {
      const iter = Math.min(200, Math.max(60, Math.floor(60000 / Math.max(1, g.order)))) as number; // fewer iterations when large
      setTimeout(() => forceAtlas2.assign(g, { iterations: iter, settings: inferFA2(g) as any }), 0);
    } catch {}
  }, [data, loadGraph, setSettings]);

  // Highlight via reducers
  const [highlightSet, setHighlightSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!gRef.current) return;
    if (!focus) { setHighlightSet(new Set()); return; }
    setHighlightSet(computeAncestors(gRef.current, focus));
  }, [focus]);

  // Register click events to update focus
  useRegisterEvents({
    clickNode: (e) => setFocus(e.node),
    clickStage: () => setFocus(null),
  });

  // Reducers configured through settings
  useEffect(() => {
    setSettings({
      nodeReducer: (n, data) => {
        if (!highlightSet.size) return data;
        const inSet = highlightSet.has(n);
        return {
          ...data,
          color: inSet ? (n === focus ? "#f59e0b" : data.color) : "#d1d5db",
          size: inSet ? (n === focus ? (data.size ?? 2) + 3 : (data.size ?? 2) + 1) : (data.size ?? 2) * 0.8,
          zIndex: inSet ? 2 : 0,
        } as any;
      },
      edgeReducer: (e, data) => {
        if (!highlightSet.size) return data;
        const g = gRef.current!;
        const s = g.source(e);
        const t = g.target(e);
        const onPath = highlightSet.has(s) && highlightSet.has(t);
        return {
          ...data,
          color: onPath ? "#f59e0b" : "#e5e7eb",
          size: onPath ? 2 : 0.5,
          hidden: !onPath,
        } as any;
      },
    });
  }, [highlightSet, focus, setSettings]);

  // Simple search box
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!gRef.current || !query) return [] as { id: string; label: string }[];
    const q = query.toLowerCase();
    const out: { id: string; label: string }[] = [];
    gRef.current.forEachNode((n, a) => {
      if ((a.label as string)?.toLowerCase().includes(q)) out.push({ id: n, label: a.label });
    });
    return out.slice(0, 10);
  }, [query]);

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full flex-col">
      <div className="z-10 m-2 flex gap-2 rounded-xl bg-white/90 p-2 shadow ring-1 ring-black/10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons…"
          className="w-72 rounded-md border px-2 py-1 text-sm"
        />
        {results.length > 0 && (
          <div className="absolute mt-8 max-h-64 w-96 overflow-y-auto rounded-md border bg-white p-2 text-sm shadow">
            {results.map((r) => (
              <div key={r.id} className="cursor-pointer rounded px-1 py-0.5 hover:bg-indigo-50" onClick={() => setFocus(r.id)}>
                {r.label}
              </div>
            ))}
          </div>
        )}
        {focus && (
          <div className="ml-4 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
            Showing prerequisites for: {gRef.current?.getNodeAttribute(focus, "label")}
          </div>
        )}
      </div>
      <div className="relative h-full w-full">
        <SigmaContainer style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}

export default function LearningGraph({ src = "/graph/v1/graph.json" }: { src?: string }) {
  // Try sharded mode first
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manErr, setManErr] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(src.replace("graph.json", "manifest.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((j) => { if (!cancelled) setManifest(j); })
      .catch((e) => { if (!cancelled) setManErr(String(e)); });
    return () => { cancelled = true; };
  }, [src]);

  if (manifest) return <ShardedGraph manifest={manifest} baseSrc={src.replace("graph.json", "")} />;
  if (!manErr) return <div className="p-4 text-gray-500">Loading graph…</div>;
  // Fallback to full graph if manifest not found
  const { data, error } = useStaticGraph(src);
  if (error) return <div className="p-4 text-red-600">Failed to load graph: {error}</div>;
  if (!data) return <div className="p-4 text-gray-500">Loading full graph…</div>;
  return <GraphInner data={data} />;
}

// =====================
// Sharded (by course) viewer
// =====================
function ShardedGraph({ manifest, baseSrc }: { manifest: Manifest; baseSrc: string }) {
  const loadGraph = useLoadGraph();
  const setSettings = useSetSettings();
  const gRef = useRef<Graph | null>(null);
  const expanded = useRef<Set<number>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);

  function colorForCourse(courseId?: number) {
    if (!courseId) return "#9aa3af";
    const hues = [0, 24, 48, 72, 96, 150, 180, 210, 260, 300];
    const h = hues[Math.abs(courseId) % hues.length];
    return `hsl(${h} 70% 52%)`;
  }

  useEffect(() => {
    const g = new Graph({ type: "directed" });
    // Course nodes
    for (const c of manifest.courses) {
      const id = `c:${c.id}`;
      g.addNode(id, {
        type: "course",
        label: c.title,
        courseId: c.id,
        size: Math.max(6, Math.log2(1 + c.size) * 3),
        x: c.x,
        y: c.y,
        color: colorForCourse(c.id),
      });
    }
    // Aggregated cross edges between courses
    let i = 0;
    for (const e of manifest.cross) {
      const k = `ce:${i++}`;
      const s = `c:${e.from}`;
      const t = `c:${e.to}`;
      if (g.hasNode(s) && g.hasNode(t)) {
        g.addDirectedEdgeWithKey(k, s, t, { size: Math.min(5, 0.5 + Math.log10(1 + e.count)), color: "#c0c4cc" });
      }
    }
    gRef.current = g;
    loadGraph(g);
    setSettings({
      labelRenderedSizeThreshold: 6,
      labelDensity: 0.07,
      zIndex: true,
      allowInvalidContainer: true,
      renderEdgeLabels: false,
    });
  }, [manifest, loadGraph, setSettings]);

  // Expand a course into its lessons
  async function expandCourse(courseId: number) {
    if (expanded.current.has(courseId)) return;
    const res = await fetch(`${baseSrc}course-${courseId}.json`);
    const data: GraphJSON = await res.json();
    const g = gRef.current!;
    const courseNodeId = `c:${courseId}`;
    const cx = g.getNodeAttribute(courseNodeId, "x");
    const cy = g.getNodeAttribute(courseNodeId, "y");
    const color = colorForCourse(courseId);
    g.dropNode(courseNodeId);
    // Add lessons
    for (const n of data.nodes) {
      g.addNode(n.id, {
        type: "lesson",
        label: n.label,
        slug: n.slug,
        courseId: n.courseId,
        x: n.x ?? cx + (Math.random() * 2 - 1) * 300,
        y: n.y ?? cy + (Math.random() * 2 - 1) * 300,
        size: 2,
        color,
      });
    }
    // Edges (within course only)
    for (const e of data.edges) g.addDirectedEdgeWithKey(e.id, e.source, e.target, { size: 0.8, color: "#d1d5db" });
    expanded.current.add(courseId);
    // Quick local FA2 settle for this course's nodes
    try {
      // Collect ids of nodes we just added
      const ids: string[] = [];
      for (const n of data.nodes) ids.push(n.id);
      // Run FA2 on a temporary subgraph for better speed
      const sub = new Graph({ type: "directed" });
      for (const id of ids) sub.addNode(id, { x: g.getNodeAttribute(id, "x"), y: g.getNodeAttribute(id, "y") });
      for (const e of data.edges) if (sub.hasNode(e.source) && sub.hasNode(e.target)) sub.addDirectedEdge(e.source, e.target);
      forceAtlas2.assign(sub, { iterations: Math.min(200, 40 + Math.floor(ids.length / 4)), settings: inferFA2(sub) as any });
      sub.forEachNode((id, a) => { g.setNodeAttribute(id, "x", a.x); g.setNodeAttribute(id, "y", a.y); });
    } catch {}
  }

  // Collapses everything back to overview
  function collapseAll() {
    const g = gRef.current!;
    g.clear();
    expanded.current = new Set();
    // Rebuild overview quickly
    for (const c of manifest.courses) {
      const id = `c:${c.id}`;
      g.addNode(id, { type: "course", label: c.title, courseId: c.id, size: Math.max(6, Math.log2(1 + c.size) * 3), x: c.x, y: c.y, color: colorForCourse(c.id) });
    }
    let i = 0;
    for (const e of manifest.cross) {
      const k = `ce:${i++}`;
      const s = `c:${e.from}`;
      const t = `c:${e.to}`;
      if (g.hasNode(s) && g.hasNode(t)) g.addDirectedEdgeWithKey(k, s, t, { size: Math.min(5, 0.5 + Math.log10(1 + e.count)), color: "#c0c4cc" });
    }
  }

  // Highlight prerequisites for lessons within expanded area
  const [highlightSet, setHighlightSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!gRef.current) return;
    if (!focus) { setHighlightSet(new Set()); return; }
    const g = gRef.current;
    const visited = new Set<string>();
    const stack = [focus];
    while (stack.length) {
      const t = stack.pop()!;
      g.forEachInNeighbor(t, (src) => {
        if (!visited.has(src)) { visited.add(src); stack.push(src); }
      });
    }
    visited.add(focus);
    setHighlightSet(visited);
  }, [focus]);

  useRegisterEvents({
    clickNode: (e) => {
      const g = gRef.current!;
      const t = g.getNodeAttribute(e.node, "type");
      if (t === "course") expandCourse(g.getNodeAttribute(e.node, "courseId"));
      else setFocus(e.node);
    },
    clickStage: () => setFocus(null),
  });

  useEffect(() => {
    setSettings({
      nodeReducer: (n, data) => {
        const t = data.type as string | undefined;
        if (!highlightSet.size || t !== "lesson") return data;
        const inSet = highlightSet.has(n);
        return {
          ...data,
          color: inSet ? (n === focus ? "#f59e0b" : data.color) : (t === "lesson" ? "#e5e7eb" : data.color),
          size: inSet ? (n === focus ? (data.size ?? 2) + 3 : (data.size ?? 2) + 1) : (data.size ?? 2) * 0.85,
          zIndex: inSet ? 2 : 0,
        } as any;
      },
      edgeReducer: (e, data) => {
        if (!highlightSet.size) return data;
        const g = gRef.current!;
        const s = g.source(e);
        const t = g.target(e);
        const onPath = highlightSet.has(s) && highlightSet.has(t);
        return { ...data, color: onPath ? "#f59e0b" : "#e5e7eb", size: onPath ? 2 : 0.5, hidden: !onPath } as any;
      },
    });
  }, [highlightSet, focus, setSettings]);

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full flex-col">
      <div className="z-10 m-2 flex items-center gap-2 rounded-xl bg-white/90 p-2 shadow ring-1 ring-black/10">
        <button className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700" onClick={collapseAll}>Overview</button>
        <div className="text-xs text-gray-600">Click a course to expand. Click a lesson to highlight its prerequisites (loaded courses only).</div>
        {focus && (
          <div className="ml-4 rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
            Focus: {gRef.current?.getNodeAttribute(focus, "label")}
          </div>
        )}
      </div>
      <div className="relative h-full w-full">
        <SigmaContainer style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}
