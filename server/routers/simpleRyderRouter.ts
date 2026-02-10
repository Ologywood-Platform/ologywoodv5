import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';

const SimpleRyderDataSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  performanceType: z.enum(['concert', 'dj_set', 'acoustic', 'workshop', 'other']),
  performanceDuration: z.number().min(1, 'Duration must be at least 1 minute'),
  setupTimeRequired: z.number().min(0),
  paSystemRequired: z.boolean(),
  lightingRequired: z.boolean(),
  monitorMixRequired: z.boolean(),
  bringingOwnEquipment: z.boolean(),
  equipmentList: z.string().optional(),
  powerRequirements: z.string().optional(),
  dressingRoomRequired: z.boolean(),
  cateringProvided: z.boolean(),
  dietaryRestrictions: z.string().optional(),
  parkingRequired: z.boolean(),
  numberOfPerformers: z.number().min(1).optional(),
  specialRequests: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const simpleRyderRouter = router({
  // Create a new ryder template
  create: protectedProcedure
    .input(SimpleRyderDataSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await db.createRiderTemplate({
          artistId: ctx.user.id,
          name: input.templateName,
          description: `${input.performanceType} - ${input.performanceDuration} minutes`,
          performanceType: input.performanceType,
          performanceDuration: input.performanceDuration,
          setupTimeRequired: input.setupTimeRequired,
          paSystemRequired: input.paSystemRequired,
          lightingRequired: input.lightingRequired,
          monitorMixRequired: input.monitorMixRequired,
          bringingOwnEquipment: input.bringingOwnEquipment,
          equipmentList: input.equipmentList,
          powerRequirements: input.powerRequirements,
          dressingRoomRequired: input.dressingRoomRequired,
          cateringProvided: input.cateringProvided,
          dietaryRestrictions: input.dietaryRestrictions,
          parkingRequired: input.parkingRequired,
          numberOfPerformers: input.numberOfPerformers,
          specialRequests: input.specialRequests,
          cancellationPolicy: input.cancellationPolicy,
          emergencyContact: input.emergencyContact,
          isPublished: true,
          version: 1,
        });

        return {
          success: true,
          templateId: result.id,
          message: 'Ryder template created successfully',
        };
      } catch (error) {
        console.error('Error creating ryder template:', error);
        throw new Error('Failed to create ryder template');
      }
    }),

  // Get a specific ryder template
  get: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const template = await db.getRiderTemplateById(input.templateId);

        if (!template || template.artistId !== ctx.user.id) {
          throw new Error('Template not found or unauthorized');
        }

        return template;
      } catch (error) {
        console.error('Error fetching ryder template:', error);
        throw new Error('Failed to fetch ryder template');
      }
    }),

  // List all ryder templates for current artist
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const templates = await db.getRiderTemplatesByArtistId(ctx.user.id);
      return templates;
    } catch (error) {
      console.error('Error listing ryder templates:', error);
      throw new Error('Failed to list ryder templates');
    }
  }),

  // Update a ryder template
  update: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        data: SimpleRyderDataSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify ownership
        const existing = await db.getRiderTemplateById(input.templateId);

        if (!existing || existing.artistId !== ctx.user.id) {
          throw new Error('Template not found or unauthorized');
        }

        const result = await db.updateRiderTemplate(input.templateId, {
          name: input.data.templateName,
          description: `${input.data.performanceType} - ${input.data.performanceDuration} minutes`,
          performanceType: input.data.performanceType,
          performanceDuration: input.data.performanceDuration,
          setupTimeRequired: input.data.setupTimeRequired,
          paSystemRequired: input.data.paSystemRequired,
          lightingRequired: input.data.lightingRequired,
          monitorMixRequired: input.data.monitorMixRequired,
          bringingOwnEquipment: input.data.bringingOwnEquipment,
          equipmentList: input.data.equipmentList,
          powerRequirements: input.data.powerRequirements,
          dressingRoomRequired: input.data.dressingRoomRequired,
          cateringProvided: input.data.cateringProvided,
          dietaryRestrictions: input.data.dietaryRestrictions,
          parkingRequired: input.data.parkingRequired,
          numberOfPerformers: input.data.numberOfPerformers,
          specialRequests: input.data.specialRequests,
          cancellationPolicy: input.data.cancellationPolicy,
          emergencyContact: input.data.emergencyContact,
          version: (existing.version || 1) + 1,
        });

        return {
          success: true,
          templateId: result.id,
          message: 'Ryder template updated successfully',
        };
      } catch (error) {
        console.error('Error updating ryder template:', error);
        throw new Error('Failed to update ryder template');
      }
    }),

  // Delete a ryder template
  delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify ownership
        const existing = await db.getRiderTemplateById(input.templateId);

        if (!existing || existing.artistId !== ctx.user.id) {
          throw new Error('Template not found or unauthorized');
        }

        await db.deleteRiderTemplate(input.templateId);

        return {
          success: true,
          message: 'Ryder template deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting ryder template:', error);
        throw new Error('Failed to delete ryder template');
      }
    }),

  // Get template for use in booking (public view)
  getPublic: publicProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      try {
        const template = await db.getRiderTemplateById(input.templateId);

        if (!template || !template.isPublished) {
          throw new Error('Template not found');
        }

        return template;
      } catch (error) {
        console.error('Error fetching public ryder template:', error);
        throw new Error('Failed to fetch ryder template');
      }
    }),
});
