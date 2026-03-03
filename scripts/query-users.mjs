import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [users] = await conn.execute('SELECT id, name, email, role FROM users');
console.log('USERS:', JSON.stringify(users, null, 2));

const [artists] = await conn.execute('SELECT * FROM artist_profiles');
console.log('ARTIST PROFILES:', JSON.stringify(artists, null, 2));

await conn.end();
