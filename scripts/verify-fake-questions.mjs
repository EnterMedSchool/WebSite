import pg from "pg";
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

function parseArgs(argv) {
  const out = { query: "calculating angles", list: false };
  const rest = [];
  for (const a of argv.slice(2)) {
    if (a === "--all" || a === "--list") out.list = true;
    else rest.push(a);
  }
  if (rest[0]) out.query = rest[0].toLowerCase();
  return out;
}

const ARGS = parseArgs(process.argv);

const client = new Client({
  connectionString: DATABASE_URL,
  application_name: "ems:verify-fake-questions",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  try {
    if (ARGS.list) {
      const { rows } = await client.query(
        `select l.id, l.slug, l.title,
                count(q.id) filter (where (q.meta->>'seedTag')='fake_calculating_angles') as fake_q,
                coalesce(sum(cc.cnt),0) as fake_choices
         from lessons l
         left join questions q on q.lesson_id=l.id and (q.meta->>'seedTag')='fake_calculating_angles'
         left join (
           select q.id as qid, count(c.id) as cnt
           from questions q
           join choices c on c.question_id=q.id
           where (q.meta->>'seedTag')='fake_calculating_angles'
           group by q.id
         ) cc on cc.qid = q.id
         where lower(l.title) like $1 or lower(l.slug) like $1
         group by l.id, l.slug, l.title
         order by l.id desc`,
        ["%" + ARGS.query + "%"]
      );
      for (const r of rows) {
        console.log(`Lesson ${r.id} '${r.slug}': fake questions=${r.fake_q||0}, choices=${r.fake_choices||0}`);
      }
      return;
    }

    const { rows: lessons } = await client.query(
      `select id, slug, title from lessons
       where lower(title) like $1 or lower(slug) like $1
       order by id desc limit 20`,
      ["%" + ARGS.query + "%"]
    );
    if (lessons.length === 0) {
      console.error(`No lessons found matching '${ARGS.query}'.`);
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
