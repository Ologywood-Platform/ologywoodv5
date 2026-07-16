/**
 * Rider Template tRPC Router
 * API endpoints for managing artist rider templates
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  getArtistRiderTemplates,
  getRiderTemplate,
  createRiderTemplate,
  updateRiderTemplate,
  deleteRiderTemplate,
  createFromDefaultTemplate,
  validateTemplate,
  generateRiderPreview,
  exportRiderAsJSON,
  duplicateRiderTemplate,
  getRiderTemplateStats,
  getDefaultTemplate,
  listDefaultTemplates,
  setDefaultRiderTemplate,
  getDefaultRiderForArtist,
} from "../services/riderTemplateService";

export const riderRouter = router({
  /**
   * Get all rider templates for the current artist
   */
  getMyTemplates: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");
    return await getArtistRiderTemplates(userId);
  }),

  /**
   * Get a specific rider template
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const template = await getRiderTemplate(input.templateId);
      if (!template || template.artistId !== userId) {
        throw new Error("Template not found or unauthorized");
      }
      return template;
    }),

  /**
   * Create a new rider template from scratch
   */
  createTemplate: protectedProcedure
    .input(
      z.object({
        templateName: z.string().min(1).max(255),
        templateData: z.record(z.string(), z.any()),
        templateType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      // Validate required fields before saving
      const templateType = input.templateType || "simple_booking";
      const formData = input.templateData?.formData || input.templateData || {};
      const validation = validateTemplate(templateType, formData);
      if (!validation.valid) {
        throw new Error(`Missing required fields: ${validation.errors.join(', ')}`);
      }

      return await createRiderTemplate(
        userId,
        input.templateName,
        input.templateData || {},
        input.templateType || "custom"
      );
    }),

  /**
   * Create a rider template from a default template
   */
  createFromDefault: protectedProcedure
    .input(
      z.object({
        templateType: z.string(),
        customName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      return await createFromDefaultTemplate(
        userId,
        input.templateType,
        input.customName || undefined
      );
    }),

  /**
   * Update a rider template
   */
  updateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        templateName: z.string().optional(),
        templateData: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      // Validate required fields if templateData is being updated
      if (input.templateData) {
        const formData = input.templateData?.formData || input.templateData || {};
        const templateType = input.templateData?.baseTemplate || "simple_booking";
        const validation = validateTemplate(templateType, formData);
        if (!validation.valid) {
          throw new Error(`Missing required fields: ${validation.errors.join(', ')}`);
        }
      }

      return await updateRiderTemplate(
        input.templateId,
        userId,
        input.templateName,
        input.templateData
      );
    }),

  /**
   * Delete a rider template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await deleteRiderTemplate(input.templateId, userId);
    }),

  /**
   * Duplicate a rider template
   */
  duplicateTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        newName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await duplicateRiderTemplate(input.templateId, userId, input.newName);
    }),

  /**
   * Validate rider template data
   */
  validateTemplate: publicProcedure
    .input(
      z.object({
        templateType: z.string(),
        data: z.record(z.string(), z.any()),
      })
    )
    .query(async ({ input }) => {
      return validateTemplate(input.templateType, input.data || {});
    }),

  /**
   * Generate HTML preview of a rider template
   */
  generatePreview: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await generateRiderPreview(input.templateId, userId);
    }),

  /**
   * Export rider template as JSON
   */
  exportAsJSON: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await exportRiderAsJSON(input.templateId, userId);
    }),

  /**
   * Get rider template statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");
    return await getRiderTemplateStats(userId);
  }),

  /**
   * Get default template structure by type
   */
  getDefaultTemplate: publicProcedure
    .input(z.object({ templateType: z.string() }))
    .query(async ({ input }) => {
      return getDefaultTemplate(input.templateType);
    }),

  /**
   * List all available default templates (summary info)
   */
  listDefaultTemplates: publicProcedure.query(async () => {
    return listDefaultTemplates();
  }),

  /**
   * Set a rider template as the default for auto-attach to new bookings
   */
  setDefault: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await setDefaultRiderTemplate(input.templateId, userId);
    }),

  /**
   * Clear the default rider template (no auto-attach)
   */
  clearDefault: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await setDefaultRiderTemplate(null, userId);
    }),

  /**
   * Get the artist's default rider template
   */
  getDefault: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await getDefaultRiderForArtist(userId);
    }),
});
