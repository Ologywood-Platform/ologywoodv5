import { getDb } from '../db';
import { riderAcknowledgments, riderModificationHistory, users, bookings, riderTemplates } from '../../drizzle/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { generateVenueRiderReminderHTML, generateArtistModificationReminderHTML } from '../emails/riderReminders';

/**
 * Service for managing rider reminder notifications
 */

export interface ReminderPreferences {
  enableVenueReminders: boolean;
  enableArtistReminders: boolean;
  venueReminderDays: number[]; // Days to send reminders (e.g., [1, 3, 7])
  artistReminderDays: number[]; // Days to send reminders (e.g., [1, 3, 7])
}

export async function getDefaultReminderPreferences(): Promise<ReminderPreferences> {
  return {
    enableVenueReminders: true,
    enableArtistReminders: true,
    venueReminderDays: [1, 3, 7], // Remind at 1, 3, and 7 days
    artistReminderDays: [1, 3, 7], // Remind at 1, 3, and 7 days
  };
}

export async function sendVenueReminderIfNeeded(
  acknowledgmentId: number,
  preferences: ReminderPreferences
): Promise<boolean> {
  if (!preferences.enableVenueReminders) {
    return false;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get acknowledgment with related data
    const acknowledgment = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, acknowledgmentId))
      .limit(1);

    if (!acknowledgment.length) {
      return false;
    }

    const ack = acknowledgment[0];

    // Check if already acknowledged
    if (ack.acknowledgedAt !== null) {
      return false;
    }

    // Calculate days since shared
    const sharedDate = new Date(ack.createdAt);
    const now = new Date();
    const daysSinceShared = Math.floor(
      (now.getTime() - sharedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if we should send reminder today
    if (!preferences.venueReminderDays.includes(daysSinceShared)) {
      return false;
    }

    // Get booking and rider info
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, ack.bookingId))
      .limit(1);

    if (!booking.length) {
      return false;
    }

    const rider = await db
      .select()
      .from(riderTemplates)
      .where(eq(riderTemplates.id, ack.riderTemplateId))
      .limit(1);

    if (!rider.length) {
      return false;
    }

    // Get venue user
    const venueUser = await db
      .select()
      .from(users)
      .where(eq(users.id, booking[0].venueId))
      .limit(1);

    if (!venueUser.length || !venueUser[0].email) {
      return false;
    }

    // Generate email content
    const eventDate = new Date(booking[0].eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const acknowledgmentLink = `${process.env.FRONTEND_URL || 'https://ologywood.com'}/booking/${booking[0].id}?tab=rider`;

    const htmlContent = generateVenueRiderReminderHTML(
      venueUser[0].name || 'Venue Manager',
      'Artist',
      eventDate,
      rider[0].templateName || 'Rider',
      acknowledgmentLink,
      daysSinceShared
    );

    // Send email (integrate with your email service)
    console.log(`[Rider Reminder] Sending venue reminder to ${venueUser[0].email}`);
    // await sendEmail({
    //   to: venueUser[0].email,
    //   subject: `Reminder: ${booking[0].artistName}'s Rider Awaiting Your Response`,
    //   html: htmlContent,
    // });

    return true;
  } catch (error) {
    console.error('[Rider Reminder] Error sending venue reminder:', error);
    return false;
  }
}

export async function sendArtistReminderIfNeeded(
  acknowledgmentId: number,
  preferences: ReminderPreferences
): Promise<boolean> {
  if (!preferences.enableArtistReminders) {
    return false;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get acknowledgment with related data
    const acknowledgment = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, acknowledgmentId))
      .limit(1);

    if (!acknowledgment.length) {
      return false;
    }

    const ack = acknowledgment[0];

    // Check if there are pending modifications
    const pendingMods = await db
      .select()
      .from(riderModificationHistory)
      .where(
        and(
          eq(riderModificationHistory.riderAcknowledgmentId, acknowledgmentId)
        )
      );

    if (!pendingMods.length) {
      return false;
    }

    // Calculate days since first modification
    const oldestMod = pendingMods.reduce((oldest: any, current: any) => {
      const currentDate = new Date(current.createdAt).getTime();
      const oldestDate = new Date(oldest.createdAt).getTime();
      return currentDate < oldestDate ? current : oldest;
    });

    const modDate = new Date(oldestMod.createdAt);
    const now = new Date();
    const daysSincePending = Math.floor(
      (now.getTime() - modDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if we should send reminder today
    if (!preferences.artistReminderDays.includes(daysSincePending)) {
      return false;
    }

    // Get booking and artist info
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, ack.bookingId))
      .limit(1);

    if (!booking.length) {
      return false;
    }

    const artist = await db
      .select()
      .from(users)
      .where(eq(users.id, booking[0].artistId))
      .limit(1);

    if (!artist.length || !artist[0].email) {
      return false;
    }

    // Generate email content
    const eventDate = new Date(booking[0].eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dashboardLink = `${process.env.FRONTEND_URL || 'https://ologywood.com'}/dashboard?tab=riders`;

    const htmlContent = generateArtistModificationReminderHTML(
      artist[0].name || 'Artist',
      booking[0].venueName || 'Venue',
      eventDate,
      pendingMods.length,
      dashboardLink,
      daysSincePending
    );

    // Send email (integrate with your email service)
    console.log(`[Rider Reminder] Sending artist reminder to ${artist[0].email}`);
    // await sendEmail({
    //   to: artist[0].email,
    //   subject: `Reminder: ${pendingMods.length} Modification${pendingMods.length > 1 ? 's' : ''} Awaiting Your Response`,
    //   html: htmlContent,
    // });

    return true;
  } catch (error) {
    console.error('[Rider Reminder] Error sending artist reminder:', error);
    return false;
  }
}

/**
 * Batch process all pending reminders
 * This should be called by a scheduled job (e.g., cron job)
 */
export async function processPendingReminders(preferences?: ReminderPreferences): Promise<void> {
  const prefs = preferences || (await getDefaultReminderPreferences());

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get all pending acknowledgments
    const pendingAcknowledgments = await db
      .select()
      .from(riderAcknowledgments)
      .where(isNull(riderAcknowledgments.acknowledgedAt));

    console.log(`[Rider Reminder] Processing ${pendingAcknowledgments.length} pending acknowledgments`);

    // Send venue reminders
    for (const ack of pendingAcknowledgments) {
      await sendVenueReminderIfNeeded(ack.id, prefs);
    }

    // Send artist reminders for pending modifications
    for (const ack of pendingAcknowledgments) {
      await sendArtistReminderIfNeeded(ack.id, prefs);
    }
  } catch (error) {
    console.error('[Rider Reminder] Error processing pending reminders:', error);
  }
}

/**
 * Get reminder preferences for a user
 */
export async function getUserReminderPreferences(userId: number): Promise<ReminderPreferences> {
  // In a real implementation, fetch from user preferences table
  // For now, return defaults
  return getDefaultReminderPreferences();
}

/**
 * Update reminder preferences for a user
 */
export async function updateUserReminderPreferences(
  userId: number,
  preferences: Partial<ReminderPreferences>
): Promise<void> {
  // In a real implementation, update user preferences table
  console.log(`[Rider Reminder] Updated preferences for user ${userId}:`, preferences);
}
