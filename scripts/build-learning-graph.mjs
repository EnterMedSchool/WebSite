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
    SELECT id, course_id AS "courseId", slug, title
    FROM lessons
    WHERE visibility IS NULL OR visibility='public'
  `;
  const edgesRes = await sql`
    SELECT lesson_id AS "lessonId", requires_lesson_id AS "requiresLessonId"
    FROM lesson_prerequisites
  `;
  const coursesRes = await sql`SELECT id, slug, title FROM courses`;

  return {
    lessons: lessonsRes.rows,
    edges: edgesRes.rows,
    courses: coursesRes.rows,
  };
}

function buildGraph({ lessons, edges, courses }) {
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
      nodes.push({ id, label: l.title, slug: l.slug, courseId: l.courseId, x, y, size: 2 });
    }
  }

  // Edges are directed: prerequisite -> lesson
  let eid = 0;
  for (const e of edges) {
    edgesOut.push({ id: String(eid++), source: String(e.requiresLessonId), target: String(e.lessonId), kind: "required" });
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    nodes,
    edges: edgesOut,
    meta: { courses: courseMeta },
    layout: { type: "course-ring-jitter" },
  };
}

async function main() {
  console.log("Building learning graph → public/graph/v1/graph.json");
  const data = await fetchData();
  const graph = buildGraph(data);
  const outDir = path.join(process.cwd(), "public", "graph", "v1");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "graph.json");
  fs.writeFileSync(outFile, JSON.stringify(graph));
  console.log(`Wrote ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

