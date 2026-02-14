/**
 * Rider Template TRPC Router
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
} from "../services/riderTemplateService";
import { hasFeatureAccess } from "../services/pricingTierService";

export const riderRouter = router({
  /**
   * Get all rider templates for the current artist
   */
  getMyTemplates: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Check if user has access to rider feature
    const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
    if (!hasAccess) {
      throw new Error("Rider builder feature not available in your tier");
    }

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

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

      return await createRiderTemplate(
        userId,
        input.templateName,
        input.templateData || {}
      );
    }),

  /**
   * Create a rider template from a default template
   */
  createFromDefault: protectedProcedure
    .input(
      z.object({
        templateType: z.enum(["standard", "minimal", "band"]),
        customName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("Unauthorized");

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

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

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
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

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

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

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

      return await duplicateRiderTemplate(
        input.templateId,
        userId,
        input.newName
      );
    }),

  /**
   * Validate rider template data
   */
  validateTemplate: publicProcedure
    .input(
      z.object({
        templateType: z.enum(["standard", "minimal", "band"]),
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

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

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

      const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
      if (!hasAccess) {
        throw new Error("Rider builder feature not available in your tier");
      }

      return await exportRiderAsJSON(input.templateId, userId);
    }),

  /**
   * Get rider template statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const hasAccess = await hasFeatureAccess(userId, "riderBuilder");
    if (!hasAccess) {
      throw new Error("Rider builder feature not available in your tier");
    }

    return await getRiderTemplateStats(userId);
  }),

  /**
   * Get default template structure
   */
  getDefaultTemplate: publicProcedure
    .input(z.object({ templateType: z.enum(["standard", "minimal", "band"]) }))
    .query(async ({ input }) => {
      return getDefaultTemplate(input.templateType);
    }),

  /**
   * List all available default templates
   */
  listDefaultTemplates: publicProcedure.query(async () => {
    return {
      standard: getDefaultTemplate("standard"),
      minimal: getDefaultTemplate("minimal"),
      band: getDefaultTemplate("band"),
    };
  }),
});
