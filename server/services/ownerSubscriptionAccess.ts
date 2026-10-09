import type { UserSubscription } from '../../drizzle/schema';
import type { PlatformOwnerConfiguration, PlatformOwnerIdentity } from './platformOwnerAccess';
import { isPlatformOwner } from './platformOwnerAccess';

export type EffectiveSubscription = UserSubscription & {
  accessSource?: 'platform_owner';
  isComplimentary?: boolean;
  subscriptionPrice?: number;
  billingStatus?: UserSubscription['status'] | null;
  billingTier?: UserSubscription['tier'] | null;
  hasExistingStripeSubscription?: boolean;
};

/** Server-side identities only. A matching email must be verified; admin role alone is insufficient. */
export function hasComplimentaryOwnerAccess(
  user: (PlatformOwnerIdentity & { emailVerified?: boolean }) | null | undefined,
  configuration: PlatformOwnerConfiguration = {},
): boolean {
  if (!user || !isPlatformOwner(user, configuration)) return false;
  const openIds = [
    configuration.openId ?? process.env.OWNER_OPEN_ID,
    configuration.legacyOpenId ?? process.env.OWNER_NAME,
  ].filter(Boolean);
  return (!!user.openId && openIds.includes(user.openId)) || user.emailVerified === true;
}

export function resolveOwnerSubscription(
  user: (PlatformOwnerIdentity & { emailVerified?: boolean }) | null | undefined,
  billingSubscription: UserSubscription | null,
  configuration: PlatformOwnerConfiguration = {},
): EffectiveSubscription | null {
  if (!hasComplimentaryOwnerAccess(user, configuration)) return billingSubscription;
  return {
    id: billingSubscription?.id ?? 0,
    userId: user!.id!,
    tier: 'enterprise' as const,
    status: 'active' as const,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelledAt: null,
    pausedAt: null,
    pauseExpiresAt: null,
    createdAt: billingSubscription?.createdAt ?? new Date(),
    updatedAt: billingSubscription?.updatedAt ?? new Date(),
    accessSource: 'platform_owner' as const,
    isComplimentary: true as const,
    subscriptionPrice: 0,
    billingStatus: billingSubscription?.status ?? null,
    billingTier: billingSubscription?.tier ?? null,
    hasExistingStripeSubscription: !!billingSubscription?.stripeSubscriptionId,
  };
}
