import { followUser } from './followService';
import { getFanEmailConsent, setFanEmailConsent } from './fanEmailConsentService';

export type PurchaseFanEmailCaptureInput = {
  creatorUserId: number | null | undefined;
  buyerUserId: number | null | undefined;
  optIn: boolean;
};

/**
 * Capture a purchaser in the existing consented fan list only after payment has
 * been verified. This intentionally does not create anonymous mailing-list
 * records: guest checkout remains account-free, and email permission remains
 * tied to a verified user who can manage or revoke it.
 *
 * The helper is best-effort after financial fulfillment. A missing/invalid
 * identity, an unverified email, a global preference block, or a transient
 * consent-store failure never rolls back a paid order or makes Stripe retry it.
 */
export async function capturePurchaseFanEmailOptIn(
  input: PurchaseFanEmailCaptureInput,
): Promise<{ captured: boolean; reason?: string }> {
  const creatorUserId = Number(input.creatorUserId);
  const buyerUserId = Number(input.buyerUserId);
  if (!input.optIn) return { captured: false, reason: 'not_requested' };
  if (!Number.isSafeInteger(creatorUserId) || creatorUserId < 1) {
    return { captured: false, reason: 'creator_not_eligible' };
  }
  if (!Number.isSafeInteger(buyerUserId) || buyerUserId < 1) {
    return { captured: false, reason: 'buyer_not_authenticated' };
  }
  if (creatorUserId === buyerUserId) {
    return { captured: false, reason: 'self_purchase' };
  }

  try {
    // Following and email permission remain separate concepts in the existing
    // model. The purchase checkbox authorizes both actions for this creator.
    await followUser(buyerUserId, creatorUserId, 'artist');
    const current = await getFanEmailConsent(buyerUserId, creatorUserId);
    if (current.optedIn) return { captured: true };

    const next = await setFanEmailConsent(buyerUserId, creatorUserId, {
      optIn: true,
      expectedRevision: current.revision,
    });
    return next.optedIn
      ? { captured: true }
      : { captured: false, reason: 'consent_not_granted' };
  } catch (error) {
    // Paid fulfillment must remain durable even if the optional email-list
    // write is unavailable or the user has not verified their email yet.
    console.warn('[Purchase Fan Email] Opt-in capture skipped:', error instanceof Error ? error.message : 'unknown error');
    return { captured: false, reason: 'consent_unavailable' };
  }
}
