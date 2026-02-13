import { getDb } from '../db';
import { invoices, bookings, users, artistProfiles, venueProfiles } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface InvoiceData {
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

export const invoiceGenerationService = {
  /**
   * Generate invoice number
   */
  generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `INV-${timestamp}-${random}`;
  },

  /**
   * Create invoice for a booking
   */
  async createInvoice(bookingId: number): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get booking details
    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    const booking = bookingResult[0];

    if (!booking) throw new Error('Booking not found');

    // Calculate amounts (1% platform fee, 8% tax)
    const amount = 1000; // Default amount - should be from booking
    const platformFee = (amount * 1) / 100;
    const subtotal = amount + platformFee;
    const tax = (subtotal * 8) / 100;
    const total = subtotal + tax;

    // Create invoice record
    const invoiceNumber = this.generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

    const result = await db.insert(invoices).values({
      bookingId,
      artistId: booking.artistId,
      venueId: booking.venueId,
      invoiceNumber,
      amount: amount.toString(),
      tax: tax.toString(),
      platformFee: platformFee.toString(),
      total: total.toString(),
      status: 'draft',
      dueDate: dueDate.toISOString().split('T')[0],
    });

    return {
      success: true,
      invoiceId: (result as any).insertId,
      invoiceNumber,
      amount: total,
    };
  },

  /**
   * Get invoice by booking ID
   */
  async getInvoiceByBookingId(bookingId: number): Promise<any> {
    const db = await getDb();
    if (!db) return null;

    const result = await db.select().from(invoices).where(eq(invoices.bookingId, bookingId)).limit(1);
    return result[0] || null;
  },

  /**
   * Send invoice (mark as sent and trigger email)
   */
  async sendInvoice(invoiceId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(invoices)
      .set({
        status: 'sent',
        sentAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  },

  /**
   * Mark invoice as viewed
   */
  async markInvoiceViewed(invoiceId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(invoices)
      .set({
        status: 'viewed',
        viewedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  },

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(invoiceId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  },

  /**
   * Get invoices for artist
   */
  async getArtistInvoices(artistId: number, limit: number = 20): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.artistId, artistId))
      .limit(limit);

    return results.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: parseFloat(inv.total.toString()),
      status: inv.status,
      sentAt: inv.sentAt,
      paidAt: inv.paidAt,
      dueDate: inv.dueDate,
    }));
  },

  /**
   * Get invoices for venue
   */
  async getVenueInvoices(venueId: number, limit: number = 20): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.venueId, venueId))
      .limit(limit);

    return results.map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: parseFloat(inv.total.toString()),
      status: inv.status,
      sentAt: inv.sentAt,
      paidAt: inv.paidAt,
      dueDate: inv.dueDate,
    }));
  },
};
