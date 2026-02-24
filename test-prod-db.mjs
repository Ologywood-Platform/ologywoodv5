import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood'
});

const [artists] = await connection.execute('SELECT id, name, profilePhotoUrl FROM artist_profiles LIMIT 6');
console.log('Artists in AWS RDS:');
console.log(artists);

await connection.end();
