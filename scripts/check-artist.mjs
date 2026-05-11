import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const res25 = await pool.query('SELECT id, name, "profilePhoto", bio, role FROM users WHERE id = 25');
const res11 = await pool.query('SELECT id, name, "profilePhoto", bio, role FROM users WHERE id = 11');

console.log('Artist 25:', JSON.stringify(res25.rows[0], null, 2));
console.log('Artist 11:', JSON.stringify(res11.rows[0], null, 2));

await pool.end();
