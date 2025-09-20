const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_YgJuKaCj6ny3@ep-bold-mode-a2sorydk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});
(async () => {
  try {
    await client.connect();
    const res = await client.query("select table_name from information_schema.tables where table_schema = 'public' and table_name like 'qbank_%' order by table_name");
    console.log(res.rows);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
