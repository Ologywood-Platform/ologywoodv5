import type Stripe from 'stripe';
import { capturePurchaseFanEmailOptIn } from './purchaseFanEmailService';

/** Undefined/unpaid checkout state is never evidence of a completed payment. */
export function hasVerifiedCheckoutPayment(session: Stripe.Checkout.Session): boolean {
  return session.payment_status === 'paid'
    || (session.payment_status === 'no_payment_required'
      && session.amount_total === 0
      && session.metadata?.type === 'ticket_purchase');
}

/** The entire optional creator lookup and consent write is noncritical after commit. */
export async function captureCheckoutFanEmailBestEffort(
  session: Pick<Stripe.Checkout.Session, 'metadata'>,
  input: {
    buyerUserId: number | null;
    purchaseId: string;
    resolveCreatorUserId: () => Promise<number | null>;
  },
): Promise<void> {
  if (session.metadata?.fanEmailOptIn !== 'true' || !input.buyerUserId) return;
  try {
    const creatorUserId = await input.resolveCreatorUserId();
    await capturePurchaseFanEmailOptIn({
      creatorUserId,
      buyerUserId: input.buyerUserId,
      optIn: true,
      metadata: session.metadata,
      purchaseId: input.purchaseId,
    });
  } catch (error) {
    // A failed optional relationship lookup must not suppress a receipt or
    // turn a durable paid purchase into a verification error.
    console.warn('[Purchase Fan Email] Optional capture unavailable', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
  }
}

/** Receipt links must contain the real capability, not a synthetic PI marker. */
export function getRealCheckoutSessionId(
  storedSessionId: string | null | undefined,
  eventSessionId: string,
): string | null {
  const valid = (id: string | null | undefined): id is string =>
    typeof id === 'string' && /^cs_(?:test|live)_[A-Za-z0-9]+$/.test(id);
  if (valid(storedSessionId)) return storedSessionId;
  return valid(eventSessionId) ? eventSessionId : null;
}
