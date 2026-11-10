import type Stripe from 'stripe';
import type { InsertUserSubscription, UserSubscription } from '../../drizzle/schema';
import { SUBSCRIPTION_PRODUCTS } from '../../shared/products';
import { getEffectiveSubscriptionTier, type SubscriptionEntitlementInput, type SubscriptionTier } from '../../shared/subscriptionEntitlements';

export type BillingSubscriptionStatus = UserSubscription['status'];
export type SubscriptionStripeClient = Pick<Stripe, 'subscriptions'>;
export type SubscriptionWrite = Pick<InsertUserSubscription, 'userId'> & Partial<Omit<InsertUserSubscription, 'id' | 'userId' | 'createdAt'>>;
export type SubscriptionTransaction = {
  getCurrent(): Promise<UserSubscription | null>;
  /** Compare the stored Stripe identity even while holding the user-row lock. */
  save(data: SubscriptionWrite, expectedStripeSubscriptionId: string | null, exists: boolean): Promise<void>;
};
export type SubscriptionRepository = {
  /** Must lock the existing users row before reading/inserting a subscription. */
  withUserLock<T>(userId: number, work: (tx: SubscriptionTransaction) => Promise<T>): Promise<T>;
};
export type SubscriptionSyncResult =
  | { synced: true; subscription: Stripe.Subscription; state: SubscriptionWrite }
  | { synced: false; reason: 'different_current_subscription'; currentSubscriptionId: string };

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status, pauseCollection = false): BillingSubscriptionStatus {
  if (status === 'canceled' || status === 'incomplete_expired') return 'cancelled';
  if (status === 'unpaid' || status === 'past_due') return 'past_due';
  if (status === 'paused' || status === 'incomplete' || pauseCollection) return 'paused';
  if (status === 'trialing') return 'trialing';
  if (status === 'active') return 'active';
  return 'paused'; // Fail closed if Stripe adds a status before our SDK is updated.
}

function stripeDate(seconds: number | null | undefined): Date | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const date = new Date(seconds * 1000);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getStripeSubscriptionPeriod(subscription: Stripe.Subscription): { currentPeriodStart: Date | null; currentPeriodEnd: Date | null } {
  // New Stripe SDK/API versions moved billing periods onto subscription items.
  const legacy = subscription as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
  const item = subscription.items.data[0];
  return {
    currentPeriodStart: stripeDate(item?.current_period_start ?? legacy.current_period_start),
    currentPeriodEnd: stripeDate(item?.current_period_end ?? legacy.current_period_end),
  };
}

export function resolveStripeSubscriptionTier(subscription: Stripe.Subscription): Exclude<SubscriptionTier, 'free'> {
  const price = subscription.items.data[0]?.price;
  const products = [
    ['starter', SUBSCRIPTION_PRODUCTS.ARTIST_STARTER],
    ['professional', SUBSCRIPTION_PRODUCTS.ARTIST_PROFESSIONAL],
    ['enterprise', SUBSCRIPTION_PRODUCTS.ARTIST_ENTERPRISE],
  ] as const;
  // Current price lookup beats possibly stale metadata following a plan change.
  const byLookup = products.find(([, product]) => price?.lookup_key === product.lookupKey || price?.lookup_key === product.yearlyLookupKey);
  if (byLookup) return byLookup[0];
  const byMetadata = products.find(([, product]) => subscription.metadata?.plan === product.key);
  if (byMetadata) return byMetadata[0];
  if (subscription.metadata?.plan === 'ARTIST_BASIC') return 'professional';
  const byAmount = products.find(([, product]) => price?.currency === 'usd' && price.recurring
    && (price.unit_amount === product.priceMonthly || price.unit_amount === product.priceYearly));
  if (byAmount) return byAmount[0];
  throw new Error('Cannot resolve a supported platform subscription plan');
}

/** Do not replace active/trialing/past-due/paused or uncertain period-end billing. */
export function canReplaceBillingSubscription(current: UserSubscription | null, now = new Date()): boolean {
  if (!current || !current.stripeSubscriptionId) return true;
  // A free local tier with a live Stripe identity is not evidence of termination.
  return current.status === 'cancelled' && current.currentPeriodEnd != null
    && Number.isFinite(new Date(current.currentPeriodEnd).getTime())
    && new Date(current.currentPeriodEnd).getTime() <= now.getTime();
}

