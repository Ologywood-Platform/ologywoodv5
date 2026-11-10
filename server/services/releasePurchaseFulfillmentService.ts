import type Stripe from 'stripe';
import { eq, sql } from 'drizzle-orm';
import { artistReleases, releasePurchases, type ArtistRelease, type InsertReleasePurchase, type ReleasePurchase } from '../../drizzle/schema';
import { getDb } from '../db';

type PurchaseDatabase = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export function validatePaidReleaseCheckout(
  session: Stripe.Checkout.Session,
  release: Pick<ArtistRelease, 'id' | 'artistId' | 'priceInCents' | 'currency' | 'allowPayWhatYouWant'>,
): boolean {
  const amount = session.amount_total;
  return session.payment_status === 'paid'
    && session.mode === 'payment'
    && Boolean(session.payment_intent)
    && /^cs_(?:test|live)_[A-Za-z0-9]+$/.test(session.id)
    && session.metadata?.type === 'release_purchase'
    && session.metadata.releaseId === String(release.id)
    && session.metadata.artistId === String(release.artistId)
    && Number.isSafeInteger(amount)
    && amount !== null
    && amount >= Math.max(50, release.priceInCents)
    && amount <= 10_000_000
    && session.currency?.toLowerCase() === (release.currency || 'usd').toLowerCase()
    && (Boolean(release.allowPayWhatYouWant) || amount === release.priceInCents);
}

/**
 * Every production release-fulfillment path takes the same release row lock.
 * Receipt creation and denormalized revenue counters commit together. Existing
 * historical receipts are preserved; this does not delete or rewrite them.
 */
export async function commitReleasePurchase(
  data: InsertReleasePurchase,
  databaseOverride?: PurchaseDatabase,
): Promise<{ purchase: ReleasePurchase; created: boolean }> {
  const database = databaseOverride || await getDb();
  if (!database) throw new Error('Purchase storage unavailable');
  return database.transaction(async (tx) => {
    const [release] = await tx.select({ id: artistReleases.id }).from(artistReleases)
      .where(eq(artistReleases.id, data.releaseId)).limit(1).for('update');
    if (!release) throw new Error('Release unavailable for purchase');
    const [existing] = await tx.select().from(releasePurchases)
      .where(eq(releasePurchases.stripeCheckoutSessionId, data.stripeCheckoutSessionId))
      .limit(1).for('update');
    if (existing) {
      if (existing.releaseId !== data.releaseId) throw new Error('Purchase identity mismatch');
      return { purchase: existing, created: false };
    }
    const result = await tx.insert(releasePurchases).values(data);
    const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Purchase insert not confirmed');
    await tx.update(artistReleases).set({
      totalSales: sql`${artistReleases.totalSales} + 1`,
      totalRevenueCents: sql`${artistReleases.totalRevenueCents} + ${data.amountPaidCents}`,
    }).where(eq(artistReleases.id, data.releaseId));
    const [purchase] = await tx.select().from(releasePurchases)
      .where(eq(releasePurchases.id, id)).limit(1);
    if (!purchase) throw new Error('Committed receipt unavailable');
    return { purchase, created: true };
  });
}
