import { getDb } from '../db';
import { bookings, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  bookingId: number;
  artistId: number;
  venueId: number;
  amount: number;
  tax: number;
  platformFee: number;
  total: number;
  eventDate: Date;
  eventDetails: string;
}

export const invoicingService = {
  async generateInvoice(bookingId: number): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Fetch booking details
    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    const booking = bookingResult[0];

    if (!booking) throw new Error('Booking not found');

    // Fetch artist and venue details
    const artistResult = await db.select().from(users).where(eq(users.id, booking.artistId)).limit(1);
    const artist = artistResult[0];

    const venueResult = await db.select().from(users).where(eq(users.id, booking.venueId)).limit(1);
    const venue = venueResult[0];

    if (!artist || !venue) throw new Error('Artist or venue not found');

    // Calculate invoice amounts
    const subtotal = parseFloat(booking.totalFee as any) || 0;
    const platformFee = subtotal * 0.01; // 1% platform fee
    const tax = (subtotal + platformFee) * 0.08; // 8% tax
    const total = subtotal + platformFee + tax;

    // Create invoice data object
    const invoiceData: InvoiceData = {
      bookingId,
      artistId: booking.artistId,
      venueId: booking.venueId,
      amount: subtotal,
      tax,
      platformFee,
      total,
      eventDate: booking.eventDate || new Date(),
      eventDetails: booking.eventDetails || '',
    };

    return JSON.stringify(invoiceData);
  },

  async getInvoice(bookingId: number): Promise<InvoiceData | null> {
    const db = await getDb();
    if (!db) return null;

    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    const booking = bookingResult[0];

    if (!booking) return null;

    const subtotal = parseFloat(booking.totalFee as any) || 0;
    const platformFee = subtotal * 0.01;
    const tax = (subtotal + platformFee) * 0.08;
    const total = subtotal + platformFee + tax;

    return {
      bookingId,
      artistId: booking.artistId,
      venueId: booking.venueId,
      amount: subtotal,
      tax,
      platformFee,
      total,
      eventDate: booking.eventDate || new Date(),
      eventDetails: booking.eventDetails || '',
    };
  },
};
