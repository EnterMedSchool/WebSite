// Seed a bunch of fake questions (and choices) for a given lesson
// Usage:
//   DATABASE_URL=postgresql://... node scripts/seed-fake-questions.mjs "calculating angles" 15
// If lesson query is omitted, defaults to 'calculating angles'. If count is omitted, defaults to 12.

import pg from "pg";

const { Client } = pg;

function getArg(idx, def) {
  return process.argv[idx] || def;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const LESSON_QUERY = (getArg(2, "calculating angles") || "").toLowerCase();
const COUNT = parseInt(getArg(3, "12"), 10) || 12;

const client = new Client({
  connectionString: DATABASE_URL,
  application_name: "ems:seed-fake-questions",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  try {
    // 1) Find lesson by title/slug match
    const { rows: lessons } = await client.query(
      `select id, slug, title from lessons
       where lower(title) like $1 or lower(slug) like $1
       order by id desc limit 20`,
      ["%" + LESSON_QUERY + "%"]
    );
    if (lessons.length === 0) {
      console.error(`No lessons found matching '${LESSON_QUERY}'.`);
      process.exit(2);
    }

    // Prefer exact-ish match containing both 'calculating' and 'angle' if possible
    const best = lessons.find(
      (l) => /calculat/.test(l.title.toLowerCase() + " " + l.slug.toLowerCase()) && /angle/.test(l.title.toLowerCase() + " " + l.slug.toLowerCase())
    ) || lessons[0];

    const lessonId = best.id;
    console.log(`Using lesson id=${lessonId} slug='${best.slug}' title='${best.title}'`);

    // 2) Insert questions + choices in a single transaction
    await client.query("BEGIN");

    const createdQuestionIds = [];
    for (let i = 1; i <= COUNT; i++) {
      const prompt = `Fake Q${i}: In the triangle ABC, what is the measure of angle A given some made-up info?`;
      const explanation = `Because this is a fake seed, any reasonable choice can be correct. This item is for testing UI flows only.`;

      const { rows: qRows } = await client.query(
        `insert into questions (lesson_id, prompt, explanation, access, difficulty, version, meta)
         values ($1, $2, $3, 'public', 'easy', 1, $4::jsonb)
         returning id`,
        [
          lessonId,
          prompt,
          explanation,
          JSON.stringify({ seedTag: "fake_calculating_angles", generatedAt: new Date().toISOString() }),
        ]
      );
      const qid = qRows[0].id;
      createdQuestionIds.push(qid);

      // Create 4 choices, mark the k-th one as correct in a round-robin pattern
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
    console.log(`Inserted ${createdQuestionIds.length} questions with 4 choices each.`);

    // 3) Quick verification
    const { rows: verify } = await client.query(
      `select count(*)::int as cnt from questions where lesson_id = $1 and (meta->>'seedTag') = 'fake_calculating_angles'`,
      [best.id]
    );
    console.log(`Now ${verify[0].cnt} fake questions exist for this lesson (seedTag=fake_calculating_angles).`);
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Error while seeding:", err);
    process.exit(3);
  } finally {
    await client.end();
  }
}

main();
