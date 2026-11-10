import { getDefaultStripeApiKey } from '../services/stripeWebhookMode';
/**
 * Release Checkout Route — Express endpoint for creating Stripe Checkout sessions
 * for release purchases. Uses Stripe Connect to pay artists directly with 1% platform fee.
 */

import { Router, Request, Response } from "express";
import Stripe from "stripe";
import * as db from "../db";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";
import { stripeConnectAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { positiveRouteId } from './routeInput';
import { trustedCheckoutOrigin } from '../services/trustedOrigin';
import { createPurchaseFanEmailOptInMetadata } from '../services/purchaseFanEmailService';

const stripe = new Stripe(getDefaultStripeApiKey(), {
  apiVersion: "2025-12-15.clover",
});

const router = Router();

const PLATFORM_FEE_PERCENT = 1; // 1% platform fee

/**
 * Look up the artist's connected Stripe account ID
 */
async function getArtistStripeAccountId(artistUserId: number): Promise<string | null> {
  const dbInstance = await getDb();
  if (!dbInstance) return null;

  const accounts = await dbInstance
    .select()
    .from(stripeConnectAccounts)
    .where(eq(stripeConnectAccounts.artistId, artistUserId))
    .limit(1);

  if (!accounts.length) return null;
  const account = accounts[0];

  // Only return if the account is active and can receive charges
  if (account.status === 'active' && account.chargesEnabled) {
    return account.stripeAccountId;
  }

  return null;
}

/**
 * POST /api/release/checkout
 * Create a Stripe Checkout session for purchasing a release.
 * Supports both authenticated and guest purchases.
 * If artist has Stripe Connect, payment goes directly to them with platform fee.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }
    const allowedKeys = new Set(['releaseId', 'customAmountCents', 'buyerEmail', 'buyerName', 'fanEmailOptIn']);
    if (Object.keys(req.body).some((key) => !allowedKeys.has(key))) {
      return res.status(400).json({ error: 'Unknown release checkout field' });
    }
    const { releaseId, customAmountCents, buyerEmail: rawBuyerEmail, buyerName: rawBuyerName, fanEmailOptIn } = req.body;
    if (fanEmailOptIn !== undefined && typeof fanEmailOptIn !== 'boolean') {
      return res.status(400).json({ error: 'fanEmailOptIn must be a boolean' });
    }

    if (rawBuyerEmail !== undefined && (typeof rawBuyerEmail !== 'string' || rawBuyerEmail.trim().length > 320)) {
      return res.status(400).json({ error: 'buyerEmail must be a valid email address' });
    }
    if (rawBuyerName !== undefined && (typeof rawBuyerName !== 'string' || rawBuyerName.trim().length > 255)) {
      return res.status(400).json({ error: 'buyerName must be a text value' });
    }
    const buyerEmail = typeof rawBuyerEmail === 'string' ? rawBuyerEmail.trim().toLowerCase() : undefined;
    if (buyerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return res.status(400).json({ error: 'buyerEmail must be a valid email address' });
    }
    const buyerName = typeof rawBuyerName === 'string' ? rawBuyerName.trim() : undefined;

    const parsedReleaseId = positiveRouteId(releaseId);
    if (parsedReleaseId === null) {
      return res.status(400).json({ error: "releaseId must be a positive integer" });
    }

    // Get the release
    const release = await db.getReleaseById(parsedReleaseId);
    if (!release) {
      return res.status(404).json({ error: "Release not found" });
    }

    if (release.status !== "published") {
      return res.status(400).json({ error: "This release is not available for purchase" });
    }

    // Try to authenticate (optional — guest purchases allowed)
    let user = null;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      // Guest purchase — no user
    }

    if (!user && !buyerEmail) {
      return res.status(400).json({ error: 'Enter your email to continue as a guest' });
    }

    // Get the artist profile for the release
    const artistProfile = await db.getArtistProfileById(release.artistId);
    if (!artistProfile) {
      return res.status(404).json({ error: "Artist not found" });
    }

    // Determine the final price (support pay-what-you-want)
    let finalPriceCents = release.priceInCents;
    if (customAmountCents !== undefined && customAmountCents !== null && customAmountCents !== '') {
      const amountText = typeof customAmountCents === 'number' ? String(customAmountCents) : customAmountCents;
      if (typeof amountText !== 'string' || !/^[1-9]\d*$/.test(amountText)) {
        return res.status(400).json({ error: "customAmountCents must be a positive integer" });
      }
      const customAmount = Number(amountText);
      // Must be at least the base price and at least $0.50 (Stripe minimum), within safe integer bounds.
      if (!Number.isSafeInteger(customAmount) || customAmount < release.priceInCents || customAmount < 50 || customAmount > 10_000_000) {
        return res.status(400).json({ error: "customAmountCents is outside the allowed range" });
      }
      if (!release.allowPayWhatYouWant) {
        return res.status(400).json({ error: "This release does not allow custom pricing" });
      }
      finalPriceCents = customAmount;
    }

    // Calculate platform fee (1%, minimum 1 cent)
    const platformFeeCents = Math.max(1, Math.round(finalPriceCents * PLATFORM_FEE_PERCENT / 100));

    // Check if artist has a connected Stripe account
    const artistStripeAccountId = await getArtistStripeAccountId(artistProfile.userId);

    // Build the checkout session
    const origin = trustedCheckoutOrigin(process.env.BASE_URL, req.headers.origin);
    const fanEmailMetadata = await createPurchaseFanEmailOptInMetadata({
      creatorUserId: artistProfile.userId,
      buyerUserId: user?.id,
      optIn: fanEmailOptIn === true,
    });
    const purchaseMetadata: Record<string, string> = {
      releaseId: release.id.toString(),
      artistId: release.artistId.toString(),
      artistUserId: artistProfile.userId.toString(),
      buyerUserId: user?.id?.toString() || "",
      buyerEmail: user?.email || buyerEmail || "",
      buyerName: user?.name || buyerName || "",
      ...fanEmailMetadata,
      type: "release_purchase",
      amountCents: finalPriceCents.toString(),
      currency: release.currency || "usd",
      source: "release_checkout",
      platformFeeCents: platformFeeCents.toString(),
      hasConnectAccount: artistStripeAccountId ? "true" : "false",
    };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: release.currency || "usd",
            product_data: {
              name: release.title,
              description: `Single by ${artistProfile.artistName}`,
            },
            unit_amount: finalPriceCents,
          },
          quantity: 1,
        },
      ],
      metadata: purchaseMetadata,
      payment_intent_data: { metadata: purchaseMetadata },
      success_url: `${origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/artist/${release.artistId}?purchase=cancelled`,
      allow_promotion_codes: true,
    };

    // Prefill customer email if authenticated
    if (user?.email) {
      sessionParams.customer_email = user.email;
    } else if (buyerEmail) {
      sessionParams.customer_email = buyerEmail;
    }

    // If artist has Stripe Connect, route payment to them with platform fee
    if (artistStripeAccountId) {
      sessionParams.payment_intent_data = {
        metadata: purchaseMetadata,
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: artistStripeAccountId,
        },
      };
      console.log(`[Release Checkout] Using Stripe Connect with platform fee ${platformFeeCents}c`);
    } else {
      console.log('[Release Checkout] No active Connect account; payment goes to platform');
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[Release Checkout] Session created for release purchase ($${(finalPriceCents / 100).toFixed(2)})`);

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("[Release Checkout] Error:", error instanceof Error ? error.name : 'UnknownError');
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
