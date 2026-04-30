const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not set. Database features will not work.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

module.exports = pool;
