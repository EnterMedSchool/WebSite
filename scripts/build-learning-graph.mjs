#!/usr/bin/env node
// Static graph builder: exports prerequisite graph to public/graph/v1/graph.json
// - Reads lessons and lesson_prerequisites from Postgres (via @vercel/postgres)
// - Produces a single JSON suitable for client-side rendering
// - Positions are coarse but stable: cluster-by-course laid on a circle with jitter

import { sql } from "@vercel/postgres";
import fs from "node:fs";
import path from "node:path";

async function fetchData() {
  const lessonsRes = await sql`
    SELECT l.id,
           l.course_id AS "courseId",
           l.slug,
           l.title,
           COALESCE(l.length_min, l.duration_min) AS "lengthMin",
           LEFT(COALESCE(l.body, ''), 180) AS "excerpt",
           c.slug AS "courseSlug",
           c.title AS "courseTitle"
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.visibility IS NULL OR l.visibility='public'
  `;
  const edgesRes = await sql`
    SELECT lesson_id AS "lessonId", requires_lesson_id AS "requiresLessonId"
    FROM lesson_prerequisites
  `;
  const coursesRes = await sql`SELECT id, slug, title FROM courses`;

  // Optional: merge manual edges from repository CSV/JSON (slug-based)
  const manualEdges = [];
  try {
    const base = path.join(process.cwd(), "data", "graph");
    const csvPath = path.join(base, "edges.csv");
    const jsonPath = path.join(base, "edges.json");
    const slugToId = new Map(lessonsRes.rows.map((r) => [String(r.slug), Number(r.id)]));
    const pushEdge = (srcSlug, tgtSlug, kind = "required") => {
      const sId = slugToId.get(String(srcSlug));
      const tId = slugToId.get(String(tgtSlug));
      if (!sId || !tId) {
        console.warn(`[graph] manual edge skipped: ${srcSlug} -> ${tgtSlug} (slug not found)`);
        return;
      }
      manualEdges.push({ requiresLessonId: sId, lessonId: tId, kind });
    };
    if (fs.existsSync(csvPath)) {
      const raw = fs.readFileSync(csvPath, "utf8");
      raw.split(/\r?\n/).forEach((line) => {
        const t = line.trim();
        if (!t || t.startsWith("#")) return;
        const [lessonSlug, requiresSlug, kind] = t.split(",").map((s) => s.trim());
        // CSV order: lesson_slug, requires_slug[, kind]
        pushEdge(requiresSlug, lessonSlug, kind || "required");
      });
    }
    if (fs.existsSync(jsonPath)) {
      const arr = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      for (const e of arr) {
        // JSON format: { lessonSlug, requiresSlug, kind? }
        pushEdge(e.requiresSlug, e.lessonSlug, e.kind || "required");
      }
    }
  } catch (e) {
    console.warn("[graph] manual edges load error:", e.message);
  }

  return {
    lessons: lessonsRes.rows,
    edgesDb: edgesRes.rows,
    manualEdges,
    courses: coursesRes.rows,
  };
}

