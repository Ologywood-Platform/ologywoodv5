import { getDb } from "../db";
import { users, bookings, follows } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface ReferralReward {
  id: number;
  artistId: number;
  followerId: number;
  bookingId: number;
  creditsEarned: number;
  createdAt: Date;
}

interface ArtistRewardsStats {
  totalFollowers: number;
  totalBookingsFromFollowers: number;
  totalCreditsEarned: number;
  recentRewards: ReferralReward[];
}

const CREDITS_PER_BOOKING = 50; // Credits earned per booking from a follower

/**
 * Award referral credits when a follower books the artist
 * NOTE: This function is currently disabled as the users table does not have a 'credits' field.
 * To enable this, add a 'credits' column to the users table in the database schema.
 */
export async function awardReferralCredits(
  artistId: number,
  bookingId: number,
  followerId: number
): Promise<ReferralReward> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Verify that followerId is actually following the artist
  const followRecord = await database
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, artistId),
        eq(follows.followingType, "artist")
      )
    );

  if (followRecord.length === 0) {
    throw new Error("User is not following this artist");
  }

  // TODO: Award credits to artist once 'credits' field is added to users table
  // const artist = await database.select().from(users).where(eq(users.id, artistId));
  // if (artist.length === 0) throw new Error("Artist not found");
  //
  // const currentCredits = artist[0].credits || 0;
  // await database
  //   .update(users)
  //   .set({ credits: currentCredits + CREDITS_PER_BOOKING })
  //   .where(eq(users.id, artistId));

  // Log the reward (in a real app, you'd have a referralRewards table)
  return {
    id: Math.random(),
    artistId,
    followerId,
    bookingId,
    creditsEarned: CREDITS_PER_BOOKING,
    createdAt: new Date(),
  };
}

/**
 * Get referral rewards statistics for an artist
 */
export async function getArtistRewardsStats(artistId: number): Promise<ArtistRewardsStats> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get total followers
  const followers = await database
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followingId, artistId),
        eq(follows.followingType, "artist")
      )
    );

  // Get bookings from followers
  const followerIds = followers.map((f) => f.followerId);
  let bookingsFromFollowers = 0;
  let totalCreditsEarned = 0;

  if (followerIds.length > 0) {
    const bookingsData = await database
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.artistId, artistId),
          eq(bookings.status, "confirmed")
        )
      );

    // Count bookings from followers
    bookingsFromFollowers = bookingsData.filter((b) =>
      followerIds.includes(b.venueId)
    ).length;

    totalCreditsEarned = bookingsFromFollowers * CREDITS_PER_BOOKING;
  }

  // Get recent rewards (simulated - in real app, query referralRewards table)
  const recentRewards: ReferralReward[] = [];

  return {
    totalFollowers: followers.length,
    totalBookingsFromFollowers: bookingsFromFollowers,
    totalCreditsEarned,
    recentRewards,
  };
}

/**
 * Redeem credits for account credit
 * NOTE: This function is currently disabled as the users table does not have a 'credits' field.
 * To enable this, add a 'credits' column to the users table in the database schema.
 */
export async function redeemCredits(
  artistId: number,
  creditsToRedeem: number
): Promise<{ success: boolean; remainingCredits: number }> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // TODO: Implement credit redemption once 'credits' field is added to users table
  // const artist = await database.select().from(users).where(eq(users.id, artistId));
  // if (artist.length === 0) throw new Error("Artist not found");
  //
  // const currentCredits = artist[0].credits || 0;
  // if (currentCredits < creditsToRedeem) {
  //   throw new Error("Insufficient credits");
  // }
  //
  // const newCredits = currentCredits - creditsToRedeem;
  // await database
  //   .update(users)
  //   .set({ credits: newCredits })
  //   .where(eq(users.id, artistId));

  return {
    success: true,
    remainingCredits: 0,
  };
}

/**
 * Get artist's current credit balance
 * NOTE: This function is currently disabled as the users table does not have a 'credits' field.
 * To enable this, add a 'credits' column to the users table in the database schema.
 */
export async function getArtistCredits(artistId: number): Promise<number> {
  const database = await getDb();
  if (!database) return 0;

  // TODO: Return actual credits once 'credits' field is added to users table
  // const artist = await database.select().from(users).where(eq(users.id, artistId));
  // return artist.length > 0 ? artist[0].credits || 0 : 0;

  return 0;
}
