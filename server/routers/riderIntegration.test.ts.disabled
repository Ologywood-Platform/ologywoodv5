import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { bookings, riderTemplates, riderAcknowledgments, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as bookingRiderIntegration from '../services/bookingRiderIntegration';

describe('Rider Integration with Bookings', () => {
  let db: any;
  let testUserId: number;
  let testBookingId: number;
  let testRiderTemplateId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-integration-${Date.now()}`,
      name: 'Test User',
      email: `test-integration-${Date.now()}@example.com`,
      loginMethod: 'test',
      role: 'admin',
    });
    testUserId = userResult.insertId;

    // Create rider template
    const riderResult = await db.insert(riderTemplates).values({
      artistId: 1,
      templateName: 'Integration Test Rider',
      performanceDuration: 60,
      paSystemRequired: true,
      lightingRequired: true,
    });
    testRiderTemplateId = riderResult.insertId;

    // Create booking
    const bookingResult = await db.insert(bookings).values({
      artistId: 1,
      venueId: 1,
      eventDate: new Date(),
      venueName: 'Test Venue',
      status: 'pending',
    });
    testBookingId = bookingResult.insertId;
  });

  afterAll(async () => {
    if (!db) return;
    // Cleanup is minimal to avoid errors
  });

  it('should attach rider template to booking', async () => {
    const result = await bookingRiderIntegration.attachRiderToBooking(testBookingId, testRiderTemplateId);

    expect(result.success).toBe(true);
    expect(result.bookingId).toBe(testBookingId);
    expect(result.riderTemplateId).toBe(testRiderTemplateId);

    // Verify booking was updated
    const updated = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, testBookingId))
      .limit(1);

    expect(updated[0].riderTemplateId).toBe(testRiderTemplateId);
  });

  it('should create rider acknowledgment for booking', async () => {
    // First attach rider
    await bookingRiderIntegration.attachRiderToBooking(testBookingId + 1, testRiderTemplateId);

    // Create booking first
    const bookingResult = await db.insert(bookings).values({
      artistId: 1,
      venueId: 1,
      eventDate: new Date(),
      venueName: 'Test Venue 2',
      status: 'confirmed',
      riderTemplateId: testRiderTemplateId,
    });
    const newBookingId = bookingResult.insertId;

    const result = await bookingRiderIntegration.createRiderAcknowledgmentForBooking(newBookingId);

    expect(result.success).toBe(true);
    expect(result.bookingId).toBe(newBookingId);
    expect(result.riderTemplateId).toBe(testRiderTemplateId);

    // Verify acknowledgment was created
    const ack = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.bookingId, newBookingId))
      .limit(1);

    expect(ack).toHaveLength(1);
    expect(ack[0].status).toBe('pending');
  });

  it('should get rider for booking', async () => {
    // Create booking with rider
    const bookingResult = await db.insert(bookings).values({
      artistId: 1,
      venueId: 1,
      eventDate: new Date(),
      venueName: 'Test Venue 3',
      status: 'confirmed',
      riderTemplateId: testRiderTemplateId,
    });
    const newBookingId = bookingResult.insertId;

    const result = await bookingRiderIntegration.getRiderForBooking(newBookingId);

    expect(result).not.toBeNull();
    expect(result?.booking.id).toBe(newBookingId);
    expect(result?.rider.id).toBe(testRiderTemplateId);
  });

  it('should get booking rider status', async () => {
    // Create booking with rider
    const bookingResult = await db.insert(bookings).values({
      artistId: 1,
      venueId: 1,
      eventDate: new Date(),
      venueName: 'Test Venue 4',
      status: 'confirmed',
      riderTemplateId: testRiderTemplateId,
    });
    const newBookingId = bookingResult.insertId;

    const status = await bookingRiderIntegration.getBookingRiderStatus(newBookingId);

    expect(status.hasRider).toBe(false); // No acknowledgment created yet
    expect(status.status).toBe('no_rider');
  });

  it('should get artist rider templates', async () => {
    const templates = await bookingRiderIntegration.getArtistRiderTemplates(1);

    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it('should get bookings by rider template', async () => {
    // Create booking with rider
    await db.insert(bookings).values({
      artistId: 1,
      venueId: 1,
      eventDate: new Date(),
      venueName: 'Test Venue 5',
      status: 'confirmed',
      riderTemplateId: testRiderTemplateId,
    });

    const bookingsList = await bookingRiderIntegration.getBookingsByRiderTemplate(testRiderTemplateId);

    expect(Array.isArray(bookingsList)).toBe(true);
    expect(bookingsList.length).toBeGreaterThan(0);
  });

  it('should handle booking without rider gracefully', async () => {
    // Create booking without rider
    const bookingResult = await db.insert(bookings).values({
      artistId: 1,
      venueId: 1,
      eventDate: new Date(),
      venueName: 'Test Venue No Rider',
      status: 'pending',
    });
    const newBookingId = bookingResult.insertId;

    const result = await bookingRiderIntegration.getRiderForBooking(newBookingId);

    expect(result).toBeNull();
  });

  it('should handle non-existent booking gracefully', async () => {
    const result = await bookingRiderIntegration.getRiderForBooking(999999);

    expect(result).toBeNull();
  });
});
