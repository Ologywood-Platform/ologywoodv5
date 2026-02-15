/**
 * Follow Service Tests
 * Comprehensive test suite for follow/unfollow operations
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as followService from "./followService";
import { getDb } from "../db";
import { follows, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Follow Service", () => {
  let testUserId1: number;
  let testUserId2: number;
  let testUserId3: number;

  beforeEach(async () => {
    // Create test users
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up existing test data
    await db.delete(follows);

    // Create test users (simplified - in real tests would use proper user creation)
    testUserId1 = 1;
    testUserId2 = 2;
    testUserId3 = 3;
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
    });

    it("should return correct following count", async () => {
      // User 1 follows user 2
      await followService.followUser(testUserId1, testUserId2, "artist");
      // User 1 follows user 3
      await followService.followUser(testUserId1, testUserId3, "venue");

      const stats = await followService.getFollowStats(testUserId1);
      expect(stats.followingCount).toBe(2);
    });

    it("should check if current user is following", async () => {
      await followService.followUser(testUserId1, testUserId2, "artist");

      const stats = await followService.getFollowStats(testUserId2, testUserId1);
      expect(stats.isFollowing).toBe(true);
    });

    it("should return false for isFollowing if not following", async () => {
      const stats = await followService.getFollowStats(testUserId2, testUserId1);
      expect(stats.isFollowing).toBe(false);
    });
  });

  describe("getFollowing", () => {
    it("should return list of users being followed", async () => {
      await followService.followUser(testUserId1, testUserId2, "artist");
      await followService.followUser(testUserId1, testUserId3, "venue");

      const following = await followService.getFollowing(testUserId1);
      expect(following.length).toBe(2);
      expect(following.some((f) => f.id === testUserId2)).toBe(true);
      expect(following.some((f) => f.id === testUserId3)).toBe(true);
    });

    it("should support pagination", async () => {
      await followService.followUser(testUserId1, testUserId2, "artist");
      await followService.followUser(testUserId1, testUserId3, "venue");

      const following = await followService.getFollowing(testUserId1, 1, 0);
      expect(following.length).toBeLessThanOrEqual(1);
    });
  });

  describe("getFollowers", () => {
    it("should return list of followers", async () => {
      await followService.followUser(testUserId2, testUserId1, "artist");
      await followService.followUser(testUserId3, testUserId1, "venue");

      const followers = await followService.getFollowers(testUserId1);
      expect(followers.length).toBe(2);
    });

    it("should support pagination", async () => {
      await followService.followUser(testUserId2, testUserId1, "artist");
      await followService.followUser(testUserId3, testUserId1, "venue");

      const followers = await followService.getFollowers(testUserId1, 1, 0);
      expect(followers.length).toBeLessThanOrEqual(1);
    });
  });

  describe("isFollowing", () => {
    it("should return true if following", async () => {
      await followService.followUser(testUserId1, testUserId2, "artist");
      const result = await followService.isFollowing(testUserId1, testUserId2);
      expect(result).toBe(true);
    });

    it("should return false if not following", async () => {
      const result = await followService.isFollowing(testUserId1, testUserId2);
      expect(result).toBe(false);
    });

    it("should check by followingType if provided", async () => {
      await followService.followUser(testUserId1, testUserId2, "artist");
      const artistResult = await followService.isFollowing(testUserId1, testUserId2, "artist");
      const venueResult = await followService.isFollowing(testUserId1, testUserId2, "venue");
      expect(artistResult).toBe(true);
      expect(venueResult).toBe(false);
    });
  });

  describe("getMutualFollowers", () => {
    it("should count mutual followers correctly", async () => {
      // User 2 follows both user 1 and user 3
      await followService.followUser(testUserId2, testUserId1, "artist");
      await followService.followUser(testUserId2, testUserId3, "artist");

      // User 3 follows user 1 (mutual with user 2)
      await followService.followUser(testUserId3, testUserId1, "artist");

      const mutualCount = await followService.getMutualFollowers(testUserId1, testUserId3);
      expect(mutualCount).toBe(1); // User 2 is mutual follower
    });

    it("should return 0 if no mutual followers", async () => {
      const mutualCount = await followService.getMutualFollowers(testUserId1, testUserId2);
      expect(mutualCount).toBe(0);
    });
  });

  describe("getTrendingUsers", () => {
    it("should return trending artists sorted by follow count", async () => {
      // User 2 follows user 3 (1 follow)
      await followService.followUser(testUserId2, testUserId3, "artist");
      // User 1 follows user 3 (2 follows total)
      await followService.followUser(testUserId1, testUserId3, "artist");

      const trending = await followService.getTrendingUsers("artist", 10);
      expect(trending.length).toBeGreaterThan(0);
      // User 3 should be in trending (has 2 follows)
      expect(trending.some((u) => u.id === testUserId3)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const trending = await followService.getTrendingUsers("artist", 1);
      expect(trending.length).toBeLessThanOrEqual(1);
    });
  });

  describe("removeAllFollows", () => {
    it("should remove all follows for a user", async () => {
      // User 1 follows user 2 and 3
      await followService.followUser(testUserId1, testUserId2, "artist");
      await followService.followUser(testUserId1, testUserId3, "artist");
      // User 2 follows user 1
      await followService.followUser(testUserId2, testUserId1, "artist");

      // Remove all follows for user 1
      await followService.removeAllFollows(testUserId1);

      // Check that user 1 has no follows
      const stats = await followService.getFollowStats(testUserId1);
      expect(stats.followingCount).toBe(0);
      expect(stats.followersCount).toBe(1); // User 2 still follows user 1
    });
  });

  describe("getFollowRecommendations", () => {
    it("should recommend users followed by people you follow", async () => {
      // User 1 follows user 2
      await followService.followUser(testUserId1, testUserId2, "artist");
      // User 2 follows user 3
      await followService.followUser(testUserId2, testUserId3, "artist");

      const recommendations = await followService.getFollowRecommendations(testUserId1, 10);
      // User 3 should be recommended (followed by user 2, who user 1 follows)
      expect(recommendations.some((r) => r.id === testUserId3)).toBe(true);
    });

    it("should not recommend users already followed", async () => {
      // User 1 follows user 2
      await followService.followUser(testUserId1, testUserId2, "artist");
      // User 1 also follows user 3
      await followService.followUser(testUserId1, testUserId3, "artist");

      const recommendations = await followService.getFollowRecommendations(testUserId1, 10);
      // User 3 should not be recommended (already following)
      expect(recommendations.some((r) => r.id === testUserId3)).toBe(false);
    });

    it("should return empty list if not following anyone", async () => {
      const recommendations = await followService.getFollowRecommendations(testUserId1, 10);
      expect(recommendations.length).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const recommendations = await followService.getFollowRecommendations(testUserId1, 1);
      expect(recommendations.length).toBeLessThanOrEqual(1);
    });
  });
});
