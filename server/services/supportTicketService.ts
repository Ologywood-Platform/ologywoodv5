import { getDb } from '../db';
import { eq, and, desc, isNull } from 'drizzle-orm';

/**
 * Support Ticket Service
 * Manages support tickets for users
 */

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  description: string;
  category: 'rider' | 'booking' | 'payment' | 'technical' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: number;
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  isStaff: boolean;
  createdAt: Date;
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(
  userId: number,
  data: {
    subject: string;
    description: string;
    category: 'rider' | 'booking' | 'payment' | 'technical' | 'other';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    attachmentUrl?: string;
  }
): Promise<SupportTicket> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();
  const ticket = {
    userId,
    subject: data.subject,
    description: data.description,
    category: data.category,
    priority: data.priority || 'medium',
    status: 'open' as const,
    attachmentUrl: data.attachmentUrl,
    createdAt: now,
    updatedAt: now,
  };

  console.log('[Support Ticket] Creating ticket:', ticket);
  // In a real implementation, insert into support_tickets table
  // For now, return mock response
  return {
    id: Math.floor(Math.random() * 10000),
    ...ticket,
  };
}

/**
 * Get user's support tickets
 */
export async function getUserTickets(userId: number): Promise<SupportTicket[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Support Ticket] Fetching tickets for user:', userId);
  // In a real implementation, query support_tickets table
  // For now, return empty array
  return [];
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: number): Promise<SupportTicket | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Support Ticket] Fetching ticket:', ticketId);
  // In a real implementation, query support_tickets table
  return null;
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: number,
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed'
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Support Ticket] Updating ticket status:', { ticketId, status });
  // In a real implementation, update support_tickets table
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(
  ticketId: number,
  userId: number,
  message: string,
  isStaff: boolean = false
): Promise<TicketMessage> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const now = new Date();
  const ticketMessage = {
    ticketId,
    userId,
    message,
    isStaff,
    createdAt: now,
  };

  console.log('[Support Ticket] Adding message:', ticketMessage);
  // In a real implementation, insert into ticket_messages table
  return {
    id: Math.floor(Math.random() * 10000),
    ...ticketMessage,
  };
}

/**
 * Get ticket messages
 */
export async function getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Support Ticket] Fetching messages for ticket:', ticketId);
  // In a real implementation, query ticket_messages table
  return [];
}

/**
 * Get support statistics
 */
export async function getSupportStats(): Promise<{
  totalTickets: number;
  openTickets: number;
  averageResolutionTime: number;
  satisfactionRating: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Support Ticket] Fetching support statistics');
  // In a real implementation, calculate from support_tickets table
  return {
    totalTickets: 0,
    openTickets: 0,
    averageResolutionTime: 0,
    satisfactionRating: 0,
  };
}

/**
 * Categorize support request based on content
 */
export function categorizeSupportRequest(
  subject: string,
  description: string
): 'rider' | 'booking' | 'payment' | 'technical' | 'other' {
  const content = `${subject} ${description}`.toLowerCase();

  if (
    content.includes('rider') ||
    content.includes('requirement') ||
    content.includes('modification')
  ) {
    return 'rider';
  }

  if (
    content.includes('booking') ||
    content.includes('request') ||
    content.includes('confirm')
  ) {
    return 'booking';
  }

  if (
    content.includes('payment') ||
    content.includes('invoice') ||
    content.includes('refund')
  ) {
    return 'payment';
  }

  if (
    content.includes('error') ||
    content.includes('bug') ||
    content.includes('not working') ||
    content.includes('crash')
  ) {
    return 'technical';
  }

  return 'other';
}

/**
 * Determine priority based on category and keywords
 */
export function determinePriority(
  category: string,
  description: string
): 'low' | 'medium' | 'high' | 'urgent' {
  const content = description.toLowerCase();

  // Urgent indicators
  if (
    content.includes('urgent') ||
    content.includes('emergency') ||
    content.includes('critical') ||
    content.includes('event today') ||
    content.includes('event tomorrow')
  ) {
    return 'urgent';
  }

  // High priority
  if (
    content.includes('payment failed') ||
    content.includes('cannot book') ||
    content.includes('cannot access') ||
    category === 'payment'
  ) {
    return 'high';
  }

  // Medium priority
  if (category === 'booking' || category === 'rider') {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate support ticket summary for analytics
 */
export function generateTicketSummary(tickets: SupportTicket[]): {
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  avgResolutionTime: number;
} {
  const summary = {
    byCategory: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    avgResolutionTime: 0,
  };

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  for (const ticket of tickets) {
    // Count by category
    summary.byCategory[ticket.category] = (summary.byCategory[ticket.category] || 0) + 1;

    // Count by priority
    summary.byPriority[ticket.priority] = (summary.byPriority[ticket.priority] || 0) + 1;

    // Count by status
    summary.byStatus[ticket.status] = (summary.byStatus[ticket.status] || 0) + 1;

    // Calculate average resolution time
    if (ticket.resolvedAt && ticket.createdAt) {
      const resolutionTime =
        new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime();
      totalResolutionTime += resolutionTime;
      resolvedCount++;
    }
  }

  if (resolvedCount > 0) {
    summary.avgResolutionTime = Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60)); // Convert to hours
  }

  return summary;
}
