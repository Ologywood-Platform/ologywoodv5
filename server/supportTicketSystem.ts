/**
 * Support Ticket System with Automated Routing
 * Handles ticket creation, categorization, and automated routing
 */

import { z } from 'zod';

export type TicketCategory = 'contracts' | 'billing' | 'technical' | 'account' | 'general';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'artist' | 'venue' | 'admin';
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  assignedTeam?: string;
  tags: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responses: TicketResponse[];
  estimatedResolutionTime?: number; // in hours
  sla?: {
    responseTime: number; // in hours
    resolutionTime: number; // in hours
    breached: boolean;
  };
}

export interface TicketResponse {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: 'customer' | 'support' | 'admin';
  message: string;
  attachments: string[];
  createdAt: string;
  isInternal: boolean; // Internal notes not visible to customer
}

// Validation schemas
export const createTicketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['contracts', 'billing', 'technical', 'account', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export const addResponseSchema = z.object({
  ticketId: z.string(),
  message: z.string().min(1).max(5000),
  attachments: z.array(z.string()).optional(),
  isInternal: z.boolean().optional(),
});

export const updateTicketSchema = z.object({
  ticketId: z.string(),
  status: z.enum(['open', 'in-progress', 'waiting-customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Automated routing logic
export class SupportTicketRouter {
  /**
   * Determine ticket priority based on category and content
   */
  static determinePriority(
    category: TicketCategory,
    description: string,
    userRole: string
  ): TicketPriority {
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'down', 'broken', 'not working'];
    const highKeywords = ['important', 'asap', 'soon', 'error', 'issue'];

    const descLower = description.toLowerCase();
    const hasUrgent = urgentKeywords.some((kw) => descLower.includes(kw));
    const hasHigh = highKeywords.some((kw) => descLower.includes(kw));

    if (hasUrgent) return 'urgent';
    if (hasHigh) return 'high';

    // Billing issues are typically high priority
    if (category === 'billing') return 'high';

    // Technical issues are medium priority
    if (category === 'technical') return 'medium';

    return 'low';
  }

  /**
   * Determine which team should handle the ticket
   */
  static routeToTeam(
    category: TicketCategory,
    priority: TicketPriority
  ): {
    team: string;
    estimatedResponseTime: number; // in hours
    estimatedResolutionTime: number; // in hours
  } {
    const routingRules: Record<
      TicketCategory,
      { team: string; responseTime: number; resolutionTime: number }
    > = {
      contracts: {
        team: 'contracts-support',
        responseTime: 2,
        resolutionTime: 24,
      },
      billing: {
        team: 'billing-support',
        responseTime: 1,
        resolutionTime: 4,
      },
      technical: {
        team: 'technical-support',
        responseTime: 1,
        resolutionTime: 8,
      },
      account: {
        team: 'account-support',
        responseTime: 2,
        resolutionTime: 12,
      },
      general: {
        team: 'general-support',
        responseTime: 4,
        resolutionTime: 24,
      },
    };

    let routing = routingRules[category];

    // Adjust based on priority
    if (priority === 'urgent') {
      routing.responseTime = Math.max(0.5, routing.responseTime / 4);
      routing.resolutionTime = Math.max(2, routing.resolutionTime / 2);
    } else if (priority === 'high') {
      routing.responseTime = routing.responseTime / 2;
      routing.resolutionTime = routing.resolutionTime / 1.5;
    }

    return {
      team: routing.team,
      estimatedResponseTime: routing.responseTime,
      estimatedResolutionTime: routing.resolutionTime,
    };
  }

  /**
   * Extract relevant tags from ticket content
   */
  static extractTags(category: TicketCategory, description: string): string[] {
    const tags: string[] = [category];

    // Contract-related tags
    if (category === 'contracts') {
      if (description.toLowerCase().includes('signature'))
        tags.push('signature');
      if (description.toLowerCase().includes('certificate'))
        tags.push('certificate');
      if (description.toLowerCase().includes('verification'))
        tags.push('verification');
      if (description.toLowerCase().includes('signing'))
        tags.push('signing');
    }

    // Billing-related tags
    if (category === 'billing') {
      if (description.toLowerCase().includes('payment'))
        tags.push('payment');
      if (description.toLowerCase().includes('invoice'))
        tags.push('invoice');
      if (description.toLowerCase().includes('refund'))
        tags.push('refund');
      if (description.toLowerCase().includes('charge'))
        tags.push('charge');
    }

    // Technical-related tags
    if (category === 'technical') {
      if (description.toLowerCase().includes('error'))
        tags.push('error');
      if (description.toLowerCase().includes('bug'))
        tags.push('bug');
      if (description.toLowerCase().includes('crash'))
        tags.push('crash');
      if (description.toLowerCase().includes('slow'))
        tags.push('performance');
    }

    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Check if ticket matches FAQ
   */
  static findRelatedFAQ(category: TicketCategory, description: string): string[] {
    const faqMappings: Record<TicketCategory, Record<string, string>> = {
      contracts: {
        'how to sign': 'how-to-sign-contract',
        'how to send': 'how-to-send-contract',
        'digital certificate': 'understanding-certificates',
        'verify certificate': 'verifying-certificate',
      },
      billing: {
        'payment issue': 'billing-faq',
        invoice: 'billing-faq',
        refund: 'billing-faq',
      },
      technical: {
        'signature won\'t appear': 'troubleshooting-signature',
        'page won\'t load': 'troubleshooting-general',
        error: 'troubleshooting-general',
      },
      account: {
        'forgot password': 'account-faq',
        'reset password': 'account-faq',
        'change email': 'account-faq',
      },
      general: {
        getting: 'getting-started-contracts',
      },
    };

    const mapping = faqMappings[category] || {};
    const descLower = description.toLowerCase();
    const related: string[] = [];

    for (const [keyword, faqId] of Object.entries(mapping)) {
      if (descLower.includes(keyword)) {
        related.push(faqId);
      }
    }

    return related;
  }

  /**
   * Suggest FAQ before creating ticket
   */
  static shouldSuggestFAQ(category: TicketCategory, description: string): boolean {
    const relatedFAQ = this.findRelatedFAQ(category, description);
    return relatedFAQ.length > 0;
  }

  /**
   * Calculate SLA (Service Level Agreement)
   */
  static calculateSLA(
    category: TicketCategory,
    priority: TicketPriority,
    createdAt: Date
  ): {
    responseDeadline: Date;
    resolutionDeadline: Date;
  } {
    const routing = this.routeToTeam(category, priority);
    const responseDeadline = new Date(
      createdAt.getTime() + routing.estimatedResponseTime * 60 * 60 * 1000
    );
    const resolutionDeadline = new Date(
      createdAt.getTime() + routing.estimatedResolutionTime * 60 * 60 * 1000
    );

    return { responseDeadline, resolutionDeadline };
  }

  /**
   * Check if SLA is breached
   */
  static checkSLABreach(
    ticket: SupportTicket,
    currentTime: Date = new Date()
  ): boolean {
    if (!ticket.sla) return false;

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      // Check response SLA
      if (ticket.responses.length === 0) {
        const createdAt = new Date(ticket.createdAt);
        const responseDeadline = new Date(
          createdAt.getTime() + ticket.sla.responseTime * 60 * 60 * 1000
        );
        if (currentTime > responseDeadline) return true;
      }

      // Check resolution SLA
      const createdAt = new Date(ticket.createdAt);
      const resolutionDeadline = new Date(
        createdAt.getTime() + ticket.sla.resolutionTime * 60 * 60 * 1000
      );
      if (currentTime > resolutionDeadline) return true;
    }

    return false;
  }

  /**
   * Auto-close resolved tickets after 7 days
   */
  static shouldAutoClose(ticket: SupportTicket, currentTime: Date = new Date()): boolean {
    if (ticket.status !== 'resolved') return false;

    const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
    if (!resolvedAt) return false;

    const daysSinceResolved = (currentTime.getTime() - resolvedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceResolved > 7;
  }
}

// Ticket template suggestions
export const ticketTemplates: Record<TicketCategory, { title: string; description: string }[]> = {
  contracts: [
    {
      title: 'Signature not appearing',
      description: 'I\'m trying to sign a contract but my signature won\'t appear on the canvas.',
    },
    {
      title: 'Certificate verification failed',
      description: 'I\'m unable to verify a digital certificate for a signed contract.',
    },
    {
      title: 'Contract won\'t send',
      description: 'I\'m trying to send a contract to an artist but it\'s not being sent.',
    },
  ],
  billing: [
    {
      title: 'Unexpected charge',
      description: 'I was charged an unexpected amount on my account.',
    },
    {
      title: 'Refund request',
      description: 'I would like to request a refund for a recent charge.',
    },
    {
      title: 'Invoice issue',
      description: 'There\'s an issue with my invoice or billing information.',
    },
  ],
  technical: [
    {
      title: 'Page not loading',
      description: 'A page in the dashboard is not loading or is showing an error.',
    },
    {
      title: 'Feature not working',
      description: 'A feature that was previously working is now broken.',
    },
    {
      title: 'Performance issue',
      description: 'The platform is running slowly or timing out.',
    },
  ],
  account: [
    {
      title: 'Forgot password',
      description: 'I forgot my password and need to reset it.',
    },
    {
      title: 'Account locked',
      description: 'My account appears to be locked or I can\'t log in.',
    },
    {
      title: 'Update account info',
      description: 'I need to update my email address or other account information.',
    },
  ],
  general: [
    {
      title: 'Feature request',
      description: 'I have a suggestion for a new feature or improvement.',
    },
    {
      title: 'General question',
      description: 'I have a general question about using Ologywood.',
    },
    {
      title: 'Feedback',
      description: 'I have feedback about my experience using the platform.',
    },
  ],
};

// Support team configuration
export const supportTeams: Record<
  string,
  {
    name: string;
    email: string;
    maxTickets: number;
    categories: TicketCategory[];
    availability: { start: number; end: number }; // hours in UTC
  }
> = {
  'contracts-support': {
    name: 'Contracts Support Team',
    email: 'contracts-support@ologywood.com',
    maxTickets: 50,
    categories: ['contracts'],
    availability: { start: 0, end: 24 },
  },
  'billing-support': {
    name: 'Billing Support Team',
    email: 'billing-support@ologywood.com',
    maxTickets: 30,
    categories: ['billing'],
    availability: { start: 8, end: 20 },
  },
  'technical-support': {
    name: 'Technical Support Team',
    email: 'tech-support@ologywood.com',
    maxTickets: 40,
    categories: ['technical'],
    availability: { start: 0, end: 24 },
  },
  'account-support': {
    name: 'Account Support Team',
    email: 'account-support@ologywood.com',
    maxTickets: 35,
    categories: ['account'],
    availability: { start: 8, end: 18 },
  },
  'general-support': {
    name: 'General Support Team',
    email: 'support@ologywood.com',
    maxTickets: 60,
    categories: ['general'],
    availability: { start: 8, end: 20 },
  },
};
