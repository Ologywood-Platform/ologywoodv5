import { getDb } from '../db';
import { bookings, riderTemplates, riderAcknowledgments, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Handles integration of rider templates into the booking workflow
 */

export async function attachRiderToBooking(bookingId: number, riderTemplateId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Update booking with rider template reference
  await db
    .update(bookings)
    .set({ riderTemplateId })
    .where(eq(bookings.id, bookingId));

  return { success: true, bookingId, riderTemplateId };
}

export async function createRiderAcknowledgmentForBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get booking details
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.length === 0) {
    throw new Error('Booking not found');
  }

  const bookingData = booking[0];

  if (!bookingData.riderTemplateId) {
    throw new Error('No rider template attached to booking');
  }

  // Create rider acknowledgment
  const result = await db.insert(riderAcknowledgments).values({
    bookingId: bookingId,
    riderTemplateId: bookingData.riderTemplateId,
    artistId: bookingData.artistId,
    venueId: bookingData.venueId,
    status: 'pending',
  });

  const acknowledgmentId = (result as any).insertId || 0;

  return {
    success: true,
    acknowledgmentId,
    bookingId,
    riderTemplateId: bookingData.riderTemplateId,
  };
}

export async function getRiderForBooking(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get booking with rider template
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.length === 0) {
    return null;
  }

  const bookingData = booking[0];

  if (!bookingData.riderTemplateId) {
    return null;
  }

  // Get rider template details
  const riderTemplate = await db
    .select()
    .from(riderTemplates)
    .where(eq(riderTemplates.id, bookingData.riderTemplateId))
    .limit(1);

  if (!riderTemplate || riderTemplate.length === 0) {
    return null;
  }

  // Get acknowledgment status
  const acknowledgment = await db
    .select()
    .from(riderAcknowledgments)
    .where(eq(riderAcknowledgments.bookingId, bookingId))
    .limit(1);

  return {
    booking: bookingData,
    rider: riderTemplate[0],
    acknowledgment: acknowledgment.length > 0 ? acknowledgment[0] : null,
  };
}

export async function getBookingRiderStatus(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const acknowledgment = await db
    .select()
    .from(riderAcknowledgments)
    .where(eq(riderAcknowledgments.bookingId, bookingId))
    .limit(1);

  if (!acknowledgment || acknowledgment.length === 0) {
    return {
      hasRider: false,
      status: 'no_rider',
    };
  }

  const ack = acknowledgment[0];
  return {
    hasRider: true,
    status: ack.status,
    acknowledgedAt: ack.acknowledgedAt,
    proposedModifications: null,
  };
}

export async function getArtistRiderTemplates(artistId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const templates = await db
    .select()
    .from(riderTemplates)
    .where(eq(riderTemplates.artistId, artistId));

  return templates;
}

export async function getBookingsByRiderTemplate(riderTemplateId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const bookingsList = await db
    .select()
    .from(bookings)
    .where(eq(bookings.riderTemplateId, riderTemplateId));

  return bookingsList;
}
