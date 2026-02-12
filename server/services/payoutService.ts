import { getDb } from '../db';
import { artistPayouts, artistEarnings, bookings, users } from '../../drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  completedEarnings: number;
  paidOutEarnings: number;
  recentEarnings: Array<{
    bookingId: number;
    amount: number;
    status: string;
    eventDate: Date;
  }>;
}

export interface PayoutRequest {
  artistId: number;
  amount: number;
  payoutMethod: 'bank_transfer' | 'stripe_connect' | 'manual';
  notes?: string;
}

export const payoutService = {
  /**
   * Calculate total earnings for an artist
   */
  async getArtistEarnings(artistId: number): Promise<EarningsData> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get all earnings for artist
    const earnings = await db.select().from(artistEarnings).where(eq(artistEarnings.artistId, artistId));

    const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.netAmount.toString()), 0);
    const pendingEarnings = earnings
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + parseFloat(e.netAmount.toString()), 0);
    const completedEarnings = earnings
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + parseFloat(e.netAmount.toString()), 0);
    const paidOutEarnings = earnings
      .filter(e => e.status === 'paid_out')
      .reduce((sum, e) => sum + parseFloat(e.netAmount.toString()), 0);

    // Get recent bookings for earnings display
    const recentBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.artistId, artistId))
      .orderBy(desc(bookings.eventDate))
      .limit(10);

    const recentEarnings = recentBookings.map(booking => ({
      bookingId: booking.id,
      amount: parseFloat(booking.estimatedBudget?.toString() || '0'),
      status: booking.status,
      eventDate: booking.eventDate,
    }));

    return {
      totalEarnings,
      pendingEarnings,
      completedEarnings,
      paidOutEarnings,
      recentEarnings,
    };
  },

  /**
   * Create a payout request
   */
  async createPayoutRequest(request: PayoutRequest): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verify artist has sufficient balance
    const earnings = await this.getArtistEarnings(request.artistId);
    if (earnings.completedEarnings < request.amount) {
      throw new Error('Insufficient balance for payout');
    }

    // Create payout record
    const result = await db.insert(artistPayouts).values({
      artistId: request.artistId,
      amount: request.amount.toString(),
      currency: 'USD',
      status: 'pending',
      payoutMethod: request.payoutMethod,
      notes: request.notes,
      requestedAt: new Date(),
    });

    return {
      success: true,
      payoutId: (result as any).insertId,
      message: 'Payout request created successfully',
    };
  },

  /**
   * Get payout history for artist
   */
  async getPayoutHistory(artistId: number, limit: number = 20): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    const payouts = await db
      .select()
      .from(artistPayouts)
      .where(eq(artistPayouts.artistId, artistId))
      .orderBy(desc(artistPayouts.requestedAt))
      .limit(limit);

    return payouts.map(payout => ({
      id: payout.id,
      amount: parseFloat(payout.amount.toString()),
      status: payout.status,
      payoutMethod: payout.payoutMethod,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
      completedAt: payout.completedAt,
    }));
  },

  /**
   * Record earnings from a booking
   */
  async recordBookingEarnings(bookingId: number, grossAmount: number, platformFeePercent: number = 5): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get booking details
    const bookingResult = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    const booking = bookingResult[0];

    if (!booking) throw new Error('Booking not found');

    const platformFee = (grossAmount * platformFeePercent) / 100;
    const netAmount = grossAmount - platformFee;

    // Record earnings
    await db.insert(artistEarnings).values({
      artistId: booking.artistId,
      bookingId,
      grossAmount: grossAmount.toString(),
      platformFee: platformFee.toString(),
      netAmount: netAmount.toString(),
      status: 'completed',
    });
  },

  /**
   * Process a payout (admin function)
   */
  async processPayout(payoutId: number, stripeTransferId?: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(artistPayouts)
      .set({
        status: 'processing',
        stripeTransferId,
        processedAt: new Date(),
      })
      .where(eq(artistPayouts.id, payoutId));
  },

  /**
   * Complete a payout
   */
  async completePayout(payoutId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get payout details
    const payoutResult = await db.select().from(artistPayouts).where(eq(artistPayouts.id, payoutId)).limit(1);
    const payout = payoutResult[0];

    if (!payout) throw new Error('Payout not found');

    // Update payout status
    await db
      .update(artistPayouts)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(artistPayouts.id, payoutId));

    // Mark earnings as paid out
    await db
      .update(artistEarnings)
      .set({
        status: 'paid_out',
        payoutId,
      })
      .where(
        and(
          eq(artistEarnings.artistId, payout.artistId),
          eq(artistEarnings.status, 'completed'),
          // Only update earnings that haven't been paid out yet
          lte(artistEarnings.netAmount, payout.amount as any)
        )
      );
  },
};
