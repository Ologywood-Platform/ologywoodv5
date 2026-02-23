import mysql from 'mysql2/promise';

const config = {
  host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2uXaD1wbYUFqiqF.root',
  password: 'cwRgelpxV28lX0k5',
  database: 'test',
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
};

const connection = await mysql.createConnection(config);

try {
  const [tables] = await connection.execute('SHOW TABLES');
  console.log('Tables in database:');
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
} finally {
  await connection.end();
}
