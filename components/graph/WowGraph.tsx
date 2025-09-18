"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { buildFakeMindmap, type MindmapEdge, type MindmapGraph, type MindmapNode } from "./fakeGraphData";

type GraphNode = MindmapNode & { x?: number; y?: number; vx?: number; vy?: number };
type GraphLink = MindmapEdge & { source: string | GraphNode; target: string | GraphNode; __key?: string };

type GraphStatus = "idle" | "loading" | "ready" | "error";

const FALLBACK_GRAPH = buildFakeMindmap();

function normalizeGraph(payload: any): MindmapGraph {
  if (!payload || !Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    return FALLBACK_GRAPH;
  }

  const colorFallback = "#6366f1";
  const dimFallback = "rgba(99, 102, 241, 0.2)";

  const nodes: MindmapNode[] = payload.nodes.map((raw: any, idx: number) => {
    const color = typeof raw.color === "string" ? raw.color : colorFallback;
    const dimColor = typeof raw.dimColor === "string" ? raw.dimColor : dimFallback;
    const tier = Number.isFinite(raw.tier) ? Number(raw.tier) : Number(raw.level ?? raw.depth ?? 0);

    return {
      id: String(raw.id ?? idx),
      label: String(raw.label ?? raw.slug ?? `Node ${idx + 1}`),
      slug: String(raw.slug ?? raw.id ?? idx),
      courseId: Number.isFinite(raw.courseId) ? Number(raw.courseId) : 0,
      area: String(raw.area ?? raw.category ?? "General"),
      tier,
      summary: String(raw.summary ?? `Review ${raw.label ?? raw.slug ?? `node ${idx + 1}`}.`),
      minutes: Number.isFinite(raw.minutes) ? Number(raw.minutes) : 20 + tier * 5,
      color,
      dimColor,
    };
  });

  const edges: MindmapEdge[] = payload.edges.map((raw: any, idx: number) => ({
    id: String(raw.id ?? `edge-${idx}`),
    source: typeof raw.source === "object" ? String(raw.source.id ?? raw.source) : String(raw.source),
    target: typeof raw.target === "object" ? String(raw.target.id ?? raw.target) : String(raw.target),
    type: raw.type === "bridge" ? "bridge" : "scaffold",
  }));

  return { nodes, edges };
}

