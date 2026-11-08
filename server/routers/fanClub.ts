import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { fanClubTiers, fanClubMemberships, fanClubPosts, artistProfiles, stripeConnectAccounts, fanClubPostLikes, fanClubPostComments } from "../../drizzle/schema";
import { stripe } from "../stripe";
import { ENV } from "../_core/env";
import { FAN_CLUB_PLATFORM_FEE_PERCENT } from "../../shared/platformFees";

// Fan Club revenue share: 10% to Ologywood, 90% to talent.
const PLATFORM_FEE_PERCENT = FAN_CLUB_PLATFORM_FEE_PERCENT;

function getStripe() {
  if (!stripe) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe not configured' });
  return stripe;
}

async function assertFanClubPostAccess(db: any, postId: number, viewerId?: number) {
  const [post] = await db.select().from(fanClubPosts).where(eq(fanClubPosts.id, postId)).limit(1);
  if (!post) throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
  if (post.visibility === 'public' || viewerId === post.artistUserId) return post;
  if (!viewerId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Fan Club membership required' });

  const [membership] = await db.select().from(fanClubMemberships).where(and(
    eq(fanClubMemberships.fanUserId, viewerId),
    eq(fanClubMemberships.artistUserId, post.artistUserId),
    eq(fanClubMemberships.status, 'active'),
  )).limit(1);
  if (!membership) throw new TRPCError({ code: 'FORBIDDEN', message: 'Fan Club membership required' });
  if (!post.requiredTierId) return post;

  const [memberTier] = await db.select({ priceCents: fanClubTiers.priceCents, priceMonthly: fanClubTiers.priceMonthly })
    .from(fanClubTiers).where(eq(fanClubTiers.id, membership.tierId)).limit(1);
  const [requiredTier] = await db.select({ priceCents: fanClubTiers.priceCents, priceMonthly: fanClubTiers.priceMonthly })
    .from(fanClubTiers).where(and(eq(fanClubTiers.id, post.requiredTierId), eq(fanClubTiers.artistUserId, post.artistUserId))).limit(1);
  const memberPrice = Number(memberTier?.priceCents ?? memberTier?.priceMonthly ?? 0);
  const requiredPrice = Number(requiredTier?.priceCents ?? requiredTier?.priceMonthly ?? 0);
  if (!requiredTier || memberPrice < requiredPrice) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'A higher Fan Club tier is required for this post' });
  }
  return post;
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
      name: z.string().trim().min(1).max(100),
      priceMonthly: z.number().int().min(100).max(100000), // $1 to $1000 in cents
      description: z.string().trim().max(500).optional(),
      perks: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
    }).strict())
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
        talentUserId: ctx.user.id,
        artistUserId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        priceMonthly: input.priceMonthly,
        priceCents: input.priceMonthly,
        perks: input.perks || [],
        stripePriceId: price.id,
        stripeProductId: product.id,
        sortOrder,
      }).$returningId();

      return { id: tier.id, stripePriceId: price.id };
    }),

  updateTier: talentProcedure
    .input(z.object({
      tierId: z.number().int().safe().positive(),
      name: z.string().trim().min(1).max(100).optional(),
      description: z.string().trim().max(500).optional(),
      perks: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
      isActive: z.boolean().optional(),
    }).strict())
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
    .input(z.object({ tierId: z.number().int().safe().positive() }).strict())
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
    .input(z.object({ talentUserId: z.number().int().safe().positive() }).strict())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const tiers = await db.select().from(fanClubTiers)
        .where(and(eq(fanClubTiers.artistUserId, input.talentUserId), eq(fanClubTiers.isActive, true)))
        .orderBy(asc(fanClubTiers.id));
      return tiers;
    }),

  getDiscoverableClubs: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: fanClubTiers.id,
      talentUserId: fanClubTiers.talentUserId,
      name: fanClubTiers.name,
      priceMonthly: fanClubTiers.priceMonthly,
      priceCents: fanClubTiers.priceCents,
      artistName: artistProfiles.artistName,
      profilePhotoUrl: artistProfiles.profilePhotoUrl,
    })
      .from(fanClubTiers)
      .leftJoin(artistProfiles, eq(artistProfiles.userId, fanClubTiers.talentUserId))
      .where(eq(fanClubTiers.isActive, true))
      .orderBy(asc(fanClubTiers.talentUserId), asc(fanClubTiers.priceCents));
  }),

  getMyMembership: protectedProcedure
    .input(z.object({ talentUserId: z.number().int().safe().positive() }).strict())
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

  listMyMemberships: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

    return db.select({
      id: fanClubMemberships.id,
      talentUserId: fanClubMemberships.talentUserId,
      tierId: fanClubMemberships.tierId,
      tierName: fanClubTiers.name,
      status: fanClubMemberships.status,
      startedAt: fanClubMemberships.startedAt,
      currentPeriodEnd: fanClubMemberships.currentPeriodEnd,
    })
      .from(fanClubMemberships)
      .leftJoin(fanClubTiers, eq(fanClubMemberships.tierId, fanClubTiers.id))
      .where(eq(fanClubMemberships.fanUserId, ctx.user.id))
      .orderBy(desc(fanClubMemberships.startedAt))
      .limit(50);
  }),

  subscribe: protectedProcedure
    .input(z.object({ tierId: z.number().int().safe().positive() }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [tier] = await db.select().from(fanClubTiers)
        .where(and(eq(fanClubTiers.id, input.tierId), eq(fanClubTiers.isActive, true)));
      if (!tier) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tier not found or inactive' });
      }

      // Check if already subscribed to this talent
      const talentId = tier.artistUserId ?? tier.talentUserId;
      if (!talentId || talentId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot subscribe to your own Fan Club.' });
      }
      if (!tier.stripePriceId) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'This Fan Club tier is not ready for subscriptions yet.' });
      }
      const [existing] = await db.select().from(fanClubMemberships)
        .where(and(
          eq(fanClubMemberships.fanUserId, ctx.user.id),
          eq(fanClubMemberships.talentUserId, talentId),
          eq(fanClubMemberships.status, 'active')
        ));
      if (existing) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have an active membership with this talent' });
      }

      // Create Stripe Checkout Session for subscription with 90/10 revenue share
      const baseUrl = ENV.baseUrl || 'https://www.ologywood.com';
      const s = getStripe();

      // Look up talent's Stripe Connect account for direct payouts
      let connectAccountId: string | null = null;
      const [connectAccount] = await db.select().from(stripeConnectAccounts)
        .where(eq(stripeConnectAccounts.artistId, talentId));
      if (connectAccount && connectAccount.status === 'active' && connectAccount.chargesEnabled && connectAccount.payoutsEnabled) {
        connectAccountId = connectAccount.stripeAccountId;
      }

      const sessionParams: any = {
        mode: 'subscription',
        line_items: [{ price: tier.stripePriceId, quantity: 1 }],
        success_url: `${baseUrl}/fan-club/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/fan-club/cancelled`,
        metadata: {
          type: 'fan_club_subscription',
          fanUserId: String(ctx.user.id),
          talentUserId: String(talentId),
          tierId: String(tier.id),
          platformFeePercent: String(PLATFORM_FEE_PERCENT),
        },
        subscription_data: {
          metadata: {
            type: 'fan_club_subscription',
            fanUserId: String(ctx.user.id),
            talentUserId: String(talentId),
            tierId: String(tier.id),
          },
        },
      };

      // Route 90% to talent's connected Stripe account, 10% platform fee
      if (connectAccountId) {
        sessionParams.subscription_data.application_fee_percent = PLATFORM_FEE_PERCENT;
        sessionParams.subscription_data.transfer_data = { destination: connectAccountId };
        console.log(`[FanClub] Subscribe: routing to ${connectAccountId}, ${PLATFORM_FEE_PERCENT}% platform fee`);
      } else {
        // No Connect account — all revenue goes to platform until talent connects Stripe
        console.log(`[FanClub] Subscribe: No Connect account for talent ${talentId}, revenue stays on platform`);
      }

      const session = await s.checkout.sessions.create(sessionParams);

      return { checkoutUrl: session.url };
    }),

  cancelMembership: protectedProcedure
    .input(z.object({ talentUserId: z.number().int().safe().positive() }).strict())
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

      // Stripe cancels at the end of the current period. Keep the local
      // membership active so the fan retains access until the paid period
      // ends; the subscription.deleted webhook will mark it cancelled.
      await db.update(fanClubMemberships).set({
        cancelledAt: membership.cancelledAt || new Date(),
      }).where(eq(fanClubMemberships.id, membership.id));

      return { success: true, currentPeriodEnd: membership.currentPeriodEnd };
    }),

  getMemberCount: publicProcedure
    .input(z.object({ talentUserId: z.number().int().safe().positive() }).strict())
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
      title: z.string().trim().min(1).max(255),
      content: z.string().max(5000).optional(),
      mediaUrl: z.string().url().max(2048).optional().or(z.literal("")),
      mediaType: z.enum(['image', 'video', 'audio', 'none']).default('none'),
      visibility: z.enum(['public', 'members_only']).default('members_only'),
      requiredTierId: z.number().int().safe().positive().optional(),
      contentCategory: z.string().trim().max(50).optional(),
    }).strict())
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
        talentUserId: ctx.user.id,
        artistUserId: ctx.user.id,
        title: input.title,
        content: input.content || "",
        mediaUrl: input.mediaUrl || null,
        visibility: input.visibility,
        requiredTierId: input.requiredTierId || null,
        contentCategory: input.contentCategory || null,
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
    .input(z.object({ postId: z.number().int().safe().positive() }).strict())
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
    .input(z.object({ talentUserId: z.number().int().safe().positive(), limit: z.number().int().min(1).max(50).default(20) }).strict())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const posts = await db.select().from(fanClubPosts)
        .where(eq(fanClubPosts.artistUserId, input.talentUserId))
        .orderBy(desc(fanClubPosts.createdAt))
        .limit(input.limit);

      // Check if viewer has membership
      let membershipTierId: number | null = null;
      let membershipTierPrice = 0;
      if (ctx.user) {
        const [membership] = await db.select().from(fanClubMemberships)
          .where(and(
            eq(fanClubMemberships.fanUserId, ctx.user.id),
            eq(fanClubMemberships.artistUserId, input.talentUserId),
            eq(fanClubMemberships.status, 'active')
          ));
        if (membership) {
          membershipTierId = membership.tierId;
          const [membershipTier] = await db.select({ priceCents: fanClubTiers.priceCents, priceMonthly: fanClubTiers.priceMonthly })
            .from(fanClubTiers)
            .where(and(eq(fanClubTiers.id, membership.tierId), eq(fanClubTiers.artistUserId, input.talentUserId)))
            .limit(1);
          membershipTierPrice = Number(membershipTier?.priceCents ?? membershipTier?.priceMonthly ?? 0);
        }
      }

      const requiredTierIds = [...new Set(posts.map((post) => post.requiredTierId).filter((id): id is number => id !== null))];
      const requiredTiers = requiredTierIds.length > 0
        ? await db.select({ id: fanClubTiers.id, priceCents: fanClubTiers.priceCents, priceMonthly: fanClubTiers.priceMonthly })
          .from(fanClubTiers)
          .where(and(eq(fanClubTiers.artistUserId, input.talentUserId), inArray(fanClubTiers.id, requiredTierIds)))
        : [];
      const requiredTierPrices = new Map(requiredTiers.map((tier) => [tier.id, Number(tier.priceCents ?? tier.priceMonthly ?? 0)]));

      // Filter posts based on visibility and membership
      return posts.map((post: typeof fanClubPosts.$inferSelect) => {
        const canView = post.visibility === 'public' ||
          (post.visibility === 'members_only' && membershipTierId !== null &&
            (!post.requiredTierId || (requiredTierPrices.has(post.requiredTierId) && membershipTierPrice >= (requiredTierPrices.get(post.requiredTierId) || 0)))) ||
          (ctx.user && ctx.user.id === input.talentUserId); // talent can always see their own

        return {
          ...post,
          content: canView ? post.content : null,
          mediaUrl: canView ? post.mediaUrl : null,
          isLocked: !canView,
        };
      });
    }),

  // Like a post
  likePost: protectedProcedure
    .input(z.object({ postId: z.number().int().safe().positive() }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await assertFanClubPostAccess(db, input.postId, ctx.user.id);
      // Check if already liked
      const existing = await db.select().from(fanClubPostLikes)
        .where(and(eq(fanClubPostLikes.postId, input.postId), eq(fanClubPostLikes.userId, ctx.user.id)))
        .limit(1);
      if (existing.length > 0) {
        // Unlike
        await db.delete(fanClubPostLikes)
          .where(and(eq(fanClubPostLikes.postId, input.postId), eq(fanClubPostLikes.userId, ctx.user.id)));
        return { liked: false };
      }
      await db.insert(fanClubPostLikes).values({ postId: input.postId, userId: ctx.user.id });
      return { liked: true };
    }),

  // Get likes for posts
  getPostLikes: publicProcedure
    .input(z.object({ postIds: z.array(z.number().int().safe().positive()).max(100).refine((ids) => new Set(ids).size === ids.length, 'Duplicate post IDs are not allowed') }).strict())
    .query(async ({ ctx, input }) => {
      if (input.postIds.length === 0) return {};
      const db = (await getDb())!;
      const likes = await db.select({
        postId: fanClubPostLikes.postId,
        count: sql<number>`COUNT(*)`,
      }).from(fanClubPostLikes)
        .where(inArray(fanClubPostLikes.postId, input.postIds))
        .groupBy(fanClubPostLikes.postId);

      const userLikes = ctx.user ? await db.select({ postId: fanClubPostLikes.postId })
        .from(fanClubPostLikes)
        .where(and(
          inArray(fanClubPostLikes.postId, input.postIds),
          eq(fanClubPostLikes.userId, ctx.user.id)
        )) : [];

      const result: Record<number, { count: number; liked: boolean }> = {};
      for (const id of input.postIds) {
        const likeEntry = likes.find((l: any) => l.postId === id);
        result[id] = {
          count: likeEntry ? Number(likeEntry.count) : 0,
          liked: userLikes.some((l: any) => l.postId === id),
        };
      }
      return result;
    }),

  // Add comment to a post
  addComment: protectedProcedure
    .input(z.object({ postId: z.number().int().safe().positive(), content: z.string().trim().min(1).max(500), parentId: z.number().int().safe().positive().optional() }).strict())
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await assertFanClubPostAccess(db, input.postId, ctx.user.id);
      if (input.parentId) {
        const [parent] = await db.select({ id: fanClubPostComments.id }).from(fanClubPostComments)
          .where(and(eq(fanClubPostComments.id, input.parentId), eq(fanClubPostComments.postId, input.postId))).limit(1);
        if (!parent) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Parent comment does not belong to this post' });
      }
      const [result] = await db.insert(fanClubPostComments).values({
        postId: input.postId,
        userId: ctx.user.id,
        userName: ctx.user.name || ctx.user.email || 'Anonymous',
        content: input.content,
        parentId: input.parentId || null,
      });
      return { id: result.insertId };
    }),

  // Get comments for a post
  getPostComments: publicProcedure
    .input(z.object({ postId: z.number().int().safe().positive() }).strict())
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await assertFanClubPostAccess(db, input.postId, ctx.user?.id);
      return await db.select().from(fanClubPostComments)
        .where(eq(fanClubPostComments.postId, input.postId))
        .orderBy(desc(fanClubPostComments.createdAt))
        .limit(50);
    }),
});
