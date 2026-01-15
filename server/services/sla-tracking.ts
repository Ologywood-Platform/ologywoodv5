/**
 * SLA (Service Level Agreement) Tracking and Escalation Service
 * Monitors ticket response times and escalates overdue tickets
 */

export interface SLAPolicy {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  responseTimeHours: number;
  resolutionTimeHours: number;
  escalationLevel1Hours?: number;
  escalationLevel2Hours?: number;
}

export interface TicketSLAStatus {
  ticketId: number;
  priority: string;
  status: string;
  createdAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  assignedToId?: number;
  isOverdue: boolean;
  escalationLevel: 0 | 1 | 2;
  hoursUntilDue: number;
  responseTimeRemaining: number;
  resolutionTimeRemaining: number;
}

/**
 * Default SLA policies by priority
 */
export const DEFAULT_SLA_POLICIES: Record<string, SLAPolicy> = {
  urgent: {
    priority: 'urgent',
    responseTimeHours: 1,
    resolutionTimeHours: 4,
    escalationLevel1Hours: 2,
    escalationLevel2Hours: 3,
  },
  high: {
    priority: 'high',
    responseTimeHours: 4,
    resolutionTimeHours: 24,
    escalationLevel1Hours: 8,
    escalationLevel2Hours: 16,
  },
  medium: {
    priority: 'medium',
    responseTimeHours: 8,
    resolutionTimeHours: 48,
    escalationLevel1Hours: 16,
    escalationLevel2Hours: 32,
  },
  low: {
    priority: 'low',
    responseTimeHours: 24,
    resolutionTimeHours: 72,
    escalationLevel1Hours: 48,
    escalationLevel2Hours: 60,
  },
};

/**
 * Calculate SLA status for a ticket
 */
export function calculateTicketSLAStatus(
  ticketId: number,
  priority: string,
  status: string,
  createdAt: Date,
  firstResponseAt: Date | undefined,
  resolvedAt: Date | undefined,
  assignedToId: number | undefined
): TicketSLAStatus {
  const policy = DEFAULT_SLA_POLICIES[priority.toLowerCase()] || DEFAULT_SLA_POLICIES.medium;
  const now = new Date();

  // Calculate hours elapsed
  const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const responseTimeRemaining = policy.responseTimeHours - hoursElapsed;
  const resolutionTimeRemaining = policy.resolutionTimeHours - hoursElapsed;

  // Determine escalation level
  let escalationLevel: 0 | 1 | 2 = 0;
  if (policy.escalationLevel2Hours && hoursElapsed > policy.escalationLevel2Hours) {
    escalationLevel = 2;
  } else if (policy.escalationLevel1Hours && hoursElapsed > policy.escalationLevel1Hours) {
    escalationLevel = 1;
  }

  // Check if overdue
  const isOverdue = status !== 'resolved' && status !== 'closed' && hoursElapsed > policy.responseTimeHours;

  return {
    ticketId,
    priority,
    status,
    createdAt,
    firstResponseAt,
    resolvedAt,
    assignedToId,
    isOverdue,
    escalationLevel,
    hoursUntilDue: Math.max(0, responseTimeRemaining),
    responseTimeRemaining,
    resolutionTimeRemaining,
  };
}

/**
 * Get escalation action for a ticket
 */
export function getEscalationAction(
  slaStatus: TicketSLAStatus
): { action: string; severity: 'warning' | 'critical'; message: string } | null {
  if (slaStatus.escalationLevel === 2) {
    return {
      action: 'escalate_to_manager',
      severity: 'critical',
      message: `CRITICAL: Ticket #${slaStatus.ticketId} has exceeded level 2 escalation threshold. Immediate manager review required.`,
    };
  }

  if (slaStatus.escalationLevel === 1) {
    return {
      action: 'escalate_to_senior',
      severity: 'warning',
      message: `WARNING: Ticket #${slaStatus.ticketId} is approaching SLA deadline. Escalate to senior support specialist.`,
    };
  }

  if (slaStatus.isOverdue) {
    return {
      action: 'notify_assignee',
      severity: 'warning',
      message: `Ticket #${slaStatus.ticketId} has missed initial response SLA. Notify assigned team member.`,
    };
  }

  return null;
}

/**
 * Format SLA status for display
 */
export function formatSLAStatus(slaStatus: TicketSLAStatus): {
  statusText: string;
  statusColor: string;
  hoursRemaining: number;
  percentComplete: number;
} {
  const policy = DEFAULT_SLA_POLICIES[slaStatus.priority.toLowerCase()] || DEFAULT_SLA_POLICIES.medium;
  const hoursRemaining = Math.max(0, policy.responseTimeHours - ((new Date().getTime() - slaStatus.createdAt.getTime()) / (1000 * 60 * 60)));
  const percentComplete = Math.min(100, ((new Date().getTime() - slaStatus.createdAt.getTime()) / (1000 * 60 * 60)) / policy.responseTimeHours * 100);

  let statusText = 'On Track';
  let statusColor = 'text-green-600';

  if (slaStatus.escalationLevel === 2) {
    statusText = 'Critical - Manager Review Required';
    statusColor = 'text-red-600';
  } else if (slaStatus.escalationLevel === 1) {
    statusText = 'Warning - Escalation Needed';
    statusColor = 'text-orange-600';
  } else if (slaStatus.isOverdue) {
    statusText = 'Overdue';
    statusColor = 'text-red-600';
  } else if (hoursRemaining < 2) {
    statusText = 'Urgent - Due Soon';
    statusColor = 'text-orange-600';
  }

  return {
    statusText,
    statusColor,
    hoursRemaining,
    percentComplete,
  };
}

/**
 * Get SLA compliance metrics for a team member
 */
export function calculateTeamMemberSLACompliance(
  ticketsHandled: TicketSLAStatus[]
): {
  totalTickets: number;
  compliantTickets: number;
  overdueTickets: number;
  compliancePercentage: number;
  avgResponseTime: number;
  avgResolutionTime: number;
} {
  const totalTickets = ticketsHandled.length;
  const compliantTickets = ticketsHandled.filter(t => !t.isOverdue).length;
  const overdueTickets = ticketsHandled.filter(t => t.isOverdue).length;
  const compliancePercentage = totalTickets > 0 ? (compliantTickets / totalTickets) * 100 : 0;

  // Calculate average response and resolution times
  const avgResponseTime = ticketsHandled
    .filter(t => t.firstResponseAt)
    .reduce((sum, t) => sum + ((t.firstResponseAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60)), 0) / Math.max(1, ticketsHandled.filter(t => t.firstResponseAt).length);

  const avgResolutionTime = ticketsHandled
    .filter(t => t.resolvedAt)
    .reduce((sum, t) => sum + ((t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60)), 0) / Math.max(1, ticketsHandled.filter(t => t.resolvedAt).length);

  return {
    totalTickets,
    compliantTickets,
    overdueTickets,
    compliancePercentage,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
  };
}
