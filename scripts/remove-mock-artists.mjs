import mysql from 'mysql2/promise';

const MOCK_USER_IDS = [1, 2, 3, 4, 5, 6];
const MOCK_PROFILE_IDS = [1, 2, 3, 4, 5, 6];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== Removing 6 mock artists (userIds 1-6, profileIds 1-6) ===\n');
  
  // 1. Delete follows where mock users are followed or following
  const [r1] = await conn.execute('DELETE FROM follows WHERE followerId IN (1,2,3,4,5,6) OR followingId IN (1,2,3,4,5,6)');
  console.log(`Deleted ${r1.affectedRows} follows`);
  
  // 2. Delete saved_artists referencing mock artist profiles
  const [r2] = await conn.execute('DELETE FROM saved_artists WHERE artistId IN (1,2,3,4,5,6)');
  console.log(`Deleted ${r2.affectedRows} saved_artists`);
  
  // 3. Delete messages involving mock users
  const [r3] = await conn.execute('DELETE FROM messages WHERE senderId IN (1,2,3,4,5,6) OR recipientId IN (1,2,3,4,5,6)');
  console.log(`Deleted ${r3.affectedRows} messages`);
  
  // 4. Delete bookings with mock artist profiles
  const [r4] = await conn.execute('DELETE FROM bookings WHERE artistId IN (1,2,3,4,5,6)');
  console.log(`Deleted ${r4.affectedRows} bookings`);
  
  // 5. Delete notifications for mock users
  const [r5] = await conn.execute('DELETE FROM notifications WHERE userId IN (1,2,3,4,5,6)');
  console.log(`Deleted ${r5.affectedRows} notifications`);
  
  // 6. Delete artist_earnings for mock profiles
  try {
    const [r6] = await conn.execute('DELETE FROM artist_earnings WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r6.affectedRows} artist_earnings`);
  } catch (e) { console.log('artist_earnings: skipped (table may not exist or different column)'); }
  
  // 7. Delete releases by mock artists
  try {
    const [r7] = await conn.execute('DELETE FROM releases WHERE artistId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r7.affectedRows} releases`);
  } catch (e) { console.log('releases: skipped'); }
  
  // 8. Delete events by mock artists
  try {
    const [r8] = await conn.execute('DELETE FROM events WHERE artistId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r8.affectedRows} events`);
  } catch (e) { console.log('events: skipped'); }
  
  // 9. Delete artist_availability for mock profiles
  try {
    const [r9] = await conn.execute('DELETE FROM artist_availability WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r9.affectedRows} artist_availability`);
  } catch (e) { console.log('artist_availability: skipped'); }
  
  // 10. Delete artist_media for mock profiles
  try {
    const [r10] = await conn.execute('DELETE FROM artist_media WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r10.affectedRows} artist_media`);
  } catch (e) { console.log('artist_media: skipped'); }
  
  // 11. Delete rider_contracts for mock profiles
  try {
    const [r11] = await conn.execute('DELETE FROM rider_contracts WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r11.affectedRows} rider_contracts`);
  } catch (e) { console.log('rider_contracts: skipped'); }
  
  // 12. Delete artist_team_members for mock profiles
  try {
    const [r12] = await conn.execute('DELETE FROM artist_team_members WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r12.affectedRows} artist_team_members`);
  } catch (e) { console.log('artist_team_members: skipped'); }
  
  // 13. Delete artist_team_invitations for mock profiles
  try {
    const [r13] = await conn.execute('DELETE FROM artist_team_invitations WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r13.affectedRows} artist_team_invitations`);
  } catch (e) { console.log('artist_team_invitations: skipped'); }
  
  // 14. Delete stripe_connect_accounts for mock users
  try {
    const [r14] = await conn.execute('DELETE FROM stripe_connect_accounts WHERE artistId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r14.affectedRows} stripe_connect_accounts`);
  } catch (e) { console.log('stripe_connect_accounts: skipped'); }
  
  // 15. Delete referral_codes for mock users
  try {
    const [r15] = await conn.execute('DELETE FROM referral_codes WHERE userId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r15.affectedRows} referral_codes`);
  } catch (e) { console.log('referral_codes: skipped'); }
  
  // 16. Delete artist_social_links for mock profiles
  try {
    const [r16] = await conn.execute('DELETE FROM artist_social_links WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r16.affectedRows} artist_social_links`);
  } catch (e) { console.log('artist_social_links: skipped'); }
  
  // 17. Delete artist_sponsorships for mock profiles
  try {
    const [r17] = await conn.execute('DELETE FROM artist_sponsorships WHERE artistId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r17.affectedRows} artist_sponsorships`);
  } catch (e) { console.log('artist_sponsorships: skipped'); }

  // 18. Delete blog_posts by mock users
  try {
    const [r18] = await conn.execute('DELETE FROM blog_posts WHERE authorId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r18.affectedRows} blog_posts`);
  } catch (e) { console.log('blog_posts: skipped'); }

  // 19. Delete featured_artists for mock profiles
  try {
    const [r19] = await conn.execute('DELETE FROM featured_artists WHERE artistProfileId IN (1,2,3,4,5,6)');
    console.log(`Deleted ${r19.affectedRows} featured_artists`);
  } catch (e) { console.log('featured_artists: skipped'); }

  // 20. Now delete the artist_profiles themselves
  const [r20] = await conn.execute('DELETE FROM artist_profiles WHERE id IN (1,2,3,4,5,6)');
  console.log(`\nDeleted ${r20.affectedRows} artist_profiles`);
  
  // 21. Finally delete the user accounts
  const [r21] = await conn.execute('DELETE FROM users WHERE id IN (1,2,3,4,5,6)');
  console.log(`Deleted ${r21.affectedRows} users`);
  
  console.log('\n=== Done! Mock artists removed. ===');
  
  // Verify
  const [remaining] = await conn.execute("SELECT COUNT(*) as cnt FROM artist_profiles WHERE id IN (1,2,3,4,5,6)");
  console.log(`Verification - remaining mock profiles: ${remaining[0].cnt}`);
  
  await conn.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
