import { describe, it, expect } from 'vitest';
import * as schema from '../../drizzle/schema';

describe('In-App Notification System', () => {
  describe('Database Schema', () => {
    it('should have a notifications table with required columns', () => {
      expect(schema.notifications).toBeDefined();
      const cols = schema.notifications as any;
      expect(cols.id).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.type).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.message).toBeDefined();
      expect(cols.actionUrl).toBeDefined();
      expect(cols.isRead).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('should have a notification_preferences table', () => {
      expect(schema.notificationPreferences).toBeDefined();
      const cols = schema.notificationPreferences as any;
      expect(cols.id).toBeDefined();
      expect(cols.userId).toBeDefined();
    });
  });

  describe('Notification Service', () => {
    it('should export all notification trigger functions', async () => {
      const notif = await import('../services/notificationService');
      expect(typeof notif.notifyBookingRequest).toBe('function');
      expect(typeof notif.notifyBookingConfirmed).toBe('function');
      expect(typeof notif.notifyBookingCancelled).toBe('function');
      expect(typeof notif.notifyNewMessage).toBe('function');
      expect(typeof notif.notifyNewReview).toBe('function');
      expect(typeof notif.notifyContractReadyToSign).toBe('function');
      expect(typeof notif.notifyContractFullySigned).toBe('function');
      expect(typeof notif.notifyPaymentReceived).toBe('function');
    });

    it('notifyBookingRequest should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      // Should not throw even if DB insert fails (fire-and-forget pattern)
      await expect(
        notif.notifyBookingRequest({
          recipientUserId: 999999,
          requesterName: 'Test Venue',
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });

    it('notifyBookingConfirmed should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyBookingConfirmed({
          recipientUserId: 999999,
          otherPartyName: 'Test Artist',
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });

    it('notifyBookingCancelled should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyBookingCancelled({
          recipientUserId: 999999,
          otherPartyName: 'Test Venue',
          bookingId: 1,
          cancelledBy: 'Test Venue',
        })
      ).resolves.not.toThrow();
    });

    it('notifyNewMessage should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyNewMessage({
          recipientUserId: 999999,
          senderName: 'Test User',
          preview: 'Hello there!',
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });

    it('notifyNewReview should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyNewReview({
          recipientUserId: 999999,
          reviewerName: 'Test Venue',
          rating: 5,
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });

    it('notifyContractReadyToSign should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyContractReadyToSign({
          recipientUserId: 999999,
          otherPartyName: 'Test Artist',
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });

    it('notifyContractFullySigned should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyContractFullySigned({
          recipientUserId: 999999,
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });

    it('notifyPaymentReceived should not throw when called with valid params', async () => {
      const notif = await import('../services/notificationService');
      await expect(
        notif.notifyPaymentReceived({
          recipientUserId: 999999,
          amount: '$500.00',
          bookingId: 1,
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Notification Router', () => {
    it('should export the notifications router with required endpoints', async () => {
      const { notificationsRouter } = await import('../routers/notifications');
      expect(notificationsRouter).toBeDefined();
      // Check that the router has the expected procedures
      const routerDef = (notificationsRouter as any)._def;
      expect(routerDef).toBeDefined();
      const procedures = routerDef.procedures || routerDef.record;
      expect(procedures).toBeDefined();
      expect(procedures.list).toBeDefined();
      expect(procedures.unreadCount).toBeDefined();
      expect(procedures.markRead).toBeDefined();
      expect(procedures.markAllRead).toBeDefined();
      expect(procedures.delete).toBeDefined();
    });
  });

  describe('DB Functions', () => {
    it('should export notification CRUD functions', async () => {
      const db = await import('../db');
      expect(typeof db.createNotification).toBe('function');
      expect(typeof db.getNotificationsByUserId).toBe('function');
      expect(typeof db.getUnreadNotificationCount).toBe('function');
      expect(typeof db.markNotificationRead).toBe('function');
      expect(typeof db.markAllNotificationsRead).toBe('function');
      expect(typeof db.deleteNotification).toBe('function');
    });
  });
});
