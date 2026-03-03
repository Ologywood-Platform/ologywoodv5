import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT * FROM user_subscriptions WHERE userId = 7');
console.log('Subscription for user 7:', JSON.stringify(rows, null, 2));
await conn.end();
