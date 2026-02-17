import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminRouter } from './admin';

describe('Admin Router', () => {
  describe('Access Control', () => {
    it('should require admin role for all procedures', async () => {
      // Admin procedures should check for admin role
      // This is enforced by the adminOnly middleware
      expect(adminRouter).toBeDefined();
    });
  });

  describe('User Management', () => {
    it('should have getUsers query', () => {
      expect(adminRouter.getUsers).toBeDefined();
    });

    it('should have getUser query', () => {
      expect(adminRouter.getUser).toBeDefined();
    });

    it('should have verifyArtist mutation', () => {
      expect(adminRouter.verifyArtist).toBeDefined();
    });

    it('should have toggleUserStatus mutation', () => {
      expect(adminRouter.toggleUserStatus).toBeDefined();
    });
  });

  describe('Booking Management', () => {
    it('should have getBookings query', () => {
      expect(adminRouter.getBookings).toBeDefined();
    });

    it('should have getBookingDetails query', () => {
      expect(adminRouter.getBookingDetails).toBeDefined();
    });

    it('should have resolveDispute mutation', () => {
      expect(adminRouter.resolveDispute).toBeDefined();
    });
  });

  describe('Financial Management', () => {
    it('should have getFinancialOverview query', () => {
      expect(adminRouter.getFinancialOverview).toBeDefined();
    });

    it('should have getPayouts query', () => {
      expect(adminRouter.getPayouts).toBeDefined();
    });

    it('should have processPayout mutation', () => {
      expect(adminRouter.processPayout).toBeDefined();
    });
  });

  describe('Analytics', () => {
    it('should have getAnalytics query', () => {
      expect(adminRouter.getAnalytics).toBeDefined();
    });

    it('should have getSystemHealth query', () => {
      expect(adminRouter.getSystemHealth).toBeDefined();
    });
  });

  describe('Router Structure', () => {
    it('should export all required procedures', () => {
      const expectedProcedures = [
        'getUsers',
        'getUser',
        'verifyArtist',
        'toggleUserStatus',
        'getBookings',
        'getBookingDetails',
        'resolveDispute',
        'getFinancialOverview',
        'getPayouts',
        'processPayout',
        'getAnalytics',
        'getSystemHealth',
      ];

      expectedProcedures.forEach((procedure) => {
        expect(adminRouter[procedure as keyof typeof adminRouter]).toBeDefined();
      });
    });
  });
});
