import { router, publicProcedure } from '../_core/trpc';
import { NewsletterDoubleOptInService } from '../services/newsletterDoubleOptInService';
import { z } from 'zod';

export const newsletterRouter = router({
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await NewsletterDoubleOptInService.initiateSubscription({
        email: input.email,
        name: input.name,
        source: input.source,
      });
    }),

  confirmSubscription: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await NewsletterDoubleOptInService.confirmSubscription(input.token);
    }),

  unsubscribe: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      return await NewsletterDoubleOptInService.unsubscribe(input.email);
    }),

  getStats: publicProcedure
    .query(async () => {
      return await NewsletterDoubleOptInService.getSubscriptionStats();
    }),
});
