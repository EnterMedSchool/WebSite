#!/usr/bin/env node
// Build static map JSON from the database into public/map/v1
// Usage:
//   DATABASE_URL=postgresql://user:pass@host/db node scripts/build-map-data.mjs
// Requires: npm i -D pg

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const OUT_DIR = path.join(root, 'public', 'map', 'v1');
const OUT_COUNTRIES = path.join(OUT_DIR, 'countries');

async function main() {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL;
  if (!connStr) {
    console.error('Set DATABASE_URL to run this script.');
    process.exit(1);
  }
  const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const { rows: markerRows } = await client.query(`
      WITH latest_scores AS (
        SELECT DISTINCT ON (university_id)
          university_id,
          year,
          candidate_type,
          min_score
        FROM university_scores
        ORDER BY university_id, year DESC
      )
      SELECT
        u.id,
        u.name AS uni,
        u.city,
        u.lat, u.lng,
        u.kind,
        u.language,
        u.admission_exam AS exam,
        u.logo_url AS logo,
        c.name AS country,
        ls.min_score AS last_score
      FROM universities u
      JOIN countries c ON c.id = u.country_id
      LEFT JOIN latest_scores ls ON ls.university_id = u.id
      ORDER BY c.name, u.city, u.name;
    `);

    // Group by country for markers
    const markersByCountry = {};
    for (const r of markerRows) {
      const key = r.country;
      markersByCountry[key] ||= [];
      markersByCountry[key].push({
        id: r.id,
        uni: r.uni,
        city: r.city,
        lat: Number(r.lat),
        lng: Number(r.lng),
        kind: r.kind || undefined,
        language: r.language || undefined,
        exam: r.exam || undefined,
        logo: r.logo || undefined,
        lastScore: r.last_score != null ? Number(r.last_score) : undefined,
      });
    }

    // Ensure output dirs
    fs.mkdirSync(OUT_COUNTRIES, { recursive: true });

    // Write markers
    fs.writeFileSync(path.join(OUT_DIR, 'markers.min.json'), JSON.stringify(markersByCountry));

    // Build per-country enriched files
    const countries = Object.keys(markersByCountry);
    for (const country of countries) {
      const ids = markersByCountry[country].map((x) => x.id);
      if (ids.length === 0) continue;

      const { rows: heavy } = await client.query(
        `SELECT id, name AS uni, city, lat, lng, kind, language, admission_exam AS exam, logo_url AS logo,
                photos, orgs, article
         FROM universities WHERE id = ANY($1::int[]) ORDER BY city, name`,
        [ids]
      );
      const { rows: costs } = await client.query(
        `SELECT university_id, rent_eur, food_index, transport_eur FROM university_costs WHERE university_id = ANY($1::int[])`,
        [ids]
      );
      const costsById = Object.fromEntries(costs.map((r) => [r.university_id, r]));

      const { rows: adm } = await client.query(
        `SELECT DISTINCT ON (university_id)
           university_id, year, opens_month, deadline_month, results_month
         FROM university_admissions
         WHERE university_id = ANY($1::int[])
         ORDER BY university_id, year DESC`,
        [ids]
      );
      const admById = Object.fromEntries(adm.map((r) => [r.university_id, r]));

      const { rows: scores } = await client.query(
        `SELECT university_id, year, candidate_type, min_score FROM university_scores WHERE university_id = ANY($1::int[]) ORDER BY year ASC`,
        [ids]
      );
      const { rows: seats } = await client.query(
        `SELECT university_id, year, candidate_type, seats FROM university_seats WHERE university_id = ANY($1::int[]) ORDER BY year ASC`,
        [ids]
      );

      const pointsById = {};
      for (const r of scores) {
        (pointsById[r.university_id] ||= []).push({ year: r.year, type: r.candidate_type, score: Number(r.min_score) });
      }
      const seatsById = {};
      for (const r of seats) {
        (seatsById[r.university_id] ||= []).push({ year: r.year, type: r.candidate_type, seats: Number(r.seats) });
      }

      const enriched = heavy.map((u) => {
        const c = costsById[u.id] || {};
        const a = admById[u.id] || {};
        const toMonth = (m) => (typeof m === 'number' && m >= 1 && m <= 12 ?
          ['January','February','March','April','May','June','July','August','September','October','November','December'][m-1] : undefined);
        return {
          id: u.id,
          uni: u.uni,
          city: u.city,
          lat: Number(u.lat),
          lng: Number(u.lng),
          kind: u.kind || undefined,
          language: u.language || undefined,
          exam: u.exam || undefined,
          logo: u.logo || undefined,
          photos: Array.isArray(u.photos) ? u.photos : undefined,
          orgs: Array.isArray(u.orgs) ? u.orgs : undefined,
          article: u.article || undefined,
          costRent: c.rent_eur ?? undefined,
          costFoodIndex: c.food_index ?? undefined,
          costTransport: c.transport_eur ?? undefined,
          admOpens: toMonth(a.opens_month),
          admDeadline: toMonth(a.deadline_month),
          admResults: toMonth(a.results_month),
          trendPoints: pointsById[u.id] || [],
          trendSeats: seatsById[u.id] || [],
        };
      });

      fs.writeFileSync(path.join(OUT_COUNTRIES, `${country}.json`), JSON.stringify(enriched));
    }

    console.log(`Wrote markers and ${countries.length} country files to ${OUT_DIR}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

