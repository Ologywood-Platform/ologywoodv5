import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'ologywood.ci1gi2qo65oh.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Crewology1',
  database: 'ologywood'
});

const artists = await connection.query(`
  SELECT id, userId, artistName, profilePhotoUrl FROM artistProfiles
`);

console.log('Artists and their profile photos:');
console.log('================================\n');

for (const artist of artists[0]) {
  console.log(`Artist: ${artist.artistName}`);
  console.log(`ID: ${artist.id}`);
  console.log(`Photo URL: ${artist.profilePhotoUrl || 'NO PHOTO'}`);
  console.log('---');
}

await connection.end();
