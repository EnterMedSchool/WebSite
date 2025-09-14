// Seed a bunch of fake questions (and choices) for a given lesson
// Usage:
//   DATABASE_URL=postgresql://... node scripts/seed-fake-questions.mjs "calculating angles" 15
// If lesson query is omitted, defaults to 'calculating angles'. If count is omitted, defaults to 12.

import pg from "pg";

const { Client } = pg;

function parseArgs(argv) {
  const out = { query: "calculating angles", count: 12, all: false };
  const rest = [];
  for (const a of argv.slice(2)) {
    if (a === "--all") out.all = true;
    else rest.push(a);
  }
  if (rest[0]) out.query = rest[0].toLowerCase();
  if (rest[1] && !Number.isNaN(parseInt(rest[1], 10))) out.count = parseInt(rest[1], 10);
  return out;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const ARGS = parseArgs(process.argv);

const client = new Client({
  connectionString: DATABASE_URL,
  application_name: "ems:seed-fake-questions",
  ssl: { rejectUnauthorized: false },
});

async function insertForLesson(lesson) {
  const COUNT = ARGS.count;
  await client.query("BEGIN");
  const createdQuestionIds = [];
  try {
    for (let i = 1; i <= COUNT; i++) {
      const prompt = `Fake Q${i}: In the triangle ABC, what is the measure of angle A given some made-up info?`;
      const explanation = `Because this is a fake seed, any reasonable choice can be correct. This item is for testing UI flows only.`;

      const { rows: qRows } = await client.query(
        `insert into questions (lesson_id, prompt, explanation, access, difficulty, version, meta)
         values ($1, $2, $3, 'public', 'easy', 1, $4::jsonb)
         returning id`,
        [
          lesson.id,
          prompt,
          explanation,
          JSON.stringify({ seedTag: "fake_calculating_angles", generatedAt: new Date().toISOString() }),
        ]
      );
      const qid = qRows[0].id;
      createdQuestionIds.push(qid);

      const correctIdx = (i % 4) + 1; // 1..4
      for (let c = 1; c <= 4; c++) {
        const content = `Choice ${c}: ${c * 15 + i}°`;
        const correct = c === correctIdx;
        await client.query(
          `insert into choices (question_id, content, correct) values ($1, $2, $3)`,
          [qid, content, correct]
        );
      }
    }
    await client.query("COMMIT");
    console.log(`Lesson ${lesson.id} '${lesson.slug}': inserted ${createdQuestionIds.length} questions.`);
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(`Error while seeding lesson ${lesson.id} '${lesson.slug}':`, err);
    throw err;
  }
}

async function main() {
  await client.connect();
  try {
    const { rows: lessons } = await client.query(
      `select l.id, l.slug, l.title,
              coalesce(count(q.id) filter (where (q.meta->>'seedTag') = 'fake_calculating_angles'), 0) as fake_count
       from lessons l
       left join questions q on q.lesson_id = l.id
       where lower(l.title) like $1 or lower(l.slug) like $1
       group by l.id, l.slug, l.title
       order by l.id desc
       limit 100`,
      ["%" + ARGS.query + "%"]
    );
    if (lessons.length === 0) {
      console.error(`No lessons found matching '${ARGS.query}'.`);
      process.exit(2);
    }

    if (ARGS.all) {
      const targets = lessons.filter((l) => Number(l.fake_count) === 0);
      if (targets.length === 0) {
        console.log("All matching lessons already have fake questions. Nothing to do.");
        return;
      }
      console.log(`Seeding ${targets.length} lessons matching '${ARGS.query}' without existing fake seed...`);
      for (const l of targets) {
        console.log(`Seeding lesson id=${l.id} slug='${l.slug}' title='${l.title}'`);
        await insertForLesson(l);
      }
      console.log("Done seeding all matching lessons.");
    } else {
      // Prefer exact-ish match containing both 'calculating' and 'angle' if possible
      const best = lessons.find(
        (l) => /calculat/.test((l.title + " " + l.slug).toLowerCase()) && /angle/.test((l.title + " " + l.slug).toLowerCase())
      ) || lessons[0];
      console.log(`Using lesson id=${best.id} slug='${best.slug}' title='${best.title}'`);
      await insertForLesson(best);
      const { rows: verify } = await client.query(
        `select count(*)::int as cnt from questions where lesson_id = $1 and (meta->>'seedTag') = 'fake_calculating_angles'`,
        [best.id]
      );
      console.log(`Now ${verify[0].cnt} fake questions exist for this lesson (seedTag=fake_calculating_angles).`);
    }
  } finally {
    await client.end();
  }
}

main();
