import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

/**
 * Help Center Router
 * Provides endpoints for help articles and support documentation
 */

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
}

// Mock data for help center
const HELP_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Bookings',
    category: 'bookings',
    content: 'Learn how to create and manage your first booking...',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Understanding Contracts',
    category: 'contracts',
    content: 'A comprehensive guide to contract management...',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Payment Processing',
    category: 'payments',
    content: 'How to process and manage payments...',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const HELP_CATEGORIES: HelpCategory[] = [
  { id: '1', name: 'Bookings', description: 'Booking management and scheduling', articleCount: 5 },
  { id: '2', name: 'Contracts', description: 'Contract creation and signing', articleCount: 4 },
  { id: '3', name: 'Payments', description: 'Payment processing and invoicing', articleCount: 3 },
  { id: '4', name: 'General', description: 'General questions and FAQs', articleCount: 8 },
];

export const helpCenterRouter = router({
  /**
   * Get all help articles with optional filtering
   */
  getArticles: publicProcedure
    .input(
      z.object({
        category: z.string().optional().describe('Filter by category'),
        search: z.string().optional().describe('Search articles by title or content'),
        limit: z.number().min(1).max(100).default(20).describe('Max results'),
        offset: z.number().min(0).default(0).describe('Pagination offset'),
      })
    )
    .query(async ({ input }) => {
      let filtered = [...HELP_ARTICLES];

      // Filter by category if provided
      if (input.category) {
        filtered = filtered.filter(a => a.category === input.category);
      }

      // Search if provided
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(
          a =>
            a.title.toLowerCase().includes(searchLower) ||
            a.content.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const paginated = filtered.slice(input.offset, input.offset + input.limit);

      return {
        articles: paginated,
        total: filtered.length,
        hasMore: input.offset + input.limit < filtered.length,
      };
    }),

  /**
   * Get a specific article by ID
   */
  getArticleById: publicProcedure
    .input(z.string().describe('Article ID'))
    .query(async ({ input }) => {
      const article = HELP_ARTICLES.find(a => a.id === input);
      if (!article) {
        throw new Error('Article not found');
      }
      return article;
    }),

  /**
   * Search articles
   */
  searchArticles: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).describe('Search query'),
        limit: z.number().min(1).max(50).default(10).describe('Max results'),
      })
    )
    .query(async ({ input }) => {
      const queryLower = input.query.toLowerCase();
      const results = HELP_ARTICLES.filter(
        a =>
          a.title.toLowerCase().includes(queryLower) ||
          a.content.toLowerCase().includes(queryLower)
      ).slice(0, input.limit);

      return results;
    }),

  /**
   * Get all help categories
   */
  getCategories: publicProcedure
    .query(async () => {
      return HELP_CATEGORIES;
    }),

  /**
   * Get articles by category
   */
  getArticlesByCategory: publicProcedure
    .input(z.string().describe('Category name'))
    .query(async ({ input }) => {
      return HELP_ARTICLES.filter(a => a.category === input);
    }),

  /**
   * Get popular articles
   */
  getPopularArticles: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      // Return first N articles (in real app, would be based on view count)
      return HELP_ARTICLES.slice(0, input.limit);
    }),

  /**
   * Get recently updated articles
   */
  getRecentArticles: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ input }) => {
      // Return articles sorted by update date
      return [...HELP_ARTICLES]
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, input.limit);
     }),
  /**
   * Record user feedback on an article
   */
  recordFeedback: publicProcedure
    .input(z.object({
      articleId: z.string(),
      helpful: z.boolean(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would save feedback to database
      console.log('Feedback recorded:', input);
      return { success: true, message: 'Thank you for your feedback!' };
    }),
});
export type HelpCenterRouter = typeof helpCenterRouter;
