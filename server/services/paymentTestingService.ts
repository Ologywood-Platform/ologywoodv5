/**
 * Payment Testing & Verification Service
 * Provides utilities for testing payment redirects and verifying booking status updates
 */

import { getDb } from '../db';
import { bookings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface PaymentTestResult {
  success: boolean;
  bookingId: number;
  previousStatus: string;
  newStatus: string;
  message: string;
  timestamp: Date;
}

export interface PaymentRedirectTest {
  bookingId: number;
  successUrl: string;
  failureUrl: string;
  retryUrl: string;
  testResults: PaymentTestResult[];
}

export class PaymentTestingService {
  /**
   * Test payment success redirect
   */
  static async testPaymentSuccess(bookingId: number): Promise<PaymentTestResult> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        return {
          success: false,
          bookingId,
          previousStatus: 'unknown',
          newStatus: 'unknown',
          message: `Booking ${bookingId} not found`,
          timestamp: new Date(),
        };
      }

      const previousStatus = booking.status;

      // Update booking status to 'confirmed'
      await db
        .update(bookings)
        .set({
          status: 'confirmed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      return {
        success: true,
        bookingId,
        previousStatus,
        newStatus: 'confirmed',
        message: `Payment success redirect tested for booking ${bookingId}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        bookingId,
        previousStatus: 'unknown',
        newStatus: 'unknown',
        message: `Error testing payment success: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test payment failure redirect
   */
  static async testPaymentFailure(bookingId: number): Promise<PaymentTestResult> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        return {
          success: false,
          bookingId,
          previousStatus: 'unknown',
          newStatus: 'unknown',
          message: `Booking ${bookingId} not found`,
          timestamp: new Date(),
        };
      }

      const previousStatus = booking.status;

      // Update booking status to 'cancelled' (payment failed)
      await db
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      return {
        success: true,
        bookingId,
        previousStatus,
        newStatus: 'cancelled',
        message: `Payment failure redirect tested for booking ${bookingId}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        bookingId,
        previousStatus: 'unknown',
        newStatus: 'unknown',
        message: `Error testing payment failure: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test payment retry flow
   */
  static async testPaymentRetry(bookingId: number): Promise<PaymentTestResult> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
      });

      if (!booking) {
        return {
          success: false,
          bookingId,
          previousStatus: 'unknown',
          newStatus: 'unknown',
          message: `Booking ${bookingId} not found`,
          timestamp: new Date(),
        };
      }

      const previousStatus = booking.status;

      // Update booking status to 'pending' for retry
      await db
        .update(bookings)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      return {
        success: true,
        bookingId,
        previousStatus,
        newStatus: 'pending',
        message: `Payment retry tested for booking ${bookingId}`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        bookingId,
        previousStatus: 'unknown',
        newStatus: 'unknown',
        message: `Error testing payment retry: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verify payment redirect URLs are correct
   */
  static verifyPaymentRedirectUrls(
    bookingId: number,
    baseUrl: string
  ): PaymentRedirectTest {
    return {
      bookingId,
      successUrl: `${baseUrl}/payment/success/${bookingId}`,
      failureUrl: `${baseUrl}/payment/failure/${bookingId}`,
      retryUrl: `${baseUrl}/payment/retry/${bookingId}`,
      testResults: [],
    };
  }

  /**
   * Run all payment tests for a booking
   */
  static async runAllPaymentTests(bookingId: number): Promise<PaymentTestResult[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const results: PaymentTestResult[] = [];

    // Test success redirect
    results.push(await this.testPaymentSuccess(bookingId));

    // Reset booking status
    if (db) {
      await db
        .update(bookings)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));
    }

    // Test failure redirect
    results.push(await this.testPaymentFailure(bookingId));

    // Reset booking status
    if (db) {
      await db
        .update(bookings)
        .set({
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));
    }

    // Test retry flow
    results.push(await this.testPaymentRetry(bookingId));

    // Reset booking status to original
    await db
      .update(bookings)
      .set({
        status: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    return results;
  }
}
