export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

// Minimal iCal parser for VEVENT blocks (folded lines supported)
function parseICS(ics: string) {
  // Unfold lines (RFC 5545: CRLF + space/tab is a continuation)
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: any[] = [];
  let cur: Record<string, string> | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT") { if (cur) { events.push(cur); cur = null; } continue; }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const keyPart = line.slice(0, idx); // may contain params e.g. DTSTART;TZID=Europe/Rome
    const val = line.slice(idx + 1);
    const key = keyPart.split(";")[0].toUpperCase();
    cur[key] = val;
  }
  // Map to normalized objects
  return events.map((e) => {
    function parseDate(v?: string) {
      if (!v) return null;
      // Format examples: 20240924T090000Z or 20240924T090000
      const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
      if (!m) return null;
      const [_, Y, M, D, h, m2, s, z] = m;
      if (z) return new Date(Date.UTC(+Y, +M - 1, +D, +h, +m2, +s));
      return new Date(+Y, +M - 1, +D, +h, +m2, +s);
    }
    const start = parseDate(e.DTSTART);
    const end = parseDate(e.DTEND);
    const title = e.SUMMARY || "Lesson";
    const location = e.LOCATION || null;
    const description = e.DESCRIPTION || null;
    const uid = e.UID || `${title}-${start?.toISOString()}`;
    return {
      uid,
      title,
      location,
      description,
      start: start ? start.toISOString() : null,
      end: end ? end.toISOString() : null,
      allDay: false,
    };
  }).filter((e) => !!e.start);
}

async function getUserEdu(userId: number) {
  const r = await sql`SELECT university_id, school_id, medical_course_id, study_year FROM users WHERE id=${userId} LIMIT 1`;
  const row = r.rows[0] || {} as any;
  const school = row?.school_id ? (await sql`SELECT name FROM schools WHERE id=${row.school_id} LIMIT 1`).rows[0]?.name : null;
  const course = row?.medical_course_id ? (await sql`SELECT name FROM medical_school_courses WHERE id=${row.medical_course_id} LIMIT 1`).rows[0]?.name : null;
  return { schoolName: school as string | null, courseName: course as string | null, year: Number(row?.study_year || 0) || null };
}

// Temporary: simple mapping function for ICS feeds per school/course/year
function resolveIcsUrl({ schoolName, courseName, year }: { schoolName: string | null; courseName: string | null; year: number | null }) {
  const s = (schoolName || "").toLowerCase();
  const c = (courseName || "").toLowerCase();
  const y = Number(year || 0);
  // Example mapping: Harvey course (Univ. of Pavia) Year 1
  if ((s.includes("harvey") || c.includes("harvey")) && y === 1) {
    return "https://unipv.prod.up.cineca.it:443/api/FiltriICal/impegniICal?id=68c1dfd30b332a002df8a1fc";
  }
  return null;
}

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const edu = await getUserEdu(userId);
    const url = resolveIcsUrl(edu);

    // If no configured URL yet, send a pretty placeholder payload
    if (!url) {
      const now = new Date();
      const day = 24 * 60 * 60 * 1000;
      const mock = [
        { uid: "m1", title: "Anatomy – Upper Limb", start: new Date(now.getTime() + day).toISOString(), end: new Date(now.getTime() + day + 2*60*60*1000).toISOString(), location: "Room A1", allDay: false },
        { uid: "m2", title: "Physiology – Membrane Potentials", start: new Date(now.getTime() + 2*day + 9*60*60*1000).toISOString(), end: new Date(now.getTime() + 2*day + 11*60*60*1000).toISOString(), location: "Auditorium", allDay: false },
      ];
      return NextResponse.json({ source: "mock", edu, events: mock });
    }

    // Fetch ICS
    const resp = await fetch(url, { cache: "no-store" });
    const text = await resp.text();
    const events = parseICS(text);
    return NextResponse.json({ source: "ics", edu, events });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

