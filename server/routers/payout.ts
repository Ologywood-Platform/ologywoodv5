import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';

// Mock data for payouts
const mockPayouts = [
  {
    id: 1,
    artistId: 1,
    amount: 2000,
    currency: 'USD',
    status: 'completed',
    payoutMethod: 'bank_transfer',
    stripeTransferId: null,
    bankAccountId: 'ba_1234567890',
    requestedAt: new Date('2026-02-01'),
    processedAt: new Date('2026-02-02'),
    completedAt: new Date('2026-02-03'),
    notes: 'Monthly payout',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-03'),
  },
  {
    id: 2,
    artistId: 1,
    amount: 1500,
    currency: 'USD',
    status: 'completed',
    payoutMethod: 'stripe_connect',
    stripeTransferId: 'tr_1234567890',
    bankAccountId: null,
    requestedAt: new Date('2026-01-15'),
    processedAt: new Date('2026-01-16'),
    completedAt: new Date('2026-01-17'),
    notes: 'Event payout',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-17'),
  },
  {
    id: 3,
    artistId: 1,
    amount: 1700,
    currency: 'USD',
    status: 'pending',
    payoutMethod: 'bank_transfer',
    stripeTransferId: null,
    bankAccountId: 'ba_0987654321',
    requestedAt: new Date('2026-02-15'),
    processedAt: null,
    completedAt: null,
    notes: 'Pending review',
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15'),
  },
];

const mockEarnings = {
  completedEarnings: 8500,
  recentEarnings: [
    { id: 1, amount: 500, date: new Date('2026-02-15'), bookingId: 1, status: 'completed' },
    { id: 2, amount: 1200, date: new Date('2026-02-10'), bookingId: 2, status: 'completed' },
    { id: 3, amount: 750, date: new Date('2026-02-05'), bookingId: 3, status: 'completed' },
  ],
  pendingEarnings: 2100,
  paidOutEarnings: 5200,
  totalEarnings: 10600,
};

export const payoutRouter = router({
  getPayouts: protectedProcedure.query(async ({ ctx }: any) => {
    // Return mock payouts for the current user
    return mockPayouts.filter(p => p.artistId === ctx.user.id || ctx.user.role === 'admin');
  }),

  getEarnings: protectedProcedure.query(async ({ ctx }: any) => {
    // Return mock earnings data
    return mockEarnings;
  }),

  getPayoutHistory: protectedProcedure.query(async ({ ctx }: any) => {
    // Return mock payout history
    return mockPayouts.filter(p => p.artistId === ctx.user.id || ctx.user.role === 'admin');
  }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        payoutMethod: z.enum(['bank_transfer', 'stripe_connect', 'manual']),
        bankAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      // Mock payout request
      const newPayout = {
        id: mockPayouts.length + 1,
        artistId: ctx.user.id,
        amount: input.amount,
        currency: 'USD',
        status: 'pending',
        payoutMethod: input.payoutMethod,
        stripeTransferId: null,
        bankAccountId: input.bankAccountId || null,
        requestedAt: new Date(),
        processedAt: null,
        completedAt: null,
        notes: 'Payout request',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPayouts.push(newPayout);
      return { success: true, message: 'Payout request submitted', payout: newPayout };
    }),

  processPayout: protectedProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      // Only admins can process payouts
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const payout = mockPayouts.find(p => p.id === input.payoutId);
      if (!payout) throw new Error('Payout not found');
      payout.status = 'processing';
      payout.processedAt = new Date();
      return { success: true, message: 'Payout processing started', payout };
    }),

  completePayout: protectedProcedure
    .input(z.object({ payoutId: z.number() }))
    .mutation(async ({ ctx, input }: any) => {
      // Only admins can complete payouts
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      const payout = mockPayouts.find(p => p.id === input.payoutId);
      if (!payout) throw new Error('Payout not found');
      payout.status = 'completed';
      payout.completedAt = new Date();
      return { success: true, message: 'Payout completed', payout };
    }),
});
