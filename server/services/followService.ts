/**
 * Follow Service
 * Handles all follow/unfollow operations, recommendations, and community features
 */

import { drizzle } from "drizzle-orm/mysql2";
import { follows, users, artistProfiles, venueProfiles } from "../../drizzle/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { getDb } from "../db";

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface FollowedUser {
  id: number;
  name: string;
  email: string;
  role: "artist" | "venue";
  followingType: "artist" | "venue";
  followedAt: Date;
  profileId?: number; // artist_profiles.id or venue_profiles.id for navigation
  profilePhotoUrl?: string | null;
}

export interface FollowRecommendation {
  id: number;
  name: string;
  email: string;
  role: "artist" | "venue";
  followingType: "artist" | "venue";
  mutualFollowers: number;
  reason: string;
}

/**
 * Follow a user (artist or venue)
 */
export async function followUser(
  followerId: number,
  followingId: number,
  followingType: "artist" | "venue"
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Prevent self-following
    if (followerId === followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Check if already following
    const existing = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
          eq(follows.followingType, followingType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return false; // Already following
    }

    // Create follow relationship
    await db.insert(follows).values({
      followerId,
      followingId,
      followingType,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  followerId: number,
  followingId: number,
  followingType: "artist" | "venue"
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if follow exists before deleting
    const existing = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
          eq(follows.followingType, followingType)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return false;
    }

    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId),
          eq(follows.followingType, followingType)
        )
      );

    return true;
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
}

/**
 * Get follow statistics for a user
 */
export async function getFollowStats(
  userId: number,
  currentUserId?: number
): Promise<FollowStats> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get followers count (people following this user)
    const followersResult = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));

    // Get following count (people this user follows)
    const followingResult = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const followRelation = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, currentUserId),
            eq(follows.followingId, userId)
          )
        )
        .limit(1);
      isFollowing = followRelation.length > 0;
    }

    return {
      followersCount: followersResult.length,
      followingCount: followingResult.length,
      isFollowing,
    };
  } catch (error) {
    console.error("Error getting follow stats:", error);
    throw error;
  }
}

/**
 * Get list of users that a user is following
 */
export async function getFollowing(
  userId: number,
  limit_: number = 50,
  offset: number = 0
): Promise<FollowedUser[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const followingRelations = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId))
      .limit(limit_)
      .offset(offset);

    const followedUsers: FollowedUser[] = [];

    for (const relation of followingRelations) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, relation.followingId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        let profileId: number | undefined;
        let profilePhotoUrl: string | null | undefined;

        // Resolve the actual profile ID for navigation
        if (relation.followingType === 'artist') {
          const artistProfile = await db
            .select({ id: artistProfiles.id, profilePhotoUrl: artistProfiles.profilePhotoUrl, artistName: artistProfiles.artistName })
            .from(artistProfiles)
            .where(eq(artistProfiles.userId, relation.followingId))
            .limit(1);
          if (artistProfile.length > 0) {
            profileId = artistProfile[0].id;
            profilePhotoUrl = artistProfile[0].profilePhotoUrl;
          }
        } else if (relation.followingType === 'venue') {
          const venueProfile = await db
            .select({ id: venueProfiles.id, profilePhotoUrl: venueProfiles.profilePhotoUrl })
            .from(venueProfiles)
            .where(eq(venueProfiles.userId, relation.followingId))
            .limit(1);
          if (venueProfile.length > 0) {
            profileId = venueProfile[0].id;
            profilePhotoUrl = venueProfile[0].profilePhotoUrl;
          }
        }

        followedUsers.push({
          id: user.id,
          name: user.name || "Unknown",
          email: user.email || "",
          role: (user.role as "artist" | "venue") || "user",
          followingType: relation.followingType,
          followedAt: relation.createdAt,
          profileId,
          profilePhotoUrl,
        });
      }
    }

    return followedUsers;
  } catch (error) {
    console.error("Error getting following list:", error);
    throw error;
  }
}

/**
 * Get list of followers for a user
 */
export async function getFollowers(
  userId: number,
  limit_: number = 50,
  offset: number = 0
): Promise<FollowedUser[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const followerRelations = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId))
      .limit(limit_)
      .offset(offset);

    const followers: FollowedUser[] = [];

    for (const relation of followerRelations) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, relation.followerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        followers.push({
          id: user.id,
          name: user.name || "Unknown",
          email: user.email || "",
          role: (user.role as "artist" | "venue") || "user",
          followingType: relation.followingType,
          followedAt: relation.createdAt,
        });
      }
    }

    return followers;
  } catch (error) {
    console.error("Error getting followers list:", error);
    throw error;
  }
}

/**
 * Get follow recommendations based on mutual follows
 */
