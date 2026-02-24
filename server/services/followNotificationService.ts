/**
 * Follow Notification Service
 * Handles sending notifications when users follow/unfollow artists or venues
 */

import * as db from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import * as email from "../email";
import { getFollowNotificationEmailHTML } from "../email-templates/followNotification";

export interface FollowNotification {
  id: number;
  followerId: number;
  followerName: string;
  followerEmail: string;
  followingId: number;
  followingName: string;
  followingType: "artist" | "venue";
  createdAt: Date;
  emailSent: boolean;
}

/**
 * Send follow notification to the artist/venue being followed
 */
export async function sendFollowNotification(
  followerId: number,
  followingId: number,
  followingType: "artist" | "venue"
): Promise<boolean> {
  try {
    // Get follower details
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");
    
    const followerResult = await database
      .select()
      .from(users)
      .where(eq(users.id, followerId))
      .limit(1);

    if (followerResult.length === 0) {
      console.error(`Follower not found: ${followerId}`);
      return false;
    }

    const follower = followerResult[0];

    // Get following user details
    const followingResult = await database
      .select()
      .from(users)
      .where(eq(users.id, followingId))
      .limit(1);

    if (followingResult.length === 0) {
      console.error(`Following user not found: ${followingId}`);
      return false;
    }

    const following = followingResult[0];

    // Send email notification
    try {
      await email.sendEmail({
      to: following.email || "",
      subject: `${follower.name || "Someone"} started following you on Ologywood!`,
      html: getFollowNotificationEmailHTML({
        followerName: follower.name || "A user",
        followingName: following.name || "Unknown",
        followingType,
        followerId,
        followingId,
      }),

      });
      return true;
    } catch (emailError) {
      console.error("Failed to send follow notification email:", emailError);
      return false;
    }
  } catch (error) {
    console.error("Error sending follow notification:", error);
    return false;
  }
}

/**
 * Send unfollow notification (optional - can be disabled)
 */
export async function sendUnfollowNotification(
  followerId: number,
  followingId: number,
  followingType: "artist" | "venue"
): Promise<boolean> {
  try {
    // Get follower details
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");
    
    const followerResult = await database
      .select()
      .from(users)
      .where(eq(users.id, followerId))
      .limit(1);

    if (followerResult.length === 0) {
      return false;
    }

    const follower = followerResult[0];

    // Get following user details
    const followingResult = await database
      .select()
      .from(users)
      .where(eq(users.id, followingId))
      .limit(1);

    if (followingResult.length === 0) {
      return false;
    }

    const following = followingResult[0];

    // For now, we don't send unfollow notifications
    // as they can be annoying. But the infrastructure is here if needed.

    return true;
  } catch (error) {
    console.error("Error processing unfollow notification:", error);
    return false;
  }
}

/**
 * Get recent followers for a user
 */
export async function getRecentFollowers(
  userId: number,
  limit: number = 10
): Promise<FollowNotification[]> {
  try {
    // This would query the follows table to get recent followers
    // For now, returning empty array as placeholder
    return [];
  } catch (error) {
    console.error("Error getting recent followers:", error);
    return [];
  }
}

/**
 * Get follower statistics for a user
 */
export async function getFollowerStats(userId: number): Promise<{
  totalFollowers: number;
  newFollowersThisWeek: number;
  newFollowersThisMonth: number;
}> {
  try {
    // This would query the follows table for statistics
    // For now, returning placeholder data
    return {
      totalFollowers: 0,
      newFollowersThisWeek: 0,
      newFollowersThisMonth: 0,
    };
  } catch (error) {
    console.error("Error getting follower stats:", error);
    return {
      totalFollowers: 0,
      newFollowersThisWeek: 0,
      newFollowersThisMonth: 0,
    };
  }
}

/**
 * Check if notification preferences allow follow notifications
 */
export async function canSendFollowNotification(userId: number): Promise<boolean> {
  try {
    // Check user's email preferences
    // For now, return true (allow notifications by default)
    return true;
  } catch (error) {
    console.error("Error checking notification preferences:", error);
    return false;
  }
}
