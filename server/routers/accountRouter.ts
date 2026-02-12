import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { AccountDeletionService } from '../services/accountDeletionService';
import { TRPCError } from '@trpc/server';

/**
 * Account management router
 * Handles account-related operations like deletion, preferences, etc.
 */
export const accountRouter = router({
  /**
   * Delete user account with all associated data
   * Requires explicit confirmation
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmationText: z.string().min(1, 'Confirmation text is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user.id;
        const userEmail = ctx.user.email || '';
        const userName = ctx.user.name || 'User';

        // Validate confirmation text - user must type "DELETE MY ACCOUNT"
        if (input.confirmationText !== 'DELETE MY ACCOUNT') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please type "DELETE MY ACCOUNT" to confirm deletion',
          });
        }

        // Perform account deletion
        await AccountDeletionService.deleteAccount(userId, userEmail, userName);

        // Log the deletion action
        console.log(
          `[Account Management] User ${userId} (${userEmail}) successfully deleted their account`
        );

        return {
          success: true,
          message: 'Your account has been successfully deleted',
        };
      } catch (error) {
        console.error('[Account Management] Error deleting account:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account. Please try again later.',
        });
      }
    }),
});
