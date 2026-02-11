import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as emailService from './emailService';
import * as db from '../db';

// Mock the database module
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variables for testing
    process.env.SENDGRID_API_KEY = 'test-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@ologywood.com';
  });

  describe('shouldSendEmail', () => {
    it('should return false if frequency is never', () => {
      const preferences = {
        frequency: 'never' as const,
        bookingUpdates: true,
        newOpportunities: true,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      };

      const result = emailService.shouldSendEmail(preferences, 'bookingUpdates');
      expect(result).toBe(false);
    });

    it('should return true if category is enabled and frequency is not never', () => {
      const preferences = {
        frequency: 'weekly' as const,
        bookingUpdates: true,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      };

      expect(emailService.shouldSendEmail(preferences, 'bookingUpdates')).toBe(true);
      expect(emailService.shouldSendEmail(preferences, 'newOpportunities')).toBe(false);
    });

    it('should return false if category is disabled', () => {
      const preferences = {
        frequency: 'daily' as const,
        bookingUpdates: false,
        newOpportunities: true,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      };

      const result = emailService.shouldSendEmail(preferences, 'bookingUpdates');
      expect(result).toBe(false);
    });
  });

  describe('sendBookingConfirmationEmail', () => {
    it('should skip sending if preferences are disabled', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  frequency: 'never',
                  bookingUpdates: false,
                  newOpportunities: true,
                  platformNews: false,
                  weeklyDigest: true,
                  reminders: true,
                },
              ]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await emailService.sendBookingConfirmationEmail(
        1,
        'artist@example.com',
        {
          artistName: 'Test Artist',
          venueName: 'Test Venue',
          eventDate: '2026-03-15',
          eventTime: '8:00 PM',
          eventLocation: '123 Main St',
          bookingId: 1,
        }
      );

      expect(result).toBe(false);
    });

    it('should return false if SendGrid API key is not configured', async () => {
      const originalKey = process.env.SENDGRID_API_KEY;
      delete process.env.SENDGRID_API_KEY;

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  frequency: 'weekly',
                  bookingUpdates: true,
                  newOpportunities: true,
                  platformNews: false,
                  weeklyDigest: true,
                  reminders: true,
                },
              ]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await emailService.sendBookingConfirmationEmail(
        1,
        'artist@example.com',
        {
          artistName: 'Test Artist',
          venueName: 'Test Venue',
          eventDate: '2026-03-15',
          eventTime: '8:00 PM',
          eventLocation: '123 Main St',
          bookingId: 1,
        }
      );

      if (originalKey) process.env.SENDGRID_API_KEY = originalKey;

      expect(result).toBe(false);
    });

    it('should return true if email preferences are enabled', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  frequency: 'weekly',
                  bookingUpdates: true,
                  newOpportunities: true,
                  platformNews: false,
                  weeklyDigest: true,
                  reminders: true,
                },
              ]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      // Mock SendGrid send
      const sgMail = await import('@sendgrid/mail');
      vi.mocked(sgMail.default.send).mockResolvedValue([{ statusCode: 202 }] as any);

      const result = await emailService.sendBookingConfirmationEmail(
        1,
        'artist@example.com',
        {
          artistName: 'Test Artist',
          venueName: 'Test Venue',
          eventDate: '2026-03-15',
          eventTime: '8:00 PM',
          eventLocation: '123 Main St',
          bookingId: 1,
        }
      );

      expect(result).toBe(true);
    });
  });

  describe('sendNewOpportunityEmail', () => {
    it('should skip sending if newOpportunities preference is disabled', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  frequency: 'weekly',
                  bookingUpdates: true,
                  newOpportunities: false,
                  platformNews: false,
                  weeklyDigest: true,
                  reminders: true,
                },
              ]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await emailService.sendNewOpportunityEmail(
        1,
        'artist@example.com',
        {
          venueName: 'Test Venue',
          eventType: 'Wedding',
          eventDate: '2026-03-15',
          budget: '$1000-$2000',
          location: '123 Main St',
          opportunityId: 1,
        }
      );

      expect(result).toBe(false);
    });
  });

  describe('sendWeeklyDigestEmail', () => {
    it('should skip sending if weeklyDigest preference is disabled', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  frequency: 'weekly',
                  bookingUpdates: true,
                  newOpportunities: true,
                  platformNews: false,
                  weeklyDigest: false,
                  reminders: true,
                },
              ]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await emailService.sendWeeklyDigestEmail(
        1,
        'user@example.com',
        {
          newOpportunities: 5,
          upcomingBookings: 2,
          newMessages: 3,
          platformUpdates: ['Update 1', 'Update 2'],
        }
      );

      expect(result).toBe(false);
    });
  });

  describe('sendBookingReminderEmail', () => {
    it('should skip sending if reminders preference is disabled', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  frequency: 'weekly',
                  bookingUpdates: true,
                  newOpportunities: true,
                  platformNews: false,
                  weeklyDigest: true,
                  reminders: false,
                },
              ]),
            }),
          }),
        }),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await emailService.sendBookingReminderEmail(
        1,
        'artist@example.com',
        {
          artistName: 'Test Artist',
          venueName: 'Test Venue',
          eventDate: '2026-03-15',
          eventTime: '8:00 PM',
          hoursUntilEvent: 24,
        }
      );

      expect(result).toBe(false);
    });
  });
});
