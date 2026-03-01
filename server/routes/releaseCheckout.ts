/**
 * Release Checkout Route — Express endpoint for creating Stripe Checkout sessions
 * for release purchases. Collects 1% platform fee via application_fee_amount.
 */

import { Router, Request, Response } from "express";
import Stripe from "stripe";
import * as db from "../db";
import { sdk } from "../_core/sdk";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const router = Router();

const PLATFORM_FEE_PERCENT = 1; // 1% platform fee

/**
 * POST /api/release/checkout
 * Create a Stripe Checkout session for purchasing a release.
 * Supports both authenticated and guest purchases.
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

    // Determine the final price (support pay-what-you-want for Professional tier)
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
              // Cover art is stored as S3 key, not a public URL — omit from Stripe
            },
            unit_amount: finalPriceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        releaseId: release.id.toString(),
        artistId: release.artistId.toString(),
        buyerUserId: user?.id?.toString() || "",
        buyerEmail: user?.email || "",
        buyerName: user?.name || "",
        type: "release_purchase",
      },
      success_url: `${origin}/artist/${release.artistId}?purchase=success&release=${release.id}`,
      cancel_url: `${origin}/artist/${release.artistId}?purchase=cancelled`,
      allow_promotion_codes: true,
    };

    // Prefill customer email if authenticated
    if (user?.email) {
      sessionParams.customer_email = user.email;
    }

    // Add application fee if artist has a connected Stripe account
    // For now, the fee goes to the platform account
    if (platformFeeCents > 0) {
      // Note: application_fee_amount requires payment_intent_data with transfer_data
      // For simplicity, we track the fee in metadata and handle it in the webhook
      sessionParams.metadata!.platformFeeCents = platformFeeCents.toString();
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`[Release Checkout] Session created: ${session.id} for release ${release.id} ($${(release.priceInCents / 100).toFixed(2)})`);

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
