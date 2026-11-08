import type Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { fanClubMemberships } from '../../drizzle/schema';
import { getDb } from '../db';

export type FanClubMembershipStatus = 'active' | 'cancelled' | 'past_due' | 'incomplete';

export interface FanClubSubscriptionMetadata {
  fanUserId: number;
  talentUserId: number;
  tierId: number;
}

export function mapFanClubSubscriptionStatus(status: Stripe.Subscription.Status): FanClubMembershipStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'incomplete':
      return 'incomplete';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    case 'paused':
    default:
      return 'cancelled';
  }
}

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getFanClubSubscriptionMetadata(
  subscription: Stripe.Subscription,
  fallback?: Stripe.Metadata | null,
): FanClubSubscriptionMetadata | null {
  const metadata = { ...(fallback || {}), ...(subscription.metadata || {}) };
  const fanUserId = positiveInteger(metadata.fanUserId);
  const talentUserId = positiveInteger(metadata.talentUserId);
  const tierId = positiveInteger(metadata.tierId);
  if (!fanUserId || !talentUserId || !tierId) return null;
  return { fanUserId, talentUserId, tierId };
}

function subscriptionDate(value: unknown): Date | null {
  const seconds = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : null;
}

/**
 * Persist the current Stripe subscription state as a Fan Club membership.
 * The same subscription may be delivered through checkout and subscription
 * webhooks; the lookup by Stripe subscription ID makes those deliveries safe
 * to replay. A second lookup by fan/talent also repairs older rows that were
 * created before a subscription ID was stored.
 */
export async function syncFanClubMembershipFromSubscription(
  subscription: Stripe.Subscription,
  fallbackMetadata?: Stripe.Metadata | null,
): Promise<{ synced: boolean; reason?: string; membershipId?: number; status?: FanClubMembershipStatus }> {
  const metadata = getFanClubSubscriptionMetadata(subscription, fallbackMetadata);
  if (!metadata) {
    return { synced: false, reason: 'missing_or_invalid_metadata' };
  }

  const database = await getDb();
  if (!database) throw new Error('Database unavailable while syncing Fan Club membership');

  const status = mapFanClubSubscriptionStatus(subscription.status);
  const currentPeriodEnd = subscriptionDate((subscription as any).current_period_end);
  const startedAt = subscriptionDate((subscription as any).start_date)
    || subscriptionDate((subscription as any).created)
    || new Date();

  let membershipId = 0;
  await database.transaction(async (tx) => {
    let [membership] = await tx.select().from(fanClubMemberships)
      .where(eq(fanClubMemberships.stripeSubscriptionId, subscription.id))
      .limit(1)
      .for('update');

    if (!membership) {
      [membership] = await tx.select().from(fanClubMemberships)
        .where(and(
          eq(fanClubMemberships.fanUserId, metadata.fanUserId),
          eq(fanClubMemberships.talentUserId, metadata.talentUserId),
        ))
        .orderBy(fanClubMemberships.id)
        .limit(1)
          .for('update');
    }

    const cancelAtPeriodEnd = Boolean((subscription as any).cancel_at_period_end);
    const cancelledAt = status === 'cancelled'
      ? new Date()
      : cancelAtPeriodEnd
        ? membership?.cancelledAt || new Date()
        : null;

    const values = {
      fanUserId: metadata.fanUserId,
      talentUserId: metadata.talentUserId,
      artistUserId: metadata.talentUserId,
      tierId: metadata.tierId,
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodEnd,
      cancelledAt,
    } as const;

    if (membership) {
      membershipId = membership.id;
      await tx.update(fanClubMemberships)
        .set(values)
        .where(eq(fanClubMemberships.id, membership.id));
    } else {
      const [inserted] = await tx.insert(fanClubMemberships).values({
        ...values,
        startedAt,
      }).$returningId();
      membershipId = inserted.id;
    }
  });

  return { synced: true, membershipId, status };
}
