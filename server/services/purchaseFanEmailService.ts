import {
  applyPurchaseFanEmailConsentSnapshot,
  createPurchaseFanEmailConsentSnapshot,
} from './fanEmailConsentService';

export type PurchaseFanEmailMetadataInput = {
  creatorUserId: number | null | undefined;
  buyerUserId: number | null | undefined;
  optIn: boolean;
  /** Durable order identity, available before Stripe creation for merch/tickets. */
  purchaseId?: string;
};

export type PurchaseFanEmailCaptureInput = PurchaseFanEmailMetadataInput & {
  /** Only metadata from the trusted, paid Stripe fulfillment source. */
  metadata?: Record<string, string> | null;
};

function ineligibleReason(input: PurchaseFanEmailMetadataInput): string | null {
  if (input.optIn !== true) return 'not_requested';
  if (!Number.isSafeInteger(input.creatorUserId) || Number(input.creatorUserId) < 1) return 'creator_not_eligible';
  if (!Number.isSafeInteger(input.buyerUserId) || Number(input.buyerUserId) < 1) return 'buyer_not_authenticated';
  if (input.creatorUserId === input.buyerUserId) return 'self_purchase';
  return null;
}

/**
 * Optional checkout work: an outage or ineligible identity safely disables only
 * marketing, never a purchase. No grant/follow occurs until paid fulfillment.
 * Copy this exact object into both Checkout and PaymentIntent metadata.
 */
export async function createPurchaseFanEmailOptInMetadata(
  input: PurchaseFanEmailMetadataInput,
): Promise<Record<string, string>> {
  if (ineligibleReason(input)) return { fanEmailOptIn: 'false' };
  try {
    const token = await createPurchaseFanEmailConsentSnapshot(
      input.buyerUserId as number, input.creatorUserId as number, input.purchaseId,
    );
    return { fanEmailOptIn: 'true', fanEmailConsentToken: token };
  } catch (error) {
    console.warn('[Purchase Fan Email] Checkout snapshot skipped:', { kind: error instanceof Error ? error.name : 'UnknownError' });
    return { fanEmailOptIn: 'false' };
  }
}

/**
 * Best-effort AFTER paid financial fulfillment. Snapshot verification and all
 * consent/follow mutations share the recipient lock. Missing legacy snapshots,
 * stale revisions, changed addresses/disclosures and replays fail closed.
 * Creator/buyer identities must come from the durable purchase, not request data.
 */
export async function capturePurchaseFanEmailOptIn(
  input: PurchaseFanEmailCaptureInput,
): Promise<{ captured: boolean; reason?: string }> {
  const reason = ineligibleReason(input);
  if (reason) return { captured: false, reason };
  if (input.metadata?.fanEmailOptIn !== 'true' || !input.metadata.fanEmailConsentToken || !input.purchaseId) {
    return { captured: false, reason: 'missing_snapshot' };
  }
  try {
    return await applyPurchaseFanEmailConsentSnapshot({
      token: input.metadata.fanEmailConsentToken,
      followerUserId: input.buyerUserId as number,
      creatorUserId: input.creatorUserId as number,
      purchaseId: input.purchaseId,
    });
  } catch (error) {
    console.warn('[Purchase Fan Email] Opt-in capture skipped:', { kind: error instanceof Error ? error.name : 'UnknownError' });
    return { captured: false, reason: 'consent_unavailable' };
  }
}
