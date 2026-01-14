import { z } from "zod";
import * as db from "../db";
import { router, protectedProcedure } from "../_core/trpc";

// Pre-built booking templates
const BOOKING_TEMPLATES = [
  {
    id: 1,
    name: "Wedding Reception",
    description: "Live music for wedding reception",
    eventType: "wedding",
    suggestedFee: { min: 500, max: 2000 },
    duration: "4-5 hours",
    riderRequirements: [
      "Sound system with microphone",
      "Lighting setup",
      "Dedicated power outlet",
      "Parking for band members",
    ],
    logistics: {
      setup: "1-2 hours before event",
      breakdown: "30 minutes after event",
      capacity: "50-500 guests",
    },
  },
  {
    id: 2,
    name: "Corporate Event",
    description: "Background music for corporate event",
    eventType: "corporate",
    suggestedFee: { min: 300, max: 1500 },
    duration: "2-4 hours",
    riderRequirements: [
      "Basic sound system",
      "Microphone for announcements",
      "Table for equipment",
    ],
    logistics: {
      setup: "1 hour before event",
      breakdown: "30 minutes after event",
      capacity: "50-300 guests",
    },
  },
  {
    id: 3,
    name: "Bar/Club Gig",
    description: "Live performance at bar or nightclub",
    eventType: "bar",
    suggestedFee: { min: 200, max: 800 },
    duration: "2-4 hours",
    riderRequirements: [
      "House sound system",
      "Stage or performance area",
      "Lighting (if available)",
    ],
    logistics: {
      setup: "30 minutes before event",
      breakdown: "30 minutes after event",
      capacity: "50-200 guests",
    },
  },
  {
    id: 4,
    name: "Festival Performance",
    description: "Live performance at music festival",
    eventType: "festival",
    suggestedFee: { min: 500, max: 5000 },
    duration: "30-60 minutes",
    riderRequirements: [
      "Professional sound system",
      "Stage setup",
      "Lighting rig",
      "Monitor system",
      "Backstage area",
    ],
    logistics: {
      setup: "2-3 hours before performance",
      breakdown: "1 hour after performance",
      capacity: "500+ guests",
    },
  },
  {
    id: 5,
    name: "Private Party",
    description: "Entertainment for private party",
    eventType: "private",
    suggestedFee: { min: 250, max: 1000 },
    duration: "2-4 hours",
    riderRequirements: [
      "Basic sound system",
      "Microphone",
      "Power outlet",
      "Space for equipment",
    ],
    logistics: {
      setup: "1 hour before event",
      breakdown: "30 minutes after event",
      capacity: "20-100 guests",
    },
  },
];

export const templatesRouter = router({
  /**
   * Get all available booking templates
   */
  getAll: protectedProcedure.query(async ({ ctx }: any) => {
    return BOOKING_TEMPLATES;
  }),

  /**
   * Get template by ID
   */
  getById: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }: any) => {
      const template = BOOKING_TEMPLATES.find((t) => t.id === input.templateId);
      if (!template) {
        throw new Error("Template not found");
      }
      return template;
    }),

  /**
   * Get templates by event type
   */
  getByEventType: protectedProcedure
    .input(z.object({ eventType: z.string() }))
    .query(async ({ input }: any) => {
      return BOOKING_TEMPLATES.filter((t) => t.eventType === input.eventType);
    }),

  /**
   * Save user's template preference
   */
  savePreference: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        customizations: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      // Placeholder - would save to database
      return {
        success: true,
        message: "Template preference saved",
        templateId: input.templateId,
      };
    }),

  /**
   * Get user's saved template preferences
   */
  getUserPreferences: protectedProcedure.query(async ({ ctx }: any) => {
    // Placeholder - would fetch from database
    return [];
  }),

  /**
   * Create custom template from existing template
   */
  createCustom: protectedProcedure
    .input(
      z.object({
        baseTemplateId: z.number(),
        name: z.string(),
        customizations: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      return {
        success: true,
        message: "Custom template created",
        customTemplateId: Math.random(),
      };
    }),
});
