const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_YgJuKaCj6ny3@ep-bold-mode-a2sorydk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT q.public_id,
             q.status,
             s.slug AS section_slug,
             t.slug AS topic_slug,
             q.difficulty,
             q.time_estimate_sec
      FROM qbank_questions q
      JOIN qbank_exams e ON q.exam_id = e.id
      LEFT JOIN qbank_sections s ON q.section_id = s.id
      LEFT JOIN qbank_topics t ON q.primary_topic_id = t.id
      WHERE e.slug = 'imat'
      ORDER BY q.public_id;
    `);
    console.log(res.rows);
  } finally {
    await client.end();
  }
})();
