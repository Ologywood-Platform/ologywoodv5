import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { payoutService } from '../services/payoutService';
import { invoiceGenerationService } from '../services/invoiceGenerationService';

export const payoutRouter = router({
  /**
   * Get artist earnings summary
   */
  getEarnings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new Error('Unauthorized');
    
    try {
      const earnings = await payoutService.getArtistEarnings(ctx.user.id);
      return {
        success: true,
        data: earnings,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }),

  /**
   * Get payout history
   */
  getPayoutHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        const payouts = await payoutService.getPayoutHistory(ctx.user.id, input.limit);
        return {
          success: true,
          data: payouts,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Request a payout
   */
  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        payoutMethod: z.enum(['bank_transfer', 'stripe_connect', 'manual']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        const result = await payoutService.createPayoutRequest({
          artistId: ctx.user.id,
          amount: input.amount,
          payoutMethod: input.payoutMethod,
          notes: input.notes,
        });
        
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get invoices for artist
   */
  getArtistInvoices: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        const invoices = await invoiceGenerationService.getArtistInvoices(ctx.user.id, input.limit);
        return {
          success: true,
          data: invoices,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Get invoices for venue
   */
  getVenueInvoices: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        const invoices = await invoiceGenerationService.getVenueInvoices(ctx.user.id, input.limit);
        return {
          success: true,
          data: invoices,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Create invoice for booking
   */
  createInvoice: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        const result = await invoiceGenerationService.createInvoice(input.bookingId);
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Send invoice
   */
  sendInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        await invoiceGenerationService.sendInvoice(input.invoiceId);
        return {
          success: true,
          message: 'Invoice sent successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Mark invoice as paid
   */
  markInvoicePaid: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error('Unauthorized');
      
      try {
        await invoiceGenerationService.markInvoicePaid(input.invoiceId);
        return {
          success: true,
          message: 'Invoice marked as paid',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