export async function getFollowRecommendations(
  userId: number,
  limit_: number = 10
): Promise<FollowRecommendation[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get users that the current user is following
    const userFollowing = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const followingIds = userFollowing.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Find users that are followed by people the user follows
    const recommendations = await db
      .select()
      .from(follows)
      .where(
        and(
          inArray(follows.followerId, followingIds),
          ne(follows.followingId, userId)
        )
      );

    // Group by followingId and count mutual followers
    const recommendationMap = new Map<number, { count: number; type: string }>();

    for (const rec of recommendations) {
      const key = rec.followingId;
      if (recommendationMap.has(key)) {
        const current = recommendationMap.get(key)!;
        current.count += 1;
      } else {
        recommendationMap.set(key, { count: 1, type: rec.followingType });
      }
    }

    // Check if user is already following these recommendations
    const alreadyFollowing = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const alreadyFollowingIds = new Set(alreadyFollowing.map((f) => f.followingId));

    // Build recommendation list
    const recommendationList: FollowRecommendation[] = [];

    for (const [recommendedId, data] of recommendationMap.entries()) {
      if (alreadyFollowingIds.has(recommendedId)) {
        continue; // Skip if already following
      }

      const recommendedUserResult = await db
        .select()
        .from(users)
        .where(eq(users.id, recommendedId))
        .limit(1);

      if (recommendedUserResult.length > 0) {
        const recommendedUser = recommendedUserResult[0];
        recommendationList.push({
          id: recommendedUser.id,
          name: recommendedUser.name || "Unknown",
          email: recommendedUser.email || "",
          role: (recommendedUser.role as "artist" | "venue") || "user",
          followingType: (data.type as "artist" | "venue") || "artist",
          mutualFollowers: data.count,
          reason: `${data.count} artist${data.count > 1 ? "s" : ""} you follow also follows this ${data.type}`,
        });
      }
    }

    // Sort by mutual followers count and return top recommendations
    return recommendationList
      .sort((a, b) => b.mutualFollowers - a.mutualFollowers)
      .slice(0, limit_);
  } catch (error) {
    console.error("Error getting follow recommendations:", error);
    throw error;
  }
}

/**
 * Check if user is following another user
 */
export async function isFollowing(
  followerId: number,
  followingId: number,
  followingType?: "artist" | "venue"
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const query = and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    );

    const relation = await db
      .select()
      .from(follows)
      .where(followingType ? and(query, eq(follows.followingType, followingType)) : query)
      .limit(1);

    return relation.length > 0;
  } catch (error) {
    console.error("Error checking follow status:", error);
    throw error;
  }
}

/**
 * Get mutual followers between two users
 */
export async function getMutualFollowers(
  userId1: number,
  userId2: number
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get followers of user1
    const user1Followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId1));

    const user1FollowerIds = new Set(user1Followers.map((f) => f.followerId));

    // Get followers of user2
    const user2Followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId2));

    // Count mutual followers
    let mutualCount = 0;
    for (const follower of user2Followers) {
      if (user1FollowerIds.has(follower.followerId)) {
        mutualCount++;
      }
    }

    return mutualCount;
  } catch (error) {
    console.error("Error getting mutual followers:", error);
    throw error;
  }
}

/**
 * Get trending artists/venues based on follow count
 */
export async function getTrendingUsers(
  followingType: "artist" | "venue",
  limit_: number = 10
): Promise<FollowedUser[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all follows for the specified type
    const allFollows = await db
      .select()
      .from(follows)
      .where(eq(follows.followingType, followingType));

    // Count follows per user
    const followCounts = new Map<number, number>();
    for (const follow of allFollows) {
      const current = followCounts.get(follow.followingId) || 0;
      followCounts.set(follow.followingId, current + 1);
    }

    // Sort by follow count
    const sorted = Array.from(followCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit_);

    // Get user details
    const trendingUsers: FollowedUser[] = [];
    for (const [userId] of sorted) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        trendingUsers.push({
          id: user.id,
          name: user.name || "Unknown",
          email: user.email || "",
          role: (user.role as "artist" | "venue") || "user",
          followingType,
          followedAt: new Date(),
        });
      }
    }

    return trendingUsers;
  } catch (error) {
    console.error("Error getting trending users:", error);
    throw error;
  }
}

/**
 * Remove all follows for a user (used during account deletion)
 */
export async function removeAllFollows(userId: number): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Remove all follows where user is follower (people they follow)
    // Note: We do NOT remove follows where user is being followed (their followers)
    await db.delete(follows).where(eq(follows.followerId, userId));
  } catch (error) {
    console.error("Error removing all follows:", error);
    throw error;
  }
}


export interface FanEmail {
  id: number;
  name: string;
  email: string;
  followedAt: Date;
}

/**
 * Get the total follower count for a user
 */
export async function getFollowerCount(userId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const followers = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));

    return followers.length;
  } catch (error) {
    console.error("Error getting follower count:", error);
    throw error;
  }
}

/**
 * Get fan email list for an artist (paid tier feature)
 * Returns full fan details including emails
 */
export async function getFanEmailList(
  artistUserId: number,
  limit_: number = 100,
  offset: number = 0
): Promise<FanEmail[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const followerRelations = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, artistUserId))
      .limit(limit_)
      .offset(offset);

    const fans: FanEmail[] = [];

    for (const relation of followerRelations) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, relation.followerId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        if (user.email) {
          fans.push({
            id: user.id,
            name: user.name || "Unknown",
            email: user.email,
            followedAt: relation.createdAt,
          });
        }
      }
    }

    return fans;
  } catch (error) {
    console.error("Error getting fan email list:", error);
    throw error;
  }
}
