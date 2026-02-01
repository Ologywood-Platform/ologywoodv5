import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';

export const riderManagementRouter = router({
  // Save a new rider template
  saveTemplate: protectedProcedure
    .input(
      z.object({
        templateName: z.string().min(1, "Template name required"),
        description: z.string().optional(),
        sections: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
            isRequired: z.boolean(),
          })
        ),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // For now, we'll store the template name and use the description field
        // In a real implementation, you'd want to extend the schema to store sections
        const templateName = input.templateName;
        
        return { 
          success: true, 
          templateId: Math.floor(Math.random() * 10000),
          message: `Rider template "${templateName}" saved successfully` 
        };
      } catch (error) {
        console.error("Error saving rider template:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save rider template'
        });
      }
    }),

  // Get all templates for the current user
  getMyTemplates: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Return mock data for now
      return [
        {
          id: 1,
          templateName: "Standard Jazz Rider",
          description: "Professional rider for jazz performances",
          artistId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch templates'
      });
    }
  }),

  // Get a specific template
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // Return mock data for now
        return {
          id: input.templateId,
          templateName: "Standard Jazz Rider",
          description: "Professional rider for jazz performances",
          artistId: ctx.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (error) {
        console.error("Error fetching template:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch template'
        });
      }
    }),

  // Update a rider template
  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        templateName: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return { 
          success: true,
          message: `Rider template updated successfully` 
        };
      } catch (error) {
        console.error("Error updating template:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update rider template'
        });
      }
    }),

  // Delete a rider template
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return { 
          success: true,
          message: `Rider template deleted successfully` 
        };
      } catch (error) {
        console.error("Error deleting template:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete rider template'
        });
      }
    }),
});
