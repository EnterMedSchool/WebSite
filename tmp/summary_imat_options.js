const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_YgJuKaCj6ny3@ep-bold-mode-a2sorydk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT q.public_id,
             o.value,
             o.is_correct,
             o.label
      FROM qbank_question_options o
      JOIN qbank_questions q ON o.question_id = q.id
      JOIN qbank_exams e ON q.exam_id = e.id
      WHERE e.slug = 'imat'
      ORDER BY q.public_id, o.order_index;
    `);
    console.log(res.rows);
  } finally {
    await client.end();
  }
})();
