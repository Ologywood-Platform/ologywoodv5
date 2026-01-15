interface CancellationPolicy {
  id: string;
  name: string;
  description: string;
  refundSchedule: RefundTier[];
  penaltyStructure: PenaltyTier[];
  minimumNotice: number; // in hours
  nonRefundablePercentage: number; // percentage
}

interface RefundTier {
  daysBeforeEvent: number;
  refundPercentage: number;
  description: string;
}

interface PenaltyTier {
  daysBeforeEvent: number;
  penaltyPercentage: number;
  description: string;
}

interface BookingCancellation {
  id: number;
  bookingId: number;
  requestedBy: 'artist' | 'venue';
  reason: string;
  cancellationDate: Date;
  refundAmount: number;
  penaltyAmount: number;
  netRefund: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  approvedBy?: number;
  approvalDate?: Date;
  processedDate?: Date;
  disputeTicketId?: number;
}

// Standard cancellation policies
const standardPolicies: CancellationPolicy[] = [
  {
    id: 'flexible',
    name: 'Flexible Cancellation',
    description: 'Most flexible policy - full refunds up to 7 days before event',
    refundSchedule: [
      { daysBeforeEvent: 30, refundPercentage: 100, description: 'Full refund' },
      { daysBeforeEvent: 14, refundPercentage: 100, description: 'Full refund' },
      { daysBeforeEvent: 7, refundPercentage: 100, description: 'Full refund' },
      { daysBeforeEvent: 3, refundPercentage: 75, description: '75% refund' },
      { daysBeforeEvent: 1, refundPercentage: 50, description: '50% refund' },
      { daysBeforeEvent: 0, refundPercentage: 0, description: 'No refund' },
    ],
    penaltyStructure: [
      { daysBeforeEvent: 7, penaltyPercentage: 0, description: 'No penalty' },
      { daysBeforeEvent: 3, penaltyPercentage: 10, description: '10% penalty' },
      { daysBeforeEvent: 1, penaltyPercentage: 25, description: '25% penalty' },
      { daysBeforeEvent: 0, penaltyPercentage: 50, description: '50% penalty' },
    ],
    minimumNotice: 24,
    nonRefundablePercentage: 0,
  },
  {
    id: 'moderate',
    name: 'Moderate Cancellation',
    description: 'Balanced policy - deposit non-refundable after 14 days',
    refundSchedule: [
      { daysBeforeEvent: 30, refundPercentage: 100, description: 'Full refund' },
      { daysBeforeEvent: 14, refundPercentage: 50, description: '50% refund (deposit kept)' },
      { daysBeforeEvent: 7, refundPercentage: 25, description: '25% refund' },
      { daysBeforeEvent: 0, refundPercentage: 0, description: 'No refund' },
    ],
    penaltyStructure: [
      { daysBeforeEvent: 14, penaltyPercentage: 0, description: 'No penalty' },
      { daysBeforeEvent: 7, penaltyPercentage: 15, description: '15% penalty' },
      { daysBeforeEvent: 0, penaltyPercentage: 30, description: '30% penalty' },
    ],
    minimumNotice: 48,
    nonRefundablePercentage: 30,
  },
  {
    id: 'strict',
    name: 'Strict Cancellation',
    description: 'Most strict policy - deposit non-refundable after 30 days',
    refundSchedule: [
      { daysBeforeEvent: 60, refundPercentage: 100, description: 'Full refund' },
      { daysBeforeEvent: 30, refundPercentage: 50, description: '50% refund' },
      { daysBeforeEvent: 0, refundPercentage: 0, description: 'No refund' },
    ],
    penaltyStructure: [
      { daysBeforeEvent: 30, penaltyPercentage: 0, description: 'No penalty' },
      { daysBeforeEvent: 0, penaltyPercentage: 50, description: '50% penalty' },
    ],
    minimumNotice: 72,
    nonRefundablePercentage: 50,
  },
];

// In-memory storage
const cancellations: Map<number, BookingCancellation> = new Map();
let cancellationIdCounter = 1000;

export function getCancellationPolicies(): CancellationPolicy[] {
  return standardPolicies;
}

export function getCancellationPolicy(policyId: string): CancellationPolicy | undefined {
  return standardPolicies.find(p => p.id === policyId);
}

export function calculateRefund(
  bookingAmount: number,
  depositAmount: number,
  policyId: string,
  daysBeforeEvent: number
): { refundAmount: number; penaltyAmount: number; netRefund: number } {
  const policy = getCancellationPolicy(policyId);
  if (!policy) {
    throw new Error(`Policy ${policyId} not found`);
  }

  // Find applicable refund tier
  const refundTier = policy.refundSchedule.find(
    tier => daysBeforeEvent >= tier.daysBeforeEvent
  ) || policy.refundSchedule[policy.refundSchedule.length - 1];

  // Find applicable penalty tier
  const penaltyTier = policy.penaltyStructure.find(
    tier => daysBeforeEvent >= tier.daysBeforeEvent
  ) || policy.penaltyStructure[policy.penaltyStructure.length - 1];

  const refundAmount = (bookingAmount * refundTier.refundPercentage) / 100;
  const penaltyAmount = (bookingAmount * penaltyTier.penaltyPercentage) / 100;
  const netRefund = refundAmount - penaltyAmount;

  return {
    refundAmount: Math.max(0, refundAmount),
    penaltyAmount: Math.max(0, penaltyAmount),
    netRefund: Math.max(0, netRefund),
  };
}

