import pg from "pg";
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const LESSON_QUERY = (process.argv[2] || "calculating angles").toLowerCase();

const client = new Client({
  connectionString: DATABASE_URL,
  application_name: "ems:verify-fake-questions",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  try {
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
    const best = lessons.find(
      (l) => /calculat/.test(l.title.toLowerCase() + " " + l.slug.toLowerCase()) && /angle/.test(l.title.toLowerCase() + " " + l.slug.toLowerCase())
    ) || lessons[0];

    const { rows: qCount } = await client.query(
      `select count(*)::int as cnt from questions where lesson_id=$1 and (meta->>'seedTag')='fake_calculating_angles'`,
      [best.id]
    );
    const { rows: cCount } = await client.query(
      `select count(*)::int as cnt
       from choices c
       join questions q on q.id=c.question_id
       where q.lesson_id=$1 and (q.meta->>'seedTag')='fake_calculating_angles'`,
      [best.id]
    );
    console.log(`Lesson ${best.id} '${best.slug}': fake questions=${qCount[0].cnt}, choices=${cCount[0].cnt}`);
  } finally {
    await client.end();
  }
}

main();

