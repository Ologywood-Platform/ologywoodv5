/**
 * Database queries for support ticket system
 */

import { db } from './db';
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
export async function createSupportTicket(data: InsertSupportTicket) {
  const ticketNumber = `TKT-${Date.now()}`;
  const result = await db.insert(supportTickets).values({
    ...data,
    ticketNumber,
  });
  return result;
}

/**
 * Get ticket by ID
 */
export async function getSupportTicketById(id: number): Promise<SupportTicket | null> {
  const result = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Get ticket by ticket number
 */
export async function getSupportTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
  const result = await db.select().from(supportTickets).where(eq(supportTickets.ticketNumber, ticketNumber)).limit(1);
  return result[0] || null;
}

/**
 * Get all tickets for a user
 */
export async function getUserSupportTickets(userId: number, limit = 50, offset = 0) {
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get all open tickets (for admin)
 */
export async function getOpenSupportTickets(limit = 100, offset = 0) {
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.status, 'open'))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get tickets by category
 */
export async function getTicketsByCategory(category: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.category, category as any))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get tickets by priority
 */
export async function getTicketsByPriority(priority: string, limit = 50, offset = 0) {
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.priority, priority as any))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get tickets with SLA breaches
 */
export async function getBreachedSLATickets() {
  return db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.slaStatus, 'breached'))
    .orderBy(desc(supportTickets.slaBreachedAt));
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(id: number, status: string) {
  return db
    .update(supportTickets)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(supportTickets.id, id));
}

/**
 * Update ticket SLA status
 */
export async function updateTicketSLAStatus(id: number, slaStatus: string) {
  return db
    .update(supportTickets)
    .set({ 
      slaStatus: slaStatus as any, 
      slaBreachedAt: slaStatus === 'breached' ? new Date() : null,
      updatedAt: new Date() 
    })
    .where(eq(supportTickets.id, id));
}

/**
 * Assign ticket to team member
 */
export async function assignTicketToTeam(ticketId: number, assignedTo: number, team: string) {
  return db
    .update(supportTickets)
    .set({ assignedTo, assignedTeam: team, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
}

/**
 * Add response to ticket
 */
export async function addTicketResponse(data: InsertTicketResponse) {
  return db.insert(ticketResponses).values(data);
}

/**
 * Get ticket responses
 */
export async function getTicketResponses(ticketId: number) {
  return db
    .select()
    .from(ticketResponses)
    .where(eq(ticketResponses.ticketId, ticketId))
    .orderBy(desc(ticketResponses.createdAt));
}

/**
 * Search tickets
 */
export async function searchSupportTickets(query: string, limit = 50) {
  return db
    .select()
    .from(supportTickets)
    .where(
      or(
        like(supportTickets.title, `%${query}%`),
        like(supportTickets.description, `%${query}%`),
        like(supportTickets.ticketNumber, `%${query}%`)
      )
    )
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit);
}

/**
 * Get help article by ID
 */
export async function getHelpArticleById(articleId: string): Promise<HelpArticle | null> {
  const result = await db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.articleId, articleId))
    .limit(1);
  return result[0] || null;
}

/**
 * Get all help articles
 */
export async function getAllHelpArticles() {
  return db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.isPublished, true))
    .orderBy(desc(helpArticles.views));
}

/**
 * Get help articles by category
 */
export async function getHelpArticlesByCategory(category: string) {
  return db
    .select()
    .from(helpArticles)
    .where(and(
      eq(helpArticles.category, category as any),
      eq(helpArticles.isPublished, true)
    ))
    .orderBy(desc(helpArticles.views));
}

/**
 * Search help articles
 */
export async function searchHelpArticles(query: string) {
  return db
    .select()
    .from(helpArticles)
    .where(
      and(
        or(
          like(helpArticles.title, `%${query}%`),
          like(helpArticles.summary, `%${query}%`),
          like(helpArticles.content, `%${query}%`)
        ),
        eq(helpArticles.isPublished, true)
      )
    )
    .orderBy(desc(helpArticles.views));
}

