import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Update tier to starter
const [result] = await conn.execute(
  'UPDATE user_subscriptions SET tier = ?, status = ? WHERE userId = ?',
  ['starter', 'active', 7]
);
console.log('Update result:', JSON.stringify(result));

// Verify
const [rows] = await conn.execute('SELECT * FROM user_subscriptions WHERE userId = 7');
console.log('Updated subscription:', JSON.stringify(rows[0], null, 2));

await conn.end();
