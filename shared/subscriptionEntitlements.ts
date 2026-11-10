export const SUBSCRIPTION_TIERS = ['free', 'starter', 'professional', 'enterprise'] as const;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];
/** `free` is an access state/tier, not a persisted billing status. */
export type SubscriptionAccessStatus = 'free' | 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused';
export type SubscriptionEntitlementInput = {
  tier?: string | null;
  status?: string | null;
  trialEndsAt?: Date | string | number | null;
  isComplimentary?: boolean;
  accessSource?: string;
  complimentaryExpiresAt?: Date | string | number | null;
};

function unexpired(value: Date | string | number | null | undefined, now: Date): boolean {
  if (value == null) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}

/** Use only server-resolved owner/grant projections, never client-supplied flags. */
export function getEffectiveSubscriptionTier(
  subscription: SubscriptionEntitlementInput | null | undefined,
  now = new Date(),
): SubscriptionTier {
  const tier = SUBSCRIPTION_TIERS.find(value => value === subscription?.tier) ?? 'free';
  if (tier === 'free' || !subscription) return 'free';
  if (subscription.accessSource === 'platform_owner' && subscription.isComplimentary === true) return tier;
  if (subscription.accessSource === 'complimentary_grant') {
    return subscription.isComplimentary === true && subscription.status === 'active'
      && (subscription.complimentaryExpiresAt == null || unexpired(subscription.complimentaryExpiresAt, now))
      ? tier : 'free';
  }
  if (subscription.status === 'active') return tier;
  return subscription.status === 'trialing' && unexpired(subscription.trialEndsAt, now) ? tier : 'free';
}

export function hasPaidSubscriptionAccess(
  subscription: SubscriptionEntitlementInput | null | undefined,
  now = new Date(),
): boolean {
  return getEffectiveSubscriptionTier(subscription, now) !== 'free';
}

/** Access projection only. Raw Stripe state must remain available for billing operations. */
export function projectSubscriptionEntitlements<T extends SubscriptionEntitlementInput>(subscription: T, now = new Date()) {
  return {
    ...subscription,
    tier: getEffectiveSubscriptionTier(subscription, now),
    billingTier: 'billingTier' in subscription ? subscription.billingTier : subscription.tier ?? 'free',
    billingStatus: 'billingStatus' in subscription ? subscription.billingStatus : subscription.status ?? null,
  };
}
