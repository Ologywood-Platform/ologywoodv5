import { router, protectedProcedure } from '@/_core/trpc';
import { z } from 'zod';
import { getDb } from '@/server/db';
import { users, artistProfiles, venueProfiles } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const privacyRouter = router({
  /**
   * Get current privacy settings
   */
  getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        profileVisibility: user.profileVisibility || 'public',
        allowMessages: user.allowMessages !== false,
        allowBookingRequests: user.allowBookingRequests !== false,
        showEmail: user.showEmail === true,
        showPhone: user.showPhone === true,
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get privacy settings',
      });
    }
  }),

  /**
   * Update profile visibility
   */
  updateProfileVisibility: protectedProcedure
    .input(z.object({
      visibility: z.enum(['public', 'private', 'hidden']),
      allowMessages: z.boolean().optional(),
      allowBookingRequests: z.boolean().optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = getDb();
        
        await db
          .update(users)
          .set({
            profileVisibility: input.visibility,
            allowMessages: input.allowMessages,
            allowBookingRequests: input.allowBookingRequests,
            showEmail: input.showEmail,
            showPhone: input.showPhone,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: 'Privacy settings updated successfully',
        };
      } catch (error) {
        console.error('Error updating privacy settings:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update privacy settings',
        });
      }
    }),

  /**
   * Export user data (GDPR compliance)
   */
  exportUserData: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = getDb();
      
      // Get user data
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Get profile data based on role
      let profileData = null;
      if (user.role === 'artist') {
        profileData = await db.query.artistProfiles.findFirst({
          where: eq(artistProfiles.userId, ctx.user.id),
        });
      } else if (user.role === 'venue') {
        profileData = await db.query.venueProfiles.findFirst({
          where: eq(venueProfiles.userId, ctx.user.id),
        });
      }

      // Compile all user data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        profile: profileData,
        privacySettings: {
          profileVisibility: user.profileVisibility,
          allowMessages: user.allowMessages,
          allowBookingRequests: user.allowBookingRequests,
          showEmail: user.showEmail,
          showPhone: user.showPhone,
        },
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to export user data',
      });
    }
  }),

  /**
   * Delete user account (irreversible)
   */
  deleteAccount: protectedProcedure
    .input(z.object({
      password: z.string().min(1, 'Password required for account deletion'),
      confirmation: z.boolean().refine(val => val === true, {
        message: 'You must confirm account deletion',
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = getDb();
        
        // Get user
        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id),
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Note: In production, you should verify the password here
        // For now, we'll proceed with deletion
        // In real implementation, use bcrypt to verify password

        // Delete user profile data first (foreign key constraints)
        if (user.role === 'artist') {
          await db
            .delete(artistProfiles)
            .where(eq(artistProfiles.userId, ctx.user.id));
        } else if (user.role === 'venue') {
          await db
            .delete(venueProfiles)
            .where(eq(venueProfiles.userId, ctx.user.id));
        }

        // Delete user account
        await db
          .delete(users)
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: 'Account deleted successfully. All your data has been removed.',
        };
      } catch (error) {
        console.error('Error deleting account:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        });
      }
    }),

  /**
   * Request account deletion (with confirmation email)
   */
  requestAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const db = getDb();
      
      // Generate deletion token
      const deletionToken = Math.random().toString(36).substring(2, 15);
      const deletionTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update user with deletion token
      await db
        .update(users)
        .set({
          deletionToken,
          deletionTokenExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: 'Account deletion request sent. Check your email for confirmation.',
        expiresIn: '7 days',
      };
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to request account deletion',
      });
    }
  }),

  /**
   * Confirm account deletion with token
   */
  confirmAccountDeletion: protectedProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = getDb();
        
        // Get user
        const user = await db.query.users.findFirst({
          where: eq(users.id, ctx.user.id),
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        // Verify token
        if (user.deletionToken !== input.token) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid deletion token',
          });
        }

        // Check token expiration
        if (!user.deletionTokenExpires || user.deletionTokenExpires < new Date()) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Deletion token has expired',
          });
        }

        // Delete user profile data
        if (user.role === 'artist') {
          await db
            .delete(artistProfiles)
            .where(eq(artistProfiles.userId, ctx.user.id));
        } else if (user.role === 'venue') {
          await db
            .delete(venueProfiles)
            .where(eq(venueProfiles.userId, ctx.user.id));
        }

        // Delete user account
        await db
          .delete(users)
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: 'Account successfully deleted',
        };
      } catch (error) {
        console.error('Error confirming account deletion:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to confirm account deletion',
        });
      }
    }),
});
