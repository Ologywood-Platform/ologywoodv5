import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Fan Club security boundaries', () => {
  it('keeps members-only content protected and persists tier/category metadata', () => {
    const source = read('./routers/fanClub.ts');
    expect(source).toContain('requiredTierId: input.requiredTierId || null');
    expect(source).toContain('contentCategory: input.contentCategory || null');
    expect(source).toContain('membershipTierId !== null &&');
    expect(source).not.toContain("(post.visibility === 'members_only' && membershipTierId === null)");
    expect(source).toContain('membershipTierPrice >= (requiredTierPrices.get(post.requiredTierId) || 0)');
  });

  it('strictly bounds tier, membership, post, like, and comment inputs', () => {
    const source = read('./routers/fanClub.ts');
    expect(source).toContain('tierId: z.number().int().safe().positive()');
    expect(source).toContain('talentUserId: z.number().int().safe().positive()');
    expect(source).toContain('postId: z.number().int().safe().positive()');
    expect(source).toContain('postIds: z.array(z.number().int().safe().positive()).max(100)');
    expect(source).toContain('Parent comment does not belong to this post');
    expect(source).toContain('async function assertFanClubPostAccess');
  });

  it('prevents self-subscription and uses the resolved talent owner in Stripe metadata', () => {
    const source = read('./routers/fanClub.ts');
    expect(source).toContain("You cannot subscribe to your own Fan Club.");
    expect(source).toContain('if (!tier.stripePriceId)');
    expect(source).toContain('talentUserId: String(talentId)');
    expect(source).toContain('connectAccount.payoutsEnabled');
  });

  it('redacts Stripe failures and avoids exposing billing identifiers in public/member responses', () => {
    const source = read('./routers/fanClub.ts');
    expect(source).toContain("Failed to create billing tier', { kind: error instanceof Error ? error.name : 'UnknownError' }");
    expect(source).toContain('Unable to create this Fan Club tier right now.');
    expect(source).toContain("Subscription checkout creation failed', { kind: error instanceof Error ? error.name : 'UnknownError' }");
    expect(source).toContain('Unable to start Fan Club checkout. Please try again.');
    expect(source).toContain("Subscription cancellation failed', { kind: error instanceof Error ? error.name : 'UnknownError' }");
    expect(source).not.toContain('stripePriceId: fanClubTiers.stripePriceId');
    expect(source).not.toContain('stripeProductId: fanClubTiers.stripeProductId');
    expect(source).not.toContain('const members = await db.select().from(fanClubMemberships)');
  });
});