export default function WowGraph({ src = "/graph/v1/graph.json" }: { src?: string }) {
  const [graph, setGraph] = useState<MindmapGraph>(FALLBACK_GRAPH);
  const [status, setStatus] = useState<GraphStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const graphRef = useRef<ForceGraphMethods<any, any>>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialFocusApplied = useRef(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load graph (${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const next = normalizeGraph(json);
        if (next.nodes.length) {
          setGraph(next);
          setStatus("ready");
          setError(null);
        } else {
          setStatus("error");
          setError("Graph payload was empty");
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message ?? "Unable to load graph data");
        setGraph(FALLBACK_GRAPH);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useLayoutEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const nodesById = useMemo(() => {
    const map = new Map<string, MindmapNode>();
    for (const node of graph.nodes) map.set(node.id, node);
    return map;
  }, [graph]);

  useEffect(() => {
    if (initialFocusApplied.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const focusParam = params.get("focus");
    if (!focusParam) {
      initialFocusApplied.current = true;
      return;
    }
    const match = graph.nodes.find((node) => node.slug === focusParam || node.id === focusParam);
    if (match) {
      setFocusId(match.id);
      initialFocusApplied.current = true;
    }
  }, [graph]);

  const incoming = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const edge of graph.edges) {
      if (!map.has(edge.target)) map.set(edge.target, []);
      map.get(edge.target)!.push(edge.source);
    }
    return map;
  }, [graph]);

  const highlight = useMemo(() => {
    if (!focusId) {
      return { nodes: new Set<string>(), edges: new Set<string>(), depth: new Map<string, number>() };
    }
    const depth = new Map<string, number>();
    const queue: string[] = [focusId];
    depth.set(focusId, 0);
    while (queue.length) {
      const current = queue.shift()!;
      const parents = incoming.get(current) ?? [];
      const nextDepth = depth.get(current)! + 1;
      for (const parent of parents) {
        if (depth.has(parent)) continue;
        depth.set(parent, nextDepth);
        queue.push(parent);
      }
    }
    const highlightNodes = new Set(depth.keys());
    const highlightEdges = new Set<string>();
    for (const edge of graph.edges) {
      const srcDepth = depth.get(edge.source);
      const tgtDepth = depth.get(edge.target);
      if (srcDepth === undefined || tgtDepth === undefined) continue;
      if (srcDepth === tgtDepth + 1) highlightEdges.add(edge.id);
    }
    return { nodes: highlightNodes, edges: highlightEdges, depth };
  }, [focusId, graph.edges, incoming]);

  const focusTrail = useMemo(() => {
    if (!focusId) return [] as Array<{ node: MindmapNode; depth: number }>;
    const entries = Array.from(highlight.depth.entries());
    entries.sort((a, b) => b[1] - a[1]);
    const enriched: Array<{ node: MindmapNode; depth: number }> = [];
    for (const [nodeId, depth] of entries) {
      const node = nodesById.get(nodeId);
      if (!node) continue;
      enriched.push({ node, depth });
    }
    return enriched;
  }, [focusId, highlight.depth, nodesById]);

  const graphData = useMemo(() => {
    const links: GraphLink[] = graph.edges.map((edge) => ({ ...edge, __key: edge.id }));
    const nodes: GraphNode[] = graph.nodes.map((node) => ({ ...node }));
    return { nodes, links };
  }, [graph]);

  useEffect(() => {
    if (!graphRef.current) return;
    const linkForce = graphRef.current.d3Force("link") as any;
    if (linkForce?.distance) linkForce.distance((link: GraphLink) => (link.type === "bridge" ? 180 : 105));
    if (linkForce?.strength) linkForce.strength((link: GraphLink) => (link.type === "bridge" ? 0.25 : 0.9));
    const charge = graphRef.current.d3Force("charge") as any;
    if (charge?.strength) charge.strength(-85);
    if (charge?.distanceMax) charge.distanceMax(600);
  }, [graphData]);

  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        graphRef.current?.zoomToFit(600, 120);
      } catch (err) {
        console.warn("Failed to zoom graph", err);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [graphData]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseMove={(evt) => {
        if (!containerRef.current) return;
        const bounds = containerRef.current.getBoundingClientRect();
        pointerRef.current = { x: evt.clientX - bounds.left, y: evt.clientY - bounds.top };
      }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData as any}
        width={dimensions.width}
        height={dimensions.height}
        cooldownTicks={120}
        warmupTicks={100}
        d3VelocityDecay={0.35}
        nodeRelSize={6}
        linkDirectionalParticles={(link: GraphLink) => (highlight.edges.has(link.id ?? link.__key ?? "") ? 2 : 0)}
        linkDirectionalParticleWidth={(link: GraphLink) => (highlight.edges.has(link.id ?? link.__key ?? "") ? 2.2 : 0)}
        linkDirectionalParticleSpeed={() => 0.01}
        linkColor={(link: GraphLink) =>
          highlight.edges.has(link.id ?? link.__key ?? "")
            ? "rgba(250, 204, 21, 0.92)"
            : link.type === "bridge"
            ? "rgba(99, 102, 241, 0.18)"
            : "rgba(148, 163, 184, 0.25)"
        }
        linkWidth={(link: GraphLink) => (highlight.edges.has(link.id ?? link.__key ?? "") ? 2.4 : 0.6)}
        linkCurvature={(link: GraphLink) => (link.type === "bridge" ? 0.25 : 0)}
        nodePointerAreaPaint={(node: GraphNode, color, ctx) => {
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, 16, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        nodeCanvasObject={(node: GraphNode, ctx, globalScale) => {
          const radiusBase = 5 + node.tier * 0.6;
          const isFocus = focusId === node.id;
          const isHighlighted = highlight.nodes.has(node.id);
          const radius = isFocus ? radiusBase + 5 : isHighlighted ? radiusBase + 2 : radiusBase;
          const fill = isFocus ? "#facc15" : isHighlighted ? node.color : node.dimColor ?? "rgba(148, 163, 184, 0.22)";

          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();

          ctx.lineWidth = (isFocus ? 2.6 : 1.4) / Math.sqrt(globalScale);
          ctx.strokeStyle = isFocus ? "rgba(250, 204, 21, 0.95)" : isHighlighted ? "rgba(255, 255, 255, 0.35)" : "rgba(15, 23, 42, 0.18)";
          ctx.stroke();

          const shouldLabel = isFocus || isHighlighted || globalScale < 1.2;
          if (shouldLabel) {
            ctx.fillStyle = isFocus ? "#0f172a" : "rgba(236, 239, 244, 0.92)";
            const fontSize = Math.max(7, 14 / Math.sqrt(globalScale));
            ctx.font = `${fontSize}px 'Inter', 'Segoe UI', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(node.label, node.x ?? 0, (node.y ?? 0) + radius + 4);
          }
        }}
        onNodeClick={(node: GraphNode) => {
          setFocusId((prev) => (prev === node.id ? null : node.id));
        }}
        onNodeHover={(node) => {
          setHoverNode(node as GraphNode | null);
        }}
        onBackgroundClick={() => setFocusId(null)}
        backgroundColor="rgba(15, 23, 42, 0.35)"
      />

      <div className="pointer-events-none absolute left-4 top-4 flex max-w-xl flex-col gap-2 rounded-2xl bg-slate-900/60 p-4 text-slate-100 shadow-lg ring-1 ring-white/10 backdrop-blur">
        <div className="text-xs uppercase tracking-wide text-slate-400">Interactive Mindmap</div>
        <div className="text-lg font-semibold text-white">{focusId ? nodesById.get(focusId)?.label : "Click a lesson to light the path"}</div>
        <div className="text-xs text-slate-300">
          {focusId
            ? nodesById.get(focusId)?.summary ?? ""
            : "Zoom, drag, and click to explore how lessons reinforce each other. The highlighted path shows every prerequisite back to the fundamentals."}
        </div>
        {focusId && (
          <div className="mt-1 max-h-48 overflow-y-auto pr-1 text-xs text-slate-200">
            {focusTrail.map(({ node, depth }) => (
              <div key={node.id} className="flex items-center gap-2 py-1">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-amber-300">
                  {depth}
                </span>
                <div>
                  <div className="font-semibold text-slate-100">{node.label}</div>
                  <div className="text-[11px] text-slate-400">{node.area} • ~{node.minutes} min</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!focusId && (
          <div className="text-[11px] text-slate-400">
            Tip: open the URL with <span className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px]">?focus=clinical-dic</span> to jump directly to the DIC lesson.
          </div>
        )}
        {status === "loading" && <div className="text-[11px] text-indigo-300">Loading data…</div>}
        {status === "error" && (
          <div className="text-[11px] text-rose-300">{error ?? "Falling back to bundled demo graph."}</div>
        )}
      </div>

      {hoverNode && (
        <div
          style={{ left: pointerRef.current.x + 16, top: pointerRef.current.y + 16 }}
          className="pointer-events-none absolute z-20 w-72 -translate-y-1/2 rounded-xl border border-white/10 bg-slate-900/90 p-3 text-xs text-slate-100 shadow-xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">{hoverNode.label}</div>
              <div className="text-[11px] text-slate-300">{hoverNode.area} • ~{hoverNode.minutes} min</div>
            </div>
            <span className="mt-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
              Tier {hoverNode.tier + 1}
            </span>
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-slate-200">{hoverNode.summary}</div>
          {focusId === hoverNode.id ? (
            <div className="mt-2 text-[11px] text-amber-300">Focus node • full prerequisite chain shown</div>
          ) : highlight.nodes.has(hoverNode.id) ? (
            <div className="mt-2 text-[11px] text-emerald-300">On prerequisite path</div>
          ) : (
            <div className="mt-2 text-[11px] text-slate-400">Click to highlight prerequisites</div>
          )}
        </div>
      )}
    </div>
  );
}
