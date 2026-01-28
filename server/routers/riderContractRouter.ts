import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';
import { RiderContractGenerator, generateRiderContractText, type RiderContractData } from '../services/riderContractService';
import { storagePut } from '../storage';

const riderContractSchema = z.object({
  artistName: z.string().min(1, 'Artist name is required'),
  artistEmail: z.string().email('Valid email is required'),
  artistPhone: z.string().optional(),
  venueName: z.string().min(1, 'Venue name is required'),
  venueAddress: z.string().min(1, 'Venue address is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  eventTime: z.string().min(1, 'Event time is required'),
  eventDuration: z.number().optional(),
  totalFee: z.number().positive('Total fee must be positive'),
  depositAmount: z.number().optional(),
  technical: z.object({
    soundSystem: z.string().optional(),
    lightingSystem: z.string().optional(),
    stage: z.string().optional(),
    parking: z.string().optional(),
    loadIn: z.string().optional(),
    soundCheck: z.string().optional(),
    additionalRequirements: z.array(z.string()).optional(),
  }).optional(),
  hospitality: z.object({
    greenRoom: z.string().optional(),
    meals: z.string().optional(),
    dressing: z.string().optional(),
    parking: z.string().optional(),
    accommodations: z.string().optional(),
    additionalRequirements: z.array(z.string()).optional(),
  }).optional(),
  financial: z.object({
    paymentTerms: z.string().optional(),
    cancellationPolicy: z.string().optional(),
    insuranceRequired: z.boolean().optional(),
    taxId: z.string().optional(),
    additionalTerms: z.array(z.string()).optional(),
  }).optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
});

export const riderContractRouter = router({
  /**
   * Generate a PDF rider contract
   */
  generatePDF: protectedProcedure
    .input(riderContractSchema)
    .mutation(async ({ input }) => {
      try {
        const contractData: RiderContractData = input as RiderContractData;
        const pdfBuffer = await RiderContractGenerator.generatePDF(contractData);

        // Upload to S3
        const fileName = `rider-contracts/${contractData.artistName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        const result = await storagePut(fileName, pdfBuffer, 'application/pdf');

        return {
          success: true,
          url: result.url,
          key: result.key,
          fileName,
        };
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate rider contract PDF',
        });
      }
    }),

  /**
   * Generate a text version of the rider contract
   */
  generateText: protectedProcedure
    .input(riderContractSchema)
    .query(({ input }) => {
      try {
        const contractData: RiderContractData = input as RiderContractData;
        return generateRiderContractText(contractData);
      } catch (error) {
        console.error('Error generating text:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate rider contract text',
        });
      }
    }),

  /**
   * Save a rider contract template for an artist
   */
  saveTemplate: protectedProcedure
    .input(z.object({
      templateName: z.string().min(1, 'Template name is required'),
      contractData: riderContractSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get artist profile
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Artist profile not found',
          });
        }

        // Save rider template
        await db.createRiderTemplate({
          artistId: artistProfile.id,
          templateName: input.templateName,
        });

        return {
          success: true,
          templateName: input.templateName,
        };
      } catch (error) {
        console.error('Error saving template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save rider contract template',
        });
      }
    }),

  /**
   * Get artist's saved rider contract templates
   */
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    try {
      const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
      if (!artistProfile) {
        return [];
      }

      const templates = await db.getRiderTemplatesByArtistId(artistProfile.id);

      return templates.map((t) => ({
        id: t.id,
        templateName: t.templateName,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch rider contract templates',
      });
    }
  }),

  /**
   * Get a specific rider contract template
   */
  getTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Artist profile not found',
          });
        }

        const template = await db.getRiderTemplateById(input.templateId);
        
        // Verify ownership
        if (!template || template.artistId !== artistProfile.id) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        return {
          id: template.id,
          templateName: template.templateName,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };
      } catch (error) {
        console.error('Error fetching template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch rider contract template',
        });
      }
    }),

  /**
   * Update a rider contract template
   */
  updateTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      templateName: z.string().min(1, 'Template name is required'),
      contractData: riderContractSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Artist profile not found',
          });
        }

        // Verify ownership
        const template = await db.getRiderTemplateById(input.templateId);
        
        if (!template || template.artistId !== artistProfile.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this template',
          });
        }

        // Update template
        const result = await db.updateRiderTemplate(input.templateId, {
          templateName: input.templateName,
        });

        return {
          success: true,
          templateId: input.templateId,
          templateName: input.templateName,
        };
      } catch (error) {
        console.error('Error updating template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update rider contract template',
        });
      }
    }),

  /**
   * Delete a rider contract template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        if (!artistProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Artist profile not found',
          });
        }

        // Verify ownership
        const template = await db.getRiderTemplateById(input.templateId);
        
        if (!template || template.artistId !== artistProfile.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this template',
          });
        }

        // Delete template
        await db.deleteRiderTemplate(input.templateId);

        return {
          success: true,
          message: 'Template deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete rider contract template',
        });
      }
    }),

  /**
   * Generate and save a contract for a specific booking
   */
  generateForBooking: protectedProcedure
    .input(z.object({
      bookingId: z.number(),
      contractData: riderContractSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify booking exists and user has access
        const booking = await db.getBookingById(input.bookingId);

        if (!booking) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Booking not found',
          });
        }

        // Verify user is artist or venue on this booking
        const artistProfile = await db.getArtistProfileByUserId(ctx.user.id);
        const venueProfile = await db.getVenueProfileByUserId(ctx.user.id);

        if (
          (!artistProfile || artistProfile.id !== booking.artistId) &&
          (!venueProfile || venueProfile.id !== booking.venueId)
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to generate contracts for this booking',
          });
        }

        // Generate PDF
        const contractData: RiderContractData = input.contractData as RiderContractData;
        const pdfBuffer = await RiderContractGenerator.generatePDF(contractData);

        // Upload to S3
        const fileName = `contracts/booking-${input.bookingId}-${Date.now()}.pdf`;
        const result = await storagePut(fileName, pdfBuffer, 'application/pdf');

        // Save contract record
        const contract = await db.createContract({
          bookingId: input.bookingId,
          artistId: booking.artistId,
          venueId: booking.venueId,
          contractData: input.contractData,
          status: 'draft',
        });

        return {
          success: true,
          contractId: contract.id,
          url: result.url,
          key: result.key,
          status: contract.status,
        };
      } catch (error) {
        console.error('Error generating contract for booking:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate contract for booking',
        });
      }
    }),
});
