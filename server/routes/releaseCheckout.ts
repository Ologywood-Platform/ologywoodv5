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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
    const { releaseId, customAmountCents } = req.body;

    if (!releaseId) {
      return res.status(400).json({ error: "releaseId is required" });
    }

    // Get the release
    const release = await db.getReleaseById(parseInt(releaseId));
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

    // Get the artist profile for the release
    const artistProfile = await db.getArtistProfileById(release.artistId);
    if (!artistProfile) {
      return res.status(404).json({ error: "Artist not found" });
    }

    // Determine the final price (support pay-what-you-want)
    let finalPriceCents = release.priceInCents;
    if (release.allowPayWhatYouWant && customAmountCents) {
      const customAmount = parseInt(customAmountCents);
      // Must be at least the base price and at least $0.50 (Stripe minimum)
      if (customAmount >= release.priceInCents && customAmount >= 50) {
        finalPriceCents = customAmount;
      }
    }

    // Calculate platform fee (1%, minimum 1 cent)
    const platformFeeCents = Math.max(1, Math.round(finalPriceCents * PLATFORM_FEE_PERCENT / 100));

    // Check if artist has a connected Stripe account
    const artistStripeAccountId = await getArtistStripeAccountId(artistProfile.userId);

    // Build the checkout session
    const origin = req.headers.origin || process.env.BASE_URL || "https://www.ologywood.com";

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
      metadata: {
        releaseId: release.id.toString(),
        artistId: release.artistId.toString(),
        artistUserId: artistProfile.userId.toString(),
        buyerUserId: user?.id?.toString() || "",
        buyerEmail: user?.email || "",
        buyerName: user?.name || "",
        type: "release_purchase",
        platformFeeCents: platformFeeCents.toString(),
        hasConnectAccount: artistStripeAccountId ? "true" : "false",
      },
      success_url: `${origin}/artist/${release.artistId}?purchase=success&release=${release.id}`,
      cancel_url: `${origin}/artist/${release.artistId}?purchase=cancelled`,
      allow_promotion_codes: true,
    };

    // Prefill customer email if authenticated
    if (user?.email) {
      sessionParams.customer_email = user.email;
    }

    // If artist has Stripe Connect, route payment to them with platform fee
    if (artistStripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: artistStripeAccountId,
        },
      };
      console.log(`[Release Checkout] Using Stripe Connect: ${artistStripeAccountId}, fee: ${platformFeeCents}c`);
    } else {
      console.log(`[Release Checkout] No Connect account for artist ${artistProfile.userId}, payment goes to platform`);
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[Release Checkout] Session created: ${session.id} for release ${release.id} ($${(finalPriceCents / 100).toFixed(2)})`);

    return res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("[Release Checkout] Error:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
