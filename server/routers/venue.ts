import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { storagePut } from "../storage";
import { sendVenueVerificationEmail, sendVenueVerificationConfirmationEmail } from "../email";

// Helper to check if user is a venue
const venueProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'venue' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Venue access required' });
  }
  return next({ ctx });
});

export const venueRouter = router({
  /**
   * Search venues with filters (public)
   */
  search: publicProcedure
    .input(
      z.object({
        location: z.string().optional(),
        searchQuery: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const venues = await db.searchVenues({
          query: input.searchQuery,
          location: input.location,
          capacity: undefined,
          amenities: undefined,
        });
        return venues;
      } catch (error) {
        console.error('[Venue] Search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search venues',
        });
      }
    }),

  /**
   * Get venue types (public)
   */
  getVenueTypes: publicProcedure.query(async () => {
    return ['Concert Hall', 'Bar', 'Club', 'Theater', 'Festival', 'Other'];
  }),

  /**
   * Get current venue's profile (venue only)
   */
  getMyProfile: venueProcedure.query(async ({ ctx }) => {
    try {
      const profile = await db.getVenueProfileByUserId(ctx.user.id);
      return profile ?? null;
    } catch (error) {
      console.error('[Venue] Get profile error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch venue profile',
      });
    }
  }),

  /**
   * Get venue profile by ID (public)
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const profile = await db.getVenueProfileById(input.id);
        return profile;
      } catch (error) {
        console.error('[Venue] Get by ID error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch venue profile',
        });
      }
    }),

  /**
   * Create venue profile (venue only)
   */
  createProfile: venueProcedure
    .input(
      z.object({
        organizationName: z.string().min(1, 'Organization name is required'),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if profile already exists
        const existing = await db.getVenueProfileByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Venue profile already exists',
          });
        }

        await db.createVenueProfile({
          userId: ctx.user.id,
          organizationName: input.organizationName,
          contactName: input.contactName || null,
          contactPhone: input.contactPhone || null,
          location: input.location || null,
          bio: input.bio || null,
        });

        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        return { success: true, profile };
      } catch (error) {
        console.error('[Venue] Create profile error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create venue profile',
        });
      }
    }),

  /**
   * Update venue profile (venue only)
   */
  updateProfile: venueProcedure
    .input(
      z.object({
        organizationName: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Venue profile not found',
          });
        }

        await db.updateVenueProfile(profile.id, input);
        const updated = await db.getVenueProfileByUserId(ctx.user.id);
        return { success: true, profile: updated };
      } catch (error) {
        console.error('[Venue] Update profile error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update venue profile',
        });
      }
    }),

  /**
   * Upload venue profile photo (venue only)
   */
  uploadProfilePhoto: venueProcedure
    .input(
      z.object({
        fileData: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Venue profile not found',
          });
        }

        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `venue-profile-photos/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Note: Profile photo storage depends on schema having profilePhotoUrl field
        // For now, just return the URL
        return { url, success: true };
      } catch (error) {
        console.error('[Venue] Upload photo error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload profile photo',
        });
      }
    }),

  /**
   * Send venue email verification (venue only)
   */
  sendVerificationEmail: venueProcedure.mutation(async ({ ctx }) => {
    try {
      const profile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Venue profile not found',
        });
      }

      const userEmail = ctx.user.email;
      if (!userEmail) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User email not found',
        });
      }

      // Generate verification token
      const verificationToken = crypto
        .getRandomValues(new Uint8Array(32))
        .toString();
      const verificationLink = `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/verify-venue-email?token=${verificationToken}`;

      // Send verification email
      const emailSent = await sendVenueVerificationEmail({
        venueEmail: userEmail,
        venueName: profile.organizationName,
        verificationToken,
        verificationLink,
      });

      if (!emailSent) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send verification email',
        });
      }

      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      console.error('[Venue] Send verification email error:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to send verification email',
      });
    }
  }),

  /**
   * Verify venue email with token (public)
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const profile = await db.getVenueProfileByToken(input.token);
        if (!profile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid or expired verification token',
          });
        }

        // Send confirmation email
        const user = await db.getUserById(profile.userId);
        if (user && typeof user === 'object' && 'email' in user) {
          const email = (user as any).email;
          if (email) {
            await sendVenueVerificationConfirmationEmail({
              venueEmail: email,
              venueName: (profile as any).organizationName || 'Venue',
            });
          }
        }

        return { success: true, message: 'Email verified successfully' };
      } catch (error) {
        console.error('[Venue] Verify email error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify email',
        });
      }
    }),
});
