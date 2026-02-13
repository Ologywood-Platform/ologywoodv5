import { router, protectedProcedure } from '../_core/trpc';
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
  // Create a new rider template
  create: protectedProcedure
    .input(SimpleRyderDataSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await db.createRiderTemplate({
          artistId: ctx.user.id,
          templateName: input.templateName,
          templateData: {
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
          },
        });

        return {
          success: true,
          templateId: result.id,
          message: 'Rider template created successfully',
        };
      } catch (error) {
        console.error('Error creating rider template:', error);
        throw new Error('Failed to create rider template');
      }
    }),

  // Get a specific rider template
  get: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const template = await db.getRiderTemplateById(input.templateId);

        if (!template || template.artistId !== ctx.user.id) {
          throw new Error('Template not found or unauthorized');
        }

        return {
          id: template.id,
          templateName: template.templateName,
          templateData: template.templateData,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };
      } catch (error) {
        console.error('Error fetching rider template:', error);
        throw new Error('Failed to fetch rider template');
      }
    }),

  // List all rider templates for the artist
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const templates = await db.getRiderTemplatesByArtistId(ctx.user.id);

      return templates.map((template) => ({
        id: template.id,
        templateName: template.templateName,
        templateData: template.templateData,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }));
    } catch (error) {
      console.error('Error listing rider templates:', error);
      throw new Error('Failed to list rider templates');
    }
  }),

  // Update a rider template
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
          templateName: input.data.templateName,
          templateData: {
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
          },
        });

        return {
          success: true,
          templateId: result.id,
          message: 'Rider template updated successfully',
        };
      } catch (error) {
        console.error('Error updating rider template:', error);
        throw new Error('Failed to update rider template');
      }
    }),

  // Delete a rider template
  delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const template = await db.getRiderTemplateById(input.templateId);

        if (!template || template.artistId !== ctx.user.id) {
          throw new Error('Template not found or unauthorized');
        }

        await db.deleteRiderTemplate(input.templateId);

        return {
          success: true,
          message: 'Rider template deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting rider template:', error);
        throw new Error('Failed to delete rider template');
      }
    }),
});