function buildGraph({ lessons, edgesDb, manualEdges, courses }) {
  const nodes = [];
  const edgesOut = [];

  // Group nodes by course for coarse clustering
  const byCourse = new Map();
  for (const l of lessons) {
    if (!byCourse.has(l.courseId)) byCourse.set(l.courseId, []);
    byCourse.get(l.courseId).push(l);
  }

  const courseIds = Array.from(byCourse.keys());
  const R = 5000; // radius for course ring in layout units
  const jitter = 400; // node jitter inside clusters

  const courseMeta = Object.fromEntries(
    courses.map((c) => [String(c.id), { id: c.id, slug: c.slug, title: c.title }])
  );

  // Place courses around a circle and sprinkle lessons around their course center
  for (let i = 0; i < courseIds.length; i++) {
    const cid = courseIds[i];
    const theta = (2 * Math.PI * i) / Math.max(1, courseIds.length);
    const cx = Math.cos(theta) * R;
    const cy = Math.sin(theta) * R;
    const lessonsInCourse = byCourse.get(cid);

    for (const l of lessonsInCourse) {
      const id = String(l.id);
      const x = cx + (Math.random() * 2 - 1) * jitter;
      const y = cy + (Math.random() * 2 - 1) * jitter;
      nodes.push({
        id,
        label: l.title,
        slug: l.slug,
        courseId: l.courseId,
        courseSlug: l.courseSlug,
        courseTitle: l.courseTitle,
        lengthMin: l.lengthMin,
        excerpt: l.excerpt,
        href: `/lesson/${l.slug}`,
        x,
        y,
        size: 2,
      });
    }
  }

  // Edges are directed: prerequisite -> lesson
  let eid = 0;
  const seen = new Set();
  const addEdge = (s, t, kind = "required") => {
    const key = `${s}:${t}`;
    if (seen.has(key)) return;
    seen.add(key);
    edgesOut.push({ id: String(eid++), source: String(s), target: String(t), kind });
  };
  for (const e of edgesDb) addEdge(e.requiresLessonId, e.lessonId, "required");
  for (const e of manualEdges) addEdge(e.requiresLessonId, e.lessonId, e.kind || "required");

  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    nodes,
    edges: edgesOut,
    meta: { courses: courseMeta },
    layout: { type: "course-ring-jitter" },
  };

  // Build sharded outputs as well
  const byCourseNodes = new Map();
  for (const n of nodes) {
    const cid = n.courseId;
    if (!byCourseNodes.has(cid)) byCourseNodes.set(cid, []);
    byCourseNodes.get(cid).push(n);
  }
  const byCourseEdges = new Map();
  for (const e of edgesOut) {
    const s = nodes.find((n) => n.id === e.source);
    const t = nodes.find((n) => n.id === e.target);
    if (!s || !t) continue;
    const same = s.courseId === t.courseId;
    if (same) {
      const cid = s.courseId;
      if (!byCourseEdges.has(cid)) byCourseEdges.set(cid, []);
      byCourseEdges.get(cid).push(e);
    }
  }
  const courseCenters = new Map();
  for (let i = 0; i < courseIds.length; i++) {
    const cid = courseIds[i];
    const theta = (2 * Math.PI * i) / Math.max(1, courseIds.length);
    const cx = Math.cos(theta) * R;
    const cy = Math.sin(theta) * R;
    courseCenters.set(cid, { x: cx, y: cy });
  }
  const manifest = {
    version: 1,
    generatedAt: out.generatedAt,
    totalNodes: nodes.length,
    totalEdges: edgesOut.length,
    courses: courseIds.map((cid) => {
      const list = byCourseNodes.get(cid) || [];
      const c = courseMeta[String(cid)] || { id: cid, slug: String(cid), title: `Course ${cid}` };
      const center = courseCenters.get(cid);
      const r = Math.max(400, Math.sqrt(list.length) * 20);
      return { id: cid, slug: c.slug, title: c.title, size: list.length, x: center.x, y: center.y, r };
    }),
    cross: (() => {
      // Aggregate cross-course edge counts (directed)
      const map = new Map(); // key = `${from}:${to}`
      for (const e of edgesOut) {
        const s = nodes.find((n) => n.id === e.source);
        const t = nodes.find((n) => n.id === e.target);
        if (!s || !t) continue;
        if (s.courseId === t.courseId) continue;
        const key = `${s.courseId}:${t.courseId}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
      return Array.from(map.entries()).map(([k, count]) => {
        const [from, to] = k.split(":").map((x) => Number(x));
        return { from, to, count };
      });
    })(),
  };

  const shards = courseIds.map((cid) => ({
    courseId: cid,
    nodes: byCourseNodes.get(cid) || [],
    edges: byCourseEdges.get(cid) || [],
  }));

  return { full: out, manifest, shards };
}

async function main() {
  console.log("Building learning graph → public/graph/v1/graph.json");
  const data = await fetchData();
  const { full, manifest, shards } = buildGraph(data);
  const outDir = path.join(process.cwd(), "public", "graph", "v1");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "graph.json"), JSON.stringify(full));
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest));
  for (const s of shards) {
    fs.writeFileSync(path.join(outDir, `course-${s.courseId}.json`), JSON.stringify({ nodes: s.nodes, edges: s.edges }));
  }
  console.log(`Wrote full graph (${full.nodes.length} nodes, ${full.edges.length} edges)`);
  console.log(`Wrote manifest with ${manifest.courses.length} courses and ${manifest.cross.length} cross links`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
