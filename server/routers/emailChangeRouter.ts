import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { EmailChangeVerificationService } from '../services/emailChangeVerificationService';

export const emailChangeRouter = router({
  /**
   * Request email change with verification
   */
  requestChange: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email('Invalid email format'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await EmailChangeVerificationService.requestEmailChange(
        ctx.user.id,
        ctx.user.email,
        input.newEmail
      );
      return result;
    }),

  /**
   * Verify email change with token
   */
  verifyChange: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await EmailChangeVerificationService.verifyEmailChange(input.token);
      return result;
    }),

  /**
   * Cancel pending email change
   */
  cancelChange: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await EmailChangeVerificationService.cancelEmailChange(ctx.user.id);
    return result;
  }),

  /**
   * Get pending email verification status
   */
  getPending: protectedProcedure.query(async ({ ctx }) => {
    const result = await EmailChangeVerificationService.getPendingVerification(ctx.user.id);
    return result;
  }),
});
