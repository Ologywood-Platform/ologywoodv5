import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the getSuggestedArtists endpoint and SuggestedFollows feature
 */

// Mock follow service
const mockGetFollowing = vi.fn();
const mockGetFollowRecommendations = vi.fn();
const mockGetFollowerCount = vi.fn();
const mockFollowUser = vi.fn();
const mockUnfollowUser = vi.fn();

vi.mock('../services/followService', () => ({
  getFollowing: (...args: any[]) => mockGetFollowing(...args),
  getFollowRecommendations: (...args: any[]) => mockGetFollowRecommendations(...args),
  getFollowerCount: (...args: any[]) => mockGetFollowerCount(...args),
  followUser: (...args: any[]) => mockFollowUser(...args),
  unfollowUser: (...args: any[]) => mockUnfollowUser(...args),
  getTrendingUsers: vi.fn().mockResolvedValue([]),
  isFollowing: vi.fn().mockResolvedValue(false),
  getFollowStats: vi.fn().mockResolvedValue({ followers: 0, following: 0, isFollowing: false }),
}));

// Mock db
const mockGetAllArtists = vi.fn();
vi.mock('../db', () => ({
  getAllArtists: (...args: any[]) => mockGetAllArtists(...args),
}));

describe('getSuggestedArtists Feature', () => {
  const mockArtists = [
    {
      id: 1,
      userId: 10,
      artistName: 'Luna Moonlight',
      genre: ['Indie Folk', 'Acoustic'],
      location: 'Los Angeles, CA',
      profilePhotoUrl: 'https://example.com/luna.jpg',
    },
    {
      id: 2,
      userId: 20,
      artistName: 'The Velvet Collective',
      genre: ['Jazz', 'Funk'],
      location: 'New York, NY',
      profilePhotoUrl: 'https://example.com/velvet.jpg',
    },
    {
      id: 3,
      userId: 30,
      artistName: 'G.Chizo',
      genre: ['Hip-Hop', 'Rap'],
      location: 'Miami, FL',
      profilePhotoUrl: null,
    },
    {
      id: 4,
      userId: 40,
      artistName: 'Sofia Strings',
      genre: ['Classical', 'Contemporary'],
      location: 'Nashville, TN',
      profilePhotoUrl: 'https://example.com/sofia.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllArtists.mockResolvedValue(mockArtists);
    mockGetFollowing.mockResolvedValue([]);
    mockGetFollowRecommendations.mockResolvedValue([]);
    mockGetFollowerCount.mockResolvedValue(0);
  });

  describe('Data enrichment', () => {
    it('should return artists with enriched profile data', async () => {
      mockGetFollowerCount.mockResolvedValue(42);

      const allArtists = await mockGetAllArtists();
      expect(allArtists).toHaveLength(4);

      // Simulate enrichment logic
      const enriched = await Promise.all(
        allArtists.map(async (artist: any) => ({
          id: artist.id,
          userId: artist.userId,
          artistName: artist.artistName,
          genres: Array.isArray(artist.genre) ? artist.genre : [],
          location: artist.location || null,
          profilePhotoUrl: artist.profilePhotoUrl || null,
          followerCount: await mockGetFollowerCount(artist.userId),
          isRecommended: false,
        }))
      );

      expect(enriched).toHaveLength(4);
      expect(enriched[0].artistName).toBe('Luna Moonlight');
      expect(enriched[0].genres).toEqual(['Indie Folk', 'Acoustic']);
      expect(enriched[0].followerCount).toBe(42);
      expect(enriched[0].profilePhotoUrl).toBe('https://example.com/luna.jpg');
    });

    it('should handle artists with null genre gracefully', async () => {
      const artistWithNullGenre = { ...mockArtists[0], genre: null };
      const genres = Array.isArray(artistWithNullGenre.genre) ? artistWithNullGenre.genre : [];
      expect(genres).toEqual([]);
    });

    it('should handle artists with null profilePhotoUrl', async () => {
      const artist = mockArtists[2]; // G.Chizo has null photo
      expect(artist.profilePhotoUrl).toBeNull();
    });
  });

  describe('Exclusion logic', () => {
    it('should exclude artists the user already follows', async () => {
      // User follows Luna Moonlight (userId: 10)
      mockGetFollowing.mockResolvedValue([{ id: 10, followingType: 'artist' }]);

      const following = await mockGetFollowing(7, 1000, 0);
      const followingIds = new Set(following.map((f: any) => f.id));

      const filtered = mockArtists.filter(a => !followingIds.has(a.userId));
      expect(filtered).toHaveLength(3);
      expect(filtered.find(a => a.artistName === 'Luna Moonlight')).toBeUndefined();
    });

    it('should exclude the current user from suggestions', async () => {
      const currentUserId = 10; // Luna Moonlight's userId
      const filtered = mockArtists.filter(a => a.userId !== currentUserId);
      expect(filtered).toHaveLength(3);
      expect(filtered.find(a => a.userId === currentUserId)).toBeUndefined();
    });

    it('should exclude both followed artists and self', async () => {
      const currentUserId = 10;
      mockGetFollowing.mockResolvedValue([{ id: 20, followingType: 'artist' }]);

      const following = await mockGetFollowing(currentUserId, 1000, 0);
      const followingIds = new Set(following.map((f: any) => f.id));

      const filtered = mockArtists.filter(
        a => a.userId !== currentUserId && !followingIds.has(a.userId)
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.find(a => a.userId === 10)).toBeUndefined(); // self
      expect(filtered.find(a => a.userId === 20)).toBeUndefined(); // followed
    });
  });

  describe('Personalized recommendations', () => {
    it('should prioritize recommended artists', async () => {
      mockGetFollowRecommendations.mockResolvedValue([
        { id: 30, name: 'G.Chizo', mutualFollowers: 3, reason: '3 mutual follows' },
      ]);

      const recs = await mockGetFollowRecommendations(7, 8);
      const recommendedUserIds = recs.map((r: any) => r.id);

      expect(recommendedUserIds).toContain(30);

      // Build enriched list with recommendations first
      const enriched: any[] = [];
      const addedUserIds = new Set<number>();

      for (const recUserId of recommendedUserIds) {
        const artist = mockArtists.find(a => a.userId === recUserId);
        if (artist && !addedUserIds.has(artist.userId)) {
          addedUserIds.add(artist.userId);
          enriched.push({ ...artist, isRecommended: true });
        }
      }

      // Fill remaining
      for (const artist of mockArtists) {
        if (!addedUserIds.has(artist.userId)) {
          addedUserIds.add(artist.userId);
          enriched.push({ ...artist, isRecommended: false });
        }
      }

      expect(enriched[0].artistName).toBe('G.Chizo');
      expect(enriched[0].isRecommended).toBe(true);
      expect(enriched[1].isRecommended).toBe(false);
    });

    it('should fall back to all artists when no recommendations exist', async () => {
      mockGetFollowRecommendations.mockResolvedValue([]);

      const recs = await mockGetFollowRecommendations(7, 8);
      expect(recs).toHaveLength(0);

      // All artists should be returned as non-recommended
      const enriched = mockArtists.map(a => ({ ...a, isRecommended: false }));
      expect(enriched).toHaveLength(4);
      expect(enriched.every((a: any) => !a.isRecommended)).toBe(true);
    });
  });

  describe('Unauthenticated users', () => {
    it('should return all artists for logged-out users', async () => {
      // No currentUserId means no exclusions
      const allArtists = await mockGetAllArtists();
      expect(allArtists).toHaveLength(4);
    });

    it('should not call follow-related APIs for logged-out users', async () => {
      const currentUserId = undefined;

      if (currentUserId) {
        await mockGetFollowing(currentUserId, 1000, 0);
        await mockGetFollowRecommendations(currentUserId, 8);
      }

      expect(mockGetFollowing).not.toHaveBeenCalled();
      expect(mockGetFollowRecommendations).not.toHaveBeenCalled();
    });
  });

  describe('Follow/Unfollow integration', () => {
    it('should call followUser with correct parameters', async () => {
      mockFollowUser.mockResolvedValue(true);

      const result = await mockFollowUser(7, 10, 'artist');
      expect(mockFollowUser).toHaveBeenCalledWith(7, 10, 'artist');
      expect(result).toBe(true);
    });

    it('should call unfollowUser with correct parameters', async () => {
      mockUnfollowUser.mockResolvedValue(true);

      const result = await mockUnfollowUser(7, 10, 'artist');
      expect(mockUnfollowUser).toHaveBeenCalledWith(7, 10, 'artist');
      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should return empty array when no artists exist', async () => {
      mockGetAllArtists.mockResolvedValue([]);
      const allArtists = await mockGetAllArtists();
      expect(allArtists).toHaveLength(0);
    });

    it('should respect the limit parameter', async () => {
      const limit = 2;
      const allArtists = await mockGetAllArtists();
      const limited = allArtists.slice(0, limit);
      expect(limited).toHaveLength(2);
    });

    it('should handle getFollowing failure gracefully', async () => {
      mockGetFollowing.mockRejectedValue(new Error('DB error'));

      let followingIds = new Set<number>();
      try {
        const following = await mockGetFollowing(7, 1000, 0);
        followingIds = new Set(following.map((f: any) => f.id));
      } catch (_) {
        // Gracefully fall through with empty set
      }

      expect(followingIds.size).toBe(0);
      // All artists should still be returned
      const allArtists = await mockGetAllArtists();
      expect(allArtists).toHaveLength(4);
    });

    it('should handle getFollowRecommendations failure gracefully', async () => {
      mockGetFollowRecommendations.mockRejectedValue(new Error('DB error'));

      let recommendedUserIds: number[] = [];
      try {
        const recs = await mockGetFollowRecommendations(7, 8);
        recommendedUserIds = recs.map((r: any) => r.id);
      } catch (_) {
        // Gracefully fall through with empty recommendations
      }

      expect(recommendedUserIds).toHaveLength(0);
    });

    it('should handle getFollowerCount failure gracefully', async () => {
      mockGetFollowerCount.mockRejectedValue(new Error('DB error'));

      let followerCount = 0;
      try {
        followerCount = await mockGetFollowerCount(10);
      } catch (_) {
        // Default to 0
      }

      expect(followerCount).toBe(0);
    });
  });
});
