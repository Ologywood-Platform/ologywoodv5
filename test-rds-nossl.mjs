import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood',
  ssl: false,
  connectTimeout: 5000
});

try {
  const [result] = await connection.execute('SELECT 1 as test');
  console.log('✓ Successfully connected to AWS RDS');
} catch (error) {
  console.error('✗ Connection failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
