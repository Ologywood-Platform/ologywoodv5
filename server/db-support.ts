/**
 * Database queries for support ticket system
 */

import { getDb } from './db';
import { 
  supportTickets, 
  ticketResponses, 
  ticketAssignments, 
  helpArticles,
  supportMetrics,
  SupportTicket,
  InsertSupportTicket,
  TicketResponse,
  InsertTicketResponse,
  HelpArticle,
  InsertHelpArticle,
} from '../drizzle/schema-support';
import { eq, desc, and, or, gte, lte, like } from 'drizzle-orm';

/**
 * Create a new support ticket
 */
export async function createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(supportTickets).values(ticket);
  return ticket as SupportTicket;
}

/**
 * Get support ticket by ID
 */
export async function getSupportTicketById(ticketId: number): Promise<SupportTicket | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get all support tickets
 */
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

/**
 * Get support tickets by user ID
 */
export async function getSupportTicketsByUserId(userId: number): Promise<SupportTicket[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
}

/**
 * Update support ticket
 */
export async function updateSupportTicket(ticketId: number, updates: Partial<SupportTicket>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(supportTickets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Add response to support ticket
 */
export async function addTicketResponse(response: InsertTicketResponse): Promise<TicketResponse | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(ticketResponses).values(response);
  return response as TicketResponse;
}

/**
 * Get responses for a ticket
 */
export async function getTicketResponses(ticketId: number): Promise<TicketResponse[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(ticketResponses)
    .where(eq(ticketResponses.ticketId, ticketId))
    .orderBy(desc(ticketResponses.createdAt));
}

/**
 * Assign ticket to support staff
 */
export async function assignTicketToStaff(ticketId: number, staffId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(ticketAssignments)
    .where(eq(ticketAssignments.ticketId, ticketId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(ticketAssignments)
      .set({ assignedTo: staffId })
      .where(eq(ticketAssignments.ticketId, ticketId));
  } else {
    await db.insert(ticketAssignments).values({
      ticketId,
      assignedTo: staffId,
    } as any);
  }
}

/**
 * Search support articles
 */
export async function searchHelpArticles(query: string): Promise<HelpArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(helpArticles)
      .where(
        or(
          like(helpArticles.title, `%${query}%`),
          like(helpArticles.content, `%${query}%`)
        )
      )
      .orderBy(desc(helpArticles.views));
  } catch (error) {
    console.error('Error searching help articles:', error);
    return [];
  }
}

/**
 * Get help articles by category
 */
export async function getHelpArticlesByCategory(category: string): Promise<HelpArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(helpArticles)
      .where(eq(helpArticles.category, category as any))
      .orderBy(desc(helpArticles.views));
  } catch (error) {
    console.error('Error getting help articles by category:', error);
    return [];
  }
}

/**
 * Create help article
 */
export async function createHelpArticle(article: InsertHelpArticle): Promise<HelpArticle | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(helpArticles).values(article);
  return article as HelpArticle;
}

/**
 * Update help article
 */
export async function updateHelpArticle(articleId: number, updates: Partial<HelpArticle>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(helpArticles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(helpArticles.id, articleId));
}

/**
 * Increment article view count
 */
export async function incrementArticleViews(articleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const article = await db.select().from(helpArticles)
    .where(eq(helpArticles.id, articleId))
    .limit(1);

  if (article.length > 0) {
    await db.update(helpArticles)
      .set({ views: (article[0].views || 0) + 1 })
      .where(eq(helpArticles.id, articleId));
  }
}

/**
 * Record article feedback
 */
export async function recordArticleFeedback(articleId: number, helpful: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const article = await db.select().from(helpArticles)
    .where(eq(helpArticles.id, articleId))
    .limit(1);

  if (article.length > 0) {
    const currentArticle = article[0];
    const updates = helpful
      ? { helpful: (currentArticle.helpful || 0) + 1 }
      : { unhelpful: (currentArticle.unhelpful || 0) + 1 };

    await db.update(helpArticles)
      .set(updates)
      .where(eq(helpArticles.id, articleId));
  }
}

/**
 * Get support metrics for a date
 */
export async function getSupportMetricsForDate(date: Date): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const result = await db.select().from(supportMetrics)
    .where(eq(supportMetrics.date, dateOnly))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Update or create support metrics
 */
export async function updateSupportMetrics(date: Date, data: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  const existing = await db.select().from(supportMetrics)
    .where(eq(supportMetrics.date, dateOnly))
    .limit(1);

  if (existing.length > 0) {
    await db.update(supportMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supportMetrics.date, dateOnly));
  } else {
    await db.insert(supportMetrics).values({
      date: dateOnly,
      ...data,
    } as any);
  }
}

/**
 * Calculate support metrics for today
 */
export async function calculateDailySupportMetrics() {
  const db = await getDb();
  if (!db) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all tickets for today
  const todayTickets = await db
    .select()
    .from(supportTickets)
    .where(
      and(
        gte(supportTickets.createdAt, today),
        lte(supportTickets.createdAt, tomorrow)
      )
    );

  // Calculate metrics
  const metrics = {
    totalTickets: todayTickets.length,
    openTickets: todayTickets.filter((t: any) => t.status === 'open').length,
    resolvedTickets: todayTickets.filter((t: any) => t.status === 'resolved').length,
    avgResponseTime: 0, // Would need to calculate from actual response times
  };

  // Update metrics in database
  await updateSupportMetrics(today, metrics);
}
