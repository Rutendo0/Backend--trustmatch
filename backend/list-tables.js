require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log('Tables:', tables.rows.map(r => r.table_name));

  for (const row of tables.rows) {
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
      [row.table_name]
    );
    console.log(`\n${row.table_name}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`));
  }

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
