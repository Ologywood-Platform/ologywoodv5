import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { users, emailPreferences, bookings } from '../../drizzle/schema';
import * as emailService from './emailService';

/**
 * Email digest scheduler for sending weekly/daily digests
 * This service should be called by a cron job or scheduled task
 */

/**
 * Send weekly digest emails to all users with weekly digest preference enabled
 */
export async function sendWeeklyDigests() {
  console.log('[EmailDigest] Starting weekly digest send...');
  
  const db = await getDb();
  if (!db) {
    console.error('[EmailDigest] Database not available');
    return;
  }

  try {
    // Get all users with weekly digest enabled
    const usersWithDigest = await db
      .select({
        userId: emailPreferences.userId,
        frequency: emailPreferences.frequency,
        weeklyDigest: emailPreferences.weeklyDigest,
      })
      .from(emailPreferences)
      .where(
        sql`${emailPreferences.frequency} = 'weekly' AND ${emailPreferences.weeklyDigest} = true`
      );

    console.log(`[EmailDigest] Found ${usersWithDigest.length} users for weekly digest`);

    for (const pref of usersWithDigest) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, pref.userId))
        .limit(1);

      if (!user || !user[0]?.email) continue;

      // Get digest content for this user
      const digestContent = await getDigestContent(pref.userId);

      // Send digest email
      await emailService.sendWeeklyDigestEmail(
        pref.userId,
        user[0].email,
        digestContent
      );

      console.log(`[EmailDigest] Sent weekly digest to user ${pref.userId}`);
    }

    console.log('[EmailDigest] Weekly digest send completed');
  } catch (error) {
    console.error('[EmailDigest] Error sending weekly digests:', error);
  }
}

/**
 * Send daily digest emails to all users with daily digest preference enabled
 */
export async function sendDailyDigests() {
  console.log('[EmailDigest] Starting daily digest send...');
  
  const db = await getDb();
  if (!db) {
    console.error('[EmailDigest] Database not available');
    return;
  }

  try {
    // Get all users with daily digest enabled
    const usersWithDigest = await db
      .select({
        userId: emailPreferences.userId,
        frequency: emailPreferences.frequency,
        weeklyDigest: emailPreferences.weeklyDigest,
      })
      .from(emailPreferences)
      .where(
        sql`${emailPreferences.frequency} = 'daily' AND ${emailPreferences.weeklyDigest} = true`
      );

    console.log(`[EmailDigest] Found ${usersWithDigest.length} users for daily digest`);

    for (const pref of usersWithDigest) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, pref.userId))
        .limit(1);

      if (!user || !user[0]?.email) continue;

      // Get digest content for this user
      const digestContent = await getDigestContent(pref.userId);

      // Send digest email
      await emailService.sendWeeklyDigestEmail(
        pref.userId,
        user[0].email,
        digestContent
      );

      console.log(`[EmailDigest] Sent daily digest to user ${pref.userId}`);
    }

    console.log('[EmailDigest] Daily digest send completed');
  } catch (error) {
    console.error('[EmailDigest] Error sending daily digests:', error);
  }
}

/**
 * Get digest content for a user (new opportunities, upcoming bookings, etc.)
 */
async function getDigestContent(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      newOpportunities: 0,
      upcomingBookings: 0,
      newMessages: 0,
      platformUpdates: [],
    };
  }

  try {
    // Get upcoming bookings for this user (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingBookings = await db
      .select()
      .from(bookings)
      .where(
        sql`(artistId = ${userId} OR venueId = ${userId}) AND eventDate <= ${sevenDaysFromNow} AND status = 'confirmed'`
      );

    // Platform updates (static for now, could be dynamic)
    const platformUpdates = [
      'New payment processing improvements for faster payouts',
      'Enhanced artist search filters now available',
      'Mobile app improvements and bug fixes',
    ];

    return {
      newOpportunities: 0, // Would need to query opportunities table
      upcomingBookings: upcomingBookings.length,
      newMessages: 0, // Would need to query messages table
      platformUpdates,
    };
  } catch (error) {
    console.error('[EmailDigest] Error getting digest content:', error);
    return {
      newOpportunities: 0,
      upcomingBookings: 0,
      newMessages: 0,
      platformUpdates: [],
    };
  }
}

/**
 * Schedule digest sends using a cron job
 * This should be called from a cron scheduler or background job service
 * 
 * Example cron expressions:
 * - Weekly: 0 9 * * 1 (Every Monday at 9 AM)
 * - Daily: 0 9 * * * (Every day at 9 AM)
 */
export function getScheduleConfig() {
  return {
    weeklyDigest: {
      cronExpression: '0 9 * * 1', // Every Monday at 9 AM UTC
      handler: sendWeeklyDigests,
      description: 'Send weekly digest emails to users',
    },
    dailyDigest: {
      cronExpression: '0 9 * * *', // Every day at 9 AM UTC
      handler: sendDailyDigests,
      description: 'Send daily digest emails to users',
    },
  };
}

// Import sql for queries
import { sql } from 'drizzle-orm';
