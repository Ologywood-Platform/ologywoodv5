import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { supportTickets, supportTicketResponses, supportCategories, faqs, knowledgeBaseArticles, users } from "../../drizzle/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { sendTicketCreatedEmail, sendTicketResponseEmail, sendTicketResolvedEmail } from "../services/support-notifications";

export const supportRouter = router({
  // Support Tickets
  createTicket: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      subject: z.string().min(5).max(255),
      description: z.string().min(10),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(supportTickets).values({
        userId: ctx.user.id,
        category: input.category,
        subject: input.subject,
        description: input.description,
        priority: input.priority || "medium",
        status: "open",
      });

      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, ctx.user.id))
        .orderBy(desc(supportTickets.createdAt))
        .limit(1)
        .then((res: any) => res[0]);

      // Send email notification
      try {
        await sendTicketCreatedEmail({
          ticketId: ticket[0].id,
          ticketSubject: ticket[0].subject,
          userEmail: ctx.user.email || "",
          userName: (ctx.user.name || ctx.user.email) || "",
        });
      } catch (error) {
        console.error("Failed to send ticket created email:", error);
      }

      return ticket;
    }),

  getMyTickets: protectedProcedure
    .input(z.object({
      status: z.enum(["open", "in_progress", "waiting_user", "resolved", "closed"]).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const where = input.status
        ? and(eq(supportTickets.userId, ctx.user.id), eq(supportTickets.status, input.status))
        : eq(supportTickets.userId, ctx.user.id);

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(where)
        .orderBy(desc(supportTickets.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return tickets;
    }),

  getTicketDetail: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const ticket = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.userId, ctx.user.id)
          )
        )
        .then((res: any) => res[0]);

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      const responses = await db
        .select()
        .from(supportTicketResponses)
        .where(eq(supportTicketResponses.ticketId, input.ticketId))
        .orderBy(supportTicketResponses.createdAt);

      return { ticket, responses };
    }),

  addTicketResponse: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify user owns the ticket
      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId))
        .then((res: any) => res[0]);

      if (!ticket || ticket.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Update ticket status if it was waiting_user
      if (ticket.status === "waiting_user") {
        await db
          .update(supportTickets)
          .set({ status: "in_progress" })
          .where(eq(supportTickets.id, input.ticketId));
      }

      await db.insert(supportTicketResponses).values({
        ticketId: input.ticketId,
        responderId: ctx.user.id,
        response: input.message,
      });

      const response = await db
        .select()
        .from(supportTicketResponses)
        .where(eq(supportTicketResponses.ticketId, input.ticketId))
        .orderBy(desc(supportTicketResponses.createdAt))
        .limit(1)
        .then((res: any) => res[0]);

      // Send email notification for response
      try {
        await sendTicketResponseEmail({
          ticketId: input.ticketId,
          ticketSubject: ticket.subject,
          userEmail: ctx.user.email || "",
          userName: (ctx.user.name || ctx.user.email) || "",
          responderName: (ctx.user.name || ctx.user.email) || "",
          responseMessage: input.message,
          isStaffResponse: false,
        });
      } catch (error) {
        console.error("Failed to send ticket response email:", error);
      }

      return response;
    }),

  closeTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId))
        .then((res: any) => res[0]);

      if (!ticket || ticket.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db
        .update(supportTickets)
        .set({ status: "closed" })
        .where(eq(supportTickets.id, input.ticketId));

      // Send email notification for resolution
      try {
        await sendTicketResolvedEmail({
          ticketId: input.ticketId,
          ticketSubject: ticket.subject,
          userEmail: ctx.user.email || "",
          userName: (ctx.user.name || ctx.user.email) || "",
        });
      } catch (error) {
        console.error("Failed to send ticket resolved email:", error);
      }

      return { success: true };
    }),

  // Knowledge Base
  getArticles: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      // Return mock data for now - database tables are not yet created
      const mockArticles = [
        {
          id: 1,
          title: 'Getting Started with Bookings',
          content: 'Learn how to create and manage your first booking on Ologywood.',
          category: 'bookings',
          tags: ['booking', 'getting-started'],
          views: 234,
          helpful: 156,
          notHelpful: 12,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Understanding Rider Requirements',
          content: 'Comprehensive guide to rider requirements and how they work.',
          category: 'contracts',
          tags: ['rider', 'contract'],
          views: 189,
          helpful: 134,
          notHelpful: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return mockArticles.slice(input.offset, input.offset + input.limit);
    }),

  getArticleBySlug: publicProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const article = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(
          eq(knowledgeBaseArticles.title, input.slug)
        )
        .then((res: any) => res[0]);

      if (!article) {
        throw new Error("Article not found");
      }

      // Increment views
      await db
        .update(knowledgeBaseArticles)
        .set({ views: article.views + 1 })
        .where(eq(knowledgeBaseArticles.id, article.id));

      return article;
    }),

  voteArticle: publicProcedure
    .input(z.object({
      articleId: z.number(),
      helpful: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const article = await db
        .select()
        .from(knowledgeBaseArticles)
        .where(eq(knowledgeBaseArticles.id, input.articleId))
        .then((res: any) => res[0]);

      if (!article) {
        throw new Error("Article not found");
      }

      const updateData = input.helpful
        ? { helpful: article.helpful + 1 }
        : { notHelpful: article.notHelpful + 1 };

      await db
        .update(knowledgeBaseArticles)
        .set(updateData)
        .where(eq(knowledgeBaseArticles.id, input.articleId));

      return { success: true };
    }),

  // FAQ
  getFAQs: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      // Return mock data for now - database tables are not yet created
      const mockFAQs = [
        {
          id: 1,
          question: 'How do I create a booking?',
          answer: 'To create a booking, search for an artist, view their profile, and click "Request Booking".',
          category: 'bookings',
          tags: ['booking', 'faq'],
          order: 1,
          keywords: 'booking, create, request',
          searchContent: 'How to create a booking request',
          views: 523,
          helpful: 412,
          notHelpful: 31,
          helpfulRatio: 93.04,
          semanticSearchHits: 0,
          semanticSearchClicks: 0,
          isPublished: true,
          isPinned: false,
          embedding: null,
          embeddingModel: 'text-embedding-3-small',
          embeddingDimension: 1536,
          embeddingGeneratedAt: null,
          needsEmbeddingRefresh: false,
          createdBy: 1,
          updatedBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      return mockFAQs.slice(0, input.limit);
    }),

  // Support Categories
  getCategories: publicProcedure.query(async () => {
    // Return mock data for now - database tables are not yet created
    const mockCategories = [
      {
        id: 1,
        name: 'Getting Started',
        description: 'Learn the basics of using Ologywood',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Bookings',
        description: 'Questions about creating and managing bookings',
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'Contracts & Riders',
        description: 'Information about contracts and rider requirements',
        createdAt: new Date(),
      },
    ];

    return mockCategories;
  }),

  // Ticket Statistics
  getTicketStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, ctx.user.id));

    const stats = {
      total: tickets.length,
      open: tickets.filter((t: any) => t.status === "open").length,
      inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
      resolved: tickets.filter((t: any) => t.status === "resolved").length,
      closed: tickets.filter((t: any) => t.status === "closed").length,
    };

    return stats;
  }),
});
