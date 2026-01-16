/**
 * TRPC Router for Help Center and Support Tickets
 */

import { router, protectedProcedure, publicProcedure } from '../trpc';
import { z } from 'zod';
import { helpArticles, searchArticles, getArticlesByCategory, getAllCategories, getRelatedArticles } from '../helpCenterData';
import { SupportTicketRouter, createTicketSchema, addResponseSchema, updateTicketSchema, ticketTemplates } from '../supportTicketSystem';

export const helpAndSupportRouter = router({
  // Help Center endpoints
  helpCenter: router({
    // Get all articles
    getArticles: publicProcedure.query(async () => {
      return helpArticles;
    }),

    // Search articles
    searchArticles: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return searchArticles(input.query);
      }),

    // Get articles by category
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return getArticlesByCategory(input.category as any);
      }),

    // Get all categories
    getCategories: publicProcedure.query(async () => {
      return getAllCategories();
    }),

    // Get article by ID
    getArticle: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return helpArticles.find((a) => a.id === input.id);
      }),

    // Get related articles
    getRelated: publicProcedure
      .input(z.object({ articleId: z.string() }))
      .query(async ({ input }) => {
        return getRelatedArticles(input.articleId);
      }),

    // Record article feedback
    recordFeedback: protectedProcedure
      .input(z.object({ articleId: z.string(), helpful: z.boolean() }))
      .mutation(async ({ input }) => {
        const article = helpArticles.find((a) => a.id === input.articleId);
        if (!article) {
          throw new Error('Article not found');
        }

        if (input.helpful) {
          article.helpful += 1;
        } else {
          article.unhelpful += 1;
        }

        return { success: true };
      }),

    // Record article view
    recordView: publicProcedure
      .input(z.object({ articleId: z.string() }))
      .mutation(async ({ input }) => {
        const article = helpArticles.find((a) => a.id === input.articleId);
        if (!article) {
          throw new Error('Article not found');
        }

        article.views += 1;
        return { success: true };
      }),
  }),

  // Support Ticket endpoints
  supportTickets: router({
    // Create ticket
    create: protectedProcedure
      .input(createTicketSchema)
      .mutation(async ({ ctx, input }) => {
        // Determine priority
        const priority = input.priority || SupportTicketRouter.determinePriority(
          input.category,
          input.description,
          ctx.user.role
        );

        // Route to team
        const routing = SupportTicketRouter.routeToTeam(input.category, priority);

        // Extract tags
        const tags = input.tags || SupportTicketRouter.extractTags(input.category, input.description);

        // Check for related FAQ
        const relatedFAQ = SupportTicketRouter.findRelatedFAQ(input.category, input.description);

        // If FAQ is highly relevant, suggest it instead
        if (SupportTicketRouter.shouldSuggestFAQ(input.category, input.description)) {
          return {
            suggestFAQ: true,
            relatedArticles: relatedFAQ,
            message: 'We found some help articles that might answer your question. Would you like to view them first?',
          };
        }

        // Calculate SLA
        const now = new Date();
        const sla = SupportTicketRouter.calculateSLA(input.category, priority, now);

        // Create ticket (in real implementation, save to database)
        const ticket = {
          id: `TKT-${Date.now()}`,
          userId: ctx.user.id.toString(),
          userEmail: ctx.user.email,
          userName: ctx.user.name || 'User',
          userRole: ctx.user.role as 'artist' | 'venue' | 'admin',
          title: input.title,
          description: input.description,
          category: input.category,
          priority,
          status: 'open' as const,
          assignedTeam: routing.team,
          tags,
          attachments: input.attachments || [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          responses: [],
          sla: {
            responseTime: routing.estimatedResponseTime,
            resolutionTime: routing.estimatedResolutionTime,
            breached: false,
          },
        };

        return {
          success: true,
          ticket,
          message: `Your support ticket has been created and assigned to our ${routing.team}. We'll respond within ${routing.estimatedResponseTime} hours.`,
        };
      }),

    // Get user's tickets
    getMyTickets: protectedProcedure.query(async ({ ctx }) => {
      // In real implementation, fetch from database
      return [];
    }),

    // Get ticket by ID
    getTicket: protectedProcedure
      .input(z.object({ ticketId: z.string() }))
      .query(async ({ ctx, input }) => {
        // In real implementation, fetch from database and verify ownership
        return null;
      }),

    // Add response to ticket
    addResponse: protectedProcedure
      .input(addResponseSchema)
      .mutation(async ({ ctx, input }) => {
        // Verify ticket ownership or support staff
        // In real implementation, verify permissions

        const response = {
          id: `RSP-${Date.now()}`,
          ticketId: input.ticketId,
          userId: ctx.user.id.toString(),
          userName: ctx.user.name || 'User',
          userRole: ctx.user.role === 'admin' ? ('support' as const) : ('customer' as const),
          message: input.message,
          attachments: input.attachments || [],
          createdAt: new Date().toISOString(),
          isInternal: input.isInternal || false,
        };

        return {
          success: true,
          response,
          message: 'Your response has been added to the ticket.',
        };
      }),

    // Update ticket status
    updateStatus: protectedProcedure
      .input(z.object({ ticketId: z.string(), status: z.enum(['open', 'in-progress', 'waiting-customer', 'resolved', 'closed']) }))
      .mutation(async ({ ctx, input }) => {
        // Verify support staff or admin
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        // In real implementation, update database
        return {
          success: true,
          message: `Ticket status updated to ${input.status}`,
        };
      }),

    // Get ticket templates
    getTemplates: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return ticketTemplates[input.category as keyof typeof ticketTemplates] || [];
      }),

    // Get support team info
    getSupportTeams: publicProcedure.query(async () => {
      return {
        teams: [
          {
            name: 'Contracts Support',
            email: 'contracts-support@ologywood.com',
            responseTime: '2 hours',
            availability: '24/7',
          },
          {
            name: 'Billing Support',
            email: 'billing-support@ologywood.com',
            responseTime: '1 hour',
            availability: '8 AM - 8 PM UTC',
          },
          {
            name: 'Technical Support',
            email: 'tech-support@ologywood.com',
            responseTime: '1 hour',
            availability: '24/7',
          },
          {
            name: 'Account Support',
            email: 'account-support@ologywood.com',
            responseTime: '2 hours',
            availability: '8 AM - 6 PM UTC',
          },
        ],
      };
    }),

    // Get FAQ suggestions for ticket
    getSuggestions: publicProcedure
      .input(z.object({ category: z.string(), description: z.string() }))
      .query(async ({ input }) => {
        const relatedFAQ = SupportTicketRouter.findRelatedFAQ(
          input.category as any,
          input.description
        );
        const shouldSuggest = SupportTicketRouter.shouldSuggestFAQ(
          input.category as any,
          input.description
        );

        return {
          shouldSuggestFAQ: shouldSuggest,
          relatedArticles: relatedFAQ.map((id) => helpArticles.find((a) => a.id === id)).filter(Boolean),
        };
      }),

    // Get support statistics
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      // In real implementation, fetch from database
      return {
        totalTickets: 0,
        openTickets: 0,
        averageResolutionTime: 0,
        slaComplianceRate: 0,
        topCategories: [],
      };
    }),
  }),
});
