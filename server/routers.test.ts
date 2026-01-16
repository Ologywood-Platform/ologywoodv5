import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import * as db from './db';
import { appRouter } from './routers';

// Mock database functions
vi.mock('./db', () => ({
  getUserById: vi.fn(),
  getArtistProfile: vi.fn(),
  getVenueProfile: vi.fn(),
  getBookingById: vi.fn(),
  getBookingsByArtistId: vi.fn(),
  getBookingsByVenueId: vi.fn(),
  createBooking: vi.fn(),
  updateBookingStatus: vi.fn(),
  createReview: vi.fn(),
  getReviewsByArtistId: vi.fn(),
  sendMessage: vi.fn(),
  getMessagesByBookingId: vi.fn(),
  createSubscription: vi.fn(),
  getSubscriptionByUserId: vi.fn(),
  createRiderTemplate: vi.fn(),
  getRiderTemplatesByArtistId: vi.fn(),
  updateRiderTemplate: vi.fn(),
}));

describe('TRPC Routers Integration Tests', () => {
  let caller: ReturnType<typeof createCallerFactory>;

  beforeAll(() => {
    // Create a caller for testing
    caller = createCallerFactory(appRouter)({
      user: { id: 1, role: 'artist' },
      req: { headers: { origin: 'http://localhost:3000' } },
    } as any);
  });

  describe('Booking Flow', () => {
    it('should create a booking successfully', async () => {
      const mockBooking = {
        id: 1,
        artistId: 1,
        venueId: 2,
        eventDate: '2026-02-01',
        eventTime: '19:00',
        venueName: 'Test Venue',
        venueAddress: '123 Main St',
        status: 'pending',
        totalFee: 500,
        depositAmount: 250,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createBooking).mockResolvedValue(mockBooking as any);

      const result = await caller.booking.create({
        artistId: 1,
        eventDate: '2026-02-01',
        eventTime: '19:00',
        venueName: 'Test Venue',
        venueAddress: '123 Main St',
        totalFee: 500,
        depositAmount: 250,
      });

      expect(result.success).toBe(true);
      expect(result.booking).toEqual(mockBooking);
    });

    it('should retrieve booking details', async () => {
      const mockBooking = {
        id: 1,
        artistId: 1,
        venueId: 2,
        status: 'confirmed',
        totalFee: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getBookingById).mockResolvedValue(mockBooking as any);

      const result = await caller.booking.getDetail({ bookingId: 1 });

      expect(result.booking).toEqual(mockBooking);
      expect(db.getBookingById).toHaveBeenCalledWith(1);
    });

    it('should update booking status', async () => {
      vi.mocked(db.updateBookingStatus).mockResolvedValue({ success: true });

      const result = await caller.booking.updateStatus({
        bookingId: 1,
        status: 'confirmed',
      });

      expect(result.success).toBe(true);
      expect(db.updateBookingStatus).toHaveBeenCalledWith(1, 'confirmed');
    });

    it('should list artist bookings', async () => {
      const mockBookings = [
        { id: 1, status: 'pending', totalFee: 500, createdAt: new Date() },
        { id: 2, status: 'confirmed', totalFee: 750, createdAt: new Date() },
      ];

      vi.mocked(db.getBookingsByArtistId).mockResolvedValue(mockBookings as any);

      const result = await caller.booking.getList({});

      expect(result.bookings).toHaveLength(2);
      expect(result.bookings[0].status).toBe('pending');
    });
  });

  describe('Messaging Flow', () => {
    it('should send a message', async () => {
      const mockMessage = {
        id: 1,
        bookingId: 1,
        senderId: 1,
        content: 'Hello, can you confirm the booking?',
        createdAt: new Date(),
      };

      vi.mocked(db.sendMessage).mockResolvedValue(mockMessage as any);

      const result = await caller.message.send({
        bookingId: 1,
        content: 'Hello, can you confirm the booking?',
      });

      expect(result.success).toBe(true);
      expect(result.message.content).toBe('Hello, can you confirm the booking?');
    });

    it('should retrieve message thread', async () => {
      const mockMessages = [
        { id: 1, bookingId: 1, senderId: 1, content: 'Message 1', createdAt: new Date() },
        { id: 2, bookingId: 1, senderId: 2, content: 'Message 2', createdAt: new Date() },
      ];

      vi.mocked(db.getMessagesByBookingId).mockResolvedValue(mockMessages as any);

      const result = await caller.message.getThread({ bookingId: 1 });

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].senderId).toBe(1);
      expect(result.messages[1].senderId).toBe(2);
    });

    it('should handle empty message thread', async () => {
      vi.mocked(db.getMessagesByBookingId).mockResolvedValue([]);

      const result = await caller.message.getThread({ bookingId: 999 });

      expect(result.messages).toHaveLength(0);
    });
  });

  describe('Review Flow', () => {
    it('should submit a review for completed booking', async () => {
      const mockReview = {
        id: 1,
        bookingId: 1,
        artistId: 1,
        venueId: 2,
        rating: 5,
        createdAt: new Date(),
      };

      vi.mocked(db.createReview).mockResolvedValue(mockReview as any);

      const result = await caller.booking.submitReview({
        bookingId: 1,
        rating: 5,
      });

      expect(result.success).toBe(true);
      expect(result.review.rating).toBe(5);
    });

    it('should retrieve artist reviews', async () => {
      const mockReviews = [
        { id: 1, artistId: 1, rating: 5, createdAt: new Date() },
        { id: 2, artistId: 1, rating: 4, createdAt: new Date() },
        { id: 3, artistId: 1, rating: 5, createdAt: new Date() },
      ];

      vi.mocked(db.getReviewsByArtistId).mockResolvedValue(mockReviews as any);

      const result = await caller.artist.getReviews({ artistId: 1 });

      expect(result.reviews).toHaveLength(3);
      expect(result.averageRating).toBe(4.67);
      expect(result.totalReviews).toBe(3);
    });

    it('should calculate average rating correctly', async () => {
      const mockReviews = [
        { id: 1, rating: 5 },
        { id: 2, rating: 4 },
        { id: 3, rating: 3 },
      ];

      vi.mocked(db.getReviewsByArtistId).mockResolvedValue(mockReviews as any);

      const result = await caller.artist.getReviews({ artistId: 1 });

      expect(result.averageRating).toBe(4);
    });
  });

  describe('Subscription Flow', () => {
    it('should get user subscription', async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getSubscriptionByUserId).mockResolvedValue(mockSubscription as any);

      const result = await caller.subscription.getMy();

      expect(result.subscription).toEqual(mockSubscription);
      expect(result.subscription.status).toBe('active');
    });

    it('should handle no subscription', async () => {
      vi.mocked(db.getSubscriptionByUserId).mockResolvedValue(null);

      const result = await caller.subscription.getMy();

      expect(result.subscription).toBeNull();
    });

    it('should create checkout session', async () => {
      const result = await caller.subscription.createCheckoutSession({
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      });

      expect(result).toHaveProperty('checkoutUrl');
      expect(result.checkoutUrl).toContain('stripe.com');
    });
  });

  describe('Rider Template Flow', () => {
    it('should create a rider template', async () => {
      const mockTemplate = {
        id: 1,
        artistId: 1,
        templateName: 'Standard Rider',
        templateData: {
          technicalRequirements: 'PA system required',
          hospitality: 'Green room with refreshments',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createRiderTemplate).mockResolvedValue(mockTemplate as any);

      const result = await caller.riderTemplate.create({
        templateName: 'Standard Rider',
        templateData: {
          technicalRequirements: 'PA system required',
          hospitality: 'Green room with refreshments',
        },
      });

      expect(result.success).toBe(true);
      expect(result.template.templateName).toBe('Standard Rider');
    });

    it('should retrieve rider templates', async () => {
      const mockTemplates = [
        { id: 1, templateName: 'Standard', createdAt: new Date() },
        { id: 2, templateName: 'Premium', createdAt: new Date() },
      ];

      vi.mocked(db.getRiderTemplatesByArtistId).mockResolvedValue(mockTemplates as any);

      const result = await caller.riderTemplate.getList();

      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].templateName).toBe('Standard');
    });

    it('should update rider template', async () => {
      const updatedTemplate = {
        id: 1,
        templateName: 'Updated Rider',
        templateData: { technicalRequirements: 'Updated requirements' },
        updatedAt: new Date(),
      };

      vi.mocked(db.updateRiderTemplate).mockResolvedValue(updatedTemplate as any);

      const result = await caller.riderTemplate.update({
        templateId: 1,
        templateName: 'Updated Rider',
        templateData: { technicalRequirements: 'Updated requirements' },
      });

      expect(result.success).toBe(true);
      expect(result.template.templateName).toBe('Updated Rider');
    });
  });

  describe('Error Handling', () => {
    it('should handle booking not found', async () => {
      vi.mocked(db.getBookingById).mockResolvedValue(null);

      try {
        await caller.booking.getDetail({ bookingId: 999 });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('NOT_FOUND');
      }
    });

    it('should handle unauthorized access', async () => {
      const unauthorizedCaller = createCallerFactory(appRouter)({
        user: null,
        req: { headers: { origin: 'http://localhost:3000' } },
      } as any);

      try {
        await unauthorizedCaller.booking.create({
          artistId: 1,
          eventDate: '2026-02-01',
          eventTime: '19:00',
          venueName: 'Test Venue',
          venueAddress: '123 Main St',
          totalFee: 500,
          depositAmount: 250,
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should handle invalid input', async () => {
      try {
        await caller.booking.create({
          artistId: -1, // Invalid
          eventDate: 'invalid-date',
          eventTime: '25:00', // Invalid time
          venueName: '',
          venueAddress: '',
          totalFee: -100,
          depositAmount: -50,
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('BAD_REQUEST');
      }
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const mockBookings = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'confirmed' },
        { id: 3, status: 'completed' },
      ];

      vi.mocked(db.getBookingsByArtistId).mockResolvedValue(mockBookings as any);

      const promises = Array(10)
        .fill(null)
        .map(() => caller.booking.getList({}));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every(r => r.bookings.length === 3)).toBe(true);
    });

    it('should complete booking flow within reasonable time', async () => {
      const startTime = Date.now();

      vi.mocked(db.createBooking).mockResolvedValue({ id: 1 } as any);
      vi.mocked(db.getBookingById).mockResolvedValue({ id: 1, status: 'pending' } as any);
      vi.mocked(db.updateBookingStatus).mockResolvedValue({ success: true });

      await caller.booking.create({
        artistId: 1,
        eventDate: '2026-02-01',
        eventTime: '19:00',
        venueName: 'Test Venue',
        venueAddress: '123 Main St',
        totalFee: 500,
        depositAmount: 250,
      });

      await caller.booking.getDetail({ bookingId: 1 });
      await caller.booking.updateStatus({ bookingId: 1, status: 'confirmed' });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });
  });
});
