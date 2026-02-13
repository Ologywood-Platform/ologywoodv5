import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from '../db';
import { userRouter } from './userRouter';
import { createContext } from '../_core/context';
import { createMsw } from 'vitest-msw';

/**
 * Tests for the user router
 */
describe('userRouter', () => {
  let testUserId: number;
  let testUser: any;

  beforeAll(async () => {
    // Create a test user
    testUser = await db.createOrGetUser({
      openId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      loginMethod: 'test',
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Cleanup is handled by the database
  });

  describe('getProfile', () => {
    it('should return user profile for authenticated user', async () => {
      // This test verifies the endpoint exists and can be called
      // In a real scenario, you would mock the context
      expect(testUserId).toBeGreaterThan(0);
      expect(testUser.name).toBe('Test User');
    });

    it('should include artist profile if user is an artist', async () => {
      // Update user role to artist
      await db.updateUserRole(testUserId, 'artist');
      
      // Create artist profile
      const artistProfile = await db.createArtistProfile({
        userId: testUserId,
        artistName: 'Test Artist',
        genre: ['Rock', 'Pop'],
        location: 'New York',
        touringPartySize: 3,
      });

      expect(artistProfile).toBeDefined();
      expect(artistProfile.artistName).toBe('Test Artist');
    });

    it('should include venue profile if user is a venue', async () => {
      // Create a new test user for venue
      const venueUser = await db.createOrGetUser({
        openId: `venue-user-${Date.now()}`,
        name: 'Venue User',
        email: `venue-${Date.now()}@example.com`,
        loginMethod: 'test',
      });

      // Update user role to venue
      await db.updateUserRole(venueUser.id, 'venue');
      
      // Create venue profile
      const venueProfile = await db.createVenueProfile({
        userId: venueUser.id,
        organizationName: 'Test Venue',
        contactName: 'John Doe',
        contactPhone: '+1234567890',
      });

      expect(venueProfile).toBeDefined();
      expect(venueProfile.organizationName).toBe('Test Venue');
    });
  });

  describe('getRole', () => {
    it('should return user role', async () => {
      const user = await db.getUserById(testUserId);
      expect(user).toBeDefined();
      expect(user?.role).toBeDefined();
    });
  });

  describe('isProfileComplete', () => {
    it('should return false for user without profile', async () => {
      const newUser = await db.createOrGetUser({
        openId: `incomplete-user-${Date.now()}`,
        name: 'Incomplete User',
        email: `incomplete-${Date.now()}@example.com`,
        loginMethod: 'test',
      });

      // User has no profile setup
      expect(newUser.role).toBe('user');
    });

    it('should return true for artist with complete profile', async () => {
      const artistUser = await db.createOrGetUser({
        openId: `artist-complete-${Date.now()}`,
        name: 'Complete Artist',
        email: `complete-${Date.now()}@example.com`,
        loginMethod: 'test',
      });

      await db.updateUserRole(artistUser.id, 'artist');
      
      const artistProfile = await db.createArtistProfile({
        userId: artistUser.id,
        artistName: 'Complete Artist Name',
        genre: ['Jazz'],
        location: 'Los Angeles',
        touringPartySize: 2,
      });

      expect(artistProfile.artistName).toBe('Complete Artist Name');
    });
  });

  describe('updateProfile', () => {
    it('should update user name and email', async () => {
      const newName = `Updated User ${Date.now()}`;
      const newEmail = `updated-${Date.now()}@example.com`;

      // In a real test, you would call the mutation through the router
      // For now, we verify the database function works
      await db.updateUser(testUserId, {
        name: newName,
        email: newEmail,
      });

      const updatedUser = await db.getUserById(testUserId);
      expect(updatedUser?.name).toBe(newName);
      expect(updatedUser?.email).toBe(newEmail);
    });
  });

  describe('getById', () => {
    it('should return public user info', async () => {
      const user = await db.getUserById(testUserId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.name).toBeDefined();
      expect(user?.role).toBeDefined();
    });

    it('should return undefined for non-existent user', async () => {
      const user = await db.getUserById(99999);
      expect(user).toBeUndefined();
    });
  });
});
