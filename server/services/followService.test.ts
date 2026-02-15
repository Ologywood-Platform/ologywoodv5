/**
 * Follow Service Tests
 * Comprehensive test suite for follow/unfollow operations
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as followService from "./followService";
import { getDb } from "../db";
import { follows, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

describe("Follow Service", () => {
  let testUserId1: number;
  let testUserId2: number;
  let testUserId3: number;
  let db: any;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up existing test data
    await db.delete(follows);
    
    // Create test users with unique identifiers
    const timestamp = Date.now();
    
    const [result1] = await db.insert(users).values({
      openId: `test-user-1-${timestamp}`,
      name: "Test User 1",
      email: `test1-${timestamp}@test.com`,
      loginMethod: "email",
      role: "artist",
      emailVerified: true,
    });
    
    const [result2] = await db.insert(users).values({
      openId: `test-user-2-${timestamp}`,
      name: "Test User 2",
      email: `test2-${timestamp}@test.com`,
      loginMethod: "email",
      role: "artist",
      emailVerified: true,
    });
    
    const [result3] = await db.insert(users).values({
      openId: `test-user-3-${timestamp}`,
      name: "Test User 3",
      email: `test3-${timestamp}@test.com`,
      loginMethod: "email",
      role: "artist",
      emailVerified: true,
    });

    // Get the actual inserted user IDs
    const user1 = await db.select().from(users).where(eq(users.openId, `test-user-1-${timestamp}`)).limit(1);
    const user2 = await db.select().from(users).where(eq(users.openId, `test-user-2-${timestamp}`)).limit(1);
    const user3 = await db.select().from(users).where(eq(users.openId, `test-user-3-${timestamp}`)).limit(1);
    
    if (!user1[0] || !user2[0] || !user3[0]) {
      throw new Error("Failed to create test users");
    }
    
    testUserId1 = user1[0].id;
    testUserId2 = user2[0].id;
    testUserId3 = user3[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    if (db) {
      await db.delete(follows);
    }
  });

  describe("followUser", () => {
    it("should follow a user successfully", async () => {
      const result = await followService.followUser(testUserId1, testUserId2, "artist");
      expect(result).toBe(true);
    });

    it("should not allow self-following", async () => {
      await expect(
        followService.followUser(testUserId1, testUserId1, "artist")
      ).rejects.toThrow("Cannot follow yourself");
    });

    it("should return false if already following", async () => {
      // First follow
      await followService.followUser(testUserId1, testUserId2, "artist");
      // Second follow should return false
      const result = await followService.followUser(testUserId1, testUserId2, "artist");
      expect(result).toBe(false);
    });

    it("should support both artist and venue types", async () => {
      const artistResult = await followService.followUser(testUserId1, testUserId2, "artist");
      const venueResult = await followService.followUser(testUserId1, testUserId3, "venue");
      expect(artistResult).toBe(true);
      expect(venueResult).toBe(true);
    });
  });

  describe("unfollowUser", () => {
    it("should unfollow a user successfully", async () => {
      // First follow
      await followService.followUser(testUserId1, testUserId2, "artist");
      // Then unfollow
      const result = await followService.unfollowUser(testUserId1, testUserId2, "artist");
      expect(result).toBe(true);
    });

    it("should return false if not following", async () => {
      const result = await followService.unfollowUser(testUserId1, testUserId2, "artist");
      expect(result).toBe(false);
    });
  });

  describe("getFollowStats", () => {
    it("should return correct follower count", async () => {
      // User 2 follows user 1
      await followService.followUser(testUserId2, testUserId1, "artist");
      // User 3 follows user 1
      await followService.followUser(testUserId3, testUserId1, "artist");

      const stats = await followService.getFollowStats(testUserId1);
      expect(stats.followersCount).toBe(2);
      expect(stats.followingCount).toBe(0);
    });

    it("should return correct following count", async () => {
      // User 1 follows user 2 and 3
      await followService.followUser(testUserId1, testUserId2, "artist");
      await followService.followUser(testUserId1, testUserId3, "artist");

      const stats = await followService.getFollowStats(testUserId1);
      expect(stats.followersCount).toBe(0);
      expect(stats.followingCount).toBe(2);
    });
  });

  describe("getFollowing", () => {
    it("should return list of users being followed", async () => {
      // User 1 follows user 2 and 3
      await followService.followUser(testUserId1, testUserId2, "artist");
      await followService.followUser(testUserId1, testUserId3, "artist");

      const following = await followService.getFollowing(testUserId1);
      expect(following.length).toBe(2);
      expect(following.some((f) => f.id === testUserId2)).toBe(true);
      expect(following.some((f) => f.id === testUserId3)).toBe(true);
    });
  });

  describe("getFollowers", () => {
    it("should return list of followers", async () => {
      // User 2 and 3 follow user 1
      await followService.followUser(testUserId2, testUserId1, "artist");
      await followService.followUser(testUserId3, testUserId1, "artist");

      const followers = await followService.getFollowers(testUserId1);
      expect(followers.length).toBe(2);
    });
  });

  describe("getTrendingUsers", () => {
    it("should return trending artists sorted by follow count", async () => {
      // User 3 gets 2 follows (more popular)
      await followService.followUser(testUserId1, testUserId3, "artist");
      await followService.followUser(testUserId2, testUserId3, "artist");
      
      // User 2 gets 1 follow
      await followService.followUser(testUserId1, testUserId2, "artist");

      const trending = await followService.getTrendingUsers("artist", 10);
      expect(trending.length).toBeGreaterThan(0);
      // User 3 should be in trending (has 2 follows)
      expect(trending.some((u) => u.id === testUserId3)).toBe(true);
    });
  });

  describe("removeAllFollows", () => {
    it("should remove all follows for a user", async () => {
      // Setup: User 1 follows 2 and 3, User 2 follows User 1
      await followService.followUser(testUserId1, testUserId2, "artist");
      await followService.followUser(testUserId1, testUserId3, "artist");
      await followService.followUser(testUserId2, testUserId1, "artist");

      // Remove all follows for user 1
      await followService.removeAllFollows(testUserId1);

      const stats = await followService.getFollowStats(testUserId1);
      expect(stats.followingCount).toBe(0);
      expect(stats.followersCount).toBe(1); // User 2 still follows us
    });
  });

  describe("getFollowRecommendations", () => {
    it("should recommend users followed by people you follow", async () => {
      // User 1 follows User 2
      await followService.followUser(testUserId1, testUserId2, "artist");
      // User 2 follows User 3
      await followService.followUser(testUserId2, testUserId3, "artist");

      const recommendations = await followService.getFollowRecommendations(testUserId1, 10);
      // User 3 should be recommended (followed by user 2, who user 1 follows)
      expect(recommendations.some((r) => r.id === testUserId3)).toBe(true);
    });
  });
});