/**
 * Increment article view count
 */
export async function incrementArticleViews(articleId: string) {
  return db
    .update(helpArticles)
    .set({ 
      views: db.raw('views + 1'),
      updatedAt: new Date() 
    })
    .where(eq(helpArticles.articleId, articleId));
}

/**
 * Add article feedback
 */
export async function addArticleFeedback(articleId: string, helpful: boolean) {
  const field = helpful ? 'helpful' : 'unhelpful';
  return db
    .update(helpArticles)
    .set({ 
      [field]: db.raw(`${field} + 1`),
      updatedAt: new Date() 
    })
    .where(eq(helpArticles.articleId, articleId));
}

/**
 * Get support metrics for date range
 */
export async function getSupportMetricsForDateRange(startDate: Date, endDate: Date) {
  return db
    .select()
    .from(supportMetrics)
    .where(
      and(
        gte(supportMetrics.date, startDate),
        lte(supportMetrics.date, endDate)
      )
    )
    .orderBy(desc(supportMetrics.date));
}

/**
 * Create or update support metrics
 */
export async function upsertSupportMetrics(date: Date, data: any) {
  // Check if metrics exist for this date
  const existing = await db
    .select()
    .from(supportMetrics)
    .where(eq(supportMetrics.date, date))
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(supportMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supportMetrics.date, date));
  } else {
    return db.insert(supportMetrics).values({
      date,
      ...data,
    });
  }
}

/**
 * Calculate support metrics for today
 */
export async function calculateDailySupportMetrics() {
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

  const totalTickets = todayTickets.length;
  const openTickets = todayTickets.filter(t => t.status === 'open').length;
  const resolvedTickets = todayTickets.filter(t => t.status === 'resolved').length;
  const closedTickets = todayTickets.filter(t => t.status === 'closed').length;

  // Calculate averages
  const avgResponseTime = todayTickets
    .filter(t => t.responseTimeMinutes)
    .reduce((sum, t) => sum + (t.responseTimeMinutes || 0), 0) / Math.max(todayTickets.filter(t => t.responseTimeMinutes).length, 1);

  const avgResolutionTime = todayTickets
    .filter(t => t.resolutionTimeMinutes)
    .reduce((sum, t) => sum + (t.resolutionTimeMinutes || 0), 0) / Math.max(todayTickets.filter(t => t.resolutionTimeMinutes).length, 1);

  const breachedCount = todayTickets.filter(t => t.slaStatus === 'breached').length;
  const slaComplianceRate = totalTickets > 0 ? Math.round(((totalTickets - breachedCount) / totalTickets) * 100) : 100;

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  todayTickets.forEach(t => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
  });

  // Priority breakdown
  const priorityBreakdown: Record<string, number> = {};
  todayTickets.forEach(t => {
    priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
  });

  return upsertSupportMetrics(today, {
    totalTickets,
    openTickets,
    resolvedTickets,
    closedTickets,
    averageResponseTime: Math.round(avgResponseTime),
    averageResolutionTime: Math.round(avgResolutionTime),
    slaComplianceRate,
    slaBreachCount: breachedCount,
    categoryBreakdown,
    priorityBreakdown,
  });
}

export default {
  createSupportTicket,
  getSupportTicketById,
  getSupportTicketByNumber,
  getUserSupportTickets,
  getOpenSupportTickets,
  getTicketsByCategory,
  getTicketsByPriority,
  getBreachedSLATickets,
  updateTicketStatus,
  updateTicketSLAStatus,
  assignTicketToTeam,
  addTicketResponse,
  getTicketResponses,
  searchSupportTickets,
  getHelpArticleById,
  getAllHelpArticles,
  getHelpArticlesByCategory,
  searchHelpArticles,
  incrementArticleViews,
  addArticleFeedback,
  getSupportMetricsForDateRange,
  upsertSupportMetrics,
  calculateDailySupportMetrics,
};
