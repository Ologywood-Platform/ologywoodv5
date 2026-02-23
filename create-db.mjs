import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  ssl: false
});

try {
  await connection.execute('CREATE DATABASE IF NOT EXISTS ologywood');
  console.log('✓ Database "ologywood" created successfully');
} catch (error) {
  console.error('✗ Failed to create database:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