function userIdFromSubscription(subscription: Stripe.Subscription): number {
  const raw = subscription.metadata?.userId;
  if (!raw || !/^[1-9]\d*$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw new Error('Subscription has no valid platform user identity');
  if (subscription.metadata?.type === 'fan_club_subscription') throw new Error('Fan Club subscriptions must use their separate lifecycle');
  return Number(raw);
}

async function defaultRepository(): Promise<SubscriptionRepository> {
  return (await import('../db')).subscriptionRepository;
}

export type SynchronizeSubscriptionInput = {
  stripeClient: SubscriptionStripeClient;
  subscriptionId: string;
  userId?: number;
  expectedCustomerId?: string;
  /** Only checkout/manual reconciliation may attach a previously untracked ID. Events must match. */
  allowReplacement?: boolean;
  repository?: SubscriptionRepository;
  now?: Date;
};

/** Retrieve authoritative mode-specific Stripe state inside the serialized write; never persist an event snapshot. */
export async function synchronizeSubscription(input: SynchronizeSubscriptionInput): Promise<SubscriptionSyncResult> {
  if (!input.subscriptionId || !input.subscriptionId.startsWith('sub_')) throw new Error('Invalid Stripe subscription identity');
  let userId = input.userId;
  if (userId === undefined) userId = userIdFromSubscription(await input.stripeClient.subscriptions.retrieve(input.subscriptionId));
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid platform user identity');
  const repository = input.repository ?? await defaultRepository();
  return repository.withUserLock(userId, async tx => {
    const current = await tx.getCurrent();
    const now = input.now ?? new Date();
    if (current?.stripeSubscriptionId && current.stripeSubscriptionId !== input.subscriptionId
      && (!input.allowReplacement || !canReplaceBillingSubscription(current, now))) {
      return { synced: false, reason: 'different_current_subscription', currentSubscriptionId: current.stripeSubscriptionId };
    }
    const subscription = await input.stripeClient.subscriptions.retrieve(input.subscriptionId);
    if (subscription.id !== input.subscriptionId || userIdFromSubscription(subscription) !== userId) throw new Error('Stripe subscription identity mismatch');
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    if (input.expectedCustomerId && customerId !== input.expectedCustomerId) throw new Error('Stripe customer identity mismatch');
    if (current?.stripeSubscriptionId === subscription.id && current.stripeCustomerId && current.stripeCustomerId !== customerId) throw new Error('Stored Stripe customer identity mismatch');
    const status = mapStripeSubscriptionStatus(subscription.status, subscription.pause_collection != null);
    const period = getStripeSubscriptionPeriod(subscription);
    const terminated = subscription.status === 'canceled' || subscription.status === 'incomplete_expired';
    // Actual terminal status is proof of termination, unlike cancel_at_period_end.
    const endedAt = terminated ? stripeDate(subscription.ended_at) ?? stripeDate(subscription.canceled_at) ?? now : null;
    const state: SubscriptionWrite = {
      userId,
      tier: resolveStripeSubscriptionTier(subscription),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status,
      trialEndsAt: stripeDate(subscription.trial_end),
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: endedAt ?? period.currentPeriodEnd,
      cancelledAt: terminated ? endedAt : stripeDate(subscription.canceled_at),
      pausedAt: status === 'paused' ? (current?.stripeSubscriptionId === subscription.id ? current.pausedAt : null) ?? now : null,
      pauseExpiresAt: status === 'paused' ? (stripeDate(subscription.pause_collection?.resumes_at)
        ?? (current?.stripeSubscriptionId === subscription.id ? current.pauseExpiresAt : null)) : null,
      updatedAt: now,
    };
    await tx.save(state, current?.stripeSubscriptionId ?? null, current != null);
    return { synced: true, subscription, state };
  });
}

export type SubscriptionCheckoutDecision = { allowed: true } | { allowed: false; reason: 'complimentary_access' | 'existing_subscription' };
export function getSubscriptionCheckoutDecision(
  billing: UserSubscription | null,
  effective: SubscriptionEntitlementInput | null,
  now = new Date(),
): SubscriptionCheckoutDecision {
  if ((effective?.accessSource === 'platform_owner' || effective?.accessSource === 'complimentary_grant')
    && effective.isComplimentary === true && getEffectiveSubscriptionTier(effective, now) !== 'free') {
    return { allowed: false, reason: 'complimentary_access' };
  }
  return canReplaceBillingSubscription(billing, now) ? { allowed: true } : { allowed: false, reason: 'existing_subscription' };
}

/** Parent must also use Stripe checkout idempotency and reuse open sessions; no schema exists for a durable pending checkout lock. */
export function assertSubscriptionCheckoutAllowed(billing: UserSubscription | null, effective: SubscriptionEntitlementInput | null, now = new Date()): void {
  const decision = getSubscriptionCheckoutDecision(billing, effective, now);
  if (!decision.allowed) throw new Error(decision.reason === 'complimentary_access'
    ? 'Complimentary access does not require paid checkout'
    : 'An existing subscription must be managed or reconciled before starting another checkout');
}

/** Legacy writes remain supported, but serialize and reject conflicting Stripe identity. */
export async function persistSubscriptionPatch(data: SubscriptionWrite, repository?: SubscriptionRepository, expectedStripeSubscriptionId?: string): Promise<void> {
  if (!Number.isSafeInteger(data.userId) || data.userId < 1) throw new Error('Invalid subscription user identity');
  const repo = repository ?? await defaultRepository();
  await repo.withUserLock(data.userId, async tx => {
    const current = await tx.getCurrent();
    if (expectedStripeSubscriptionId !== undefined && current?.stripeSubscriptionId !== expectedStripeSubscriptionId) throw new Error('Subscription identity changed before persistence');
    if (data.stripeSubscriptionId != null && data.stripeSubscriptionId !== current?.stripeSubscriptionId
      && !canReplaceBillingSubscription(current)) throw new Error('Cannot replace an existing Stripe subscription');
    if (data.stripeSubscriptionId === null && current?.stripeSubscriptionId && !canReplaceBillingSubscription(current)) throw new Error('Cannot clear an existing Stripe subscription');
    if (data.status !== undefined && !['active', 'cancelled', 'past_due', 'trialing', 'paused'].includes(data.status)) throw new Error('Invalid persisted subscription status');
    if (data.tier !== undefined && !['free', 'starter', 'professional', 'enterprise'].includes(data.tier)) throw new Error('Invalid subscription tier');
    await tx.save(data, current?.stripeSubscriptionId ?? null, current != null);
  });
}
