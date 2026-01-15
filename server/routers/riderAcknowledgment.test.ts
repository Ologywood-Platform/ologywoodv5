import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { riderAcknowledgments, riderModificationHistory, bookings, riderTemplates, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Rider Acknowledgment Router', () => {
  let db: any;
  let testUserId: number;
  let testBookingId: number;
  let testRiderTemplateId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      loginMethod: 'test',
      role: 'admin',
    });
    testUserId = userResult.insertId;

    // Create test rider template
    const riderResult = await db.insert(riderTemplates).values({
      artistId: 1,
      templateName: 'Test Rider',
      performanceDuration: 60,
      paSystemRequired: true,
      lightingRequired: true,
      cateringProvided: true,
    });
    testRiderTemplateId = riderResult.insertId;

    // Create test booking (use existing data)
    const bookingsList = await db.select().from(bookings).limit(1);
    if (bookingsList.length > 0) {
      testBookingId = bookingsList[0].id;
    } else {
      // Create a new one if none exist
      const bookingResult = await db.insert(bookings).values({
        artistId: 1,
        venueId: 1,
        eventDate: new Date(),
        venueName: 'Test Venue',
        status: 'pending',
      });
      testBookingId = bookingResult.insertId;
    }
  });

  afterAll(async () => {
    if (!db) return;
    // Cleanup is minimal to avoid errors
  });

  it('should create a new rider acknowledgment', async () => {
    const result = await db.insert(riderAcknowledgments).values({
      bookingId: testBookingId,
      riderTemplateId: testRiderTemplateId,
      artistId: 1,
      venueId: 1,
      status: 'pending',
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify it was created
    const created = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, result.insertId))
      .limit(1);

    expect(created).toHaveLength(1);
    expect(created[0].status).toBe('pending');
    expect(created[0].bookingId).toBe(testBookingId);
  });

  it('should update acknowledgment status to acknowledged', async () => {
    // Create acknowledgment
    const createResult = await db.insert(riderAcknowledgments).values({
      bookingId: testBookingId + 100,
      riderTemplateId: testRiderTemplateId,
      artistId: 1,
      venueId: 1,
      status: 'pending',
    });

    const ackId = createResult.insertId;

    // Update to acknowledged
    await db
      .update(riderAcknowledgments)
      .set({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        acknowledgedByUserId: testUserId,
      })
      .where(eq(riderAcknowledgments.id, ackId));

    // Verify update
    const updated = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, ackId))
      .limit(1);

    expect(updated[0].status).toBe('acknowledged');
    expect(updated[0].acknowledgedByUserId).toBe(testUserId);
  });

  it('should propose modifications to rider', async () => {
    // Create acknowledgment
    const createResult = await db.insert(riderAcknowledgments).values({
      bookingId: testBookingId + 200,
      riderTemplateId: testRiderTemplateId,
      artistId: 1,
      venueId: 1,
      status: 'pending',
    });

    const ackId = createResult.insertId;
    const modifications = [
      {
        field: 'PA System Required',
        originalValue: true,
        proposedValue: false,
        reason: 'We have in-house PA',
      },
    ];

    // Update with modifications
    await db
      .update(riderAcknowledgments)
      .set({
        status: 'modifications_proposed',
        proposedModifications: modifications,
        modificationsProposedAt: new Date(),
      })
      .where(eq(riderAcknowledgments.id, ackId));

    // Create modification history
    await db.insert(riderModificationHistory).values({
      riderAcknowledgmentId: ackId,
      modificationNumber: 1,
      fieldName: 'PA System Required',
      originalValue: JSON.stringify(true),
      newValue: JSON.stringify(false),
      reason: 'We have in-house PA',
      changedByUserId: testUserId,
      changedByRole: 'venue',
      status: 'proposed',
    });

    // Verify modifications
    const updated = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, ackId))
      .limit(1);

    expect(updated[0].status).toBe('modifications_proposed');
    expect(updated[0].proposedModifications).toHaveLength(1);

    // Verify modification history
    const history = await db
      .select()
      .from(riderModificationHistory)
      .where(eq(riderModificationHistory.riderAcknowledgmentId, ackId));

    expect(history).toHaveLength(1);
    expect(history[0].fieldName).toBe('PA System Required');
  });

  it('should approve modifications', async () => {
    // Create acknowledgment with modifications
    const createResult = await db.insert(riderAcknowledgments).values({
      bookingId: testBookingId + 300,
      riderTemplateId: testRiderTemplateId,
      artistId: 1,
      venueId: 1,
      status: 'modifications_proposed',
      proposedModifications: [
        {
          field: 'PA System Required',
          originalValue: true,
          proposedValue: false,
        },
      ],
    });

    const ackId = createResult.insertId;

    // Add modification history
    await db.insert(riderModificationHistory).values({
      riderAcknowledgmentId: ackId,
      modificationNumber: 1,
      fieldName: 'PA System Required',
      originalValue: 'true',
      newValue: 'false',
      changedByUserId: testUserId,
      changedByRole: 'venue',
      status: 'proposed',
    });

    // Approve modifications
    await db
      .update(riderAcknowledgments)
      .set({
        status: 'accepted',
        artistResponse: 'approved',
        artistResponseAt: new Date(),
        finalizedAt: new Date(),
        finalizedByUserId: testUserId,
      })
      .where(eq(riderAcknowledgments.id, ackId));

    // Update modification history
    await db
      .update(riderModificationHistory)
      .set({
        status: 'approved',
        statusChangedAt: new Date(),
        statusChangedByUserId: testUserId,
      })
      .where(eq(riderModificationHistory.riderAcknowledgmentId, ackId));

    // Verify
    const updated = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, ackId))
      .limit(1);

    expect(updated[0].status).toBe('accepted');
    expect(updated[0].artistResponse).toBe('approved');

    const history = await db
      .select()
      .from(riderModificationHistory)
      .where(eq(riderModificationHistory.riderAcknowledgmentId, ackId));

    expect(history[0].status).toBe('approved');
  });

  it('should reject modifications with reason', async () => {
    // Create acknowledgment with modifications
    const createResult = await db.insert(riderAcknowledgments).values({
      bookingId: testBookingId + 400,
      riderTemplateId: testRiderTemplateId,
      artistId: 1,
      venueId: 1,
      status: 'modifications_proposed',
    });

    const ackId = createResult.insertId;
    const rejectionReason = 'We cannot perform without our PA system';

    // Reject modifications
    await db
      .update(riderAcknowledgments)
      .set({
        status: 'pending',
        artistResponse: 'rejected',
        artistResponseAt: new Date(),
        artistResponseNotes: rejectionReason,
      })
      .where(eq(riderAcknowledgments.id, ackId));

    // Verify
    const updated = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, ackId))
      .limit(1);

    expect(updated[0].status).toBe('pending');
    expect(updated[0].artistResponse).toBe('rejected');
    expect(updated[0].artistResponseNotes).toBe(rejectionReason);
  });

  it('should reject entire rider', async () => {
    // Create acknowledgment
    const createResult = await db.insert(riderAcknowledgments).values({
      bookingId: testBookingId + 500,
      riderTemplateId: testRiderTemplateId,
      artistId: 1,
      venueId: 1,
      status: 'pending',
    });

    const ackId = createResult.insertId;
    const rejectionReason = 'Cannot meet the venue requirements';

    // Reject rider
    await db
      .update(riderAcknowledgments)
      .set({
        status: 'rejected',
        notes: rejectionReason,
        finalizedAt: new Date(),
        finalizedByUserId: testUserId,
      })
      .where(eq(riderAcknowledgments.id, ackId));

    // Verify
    const updated = await db
      .select()
      .from(riderAcknowledgments)
      .where(eq(riderAcknowledgments.id, ackId))
      .limit(1);

    expect(updated[0].status).toBe('rejected');
    expect(updated[0].notes).toBe(rejectionReason);
  });
});
