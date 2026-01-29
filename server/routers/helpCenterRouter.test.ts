import { describe, it, expect } from 'vitest';
import { helpCenterRouter } from './helpCenterRouter';

/**
 * Tests for the Help Center Router
 */
describe('helpCenterRouter', () => {
  describe('getArticles', () => {
    it('should return all articles when no filters provided', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      
      expect(result.articles).toBeDefined();
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBeGreaterThan(0);
      expect(result.total).toBe(14);
      expect(result.hasMore).toBe(false);
    });

    it('should return articles with all required fields', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      const article = result.articles[0];
      
      expect(article).toHaveProperty('id');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('category');
      expect(article).toHaveProperty('summary');
      expect(article).toHaveProperty('content');
      expect(article).toHaveProperty('keywords');
      expect(article).toHaveProperty('difficulty');
      expect(article).toHaveProperty('estimatedReadTime');
      expect(article).toHaveProperty('views');
      expect(article).toHaveProperty('helpful');
      expect(article).toHaveProperty('unhelpful');
    });

    it('should filter articles by category', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({ category: 'bookings' });
      
      expect(result.articles.length).toBeGreaterThan(0);
      result.articles.forEach(article => {
        expect(article.category).toBe('bookings');
      });
    });

    it('should search articles by title', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({ search: 'Getting Started' });
      
      expect(result.articles.length).toBeGreaterThan(0);
      expect(result.articles[0].title).toContain('Getting Started');
    });

    it('should search articles by keywords', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({ search: 'booking' });
      
      expect(result.articles.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result1 = await caller.getArticles({ limit: 5, offset: 0 });
      
      expect(result1.articles.length).toBeLessThanOrEqual(5);
      expect(result1.hasMore).toBe(true);
      
      const result2 = await caller.getArticles({ limit: 5, offset: 5 });
      expect(result2.articles.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-matching search', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({ search: 'nonexistentterm123xyz' });
      
      expect(result.articles.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getArticleById', () => {
    it('should return article by id', async () => {
      const caller = helpCenterRouter.createCaller({});
      const article = await caller.getArticleById('1');
      
      expect(article.id).toBe('1');
      expect(article.title).toBe('Getting Started with Bookings');
    });

    it('should throw error for non-existent article', async () => {
      const caller = helpCenterRouter.createCaller({});
      
      await expect(caller.getArticleById('999')).rejects.toThrow('Article not found');
    });
  });

  describe('getCategories', () => {
    it('should return all categories', async () => {
      const caller = helpCenterRouter.createCaller({});
      const categories = await caller.getCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('bookings');
      expect(categories).toContain('contracts');
      expect(categories).toContain('payments');
      expect(categories).toContain('support');
      expect(categories).toContain('account');
      expect(categories).toContain('getting-started');
    });
  });

  describe('getArticlesByCategory', () => {
    it('should return articles for specific category', async () => {
      const caller = helpCenterRouter.createCaller({});
      const articles = await caller.getArticlesByCategory('bookings');
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.category).toBe('bookings');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const caller = helpCenterRouter.createCaller({});
      const articles = await caller.getArticlesByCategory('nonexistent');
      
      expect(articles.length).toBe(0);
    });
  });

  describe('getPopularArticles', () => {
    it('should return popular articles sorted by views', async () => {
      const caller = helpCenterRouter.createCaller({});
      const articles = await caller.getPopularArticles({ limit: 5 });
      
      expect(articles.length).toBeLessThanOrEqual(5);
      
      // Check that articles are sorted by views (descending)
      for (let i = 1; i < articles.length; i++) {
        expect(articles[i - 1].views).toBeGreaterThanOrEqual(articles[i].views);
      }
    });

    it('should respect limit parameter', async () => {
      const caller = helpCenterRouter.createCaller({});
      const articles = await caller.getPopularArticles({ limit: 3 });
      
      expect(articles.length).toBeLessThanOrEqual(3);
    });
  });

  describe('recordFeedback', () => {
    it('should record helpful feedback', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.recordFeedback({
        articleId: '1',
        helpful: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Thank you');
    });

    it('should record unhelpful feedback with comment', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.recordFeedback({
        articleId: '1',
        helpful: false,
        comment: 'Not clear enough',
      });
      
      expect(result.success).toBe(true);
    });
  });

  describe('Article Content Quality', () => {
    it('should have meaningful summaries', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      
      result.articles.forEach(article => {
        expect(article.summary.length).toBeGreaterThan(10);
        expect(article.summary.length).toBeLessThan(200);
      });
    });

    it('should have keywords for search', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      
      result.articles.forEach(article => {
        expect(article.keywords.length).toBeGreaterThan(0);
        expect(article.keywords.length).toBeLessThanOrEqual(10);
      });
    });

    it('should have valid difficulty levels', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      
      result.articles.forEach(article => {
        expect(validDifficulties).toContain(article.difficulty);
      });
    });

    it('should have reasonable read times', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      
      result.articles.forEach(article => {
        expect(article.estimatedReadTime).toBeGreaterThan(0);
        expect(article.estimatedReadTime).toBeLessThan(60);
      });
    });

    it('should have view counts', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      
      result.articles.forEach(article => {
        expect(article.views).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have helpful/unhelpful counts', async () => {
      const caller = helpCenterRouter.createCaller({});
      const result = await caller.getArticles({});
      
      result.articles.forEach(article => {
        expect(article.helpful).toBeGreaterThanOrEqual(0);
        expect(article.unhelpful).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
