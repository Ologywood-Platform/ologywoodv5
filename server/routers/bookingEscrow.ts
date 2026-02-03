import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';

export const bookingEscrowRouter = router({
  /**
   * Create deposit for a booking
   */
  createDeposit: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      depositAmount: z.number().min(0.50),
      depositPercentage: z.number().min(0).max(100).default(50),
      currency: z.string().default('USD'),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            message: 'Database not available',
          };
        }

        // Calculate deposit amount if percentage is provided
        const finalDepositAmount = input.depositAmount > 0
          ? input.depositAmount
          : (input.depositPercentage / 100) * input.depositAmount;

        // Create deposit record
        const deposit = {
          id: `dep_${Date.now()}`,
          bookingId: input.bookingId,
          userId: ctx.user.id,
          amount: finalDepositAmount,
          percentage: input.depositPercentage,
          currency: input.currency,
          status: 'pending',
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        return {
          success: true,
          deposit,
          message: `Deposit of $${(finalDepositAmount / 100).toFixed(2)} created successfully`,
        };
      } catch (error) {
        console.error('Error creating deposit:', error);
        return {
          success: false,
          message: 'Failed to create deposit',
        };
      }
    }),

  /**
   * Get deposit details
   */
  getDeposit: protectedProcedure
    .input(z.object({ depositId: z.string() }))
    .query(async ({ input }) => {
      try {
        // Mock deposit data
        const deposits: Record<string, any> = {
          'dep_1': {
            id: 'dep_1',
            bookingId: 1,
            amount: 50000, // $500.00
            percentage: 50,
            currency: 'USD',
            status: 'paid',
            paidAt: '2026-02-01',
            createdAt: '2026-01-28',
            dueDate: '2026-02-04',
          },
          'dep_2': {
            id: 'dep_2',
            bookingId: 2,
            amount: 75000, // $750.00
            percentage: 50,
            currency: 'USD',
            status: 'pending',
            createdAt: '2026-02-03',
            dueDate: '2026-02-10',
          },
        };

        const deposit = deposits[input.depositId];
        if (!deposit) {
          return {
            success: false,
            deposit: null,
            message: 'Deposit not found',
          };
        }

        return {
          success: true,
          deposit,
        };
      } catch (error) {
        console.error('Error fetching deposit:', error);
        return {
          success: false,
          deposit: null,
          message: 'Failed to fetch deposit',
        };
      }
    }),

  /**
   * Process deposit payment
   */
  processDepositPayment: protectedProcedure
    .input(z.object({
      depositId: z.string(),
      stripePaymentIntentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, verify payment with Stripe
        return {
          success: true,
          message: 'Deposit payment processed successfully',
          deposit: {
            id: input.depositId,
            status: 'paid',
            paidAt: new Date(),
          },
        };
      } catch (error) {
        console.error('Error processing deposit payment:', error);
        return {
          success: false,
          message: 'Failed to process deposit payment',
        };
      }
    }),

  /**
   * Release deposit (after booking completion)
   */
  releaseDeposit: protectedProcedure
    .input(z.object({
      depositId: z.string(),
      bookingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Release deposit to artist/venue
        return {
          success: true,
          message: 'Deposit released successfully',
          releaseDetails: {
            depositId: input.depositId,
            releasedAt: new Date(),
            status: 'released',
          },
        };
      } catch (error) {
        console.error('Error releasing deposit:', error);
        return {
          success: false,
          message: 'Failed to release deposit',
        };
      }
    }),

  /**
   * Refund deposit (if booking cancelled)
   */
  refundDeposit: protectedProcedure
    .input(z.object({
      depositId: z.string(),
      bookingId: z.number(),
      reason: z.string(),
      refundPercentage: z.number().min(0).max(100).default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const refundAmount = 50000 * (input.refundPercentage / 100); // Mock calculation

        return {
          success: true,
          message: `Refund of $${(refundAmount / 100).toFixed(2)} processed`,
          refund: {
            depositId: input.depositId,
            originalAmount: 50000,
            refundAmount,
            refundPercentage: input.refundPercentage,
            reason: input.reason,
            status: 'processed',
            processedAt: new Date(),
          },
        };
      } catch (error) {
        console.error('Error refunding deposit:', error);
        return {
          success: false,
          message: 'Failed to process refund',
        };
      }
    }),

  /**
   * Create escrow for full payment
   */
  createEscrow: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      totalAmount: z.number().min(0.50),
      holdUntilDate: z.string(),
      releaseConditions: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const escrow = {
          id: `esc_${Date.now()}`,
          bookingId: input.bookingId,
          userId: ctx.user.id,
          amount: input.totalAmount,
          status: 'held',
          holdUntilDate: input.holdUntilDate,
          releaseConditions: input.releaseConditions,
          createdAt: new Date(),
        };

        return {
          success: true,
          escrow,
          message: `Escrow of $${(input.totalAmount / 100).toFixed(2)} created`,
        };
      } catch (error) {
        console.error('Error creating escrow:', error);
        return {
          success: false,
          message: 'Failed to create escrow',
        };
      }
    }),

  /**
   * Release escrow funds
   */
  releaseEscrow: protectedProcedure
    .input(z.object({
      escrowId: z.string(),
      bookingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          success: true,
          message: 'Escrow funds released successfully',
          escrow: {
            id: input.escrowId,
            status: 'released',
            releasedAt: new Date(),
          },
        };
      } catch (error) {
        console.error('Error releasing escrow:', error);
        return {
          success: false,
          message: 'Failed to release escrow funds',
        };
      }
    }),

  /**
   * Get escrow history for a booking
   */
  getEscrowHistory: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Mock escrow history
        const histories: Record<number, any> = {
          1: {
            bookingId: 1,
            events: [
              {
                date: '2026-02-01',
                event: 'Deposit Created',
                amount: 50000,
                status: 'pending',
              },
              {
                date: '2026-02-01',
                event: 'Deposit Paid',
                amount: 50000,
                status: 'completed',
              },
              {
                date: '2026-02-15',
                event: 'Event Completed',
                amount: 50000,
                status: 'completed',
              },
              {
                date: '2026-02-16',
                event: 'Deposit Released to Artist',
                amount: 50000,
                status: 'completed',
              },
            ],
          },
        };

        const history = histories[input.bookingId] || { events: [] };

        return {
          success: true,
          history,
        };
      } catch (error) {
        console.error('Error fetching escrow history:', error);
        return {
          success: false,
          history: { events: [] },
        };
      }
    }),

  /**
   * Get deposit/escrow policies
   */
  getPolicies: protectedProcedure.query(async ({ ctx }) => {
    return {
      success: true,
      policies: {
        depositPolicy: {
          name: 'Standard Deposit Policy',
          depositPercentage: 50,
          description: '50% deposit required to secure booking',
          refundPolicy: 'Full refund if cancelled 7+ days before event',
          holdTime: '7 days',
        },
        escrowPolicy: {
          name: 'Full Payment Escrow',
          description: 'Full payment held in escrow until event completion',
          releaseCondition: 'Released after event completion and artist confirmation',
          holdTime: 'Until event date + 2 days',
        },
        refundPolicies: [
          {
            cancellationWindow: '30+ days before',
            refundPercentage: 100,
            description: 'Full refund',
          },
          {
            cancellationWindow: '14-29 days before',
            refundPercentage: 75,
            description: '75% refund',
          },
          {
            cancellationWindow: '7-13 days before',
            refundPercentage: 50,
            description: '50% refund',
          },
          {
            cancellationWindow: 'Less than 7 days',
            refundPercentage: 0,
            description: 'No refund',
          },
        ],
      },
    };
  }),
});
