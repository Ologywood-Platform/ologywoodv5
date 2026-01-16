import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { contractService, ContractData } from '../contractService';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import { bookings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Validation schemas
const contractDataSchema = z.object({
  artistName: z.string().min(1),
  stageName: z.string().optional(),
  artistEmail: z.string().email(),
  artistPhone: z.string().min(1),
  artistGenre: z.string().optional(),
  venueName: z.string().min(1),
  venueContactName: z.string().min(1),
  venueEmail: z.string().email(),
  venuePhone: z.string().min(1),
  venueAddress: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  performanceTime: z.string(),
  loadInTime: z.string().optional(),
  eventDuration: z.number().optional(),
  expectedAttendance: z.number().optional(),
  venueCapacity: z.number().optional(),
  baseFee: z.number().min(0),
  travelReimbursement: z.number().optional(),
  setupAllowance: z.number().optional(),
  paymentMethod: z.string().min(1),
  paymentTerms: z.string().min(1),
  paymentDueDate: z.string().optional(),
  paSystem: z.string().optional(),
  microphoneCount: z.string().optional(),
  monitorCount: z.string().optional(),
  mixerType: z.string().optional(),
  stageLighting: z.string().optional(),
  spotlight: z.string().optional(),
  stageDimensions: z.string().optional(),
  stageHeight: z.number().optional(),
  flooring: z.string().optional(),
  powerOutlets: z.string().optional(),
  wifiAccess: z.string().optional(),
  recordingPermission: z.string().optional(),
  liveStreamingPermission: z.string().optional(),
  videoRecordingPermission: z.string().optional(),
  audioRecordingPermission: z.string().optional(),
  dressingRoom: z.string().optional(),
  dressingRoomAmenities: z.string().optional(),
  mealsProvided: z.string().optional(),
  beveragesProvided: z.string().optional(),
  dietaryAccommodations: z.string().optional(),
  alcoholPolicy: z.string().optional(),
  parkingProvided: z.string().optional(),
  parkingLocation: z.string().optional(),
  setLength: z.number().optional(),
  intermission: z.number().optional(),
  encorePolicy: z.string().optional(),
  strictTiming: z.string().optional(),
  backingTracks: z.string().optional(),
  dressCode: z.string().optional(),
  prohibitedContent: z.string().optional(),
  artistSpecialRequests: z.string().optional(),
  venueSpecialNotes: z.string().optional(),
  additionalTerms: z.string().optional(),
  dashboardUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  privacyUrl: z.string().optional(),
  termsUrl: z.string().optional(),
});

export const contractManagementRouter = router({
  /**
   * Generate a contract from template
   */
  generateContract: protectedProcedure
    .input(
      z.object({
        contractData: contractDataSchema,
        format: z.enum(['html', 'markdown']).default('html'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const contract = await contractService.generateContract(
          input.contractData as ContractData,
          input.format
        );

        return {
          success: true,
          contract,
          format: input.format,
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error generating contract:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate contract',
        });
      }
    }),

  /**
   * Save a contract template for an artist
   */
  saveTemplate: protectedProcedure
    .input(
      z.object({
        templateName: z.string().min(1),
        contractData: contractDataSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get artist ID from user
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Artist profile not found',
          });
        }

        const templateId = await contractService.saveContractTemplate(
          artistProfile.id,
          input.templateName,
          input.contractData as ContractData
        );

        return {
          success: true,
          templateId,
          message: 'Contract template saved successfully',
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error saving template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save contract template',
        });
      }
    }),

  /**
   * Get contract templates for the current artist
   */
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    try {
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) {
        return {
          success: true,
          templates: [],
        };
      }

      const templates = await contractService.listContractTemplates(artistProfile.id);

      return {
        success: true,
        templates,
      };
    } catch (error) {
      console.error('[contractManagementRouter] Error getting templates:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get contract templates',
      });
    }
  }),

  /**
   * Attach contract to a booking
   */
  attachToBooking: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        contractData: contractDataSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify user has access to this booking
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Booking not found',
          });
        }

        // Check if user is artist or venue associated with booking
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        const isArtist = artistProfile && booking.artistId === artistProfile.id;
        const isVenue = venueProfile && booking.venueId === venueProfile.id;
        const isAdmin = ctx.user.role === 'admin';

        if (!isArtist && !isVenue && !isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this booking',
          });
        }

        await contractService.attachContractToBooking(input.bookingId, input.contractData as ContractData);

        return {
          success: true,
          message: 'Contract attached to booking successfully',
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error attaching contract:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to attach contract to booking',
        });
      }
    }),

  /**
   * Get contract for a booking
   */
  getBookingContract: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Booking not found',
          });
        }

        // Check access
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        const isArtist = artistProfile && booking.artistId === artistProfile.id;
        const isVenue = venueProfile && booking.venueId === venueProfile.id;
        const isAdmin = ctx.user.role === 'admin';

        if (!isArtist && !isVenue && !isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this booking',
          });
        }

        return {
          success: true,
          contract: booking.riderData || null,
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error getting booking contract:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get booking contract',
        });
      }
    }),

  /**
   * Create contract from booking details
   */
  createFromBooking: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Booking not found',
          });
        }

        const contractData = await contractService.createContractFromBooking(input.bookingId);

        return {
          success: true,
          contractData,
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error creating contract from booking:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create contract from booking',
        });
      }
    }),

  /**
   * Export contract as HTML
   */
  exportAsHTML: protectedProcedure
    .input(
      z.object({
        contractData: contractDataSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const html = await contractService.generateContract(input.contractData as ContractData, 'html');

        return {
          success: true,
          html,
          contentType: 'text/html',
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error exporting HTML:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export contract as HTML',
        });
      }
    }),

  /**
   * Export contract as Markdown
   */
  exportAsMarkdown: protectedProcedure
    .input(
      z.object({
        contractData: contractDataSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const markdown = await contractService.generateContract(input.contractData as ContractData, 'markdown');

        return {
          success: true,
          markdown,
          contentType: 'text/markdown',
        };
      } catch (error) {
        console.error('[contractManagementRouter] Error exporting Markdown:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export contract as Markdown',
        });
      }
    }),
});
