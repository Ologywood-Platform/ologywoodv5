const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Check indexes on email
  const [idx] = await conn.query('SHOW INDEX FROM users WHERE Column_name = "email"');
  console.log('Email indexes:', idx.map(i => ({ name: i.Key_name, unique: Number(i.Non_unique) === 0 })));

  // Check existing
  const [existing] = await conn.execute('SELECT id, email FROM users WHERE email = ?', ['garychisolm30@gmail.com']);
  console.log('Existing with this email:', existing);

  // Do the update
  const [result] = await conn.execute('UPDATE users SET email = ?, name = ? WHERE id = ?', ['garychisolm30@gmail.com', 'Gary Chisolm', 24303]);
  console.log('Update result:', { affectedRows: result.affectedRows, changedRows: result.changedRows });

  // Verify same connection
  const [verify1] = await conn.execute('SELECT id, email, name FROM users WHERE id = ?', [24303]);
  console.log('Same conn verify:', verify1);

  await conn.end();

  // New connection to verify persistence
  const conn2 = await mysql.createConnection(process.env.DATABASE_URL);
  const [verify2] = await conn2.execute('SELECT id, email, name FROM users WHERE id = ?', [24303]);
  console.log('New conn verify:', verify2);
  await conn2.end();
})();
