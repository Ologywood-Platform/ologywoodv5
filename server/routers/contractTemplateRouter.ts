import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ContractTemplateLibrary, type ContractTemplate } from '../services/contractTemplateLibrary';

export const contractTemplateRouter = router({
  /**
   * Get all available templates
   */
  getAllTemplates: publicProcedure.query(() => {
    try {
      const templates = ContractTemplateLibrary.getAllTemplates();
      return {
        success: true,
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          genre: t.genre,
          venueType: t.venueType,
          eventType: t.eventType,
        })),
        total: templates.length,
      };
    } catch (error) {
      console.error('Error fetching all templates:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch templates',
      });
    }
  }),

  /**
   * Get templates by category
   */
  getTemplatesByCategory: publicProcedure
    .input(z.object({
      category: z.enum(['genre', 'venue_type', 'event_type']),
    }))
    .query(({ input }) => {
      try {
        const templates = ContractTemplateLibrary.getTemplatesByCategory(input.category);
        return {
          success: true,
          category: input.category,
          templates: templates.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
          })),
          total: templates.length,
        };
      } catch (error) {
        console.error('Error fetching templates by category:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch templates',
        });
      }
    }),

  /**
   * Get a specific template with full details
   */
  getTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .query(({ input }) => {
      try {
        const template = ContractTemplateLibrary.getTemplateById(input.templateId);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found',
          });
        }

        return {
          success: true,
          template,
        };
      } catch (error) {
        console.error('Error fetching template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch template',
        });
      }
    }),

  /**
   * Search templates
   */
  searchTemplates: publicProcedure
    .input(z.object({
      query: z.string().min(1, 'Search query is required'),
    }))
    .query(({ input }) => {
      try {
        const templates = ContractTemplateLibrary.searchTemplates(input.query);

        return {
          success: true,
          query: input.query,
          templates: templates.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
          })),
          total: templates.length,
        };
      } catch (error) {
        console.error('Error searching templates:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search templates',
        });
      }
    }),

  /**
   * Get genre template
   */
  getGenreTemplate: publicProcedure
    .input(z.object({
      genre: z.string(),
    }))
    .query(({ input }) => {
      try {
        const template = ContractTemplateLibrary.getGenreTemplate(input.genre);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No template found for genre: ${input.genre}`,
          });
        }

        return {
          success: true,
          template,
        };
      } catch (error) {
        console.error('Error fetching genre template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch genre template',
        });
      }
    }),

  /**
   * Get venue type template
   */
  getVenueTypeTemplate: publicProcedure
    .input(z.object({
      venueType: z.string(),
    }))
    .query(({ input }) => {
      try {
        const template = ContractTemplateLibrary.getVenueTypeTemplate(input.venueType);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No template found for venue type: ${input.venueType}`,
          });
        }

        return {
          success: true,
          template,
        };
      } catch (error) {
        console.error('Error fetching venue type template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch venue type template',
        });
      }
    }),

  /**
   * Get event type template
   */
  getEventTypeTemplate: publicProcedure
    .input(z.object({
      eventType: z.string(),
    }))
    .query(({ input }) => {
      try {
        const template = ContractTemplateLibrary.getEventTypeTemplate(input.eventType);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `No template found for event type: ${input.eventType}`,
          });
        }

        return {
          success: true,
          template,
        };
      } catch (error) {
        console.error('Error fetching event type template:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch event type template',
        });
      }
    }),

  /**
   * Get template categories summary
   */
  getTemplatesSummary: publicProcedure.query(() => {
    try {
      const allTemplates = ContractTemplateLibrary.getAllTemplates();
      const genres = ContractTemplateLibrary.getTemplatesByCategory('genre');
      const venueTypes = ContractTemplateLibrary.getTemplatesByCategory('venue_type');
      const eventTypes = ContractTemplateLibrary.getTemplatesByCategory('event_type');

      return {
        success: true,
        summary: {
          total: allTemplates.length,
          byCategory: {
            genres: genres.length,
            venueTypes: venueTypes.length,
            eventTypes: eventTypes.length,
          },
          genres: genres.map((t) => ({ id: t.id, name: t.name, genre: t.genre })),
          venueTypes: venueTypes.map((t) => ({ id: t.id, name: t.name, venueType: t.venueType })),
          eventTypes: eventTypes.map((t) => ({ id: t.id, name: t.name, eventType: t.eventType })),
        },
      };
    } catch (error) {
      console.error('Error fetching templates summary:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch templates summary',
      });
    }
  }),
});
