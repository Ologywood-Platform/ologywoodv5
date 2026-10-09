export const COMPLIMENTARY_TIERS = ['starter', 'professional', 'enterprise'] as const;
export type ComplimentaryTier = typeof COMPLIMENTARY_TIERS[number];
export type GrantState = { userId:number; tier:ComplimentaryTier; status:'active'|'revoked'; expiresAt:Date|null; reason:string; grantedByUserId:number; grantedAt:Date; revision:number; revokedAt:Date|null; updatedAt:Date };
export function getGrantStatus(grant:Pick<GrantState,'status'|'expiresAt'>, now=new Date()):'active'|'expired'|'revoked' {
  if(grant.status==='revoked')return 'revoked';
  return grant.expiresAt && new Date(grant.expiresAt).getTime()<=now.getTime()?'expired':'active';
}
export function hasPotentiallyBillingSubscription(billing:{status:string;stripeSubscriptionId:string|null;currentPeriodEnd?:Date|null}|null, now=new Date()) {
  if (!billing?.stripeSubscriptionId) return false;
  if (billing.status !== 'cancelled') return true;
  // Local cancellation may only schedule Stripe cancellation at period end.
  // An unknown or future period end must be reconciled separately, never labeled free.
  return !billing.currentPeriodEnd || new Date(billing.currentPeriodEnd).getTime() > now.getTime();
}
export const GRANT_BILLING_NOTICE = 'Complimentary access does not cancel Stripe billing, refund payments, waive transaction or processing fees, grant admin roles, or unlock another creator’s paid content.';
