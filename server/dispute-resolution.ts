interface SupportTicket {
  id: number;
  bookingId: number;
  createdBy: number;
  createdByRole: 'artist' | 'venue';
  title: string;
  description: string;
  category: 'payment' | 'contract' | 'booking' | 'other';
  status: 'open' | 'in-progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  userRole: 'artist' | 'venue' | 'admin';
  message: string;
  attachments?: string[];
  createdAt: Date;
}

interface EscalationRule {
  hoursBeforeEscalation: number;
  escalateToAdmin: boolean;
  notifyParties: boolean;
}

// In-memory storage
const tickets: Map<number, SupportTicket> = new Map();
const ticketMessages: Map<number, TicketMessage[]> = new Map();
const escalationRules: EscalationRule = {
  hoursBeforeEscalation: 48,
  escalateToAdmin: true,
  notifyParties: true,
};

export function createTicket(
  bookingId: number,
  createdBy: number,
  createdByRole: 'artist' | 'venue',
  title: string,
  description: string,
  category: SupportTicket['category'],
  priority: SupportTicket['priority'] = 'medium'
): SupportTicket {
  const ticket: SupportTicket = {
    id: Math.random(),
    bookingId,
    createdBy,
    createdByRole,
    title,
    description,
    category,
    status: 'open',
    priority,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  tickets.set(ticket.id, ticket);
  ticketMessages.set(ticket.id, []);

  console.log(`[Support] Ticket #${ticket.id} created: ${title}`);
  scheduleEscalation(ticket.id);

  return ticket;
}

export function getTicket(ticketId: number): SupportTicket | undefined {
  return tickets.get(ticketId);
}

export function getTicketsByBooking(bookingId: number): SupportTicket[] {
  return Array.from(tickets.values()).filter(t => t.bookingId === bookingId);
}

export function getTicketsByUser(userId: number): SupportTicket[] {
  return Array.from(tickets.values()).filter(t => t.createdBy === userId || t.assignedTo === userId);
}

export function updateTicketStatus(
  ticketId: number,
  status: SupportTicket['status'],
  resolution?: string
): SupportTicket | undefined {
  const ticket = tickets.get(ticketId);
  if (!ticket) return undefined;

  ticket.status = status;
  ticket.updatedAt = new Date();

  if (status === 'resolved' && resolution) {
    ticket.resolution = resolution;
    ticket.resolvedAt = new Date();
  }

  console.log(`[Support] Ticket #${ticketId} status updated to ${status}`);
  return ticket;
}

export function assignTicket(ticketId: number, adminId: number): SupportTicket | undefined {
  const ticket = tickets.get(ticketId);
  if (!ticket) return undefined;

  ticket.assignedTo = adminId;
  ticket.status = 'in-progress';
  ticket.updatedAt = new Date();

  console.log(`[Support] Ticket #${ticketId} assigned to admin ${adminId}`);
  return ticket;
}

export function addTicketMessage(
  ticketId: number,
  userId: number,
  userRole: 'artist' | 'venue' | 'admin',
  message: string,
  attachments?: string[]
): TicketMessage | undefined {
  const ticket = tickets.get(ticketId);
  if (!ticket) return undefined;

  const ticketMessage: TicketMessage = {
    id: Math.random(),
    ticketId,
    userId,
    userRole,
    message,
    attachments,
    createdAt: new Date(),
  };

  if (!ticketMessages.has(ticketId)) {
    ticketMessages.set(ticketId, []);
  }

  ticketMessages.get(ticketId)!.push(ticketMessage);
  ticket.updatedAt = new Date();

  console.log(`[Support] Message added to ticket #${ticketId}`);
  return ticketMessage;
}

export function getTicketMessages(ticketId: number): TicketMessage[] {
  return ticketMessages.get(ticketId) || [];
}

export function escalateTicket(ticketId: number, reason: string): SupportTicket | undefined {
  const ticket = tickets.get(ticketId);
  if (!ticket) return undefined;

  ticket.status = 'escalated';
  ticket.priority = 'urgent';
  ticket.updatedAt = new Date();

  addTicketMessage(ticketId, 0, 'admin', `Ticket escalated: ${reason}`);

  console.log(`[Support] Ticket #${ticketId} escalated to admin team`);
  return ticket;
}

function scheduleEscalation(ticketId: number): void {
  // In production, use a job queue like Bull or Agenda
  const escalationTime = escalationRules.hoursBeforeEscalation * 60 * 60 * 1000;

  setTimeout(() => {
    const ticket = tickets.get(ticketId);
    if (ticket && ticket.status !== 'resolved') {
      escalateTicket(ticketId, 'Auto-escalation due to inactivity');

      if (escalationRules.notifyParties) {
        notifyEscalation(ticket);
      }
    }
  }, escalationTime);
}

function notifyEscalation(ticket: SupportTicket): void {
  console.log(
    `[Support] Escalation notification sent for ticket #${ticket.id} (${ticket.title})`
  );
  // In production, send email notifications
}

export function getTicketStats(): {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  averageResolutionTime: number;
} {
  const allTickets = Array.from(tickets.values());
  const resolvedTickets = allTickets.filter(t => t.resolvedAt);

  let totalResolutionTime = 0;
  for (const ticket of resolvedTickets) {
    if (ticket.resolvedAt) {
      totalResolutionTime += ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
    }
  }

  const averageResolutionTime =
    resolvedTickets.length > 0 ? totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60) : 0;

  return {
    totalTickets: allTickets.length,
    openTickets: allTickets.filter(t => t.status === 'open').length,
    inProgressTickets: allTickets.filter(t => t.status === 'in-progress').length,
    resolvedTickets: resolvedTickets.length,
    escalatedTickets: allTickets.filter(t => t.status === 'escalated').length,
    averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
  };
}

export function getTicketsByPriority(priority: SupportTicket['priority']): SupportTicket[] {
  return Array.from(tickets.values()).filter(t => t.priority === priority);
}

export function getTicketsByCategory(category: SupportTicket['category']): SupportTicket[] {
  return Array.from(tickets.values()).filter(t => t.category === category);
}

export function getOpenTickets(): SupportTicket[] {
  return Array.from(tickets.values()).filter(t => t.status !== 'resolved');
}

export function getUnassignedTickets(): SupportTicket[] {
  return Array.from(tickets.values()).filter(t => !t.assignedTo && t.status !== 'resolved');
}
