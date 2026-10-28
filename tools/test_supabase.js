require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    const client = await pool.connect();
    console.log('SUCCESS: Connected to Supabase PostgreSQL!');
    const res = await client.query('SELECT version(), current_database(), current_user;');
    console.log('Version:', res.rows[0].version.split(',')[0]);
    console.log('Database:', res.rows[0].current_database);
    console.log('User:', res.rows[0].current_user);

    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
    console.log('Existing public tables in Supabase:', tables.rows.map(r => r.table_name));

    client.release();
    await pool.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
})();
