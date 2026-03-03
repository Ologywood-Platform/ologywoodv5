import { searchPublicEvents } from '../server/db.ts';

async function main() {
  try {
    console.log('Calling searchPublicEvents with empty filters...');
    const results = await searchPublicEvents({});
    console.log('Results count:', results.length);
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

main();
