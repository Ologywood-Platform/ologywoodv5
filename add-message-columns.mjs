import mysql from 'mysql2/promise';

const url = new URL(process.env.DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false }
});

// Check if columns already exist
const [cols] = await conn.execute('SHOW COLUMNS FROM messages');
const colNames = cols.map(c => c.Field);

if (colNames.indexOf('messageType') === -1) {
  await conn.execute('ALTER TABLE messages ADD COLUMN messageType VARCHAR(50) NOT NULL DEFAULT "text" AFTER content');
  console.log('Added messageType column');
} else {
  console.log('messageType column already exists');
}

if (colNames.indexOf('metadata') === -1) {
  await conn.execute('ALTER TABLE messages ADD COLUMN metadata JSON NULL AFTER messageType');
  console.log('Added metadata column');
} else {
  console.log('metadata column already exists');
}

await conn.end();
console.log('Done');
