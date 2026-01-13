#!/usr/bin/env node

/**
 * Booking Reminder Checker
 * This script checks for bookings that need reminders and sends emails
 * Run this script daily via cron or scheduled task
 */

import * as db from './db.ts';
import { sendBookingReminder } from './email.ts';

async function checkAndSendReminders() {
  console.log('[Reminders] Checking for bookings needing reminders...');
  
  try {
    const bookingsNeedingReminders = await db.getBookingsNeedingReminders();
    
    console.log(`[Reminders] Found ${bookingsNeedingReminders.length} reminders to send`);
    
    for (const { booking, reminderType } of bookingsNeedingReminders) {
      const daysUntil = reminderType === '7_days' ? 7 : reminderType === '3_days' ? 3 : 1;
      
      // Get artist and venue details
      const artist = await db.getArtistProfile(booking.artistId);
      const venue = await db.getVenueProfile(booking.venueId);
      
      if (!artist || !venue) {
        console.error(`[Reminders] Missing artist or venue for booking ${booking.id}`);
        continue;
      }
      
      const artistUser = await db.getUserById(artist.userId);
      const venueUser = await db.getUserById(venue.userId);
      
      if (!artistUser || !venueUser) {
        console.error(`[Reminders] Missing user for booking ${booking.id}`);
        continue;
      }
      
      const bookingDetails = {
        artistName: artist.stageName || artistUser.name,
        venueName: venue.organizationName,
        eventDate: booking.eventDate,
        eventTime: booking.eventTime,
        venueAddress: booking.venueAddress,
        totalFee: booking.totalFee,
        eventDetails: booking.eventDetails,
      };
      
      // Send reminder to artist
      try {
        await sendBookingReminder(
          artistUser.email,
          artistUser.name,
          bookingDetails,
          daysUntil,
          true // isArtist
        );
        console.log(`[Reminders] Sent ${reminderType} reminder to artist ${artistUser.email} for booking ${booking.id}`);
      } catch (error) {
        console.error(`[Reminders] Failed to send reminder to artist:`, error);
      }
      
      // Send reminder to venue
      try {
        await sendBookingReminder(
          venueUser.email,
          venueUser.name,
          bookingDetails,
          daysUntil,
          false // isArtist
        );
        console.log(`[Reminders] Sent ${reminderType} reminder to venue ${venueUser.email} for booking ${booking.id}`);
      } catch (error) {
        console.error(`[Reminders] Failed to send reminder to venue:`, error);
      }
      
      // Mark reminder as sent
      await db.markReminderSent(booking.id, reminderType);
    }
    
    console.log('[Reminders] Reminder check complete');
  } catch (error) {
    console.error('[Reminders] Error checking reminders:', error);
  }
}

// Run the check
checkAndSendReminders().catch(console.error);
