export const EDU_DISCOUNT_PERCENT = 50;
export const EDU_VERIFICATION_DAYS = 365;
export const EDU_RENEWAL_GRACE_DAYS = 30;
export const EDU_MANUAL_REVIEW_STATEMENT = 'All EDU evidence is reviewed manually. A school email or code does not automatically prove email ownership, code validity, or enrollment.';

export type EduVerificationStatus = 'pending' | 'approved' | 'rejected' | 'revoked';
export type EduEffectiveStatus = 'not_submitted' | 'pending' | 'active' | 'grace' | 'expired' | 'rejected' | 'revoked';
export type EduReviewDecision = 'approve' | 'reject' | 'revoke' | 'renew';
export type EduPolicyRow = {
  status: EduVerificationStatus;
  verifiedUntil: Date | string | null;
  graceUntil: Date | string | null;
  renewalSubmittedAt?: Date | string | null;
};

function timestamp(value: Date | string | null | undefined): number {
  return value ? new Date(value).getTime() : NaN;
}

/** Fail closed on missing/invalid dates; deadlines are exclusive UTC instants. */
export function getEffectiveEduStatus(row: EduPolicyRow | null | undefined, now = new Date()): EduEffectiveStatus {
  if (!row) return 'not_submitted';
  if (row.status !== 'approved') return row.status;
  const verifiedUntil = timestamp(row.verifiedUntil);
  const graceUntil = timestamp(row.graceUntil);
  if (!Number.isFinite(verifiedUntil) || !Number.isFinite(now.getTime())) return 'expired';
  if (now.getTime() < verifiedUntil) return 'active';
  return Number.isFinite(graceUntil) && graceUntil > verifiedUntil && now.getTime() < graceUntil ? 'grace' : 'expired';
}

/** Eligibility is not paid activation and never grants subscription entitlement. */
export function isEduVerificationEligible(row: EduPolicyRow | null | undefined, now = new Date()): boolean {
  const status = getEffectiveEduStatus(row, now);
  return status === 'active' || status === 'grace';
}

export function getPermittedEduReviewActions(row: Pick<EduPolicyRow, 'status' | 'renewalSubmittedAt'>): EduReviewDecision[] {
  if (row.status === 'pending') return ['approve', 'reject'];
  if (row.status === 'approved') return row.renewalSubmittedAt ? ['renew', 'reject', 'revoke'] : ['revoke'];
  return [];
}

/** Early renewal extends from the existing verification deadline, never shortens it. */
export function getEduApprovalWindow(now = new Date(), previousVerifiedUntil?: Date | string | null) {
  const previous = timestamp(previousVerifiedUntil);
  const start = Number.isFinite(previous) ? Math.max(now.getTime(), previous) : now.getTime();
  const verifiedUntil = new Date(start + EDU_VERIFICATION_DAYS * 24 * 60 * 60 * 1000);
  const graceUntil = new Date(verifiedUntil.getTime() + EDU_RENEWAL_GRACE_DAYS * 24 * 60 * 60 * 1000);
  return { verifiedUntil, graceUntil };
}
