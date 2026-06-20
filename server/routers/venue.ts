import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getDb, getPool } from "../db";
import { storagePut } from "../storage";
import { sendVenueVerificationEmail, sendVenueVerificationConfirmationEmail, sendEmail } from "../email";
import * as notif from "../services/notificationService";
import { venueProfileViews, bookings } from "../../drizzle/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

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
        venueType: z.string().optional(),
        minCapacity: z.number().optional(),
        maxCapacity: z.number().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const venues = await db.searchVenues({
          query: input.searchQuery,
          location: input.location,
          capacity: input.minCapacity,
          amenities: undefined,
          venueType: input.venueType,
          maxCapacity: input.maxCapacity,
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
    return [
      'Arena / Stadium',
      'Banquet Hall',
      'Bar / Lounge',
      'Church / Place of Worship',
      'Community Center',
      'Concert Hall',
      'Event Space',
      'Hotel Ballroom',
      'Nightclub',
      'Outdoor Amphitheater',
      'Private Estate',
      'Restaurant',
      'Rooftop',
      'Theater',
      'Warehouse',
      'Other',
    ];
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
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        bio: z.string().optional(),
        venueType: z.string().optional(),
        capacity: z.number().int().positive().optional(),
        email: z.string().email().optional(),
        amenities: z.record(z.string(), z.any()).optional(),
        operatingHours: z.object({
          monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
        }).optional(),
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

        // Build display location from structured fields
        const locationDisplay = [input.city, input.state].filter(Boolean).join(', ') || input.location || null;

        await db.createVenueProfile({
          userId: ctx.user.id,
          organizationName: input.organizationName,
          contactName: input.contactName || null,
          contactPhone: input.contactPhone || null,
          location: locationDisplay,
          city: input.city || null,
          state: input.state || null,
          country: input.country || 'US',
          bio: input.bio || null,
          venueType: input.venueType || null,
          capacity: input.capacity || null,
          email: input.email || null,
          amenities: input.amenities || null,
          operatingHours: input.operatingHours || null,
        } as any);

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
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        bio: z.string().optional(),
        profilePhotoUrl: z.string().optional(),
        venueType: z.string().optional(),
        capacity: z.number().int().positive().optional().nullable(),
        email: z.string().email().optional().nullable(),
        amenities: z.record(z.string(), z.any()).optional().nullable(),
        operatingHours: z.object({
          monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
          sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean() }),
        }).optional().nullable(),
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

        await db.updateVenueProfile(profile.id, input as any);
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

        // Save the photo URL to the venue profile
        await db.updateVenueProfile(profile.id, { profilePhotoUrl: url });

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
   * Upload a gallery photo (venue only)
   * Stores photos in the mediaGallery JSON field as an array of { url, caption, uploadedAt }
   */
  uploadGalleryPhoto: venueProcedure
    .input(
      z.object({
        fileData: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }

        // Limit to 20 gallery photos
        const currentGallery = (profile.mediaGallery as any)?.photos || [];
        if (currentGallery.length >= 20) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Maximum 20 gallery photos allowed' });
        }

        // Convert base64 to buffer
        const base64Data = input.fileData.split(',')[1] || input.fileData;
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `venue-gallery/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Add to gallery array
        const newPhoto = {
          id: `${timestamp}-${randomSuffix}`,
          url,
          caption: input.caption || '',
          uploadedAt: new Date().toISOString(),
        };
        const updatedPhotos = [...currentGallery, newPhoto];

        await db.updateVenueProfile(profile.id, {
          mediaGallery: { photos: updatedPhotos } as any,
        });

        return { success: true, photo: newPhoto, totalPhotos: updatedPhotos.length };
      } catch (error) {
        console.error('[Venue] Upload gallery photo error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upload gallery photo' });
      }
    }),

  /**
   * Delete a gallery photo (venue only)
   */
  deleteGalleryPhoto: venueProcedure
    .input(z.object({ photoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }

        const currentGallery = (profile.mediaGallery as any)?.photos || [];
        const updatedPhotos = currentGallery.filter((p: any) => p.id !== input.photoId);

        if (updatedPhotos.length === currentGallery.length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Photo not found in gallery' });
        }

        await db.updateVenueProfile(profile.id, {
          mediaGallery: { photos: updatedPhotos } as any,
        });

        return { success: true, totalPhotos: updatedPhotos.length };
      } catch (error) {
        console.error('[Venue] Delete gallery photo error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete gallery photo' });
      }
    }),

  /**
   * Update gallery photo caption (venue only)
   */
  updateGalleryCaption: venueProcedure
    .input(z.object({ photoId: z.string(), caption: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }

        const currentGallery = (profile.mediaGallery as any)?.photos || [];
        const updatedPhotos = currentGallery.map((p: any) =>
          p.id === input.photoId ? { ...p, caption: input.caption } : p
        );

        await db.updateVenueProfile(profile.id, {
          mediaGallery: { photos: updatedPhotos } as any,
        });

        return { success: true };
      } catch (error) {
        console.error('[Venue] Update gallery caption error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update caption' });
      }
    }),

  /**
   * Reorder gallery photos (venue only)
   */
  reorderGalleryPhotos: venueProcedure
    .input(z.object({ photoIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const profile = await db.getVenueProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
        }

        const currentGallery = (profile.mediaGallery as any)?.photos || [];
        const photoMap = new Map(currentGallery.map((p: any) => [p.id, p]));
        const reordered = input.photoIds
          .map((id: string) => photoMap.get(id))
          .filter(Boolean);

        // Add any photos not in the reorder list at the end
        const reorderedIds = new Set(input.photoIds);
        const remaining = currentGallery.filter((p: any) => !reorderedIds.has(p.id));

        await db.updateVenueProfile(profile.id, {
          mediaGallery: { photos: [...reordered, ...remaining] } as any,
        });

        return { success: true };
      } catch (error) {
        console.error('[Venue] Reorder gallery error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to reorder gallery' });
      }
    }),

  /**
   * Get gallery photos for a venue (public)
   */
  getGallery: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(async ({ input }) => {
      try {
        const profile = await db.getVenueProfileById(input.venueId);
        if (!profile) {
          return { photos: [] };
        }
        const photos = (profile.mediaGallery as any)?.photos || [];
        return { photos };
      } catch (error) {
        console.error('[Venue] Get gallery error:', error);
        return { photos: [] };
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

  /**
   * Contact venue - artist sends inquiry to venue (creates booking + first message)
   */
  contactVenue: protectedProcedure
    .input(z.object({
      venueId: z.number(),
      inquiryType: z.enum(['booking', 'general', 'availability', 'pricing']),
      subject: z.string().min(1).max(200),
      message: z.string().min(10).max(2000),
      preferredDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get venue profile
        const venueProfile = await db.getVenueProfileById(input.venueId);
        if (!venueProfile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue not found' });
        }

        // Check if the preferred date is blocked (explicit or recurring)
        if (input.preferredDate) {
          const dateBlockStatus = await db.isDateBlockedForVenue(venueProfile.id, input.preferredDate);
          if (dateBlockStatus.blocked) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: `This venue is unavailable on the selected date (${dateBlockStatus.reason}). Please choose a different date.` });
          }
        }

        // Get sender's artist profile (if they have one)
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const senderUser = await db.getUserById(ctx.user.id);
        const senderName = artistProfile?.artistName || senderUser?.name || senderUser?.email || 'Someone';

        // Build the full message content with inquiry metadata
        const inquiryLabels: Record<string, string> = {
          booking: 'Booking Inquiry',
          general: 'General Inquiry',
          availability: 'Availability Check',
          pricing: 'Pricing Inquiry',
        };
        const inquiryLabel = inquiryLabels[input.inquiryType] || 'Inquiry';
        const dateStr = input.preferredDate ? `\nPreferred Date: ${input.preferredDate}` : '';
        const fullMessage = `📩 ${inquiryLabel}: ${input.subject}${dateStr}\n\n${input.message}`;

        // Auto-attach artist's default rider template if available
        let defaultRiderId: number | undefined;
        if (artistProfile) {
          try {
            const { getDefaultRiderForArtist } = await import('../services/riderTemplateService');
            const defaultRider = await getDefaultRiderForArtist(artistProfile.userId);
            if (defaultRider) defaultRiderId = defaultRider.id;
          } catch (_) { /* fallback: no auto-attach */ }
        }

        // Create a pending booking to hold this conversation
        const booking = await db.createBooking({
          artistId: artistProfile?.id || 0,
          venueId: venueProfile.id,
          eventDate: input.preferredDate ? new Date(input.preferredDate) : new Date(),
          eventTime: null,
          totalFee: null,
          eventDetails: `${inquiryLabel}: ${input.subject}`,
          status: 'pending',
          riderTemplateId: defaultRiderId,
          riderStatus: defaultRiderId ? 'pending' : undefined,
        });

        // Send the first message
        await db.createMessage({
          bookingId: booking.id,
          senderId: ctx.user.id,
          recipientId: venueProfile.userId,
          content: fullMessage,
        });

        // In-app notification
        notif.notifyNewMessage({
          recipientUserId: venueProfile.userId,
          senderName,
          preview: `${inquiryLabel}: ${input.subject}`,
          bookingId: booking.id,
        }).catch(() => {});

        // Email notification to venue
        const venueUser = await db.getUserById(venueProfile.userId);
        if (venueUser?.email) {
          sendEmail({
            to: venueUser.email,
            subject: `New ${inquiryLabel} from ${senderName} — Ologywood`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 24px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">New ${inquiryLabel}</h1>
                </div>
                <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #374151; margin: 0 0 16px;">Hi ${venueProfile.organizationName || 'there'},</p>
                  <p style="color: #374151; margin: 0 0 16px;"><strong>${senderName}</strong> has sent you a ${inquiryLabel.toLowerCase()} on Ologywood.</p>
                  <div style="background: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #6b7280; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">Subject</p>
                    <p style="color: #111827; margin: 0 0 12px; font-weight: 600;">${input.subject}</p>
                    ${input.preferredDate ? `<p style="color: #6b7280; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">Preferred Date</p><p style="color: #111827; margin: 0 0 12px;">${input.preferredDate}</p>` : ''}
                    <p style="color: #6b7280; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">Message</p>
                    <p style="color: #111827; margin: 0; white-space: pre-wrap;">${input.message}</p>
                  </div>
                  <a href="${process.env.BASE_URL || 'https://www.ologywood.com'}/messages/${booking.id}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">View & Reply</a>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">You received this because someone contacted your venue on Ologywood.</p>
                </div>
              </div>
            `,
          }).catch((err) => console.error('[Venue] Failed to send inquiry email:', err));
        }

        return { success: true, bookingId: booking.id, message: 'Inquiry sent successfully' };
      } catch (error) {
        console.error('[Venue] Contact venue error:', error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send inquiry',
        });
      }
    }),

  /**
   * Get blocked dates for the logged-in venue
   */
  getBlockedDates: venueProcedure
    .input(z.object({
      startDate: z.string().optional(), // YYYY-MM-DD
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      return db.getVenueBlockedDates(venueProfile.id, input?.startDate, input?.endDate);
    }),

  /**
   * Block one or more dates
   */
  blockDates: venueProcedure
    .input(z.object({
      dates: z.array(z.string()), // Array of YYYY-MM-DD strings
      reason: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      await db.blockVenueDates(venueProfile.id, input.dates, input.reason);
      return { success: true, count: input.dates.length };
    }),

  /**
   * Get blocked dates for a venue (public - for venue profile display)
   */
  getBlockedDatesPublic: publicProcedure
    .input(z.object({
      venueId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const explicitDates = await db.getVenueBlockedDates(input.venueId, input.startDate, input.endDate);
      const recurringBlocks = await db.getVenueRecurringBlocks(input.venueId);
      // Return explicit dates + recurring day info for public view
      return {
        blockedDates: explicitDates.map(d => d.date),
        recurringBlockedDays: recurringBlocks.map(b => b.dayOfWeek), // 0=Sun, 6=Sat
      };
    }),

  /**
   * Unblock one or more dates
   */
  unblockDates: venueProcedure
    .input(z.object({
      dates: z.array(z.string()), // Array of YYYY-MM-DD strings
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      await db.unblockVenueDates(venueProfile.id, input.dates);
      return { success: true, count: input.dates.length };
    }),

  // ─── Recurring Blocks ─────────────────────────────────────────────────────

  getRecurringBlocks: venueProcedure
    .query(async ({ ctx }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      return await db.getVenueRecurringBlocks(venueProfile.id);
    }),

  addRecurringBlock: venueProcedure
    .input(z.object({
      dayOfWeek: z.number().min(0).max(6), // 0=Sunday, 6=Saturday
      reason: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      const block = await db.addVenueRecurringBlock(venueProfile.id, input.dayOfWeek, input.reason);
      return { success: true, block };
    }),

  removeRecurringBlock: venueProcedure
    .input(z.object({
      dayOfWeek: z.number().min(0).max(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      await db.removeVenueRecurringBlock(venueProfile.id, input.dayOfWeek);
      return { success: true };
    }),

  getRecurringBlocksPublic: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .query(async ({ input }) => {
      return await db.getVenueRecurringBlocks(input.venueId);
    }),

  /**
   * Import events from a Google Calendar iCal URL as blocked dates
   */
  importCalendarBlocked: venueProcedure
    .input(z.object({
      icalUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });

      // Fetch the iCal feed
      const response = await fetch(input.icalUrl);
      if (!response.ok) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Could not fetch calendar URL. Make sure it is a public iCal link.' });
      }
      const icalText = await response.text();

      // Parse iCal events (simple parser for VEVENT blocks)
      const events: { summary: string; startDate: string }[] = [];
      const veventBlocks = icalText.split('BEGIN:VEVENT');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 1; i < veventBlocks.length; i++) {
        const block = veventBlocks[i];
        const endIdx = block.indexOf('END:VEVENT');
        const content = endIdx > -1 ? block.substring(0, endIdx) : block;

        // Extract DTSTART
        const dtStartMatch = content.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})/);
        if (!dtStartMatch) continue;

        const year = parseInt(dtStartMatch[1]);
        const month = parseInt(dtStartMatch[2]);
        const day = parseInt(dtStartMatch[3]);
        const eventDate = new Date(year, month - 1, day);

        // Only import future events (next 90 days)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 90);
        if (eventDate < today || eventDate > maxDate) continue;

        // Extract SUMMARY
        const summaryMatch = content.match(/SUMMARY:(.+)/);
        const summary = summaryMatch ? summaryMatch[1].trim().replace(/\\n/g, ' ').replace(/\\,/g, ',') : 'External event';

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        events.push({ summary, startDate: dateStr });
      }

      if (events.length === 0) {
        return { success: true, imported: 0, message: 'No upcoming events found in the calendar feed.' };
      }

      // Block the dates with the event summary as reason
      const datesToBlock = events.map(e => e.startDate);
      const uniqueDates = [...new Set(datesToBlock)];
      const reasons = events.reduce((acc, e) => {
        acc[e.startDate] = e.summary;
        return acc;
      }, {} as Record<string, string>);

      // Block each unique date with its reason
      for (const date of uniqueDates) {
        try {
          await db.blockVenueDates(venueProfile.id, [date], `Calendar: ${reasons[date]}`);
        } catch {
          // Skip duplicates silently
        }
      }

      return { success: true, imported: uniqueDates.length, message: `Imported ${uniqueDates.length} dates as blocked from your calendar.` };
    }),

  /**
   * Track a venue profile view (public)
   */
  trackProfileView: publicProcedure
    .input(z.object({ venueId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const database = await getDb();
        if (!database) return { success: true };
        await database.insert(venueProfileViews).values({ venueId: input.venueId });
      } catch (error) {
        console.error('Error tracking venue profile view:', error);
      }
      return { success: true };
    }),

  /**
   * Get booking funnel metrics for a venue
   * Tracks: profile views → booking requests → confirmed bookings
   */
  getBookingFunnel: venueProcedure
    .input(z.object({
      days: z.enum(['7', '30', '90']).default('30'),
    }).optional())
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        return { profileViews: 0, bookingRequests: 0, confirmedBookings: 0, completedBookings: 0, conversionRates: { viewToRequest: 0, requestToConfirmed: 0, overall: 0 } };
      }

      const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
      if (!venueProfile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
      }

      const days = parseInt(input?.days || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Profile views in period
      const viewsResult = await database
        .select({ count: sql<number>`COUNT(*)` })
        .from(venueProfileViews)
        .where(and(
          eq(venueProfileViews.venueId, venueProfile.id),
          gte(venueProfileViews.viewedAt, startDate)
        ));
      const profileViews = viewsResult[0]?.count || 0;

      // Booking requests (all bookings created in period)
      const requestsResult = await database
        .select({ count: sql<number>`COUNT(*)` })
        .from(bookings)
        .where(and(
          eq(bookings.venueId, venueProfile.id),
          gte(bookings.createdAt, startDate)
        ));
      const bookingRequests = requestsResult[0]?.count || 0;

      // Confirmed bookings in period
      const confirmedResult = await database
        .select({ count: sql<number>`COUNT(*)` })
        .from(bookings)
        .where(and(
          eq(bookings.venueId, venueProfile.id),
          eq(bookings.status, 'confirmed'),
          gte(bookings.createdAt, startDate)
        ));
      const confirmedBookings = confirmedResult[0]?.count || 0;

      // Completed bookings in period
      const completedResult = await database
        .select({ count: sql<number>`COUNT(*)` })
        .from(bookings)
        .where(and(
          eq(bookings.venueId, venueProfile.id),
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, startDate)
        ));
      const completedBookings = completedResult[0]?.count || 0;

      // Calculate conversion rates
      const conversionRates = {
        viewToRequest: profileViews > 0 ? Math.round((bookingRequests / profileViews) * 100) : 0,
        requestToConfirmed: bookingRequests > 0 ? Math.round((confirmedBookings / bookingRequests) * 100) : 0,
        overall: profileViews > 0 ? Math.round((confirmedBookings / profileViews) * 100) : 0,
      };

      return { profileViews, bookingRequests, confirmedBookings, completedBookings, conversionRates };
    }),

  /**
   * Get availability summary for multiple venues (public)
   * Returns whether each venue has open dates in the next 30 days
   */
  getAvailabilitySummary: publicProcedure
    .input(z.object({ venueIds: z.array(z.number()).max(50) }))
    .query(async ({ input }) => {
      await getDb();
      const pool = getPool();
      if (!pool) return {};

      const results: Record<number, { hasOpenDates: boolean; blockedCount: number }> = {};
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (const venueId of input.venueIds) {
        try {
          // Count blocked dates in next 30 days
          const [blockedRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM venue_blocked_dates 
             WHERE venueProfileId = ? AND blockedDate BETWEEN ? AND ?`,
            [venueId, now.toISOString().split('T')[0], thirtyDaysFromNow.toISOString().split('T')[0]]
          );
          const blockedCount = (blockedRows as any)[0]?.cnt || 0;

          // Count confirmed bookings in next 30 days
          const [bookingRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM bookings 
             WHERE venueId = ? AND status = 'confirmed' AND eventDate BETWEEN ? AND ?`,
            [venueId, now.toISOString().split('T')[0], thirtyDaysFromNow.toISOString().split('T')[0]]
          );
          const confirmedCount = (bookingRows as any)[0]?.cnt || 0;

          // Count recurring blocks (days of week that are always blocked)
          const [recurringRows] = await pool.query(
            `SELECT COUNT(*) as cnt FROM venue_recurring_blocks 
             WHERE venueProfileId = ? AND isActive = 1`,
            [venueId]
          );
          const recurringCount = (recurringRows as any)[0]?.cnt || 0;

          // Total days in next 30 = 30, minus blocked + confirmed + (recurring * ~4 weeks)
          const totalBlocked = blockedCount + confirmedCount + (recurringCount * 4);
          results[venueId] = { hasOpenDates: totalBlocked < 25, blockedCount: totalBlocked };
        } catch {
          results[venueId] = { hasOpenDates: true, blockedCount: 0 };
        }
      }

      return results;
    }),

  /**
   * Get featured venues for homepage (public)
   * Returns top venues by review count and rating
   */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().default(8) }).optional().default({ limit: 8 }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      try {
        const pool = getPool();
        if (!pool) return [];
        const [venues] = await pool.query(
          `SELECT * FROM venue_profiles 
           WHERE organizationName IS NOT NULL AND organizationName != ''
           ORDER BY reviewCount DESC, averageRating DESC, createdAt DESC
           LIMIT ?`,
          [input.limit]
        );

        return (venues as any[]).map(v => ({
          id: v.id,
          userId: v.userId,
          organizationName: v.organizationName,
          location: v.location,
          venueType: v.venueType,
          capacity: v.capacity,
          profilePhotoUrl: v.profilePhotoUrl,
          averageRating: v.averageRating,
          reviewCount: v.reviewCount,
        }));
      } catch (error) {
        console.error('[Venue] getFeatured error:', error);
        return [];
      }
    }),

  /**
   * Get the venue's iCal calendar feed URL for subscribing in external calendar apps
   */
  getCalendarFeedUrl: venueProcedure.query(async ({ ctx }) => {
    const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);
    if (!venueProfile) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue profile not found' });
    }
    const crypto = await import('crypto');
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    const token = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`venue-calendar-feed-${venueProfile.id}`)
      .digest('hex')
      .substring(0, 32);
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return {
      feedUrl: `${baseUrl}/api/calendar/venue/${venueProfile.id}/events.ics?token=${token}`,
      venueId: venueProfile.id,
      token,
    };
  }),
});
