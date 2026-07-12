import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { getDb } from "../db";
import { fanClubTiers, fanClubMemberships, fanClubPosts, artistProfiles, stripeConnectAccounts } from "../../drizzle/schema";
import { stripe } from "../stripe";
import { ENV } from "../_core/env";

// Platform revenue share: 15% to Ologywood, 85% to talent
const PLATFORM_FEE_PERCENT = 15;

function getStripe() {
  if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe not configured' });
  return stripe;
}

// Helper: check if user is talent (artist role)
const talentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'artist' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Talent access required' });
  }
  return next({ ctx });
});

export const fanClubRouter = router({
  // ===== TIER MANAGEMENT (Talent Side) =====
  
  getMyTiers: talentProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const tiers = await db.select().from(fanClubTiers)
      .where(eq(fanClubTiers.artistUserId, ctx.user.id))
      .orderBy(asc(fanClubTiers.id));
    return tiers;
  }),

  createTier: talentProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      priceMonthly: z.number().min(100).max(100000), // $1 to $1000 in cents
      description: z.string().max(500).optional(),
      perks: z.array(z.string()).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Get artist profile for Stripe product name
      const [profile] = await db.select().from(artistProfiles)
        .where(eq(artistProfiles.userId, ctx.user.id));
      if (!profile) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
      }

      // Create Stripe Product + Price
      const s = getStripe();
      const product = await s.products.create({
        name: `${profile.artistName} - ${input.name} Fan Club`,
        metadata: { talentUserId: String(ctx.user.id), tierName: input.name },
      });

      const price = await s.prices.create({
        product: product.id,
        unit_amount: input.priceMonthly,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { talentUserId: String(ctx.user.id) },
      });

      // Get next sort order
      const existing = await db.select({ count: sql<number>`count(*)` }).from(fanClubTiers)
        .where(eq(fanClubTiers.artistUserId, ctx.user.id));
      const sortOrder = (existing[0]?.count || 0);

      const [tier] = await db.insert(fanClubTiers).values({
        artistUserId: ctx.user.id,
        name: input.name,
        priceCents: input.priceMonthly,
        perks: input.perks || [],
        stripePriceId: price.id,
        stripeProductId: product.id,
      }).$returningId();

      return { id: tier.id, stripePriceId: price.id };
    }),

  updateTier: talentProcedure
    .input(z.object({
      tierId: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      perks: z.array(z.string()).max(10).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [tier] = await db.select().from(fanClubTiers)
        .where(and(eq(fanClubTiers.id, input.tierId), eq(fanClubTiers.artistUserId, ctx.user.id)));
      if (!tier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tier not found' });
      }

      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.perks !== undefined) updates.perks = input.perks;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      await db.update(fanClubTiers).set(updates)
        .where(eq(fanClubTiers.id, input.tierId));

      return { success: true };
    }),

  deleteTier: talentProcedure
    .input(z.object({ tierId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [tier] = await db.select().from(fanClubTiers)
        .where(and(eq(fanClubTiers.id, input.tierId), eq(fanClubTiers.artistUserId, ctx.user.id)));
      if (!tier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tier not found' });
      }

      // Check if there are active members
      const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(fanClubMemberships)
        .where(and(eq(fanClubMemberships.tierId, input.tierId), eq(fanClubMemberships.status, 'active')));
      
      if (memberCount && Number(memberCount.count) > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete a tier with active members. Deactivate it instead.' });
      }

      // Archive the Stripe product
      if (tier.stripeProductId) {
        await getStripe().products.update(tier.stripeProductId, { active: false });
      }

      await db.delete(fanClubTiers).where(eq(fanClubTiers.id, input.tierId));
      return { success: true };
    }),

  // ===== MEMBERSHIP (Fan Side) =====

  getTalentTiers: publicProcedure
    .input(z.object({ talentUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const tiers = await db.select().from(fanClubTiers)
        .where(and(eq(fanClubTiers.artistUserId, input.talentUserId), eq(fanClubTiers.isActive, true)))
        .orderBy(asc(fanClubTiers.id));
      return tiers;
    }),

  getMyMembership: protectedProcedure
    .input(z.object({ talentUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [membership] = await db.select().from(fanClubMemberships)
        .where(and(
          eq(fanClubMemberships.fanUserId, ctx.user.id),
          eq(fanClubMemberships.artistUserId, input.talentUserId),
          eq(fanClubMemberships.status, 'active')
        ));
      return membership || null;
    }),

  subscribe: protectedProcedure
    .input(z.object({ tierId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [tier] = await db.select().from(fanClubTiers)
        .where(and(eq(fanClubTiers.id, input.tierId), eq(fanClubTiers.isActive, true)));
      if (!tier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tier not found or inactive' });
      }

      // Check if already subscribed to this talent
      const [existing] = await db.select().from(fanClubMemberships)
        .where(and(
          eq(fanClubMemberships.fanUserId, ctx.user.id),
          eq(fanClubMemberships.artistUserId, tier.artistUserId),
          eq(fanClubMemberships.status, 'active')
        ));
      if (existing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have an active membership with this talent' });
      }

      // Create Stripe Checkout Session for subscription with 85/15 revenue share
      const baseUrl = ENV.baseUrl || 'https://www.ologywood.com';
      const s = getStripe();

      // Look up talent's Stripe Connect account for direct payouts
      let connectAccountId: string | null = null;
      const [connectAccount] = await db.select().from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, tier.artistUserId));
      if (connectAccount && connectAccount.status === 'active' && connectAccount.chargesEnabled) {
        connectAccountId = connectAccount.stripeAccountId;
      }

      const sessionParams: any = {
        mode: 'subscription',
        line_items: [{ price: tier.stripePriceId!, quantity: 1 }],
        success_url: `${baseUrl}/fan-club/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/fan-club/cancelled`,
        metadata: {
          type: 'fan_club_subscription',
          fanUserId: String(ctx.user.id),
          talentUserId: String(tier.artistUserId),
          tierId: String(tier.id),
          platformFeePercent: String(PLATFORM_FEE_PERCENT),
        },
        subscription_data: {
          metadata: {
            type: 'fan_club_subscription',
            fanUserId: String(ctx.user.id),
            talentUserId: String(tier.artistUserId),
            tierId: String(tier.id),
          },
        },
      };

      // Route 85% to talent's connected Stripe account, 15% platform fee
      if (connectAccountId) {
        sessionParams.subscription_data.application_fee_percent = PLATFORM_FEE_PERCENT;
        sessionParams.subscription_data.transfer_data = { destination: connectAccountId };
        console.log(`[FanClub] Subscribe: routing to ${connectAccountId}, ${PLATFORM_FEE_PERCENT}% platform fee`);
      } else {
        // No Connect account — all revenue goes to platform until talent connects Stripe
        console.log(`[FanClub] Subscribe: No Connect account for talent ${tier.artistUserId}, revenue stays on platform`);
      }

      const session = await s.checkout.sessions.create(sessionParams);

      return { checkoutUrl: session.url };
    }),

  cancelMembership: protectedProcedure
    .input(z.object({ talentUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [membership] = await db.select().from(fanClubMemberships)
        .where(and(
          eq(fanClubMemberships.fanUserId, ctx.user.id),
          eq(fanClubMemberships.artistUserId, input.talentUserId),
          eq(fanClubMemberships.status, 'active')
        ));
      if (!membership) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active membership found' });
      }

      // Cancel Stripe subscription at period end
      if (membership.stripeSubscriptionId) {
        await getStripe().subscriptions.update(membership.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      await db.update(fanClubMemberships).set({
        status: 'cancelled',
        cancelledAt: new Date(),
      }).where(eq(fanClubMemberships.id, membership.id));

      return { success: true };
    }),

  getMemberCount: publicProcedure
    .input(z.object({ talentUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { count: 0 };
      const [result] = await db.select({ count: sql<number>`count(*)` }).from(fanClubMemberships)
        .where(and(
          eq(fanClubMemberships.artistUserId, input.talentUserId),
          eq(fanClubMemberships.status, 'active')
        ));
      return { count: Number(result?.count || 0) };
    }),

  getMyMembers: talentProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const members = await db.select().from(fanClubMemberships)
      .where(and(
        eq(fanClubMemberships.artistUserId, ctx.user.id),
        eq(fanClubMemberships.status, 'active')
      ))
      .orderBy(desc(fanClubMemberships.startedAt));
    return members;
  }),

  // ===== POSTS (Exclusive Content) =====

  createPost: talentProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().max(5000).optional(),
      mediaUrl: z.string().optional(),
      mediaType: z.enum(['image', 'video', 'audio', 'none']).default('none'),
      visibility: z.enum(['public', 'members_only']).default('members_only'),
      requiredTierId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // If tier_specific, validate the tier belongs to this talent
      if (input.visibility === 'members_only' && input.requiredTierId) {
        const [tier] = await db.select().from(fanClubTiers)
          .where(and(eq(fanClubTiers.id, input.requiredTierId), eq(fanClubTiers.artistUserId, ctx.user.id)));
        if (!tier) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid tier' });
        }
      }

      const [post] = await db.insert(fanClubPosts).values({
        artistUserId: ctx.user.id,
        title: input.title,
        content: input.content || "",
        mediaUrl: input.mediaUrl || null,
        visibility: input.visibility,
      }).$returningId();

      return { id: post.id };
    }),

  getMyPosts: talentProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
    const posts = await db.select().from(fanClubPosts)
      .where(eq(fanClubPosts.artistUserId, ctx.user.id))
      .orderBy(desc(fanClubPosts.createdAt));
    return posts;
  }),

  deletePost: talentProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [post] = await db.select().from(fanClubPosts)
        .where(and(eq(fanClubPosts.id, input.postId), eq(fanClubPosts.artistUserId, ctx.user.id)));
      if (!post) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }
      await db.delete(fanClubPosts).where(eq(fanClubPosts.id, input.postId));
      return { success: true };
    }),

  // Public feed for a talent's profile (respects visibility)
  getTalentFeed: publicProcedure
    .input(z.object({ talentUserId: z.number(), limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const posts = await db.select().from(fanClubPosts)
        .where(eq(fanClubPosts.artistUserId, input.talentUserId))
        .orderBy(desc(fanClubPosts.createdAt))
        .limit(input.limit);

      // Check if viewer has membership
      let membershipTierId: number | null = null;
      if (ctx.user) {
        const [membership] = await db.select().from(fanClubMemberships)
          .where(and(
            eq(fanClubMemberships.fanUserId, ctx.user.id),
            eq(fanClubMemberships.artistUserId, input.talentUserId),
            eq(fanClubMemberships.status, 'active')
          ));
        if (membership) {
          membershipTierId = membership.tierId;
        }
      }

      // Filter posts based on visibility and membership
      return posts.map((post: typeof fanClubPosts.$inferSelect) => {
        const canView = post.visibility === 'public' ||
          (post.visibility === 'members_only' && membershipTierId !== null) ||
          (post.visibility === 'members_only' && membershipTierId === null) ||
          (ctx.user && ctx.user.id === input.talentUserId); // talent can always see their own

        return {
          ...post,
          content: canView ? post.content : null,
          mediaUrl: canView ? post.mediaUrl : null,
          isLocked: !canView,
        };
      });
    }),
});