export function requestCancellation(
  bookingId: number,
  requestedBy: 'artist' | 'venue',
  reason: string,
  bookingAmount: number,
  policyId: string,
  daysBeforeEvent: number
): BookingCancellation {
  const { refundAmount, penaltyAmount, netRefund } = calculateRefund(
    bookingAmount,
    0,
    policyId,
    daysBeforeEvent
  );

  const cancellation: BookingCancellation = {
    id: cancellationIdCounter++,
    bookingId,
    requestedBy,
    reason,
    cancellationDate: new Date(),
    refundAmount,
    penaltyAmount,
    netRefund,
    status: 'pending',
  };

  cancellations.set(cancellation.id, cancellation);
  console.log(
    `[Cancellation] Cancellation request #${cancellation.id} created for booking #${bookingId}`
  );

  return cancellation;
}

export function getCancellation(cancellationId: number): BookingCancellation | undefined {
  return cancellations.get(cancellationId);
}

export function getCancellationsByBooking(bookingId: number): BookingCancellation[] {
  return Array.from(cancellations.values()).filter(c => c.bookingId === bookingId);
}

export function approveCancellation(
  cancellationId: number,
  approvedBy: number
): BookingCancellation | undefined {
  const cancellation = cancellations.get(cancellationId);
  if (!cancellation) return undefined;

  cancellation.status = 'approved';
  cancellation.approvedBy = approvedBy;
  cancellation.approvalDate = new Date();

  console.log(`[Cancellation] Cancellation #${cancellationId} approved`);
  return cancellation;
}

export function rejectCancellation(
  cancellationId: number,
  approvedBy: number
): BookingCancellation | undefined {
  const cancellation = cancellations.get(cancellationId);
  if (!cancellation) return undefined;

  cancellation.status = 'rejected';
  cancellation.approvedBy = approvedBy;
  cancellation.approvalDate = new Date();

  console.log(`[Cancellation] Cancellation #${cancellationId} rejected`);
  return cancellation;
}

export function processCancellation(
  cancellationId: number
): BookingCancellation | undefined {
  const cancellation = cancellations.get(cancellationId);
  if (!cancellation || cancellation.status !== 'approved') {
    return undefined;
  }

  cancellation.status = 'processed';
  cancellation.processedDate = new Date();

  console.log(`[Cancellation] Cancellation #${cancellationId} processed - Refund: $${cancellation.netRefund}`);
  return cancellation;
}

export function linkDisputeTicket(
  cancellationId: number,
  ticketId: number
): BookingCancellation | undefined {
  const cancellation = cancellations.get(cancellationId);
  if (!cancellation) return undefined;

  cancellation.disputeTicketId = ticketId;
  console.log(`[Cancellation] Dispute ticket #${ticketId} linked to cancellation #${cancellationId}`);

  return cancellation;
}

export function getCancellationStats(): {
  totalCancellations: number;
  pendingCancellations: number;
  approvedCancellations: number;
  rejectedCancellations: number;
  totalRefunded: number;
  averageRefundAmount: number;
} {
  const allCancellations = Array.from(cancellations.values());
  const approvedCancellations = allCancellations.filter(c => c.status === 'approved' || c.status === 'processed');

  const totalRefunded = approvedCancellations.reduce((sum, c) => sum + c.netRefund, 0);
  const averageRefundAmount =
    approvedCancellations.length > 0 ? totalRefunded / approvedCancellations.length : 0;

  return {
    totalCancellations: allCancellations.length,
    pendingCancellations: allCancellations.filter(c => c.status === 'pending').length,
    approvedCancellations: approvedCancellations.length,
    rejectedCancellations: allCancellations.filter(c => c.status === 'rejected').length,
    totalRefunded: Math.round(totalRefunded * 100) / 100,
    averageRefundAmount: Math.round(averageRefundAmount * 100) / 100,
  };
}

export function getPolicySummary(policyId: string): string {
  const policy = getCancellationPolicy(policyId);
  if (!policy) return '';

  const firstTier = policy.refundSchedule[0];
  const lastTier = policy.refundSchedule[policy.refundSchedule.length - 1];

  return `${policy.name}: ${firstTier.refundPercentage}% refund if cancelled ${firstTier.daysBeforeEvent}+ days before, down to ${lastTier.refundPercentage}% if cancelled within ${lastTier.daysBeforeEvent} days.`;
}
